import { Card as FSRSCard } from 'ts-fsrs';
export * from './card';

export interface FolderItem {
  id: string;              // UUID
  name: string;            // Tên thư mục (vd: "IELTS Topic 01", "Giao tiếp hàng ngày")
  color?: string;          // Mã màu nhận diện (mặc định: '#4f46e5')
  icon?: string;           // Tên icon (mặc định: 'Folder')
  createdAt: number;
  updatedAt?: number;
}

export interface FolderWithStats extends FolderItem {
  wordCount: number;
  dueCount: number;
}

export interface WordItem {
  id: string;
  folderId?: string;       // Khóa ngoại liên kết FolderItem.id
  word: string;
  ipa: string;
  type: string;
  meaning: string;
  definition_en?: string;  // Định nghĩa tiếng Anh chuẩn Oxford Learner's Dictionary
  collocations?: string[]; // Mảng các cụm từ kết hợp tiêu biểu (Oxford Collocations)
  chunks: string[];
  example: string;
  example_vi: string;
  createdAt: number;
  updatedAt?: number;
}

export type FlashcardState = 'new' | 'learning' | 'review';

export interface Flashcard {
  id: string;
  wordId: string;
  folderId?: string;       // Denormalized để query lượt học theo folder siêu tốc
  hiddenChunkIndex: number; // Chỉ số âm tiết bị ẩn (0, 1, 2,...)
  due: number;              // Timestamp phục vụ query index FSRS
  fsrsCard: FSRSCard;       // Trạng thái FSRS
  updatedAt?: number;
  // Thuộc tính tương thích ngược cho dữ liệu cũ
  dueDate?: number;
  interval?: number;
  repetitions?: number;
  easeFactor?: number;
  state?: FlashcardState;
}

export type FSRSRating = 'again' | 'hard' | 'good' | 'easy';
export type SRSRating = FSRSRating;

export interface CardWithWord {
  card: Flashcard;
  word: WordItem;
}

export interface DeckStats {
  totalWords: number;
  totalCards: number;
  dueCards: number;
  learningCards: number;
  newCards: number;
  reviewedCards: number;
  totalFolders?: number;
}

