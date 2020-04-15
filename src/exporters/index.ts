import Book, { Source } from '@src/types/book';
import ReadmooExporter from '@src/exporters/readmooExporter';
import BooksExporter from '@src/exporters/booksExporter';

export const exporterSelector = (book: Book) => {
  switch (book.source) {
  case Source.Readmoo:
    return new ReadmooExporter(book);
  case Source.Books:
    return new BooksExporter(book);
  default:
    throw new Error('Undefined Exporter');
  }
};

export default [
  ReadmooExporter,
];
