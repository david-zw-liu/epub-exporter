import { DetectorConstructor } from '@src/types/detector';
import ReadmooDetector from '@src/detectors/readmooDetector';
import BooksDetector from '@src/detectors/booksDetector';

const detectors: DetectorConstructor[] = [
  ReadmooDetector,
  BooksDetector,
];
export default detectors;
