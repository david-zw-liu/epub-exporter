export enum Source {
  Readmoo = 'readmoo',
  Books = 'books',
}

export default interface Book {
  id: string;
  title: string;
  source: Source;
  description?: string;
  coverImageUrl: string;
}
