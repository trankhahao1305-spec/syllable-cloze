import { Flashcard } from '../types';
import { SRSService } from '../services/srsService';

/**
 * Tạo danh sách flashcards FSRS tự động từ số âm tiết của từ vựng (N âm tiết -> N thẻ)
 */
export function createFlashcardsForWord(wordId: string, chunkCount: number, folderId?: string): Flashcard[] {
  const cards: Flashcard[] = [];
  const now = Date.now();

  for (let i = 0; i < chunkCount; i++) {
    const fsrsCard = SRSService.initNewCard(new Date(now));
    cards.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `card_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      wordId,
      folderId,
      hiddenChunkIndex: i,
      due: now,
      dueDate: now,
      fsrsCard,
      interval: 0,
      repetitions: 0,
      easeFactor: 2.5,
      state: 'new'
    });
  }

  return cards;
}

/**
 * Định dạng khoảng thời gian ôn tập cho nhãn hiển thị
 */
export function formatDueTime(due: number): string {
  const diff = due - Date.now();
  if (diff <= 0) return 'Cần ôn ngay';

  const minutes = Math.floor(diff / (60 * 1000));
  if (minutes < 60) return `${Math.max(1, minutes)} phút nữa`;

  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 24) return `${hours} giờ nữa`;

  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  return `${days} ngày nữa`;
}
