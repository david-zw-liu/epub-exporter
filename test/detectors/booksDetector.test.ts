import fs from 'fs';
import { JSDOM } from 'jsdom';

import BooksDetector from '@src/detectors/booksDetector';
import Book, { Source } from '@src/types/book';

describe('BooksDetector', () => {
  const dom = new JSDOM();
  const { window } = dom;

  describe('#isExportable', () => {
    it('return true if hostname is library hostname', () => {
      dom.reconfigure({ url: 'https://viewer-ebook.books.com.tw/viewer/index.html?readlist=all' });

      const detector = new BooksDetector(window as unknown as Window);

      expect(detector.isExportable()).toEqual(true);
    });

    it('return false if hostname is not library hostname', () => {
      dom.reconfigure({ url: 'https://www.google.com.tw/' });

      const detector = new BooksDetector(window as unknown as Window);

      expect(detector.isExportable()).toEqual(false);
    });
  });

  describe('#extractBooks', () => {
    it('return empty array if no book found', () => {
      const detector = new BooksDetector(window as unknown as Window);
      const books: Book[] = [];

      expect(detector.extractBooks()).toEqual(books);
    });

    it('return books', () => {
      const html = fs.readFileSync('test/fixtures/booksDetector/library.html').toString();
      const libraryDOM = new JSDOM(html);
      const detector = new BooksDetector(libraryDOM.window as unknown as Window);
      const source = Source.Books;
      const books: Book[] = [
        {
          id: 'E050033363_reflowable_normal',
          title: '小書痴的下剋上：為了成為圖書管理員不擇手段！第一部 士兵的女兒(I)',
          coverImageUrl: 'https://s3public-ebook.books.com.tw/cover/49B6B7/7408648/E050033363.jpg',
          source,
        },
      ];

      expect(detector.extractBooks()).toEqual(books);
    });
  });
});
