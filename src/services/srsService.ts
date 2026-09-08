import {
  fsrs,
  generatorParameters,
  Rating,
  Card as FSRSCard,
  createEmptyCard
} from 'ts-fsrs';

// Khởi tạo thuật toán FSRS với cấu hình chuẩn Anki
const f = fsrs(generatorParameters({ enable_fuzz: true }));

export class SRSService {
  /**
   * Tạo card FSRS trắng cho âm tiết mới
   */
  static initNewCard(now: Date = new Date()): FSRSCard {
    return createEmptyCard(now);
  }

  /**
   * Định dạng khoảng thời gian hiển thị nhãn cho nút bấm
   */
  private static formatInterval(targetDate: Date, now: Date): string {
    const diffMs = targetDate.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (60 * 1000));
    const diffHours = Math.round(diffMs / (60 * 60 * 1000));
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

    if (diffMinutes < 60) return `< ${Math.max(1, diffMinutes)}p`;
    if (diffHours < 24) return `${diffHours}g`;
    if (diffDays <= 30) return `${diffDays} ngày`;
    const diffMonths = Math.round(diffDays / 30);
    return `${diffMonths} thg`;
  }

  /**
   * Tính toán trước 4 trạng thái tương ứng với 4 nút: Lại, Khó, Tốt, Dễ
   */
  static getPreviewIntervals(card: FSRSCard, now: Date = new Date()) {
    const scheduling = f.repeat(card, now);

    return {
      again: {
        card: scheduling[Rating.Again].card,
        label: this.formatInterval(scheduling[Rating.Again].card.due, now),
      },
      hard: {
        card: scheduling[Rating.Hard].card,
        label: this.formatInterval(scheduling[Rating.Hard].card.due, now),
      },
      good: {
        card: scheduling[Rating.Good].card,
        label: this.formatInterval(scheduling[Rating.Good].card.due, now),
      },
      easy: {
        card: scheduling[Rating.Easy].card,
        label: this.formatInterval(scheduling[Rating.Easy].card.due, now),
      },
    };
  }

  /**
   * Áp dụng đánh giá và trả về Card FSRS mới cập nhật
   */
  static rateCard(card: FSRSCard, rating: 'again' | 'hard' | 'good' | 'easy', now: Date = new Date()): FSRSCard {
    const ratingMap: Record<string, Rating> = {
      again: Rating.Again,
      hard: Rating.Hard,
      good: Rating.Good,
      easy: Rating.Easy,
    };

    const targetRating = ratingMap[rating];
    const scheduling = f.repeat(card, now);
    return scheduling[targetRating].card;
  }
}
