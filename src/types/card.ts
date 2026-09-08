import { Card as FSRSCard } from 'ts-fsrs';

export type { FSRSCard };

export interface ClozeFlashcard {
  id: string;
  wordId: string;
  hiddenChunkIndex: number;
  due: number; // Timestamp (milliseconds) phục vụ query index
  fsrsCard: FSRSCard; // Toàn bộ state FSRS: stability, difficulty, reps, lapses, state,...
}

export interface StudyCardData {
  id: string;
  word: string;            // vd: "perseverance"
  ipa: string;             // vd: "/ˌpɜː.sɪˈvɪə.rəns/"
  type: string;            // "DANH TỪ" | "TÍNH TỪ" | "ĐỘNG TỪ" | "PHÓ TỪ"
  meaning: string;         // "sự kiên trì, bền bỉ"
  chunks: string[];        // ["per", "se", "ver", "ance"]
  hiddenChunkIndex: number;// Index âm tiết bị ẩn (vd: 0 tương ứng với "per")
  imageUrl?: string;       // URL ảnh 2D từ Pollinations CDN
  definition_en?: string;  // Định nghĩa tiếng Anh chuẩn Oxford
  collocations?: string[]; // Mảng các cụm từ kết hợp tiêu biểu
  example?: string;        // "Success takes hard work and perseverance."
  example_vi?: string;     // "Thành công đòi hỏi sự chăm chỉ và lòng kiên trì."
}

export interface StudyCardProps {
  card: StudyCardData;
  isFlipped: boolean;
  isAnswerRevealed?: boolean;
  onFlip: () => void;
  onSpeak: () => void;
}

export const formatCardType = (type: string): string => {
  const t = (type || '').trim().toLowerCase();
  if (t === 'n' || t === 'noun' || t.includes('danh')) return 'DANH TỪ';
  if (t === 'adj' || t === 'adjective' || t.includes('tính')) return 'TÍNH TỪ';
  if (t === 'v' || t === 'verb' || t.includes('động')) return 'ĐỘNG TỪ';
  if (t === 'adv' || t === 'adverb' || t.includes('phó') || t.includes('trạng')) return 'PHÓ TỪ';
  return (type || 'TỪ VỰNG').toUpperCase();
};

export const getBadgeColorClass = (type: string): string => {
  const normalized = (type || '').trim().toUpperCase();
  if (normalized.includes('DANH') || normalized === 'N' || normalized === 'NOUN') {
    return 'bg-amber-100 text-amber-800 border-amber-300';
  }
  if (normalized.includes('TÍNH') || normalized === 'ADJ' || normalized === 'ADJECTIVE') {
    return 'bg-pink-100 text-pink-800 border-pink-300';
  }
  if (normalized.includes('ĐỘNG') || normalized === 'V' || normalized === 'VERB') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  }
  if (normalized.includes('PHÓ') || normalized.includes('TRẠNG') || normalized === 'ADV' || normalized === 'ADVERB') {
    return 'bg-purple-100 text-purple-800 border-purple-300';
  }
  return 'bg-blue-100 text-blue-800 border-blue-300';
};
