import axios, { AxiosRequestConfig } from 'axios';

import BaseExporter from '@src/exporters/baseExporter';
import Dictionary from '@src/types/dictionary';
import decodeXor, { generateKey } from '@src/utils/decodeXor';

interface DownloadInfo {
  book_uni_id: string;
  download_link: string;
  download_token: string;
  size: number;
  encrypt_type: 'enc01';
}

const booksAPIBase = 'https://appapi-ebook.books.com.tw';

const decoder = new TextDecoder('utf-8');

const arrayBufferToString = (buffer: ArrayBuffer) => decoder.decode(new Uint8Array(buffer));

const imageExtensions = ['.bmp', '.gif', '.ico', '.jpeg', '.jpg', '.tiff', '.tif', '.svg', '.png', '.webp'];

const notEncryptedExtensions = ['.css', '.ttc', '.otf', '.ttf', '.eot', '.woff', '.woff2'];

const createFetcher = (apiBase: string) => {
  const get = async (path: string, params?: Dictionary, headers?: Dictionary) => {
    const config: AxiosRequestConfig = {
      withCredentials: true,
      responseType: 'arraybuffer',
      params,
      headers,
    };

    const { data } = (await axios.get(`${apiBase}${path}`, config));

    return data;
  };

  return { get };
};

const obtainBasePath = (path: string) => {
  const segments = path.split('/');
  segments.pop();

  return segments.join('/');
};

const obtainExtension = (path: string) => {
  const segments = path.split('.');

  return segments.pop();
};

const obtainImageChecksum = (): string => {
  const seedChars = ['0', '6', '9', '3', '1', '4', '7', '1', '8', '0', '5', '5', '9', 'A', 'A', 'C'];
  seedChars.forEach((_, idx) => {
    const randIdx = Math.floor(Math.random() * seedChars.length);
    const tmp = seedChars[idx];

    seedChars[idx] = seedChars[randIdx];
    seedChars[randIdx] = tmp;
  });

  return seedChars.join('');
};

class BooksExporter extends BaseExporter {
  private downloadInfo: DownloadInfo;

  async export(): Promise<Blob> {
    const containerXmlPath = 'META-INF/container.xml';
    const encryptionXmlPath = 'META-INF/encryption.xml';

    await this.fetchDownloadInfo();
    await this.batchFetch([containerXmlPath, encryptionXmlPath], [encryptionXmlPath]);
    const rootFilePath = this.rootFilePath(containerXmlPath);
    await this.batchFetch([rootFilePath]);
    await this.batchFetch(this.contentFilePaths(rootFilePath));

    return this.buildEPUB();
  }

  private async fetchDownloadInfo() {
    await this.updateMessage('取得下載資訊');
    await this.increasePending();

    const { id } = this.book;
    const { get } = createFetcher(booksAPIBase);
    const dateTime = new Date().getTime();
    const timestamp = Math.floor(dateTime / 1000);
    const params = {
      book_uni_id: id,
      t: timestamp,
    };
    const arrayBuffer = await get('/V1.3/CMSAPIApp/BookDownLoadURL', params);
    const object = JSON.parse(arrayBufferToString(arrayBuffer));
    this.downloadInfo = object as DownloadInfo;

    await this.increaseFinished();
  }

  /* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */
  private async batchFetch(paths: string[], ignoreErrorPaths: string[] = []) {
    await this.increasePending(paths.length);
    const { download_token: downloadToken, download_link: downloadLink } = this.downloadInfo;
    const checksum = obtainImageChecksum();
    const { get } = createFetcher(downloadLink);

    for (const path of paths) {
      const message = `取得 ${path}`;
      await this.updateStatus(() => ({ message }));

      try {
        const extension = obtainExtension(path);
        if (notEncryptedExtensions.includes(extension)) {
          this.files[path] = await get(path);
        } else if (imageExtensions.includes(extension)) {
          this.files[path] = await get(path, { checksum, DownloadToken: downloadToken });
        } else {
          const fileContent = await get(path, { DownloadToken: downloadToken });
          const url = `${downloadLink}${path}`;
          const key = generateKey(url, downloadToken);

          this.files[path] = decodeXor(key, fileContent);
        }
      } catch (e) {
        if (ignoreErrorPaths.includes(path)) {
          await this.updateMessage(`${message}...失敗（可忽略）`);
        } else {
          throw e;
        }
      }

      await this.increaseFinished();
    }
  }
  /* eslint-enable no-await-in-loop, no-restricted-syntax, no-continue */

  private async updateMessage(message: string) {
    await this.updateStatus((() => ({ message })));
  }

  private async increasePending(count = 1) {
    await this.updateStatus((old => ({ itemsCount: old.itemsCount + count })));
  }

  private async increaseFinished(count = 1) {
    await this.updateStatus((old => ({ itemsCountCompleted: old.itemsCountCompleted + count })));
  }

  private rootFilePath(containerXmlPath: string): string {
    const containerXml = arrayBufferToString(this.files[containerXmlPath] as ArrayBuffer);

    return containerXml.match(/rootfile.*full-path="(.+\.opf)"/s)[1];
  }

  private contentFilePaths(rootFilePath: string): string[] {
    const basePath = obtainBasePath(rootFilePath);
    const rootFile = arrayBufferToString(this.files[rootFilePath] as ArrayBuffer);

    return [...rootFile.matchAll(/.*href="(.*?)".*/g)].map(([_self, path]) => `${basePath}/${path}`);
  }
}
export default BooksExporter;
