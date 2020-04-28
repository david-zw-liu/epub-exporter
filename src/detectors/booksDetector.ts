import Detector from '@src/types/detector';
import Book, { Source } from '@src/types/book';

const libraryHostname = 'viewer-ebook.books.com.tw';

const randomId = Math.random().toString(36).substring(7);

const emptyNodeList = document.querySelectorAll(`#empty-${randomId} > li`);

export default class BooksDetector implements Detector {
  private window: Window;

  constructor(window: Window) {
    this.window = window;
  }

  isExportable(): boolean {
    const { location } = this.window;
    const { hostname } = location;

    return hostname === libraryHostname;
  }

  extractBooks(): Book[] {
    const { document } = this.window;
    const list = document.querySelector('#list');
    const libraryItems = list ? list.querySelectorAll('li') : emptyNodeList;
    const books: Book[] = [];

    libraryItems.forEach(libraryItem => {
      const { dataset } = libraryItem.querySelector('h3 > a') as HTMLAnchorElement;
      const img = libraryItem.querySelector('img.img') as HTMLImageElement;
      const id = dataset.href.split('book_uni_id=').pop();
      const title = dataset.o_title;
      const coverImageUrl = img.getAttribute('src');
      const source = Source.Books;

      books.push({
        id,
        title,
        coverImageUrl,
        source,
      });
    });

    return books;
  }
}
