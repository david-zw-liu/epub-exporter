import axios, { AxiosRequestConfig } from 'axios';

import BaseExporter from '@src/exporters/baseExporter';
import Dictionary from '@src/types/dictionary';

type WebRequestHeadersDetails = chrome.webRequest.WebRequestHeadersDetails;

const apiBase = 'https://reader.readmoo.com';
const viewerPath = '/_single-bundle/mooreader-js-viewer_all.min.js';

const decoder = new TextDecoder('utf-8');

const arrayBufferToString = (buffer: ArrayBuffer) => decoder.decode(new Uint8Array(buffer));

const get = async (path: string, headers?: Dictionary) => {
  const config: AxiosRequestConfig = {
    withCredentials: true,
    responseType: 'arraybuffer',
    headers,
  };

  const { data } = (await axios.get(`${apiBase}${path}`, config));

  return data;
};

const obtainBasePath = (path: string) => {
  const segments = path.split('/');
  segments.pop();

  return segments.join('/');
};

const modifyHeaderBeforeRequest = (details: WebRequestHeadersDetails) => {
  const newRef = 'https://reader.readmoo.com/reader/index.html';
  const refererHeader = details.requestHeaders.find(({ name }) => name.toLowerCase() === 'referer');
  if (refererHeader) {
    refererHeader.value = newRef;
  } else {
    details.requestHeaders.push({ name: 'Referer', value: newRef });
  }

  return { requestHeaders: details.requestHeaders };
};

class ReadmooExporter extends BaseExporter {
  private basePath = '';

  private authorizationToken = '';

  async export(): Promise<Blob> {
    chrome.webRequest.onBeforeSendHeaders.addListener(
      modifyHeaderBeforeRequest,
      { urls: ['*://reader.readmoo.com/*'] },
      ['requestHeaders', 'blocking', 'extraHeaders'],
    );

    const containerXmlPath = 'META-INF/container.xml';
    const encryptionXmlPath = 'META-INF/encryption.xml';

    await this.fetchAuthorizationToken();
    await this.fetchBasePath();
    await this.batchFetch([containerXmlPath, encryptionXmlPath], [encryptionXmlPath]);
    const rootFilePath = this.rootFilePath(containerXmlPath);
    await this.batchFetch([rootFilePath]);
    await this.batchFetch(this.contentFilePaths(rootFilePath));

    chrome.webRequest.onBeforeSendHeaders.removeListener(modifyHeaderBeforeRequest);

    return this.buildEPUB();
  }

  private async fetchAuthorizationToken() {
    await this.updateMessage('取得 Authorization Token');
    await this.increasePending();

    const arrayBuffer = await get(viewerPath);
    const content = arrayBufferToString(arrayBuffer);
    // eslint-disable-next-line prefer-destructuring
    this.authorizationToken = content.match(/bearer.+return["'](.*?)["']/)[1];

    await this.increaseFinished();
  }

  private async fetchBasePath() {
    await this.updateMessage('取得檔案路徑');
    await this.increasePending();

    const { id } = this.book;
    const arrayBuffer = await get(`/api/book/${id}/nav`, { authorization: `bearer ${this.authorizationToken}` });
    const object = JSON.parse(arrayBufferToString(arrayBuffer));
    this.basePath = object.base as string;

    await this.increaseFinished();
  }

  /* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */
  private async batchFetch(paths: string[], ignoreErrorPaths: string[] = []) {
    await this.increasePending(paths.length);

    for (const path of paths) {
      const message = `取得 ${path}`;
      await this.updateStatus(() => ({ message }));

      try {
        this.files[path] = await get(this.resolvePath(path));
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

  private resolvePath(path: string): string {
    return this.basePath + path;
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
export default ReadmooExporter;
