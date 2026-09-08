import Dexie, { Table } from 'dexie';
import { WordItem, Flashcard, DeckStats, FolderItem, FolderWithStats } from '../types';
import { createFlashcardsForWord } from '../utils/srs';
import { createEmptyCard, Card as FSRSCard } from 'ts-fsrs';

export const DEFAULT_FOLDER_ID = 'folder_default';
export const DEFAULT_FOLDER_NAME = 'Thư mục mặc định';

export class VocabDatabase extends Dexie {
  folders!: Table<FolderItem, string>;
  words!: Table<WordItem, string>;
  flashcards!: Table<Flashcard, string>;

  constructor() {
    super('VocabSyllableAppDB');
    this.version(3).stores({
      folders: 'id, name, createdAt',
      words: 'id, folderId, word, createdAt',
      flashcards: 'id, wordId, folderId, due, dueDate, state, [folderId+due]'
    });
  }
}

export const db = new VocabDatabase();

/**
 * Tự động nhận diện và nâng cấp thẻ cũ sang chuẩn FSRS
 */
export function ensureFSRSCard(card: any): FSRSCard {
  if (card && card.fsrsCard && card.fsrsCard.due) {
    return {
      ...card.fsrsCard,
      due: new Date(card.fsrsCard.due),
      last_review: card.fsrsCard.last_review ? new Date(card.fsrsCard.last_review) : undefined,
    };
  }
  // Nếu là thẻ cũ chưa có FSRS, khởi tạo state ban đầu dựa trên due hoặc dueDate cũ
  const fallbackDate = card?.due ? new Date(card.due) : card?.dueDate ? new Date(card.dueDate) : new Date();
  return createEmptyCard(fallbackDate);
}

// Dữ liệu mẫu chuẩn từ điển quốc tế Oxford
export const INITIAL_SEED_WORDS: Omit<WordItem, 'id' | 'createdAt'>[] = [
  {
    word: 'imperative',
    ipa: '/ɪmˈper.ə.tɪv/',
    type: 'adj',
    meaning: 'cực kỳ quan trọng, cấp bách, bắt buộc',
    definition_en: 'extremely important or urgent',
    collocations: ['vital imperative', 'imperative to act', 'moral imperative'],
    chunks: ['im', 'per', 'a', 'tive'],
    example: 'It is imperative to act immediately.',
    example_vi: 'Hành động ngay lập tức là điều cực kỳ cấp bách.',
    folderId: DEFAULT_FOLDER_ID
  },
  {
    word: 'communication',
    ipa: '/kəˌmjuː.nəˈkeɪ.ʃən/',
    type: 'n',
    meaning: 'sự giao tiếp, truyền đạt thông tin',
    definition_en: 'the activity or process of expressing ideas and feelings or of giving people information',
    collocations: ['effective communication', 'communication skills', 'breakdown in communication'],
    chunks: ['com', 'mu', 'ni', 'ca', 'tion'],
    example: 'Good communication is essential in teamwork.',
    example_vi: 'Giao tiếp tốt là điều cốt lõi trong làm việc nhóm.',
    folderId: DEFAULT_FOLDER_ID
  },
  {
    word: 'comfortable',
    ipa: '/ˈkʌm.fət.ə.bəl/',
    type: 'adj',
    meaning: 'thoải mái, tiện nghi, dễ chịu',
    definition_en: 'making you feel physically relaxed, without any pain or other unpleasant feelings',
    collocations: ['comfortable position', 'feel comfortable', 'comfortable lifestyle'],
    chunks: ['com', 'fort', 'a', 'ble'],
    example: 'These new shoes are very comfortable.',
    example_vi: 'Đôi giày mới này đi rất thoải mái.',
    folderId: DEFAULT_FOLDER_ID
  },
  {
    word: 'necessary',
    ipa: '/ˈnes.ə.ser.i/',
    type: 'adj',
    meaning: 'cần thiết, thiết yếu',
    definition_en: 'that is needed for a purpose or a reason',
    collocations: ['absolutely necessary', 'necessary step', 'deem something necessary'],
    chunks: ['nec', 'es', 'sar', 'y'],
    example: 'Sleep is necessary for good health.',
    example_vi: 'Giấc ngủ là điều cần thiết cho sức khỏe tốt.',
    folderId: DEFAULT_FOLDER_ID
  },
  {
    word: 'perseverance',
    ipa: '/ˌpɜː.sɪˈvɪə.rəns/',
    type: 'n',
    meaning: 'sự kiên trì, bền bỉ vượt khó',
    definition_en: 'the quality of continuing to try to achieve a particular aim despite difficulties',
    collocations: ['great perseverance', 'demonstrate perseverance', 'perseverance pays off'],
    chunks: ['per', 'se', 'ver', 'ance'],
    example: 'Success requires patience and perseverance.',
    example_vi: 'Thành công đòi hỏi sự kiên nhẫn và kiên trì.',
    folderId: DEFAULT_FOLDER_ID
  }
];

/**
 * Khởi tạo dữ liệu mẫu và đảm bảo thư mục mặc định tồn tại
 */
export async function initializeDatabase(): Promise<void> {
  // 1. Đảm bảo thư mục mặc định tồn tại
  const defaultFolder = await db.folders.get(DEFAULT_FOLDER_ID);
  if (!defaultFolder) {
    await db.folders.put({
      id: DEFAULT_FOLDER_ID,
      name: DEFAULT_FOLDER_NAME,
      color: '#4f46e5',
      icon: 'Folder',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  // 2. Migration: Gán folderId cho bất kỳ từ hoặc thẻ nào chưa có folderId
  const wordsWithoutFolder = await db.words.filter(w => !w.folderId).toArray();
  for (const w of wordsWithoutFolder) {
    await db.words.update(w.id, { folderId: DEFAULT_FOLDER_ID });
  }

  const cardsWithoutFolder = await db.flashcards.filter(c => !c.folderId).toArray();
  for (const c of cardsWithoutFolder) {
    await db.flashcards.update(c.id, { folderId: DEFAULT_FOLDER_ID });
  }

  // 3. Migration: Cập nhật definition_en & collocations cho các từ mẫu cũ nếu thiếu
  const allExistingWords = await db.words.toArray();
  for (const w of allExistingWords) {
    const seedMatch = INITIAL_SEED_WORDS.find(s => s.word.toLowerCase() === w.word.toLowerCase());
    if (seedMatch) {
      const updates: Partial<WordItem> = {};
      if (!w.definition_en && seedMatch.definition_en) {
        updates.definition_en = seedMatch.definition_en;
      }
      if ((!w.collocations || w.collocations.length === 0) && seedMatch.collocations) {
        updates.collocations = seedMatch.collocations;
      }
      if (Object.keys(updates).length > 0) {
        await db.words.update(w.id, updates);
      }
    }
  }

  // 4. Khởi tạo seed words nếu database đang trống
  const count = await db.words.count();
  if (count === 0) {
    for (const item of INITIAL_SEED_WORDS) {
      await addWordWithCards(item, DEFAULT_FOLDER_ID);
    }
  }
}

/**
 * Thêm một thư mục mới
 */
export async function createFolder(name: string, color: string = '#4f46e5'): Promise<FolderItem> {
  const folderId = crypto.randomUUID ? crypto.randomUUID() : `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const folder: FolderItem = {
    id: folderId,
    name: name.trim() || 'Thư mục mới',
    color,
    icon: 'Folder',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await db.folders.add(folder);
  return folder;
}

/**
 * Lấy tất cả các thư mục
 */
export async function getAllFolders(): Promise<FolderItem[]> {
  return await db.folders.toArray();
}

/**
 * Xóa một thư mục và các từ vựng thuộc thư mục đó
 */
export async function deleteFolder(folderId: string): Promise<void> {
  if (folderId === DEFAULT_FOLDER_ID) {
    throw new Error('Không thể xóa thư mục mặc định');
  }
  await db.transaction('rw', db.folders, db.words, db.flashcards, async () => {
    await db.folders.delete(folderId);
    const wordsInFolder = await db.words.where('folderId').equals(folderId).toArray();
    for (const w of wordsInFolder) {
      await db.words.delete(w.id);
      await db.flashcards.where('wordId').equals(w.id).delete();
    }
  });
}

/**
 * Lấy danh sách thư mục kèm thống kê từ vựng và thẻ đến hạn
 */
export async function getFolderWithStatsList(now: number = Date.now()): Promise<FolderWithStats[]> {
  const allFolders = await db.folders.toArray();
  const allWords = await db.words.toArray();
  const allCards = await db.flashcards.toArray();

  const folderStats: FolderWithStats[] = allFolders.map(folder => {
    const wordCount = allWords.filter(w => (w.folderId || DEFAULT_FOLDER_ID) === folder.id).length;
    const dueCount = allCards.filter(c => {
      const isMatchFolder = (c.folderId || DEFAULT_FOLDER_ID) === folder.id;
      if (!isMatchFolder) return false;
      const cardDue = c.due ?? c.dueDate ?? 0;
      const fsrs = ensureFSRSCard(c);
      return cardDue <= now || fsrs.state === 0 || fsrs.state === 1 || fsrs.state === 3 || c.state === 'learning' || c.state === 'new';
    }).length;

    return {
      ...folder,
      wordCount,
      dueCount
    };
  });

  return folderStats;
}

/**
 * Thêm một từ mới và tự động sinh N thẻ flashcards tương ứng
 */
export async function addWordWithCards(
  wordData: Omit<WordItem, 'id' | 'createdAt'>,
  folderId: string = DEFAULT_FOLDER_ID
): Promise<{ word: WordItem; cards: Flashcard[] }> {
  const wordId = crypto.randomUUID ? crypto.randomUUID() : `w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const word: WordItem = {
    ...wordData,
    id: wordId,
    folderId: folderId || DEFAULT_FOLDER_ID,
    createdAt: Date.now()
  };

  const cards = createFlashcardsForWord(wordId, word.chunks.length, word.folderId);

  await db.transaction('rw', db.words, db.flashcards, async () => {
    await db.words.add(word);
    await db.flashcards.bulkAdd(cards);
  });

  return { word, cards };
}

/**
 * Thêm hàng loạt từ (từ modal AI sync) gắn với folderId
 */
export async function addBatchWords(words: WordItem[], folderId: string = DEFAULT_FOLDER_ID): Promise<number> {
  let totalCardsAdded = 0;

  await db.transaction('rw', db.words, db.flashcards, async () => {
    for (const w of words) {
      const itemWithFolder: WordItem = {
        ...w,
        folderId: w.folderId || folderId || DEFAULT_FOLDER_ID
      };
      await db.words.put(itemWithFolder);
      const cards = createFlashcardsForWord(w.id, w.chunks.length, itemWithFolder.folderId);
      await db.flashcards.bulkPut(cards);
      totalCardsAdded += cards.length;
    }
  });

  return totalCardsAdded;
}

/**
 * Lấy danh sách thẻ đến hạn ôn tập theo Phương án 1 (Hybrid Review Mode):
 * - Nếu folderId xác định: Lọc riêng thẻ của Thư mục đó. Nếu chưa có thẻ đến hạn, lấy tối đa 20 thẻ để luyện tập.
 * - Nếu folderId không có: Gom toàn bộ thẻ đến hạn của TOÀN BỘ thư mục.
 */
export async function getDueFlashcards(folderId?: string): Promise<{ card: Flashcard; word: WordItem }[]> {
  const now = Date.now();
  const allCards = await db.flashcards.toArray();

  let targetCards: Flashcard[] = [];

  if (folderId) {
    // 1B. Scoped Folder Queue
    const folderCards = allCards.filter(c => (c.folderId || DEFAULT_FOLDER_ID) === folderId);
    let dueInFolder = folderCards.filter(c => {
      const cardDue = c.due ?? c.dueDate ?? 0;
      const fsrs = ensureFSRSCard(c);
      return cardDue <= now || fsrs.state === 0 || fsrs.state === 1 || fsrs.state === 3 || c.state === 'learning' || c.state === 'new';
    });

    // Fallback: nếu không có thẻ nào đến hạn trong folder, nạp tối đa 20 thẻ bất kỳ của folder để luyện tập
    if (dueInFolder.length === 0) {
      dueInFolder = folderCards.slice(0, 20);
    }
    targetCards = dueInFolder;
  } else {
    // 1A. Global Queue: Gom tất cả thẻ đến hạn của mọi thư mục
    targetCards = allCards.filter(c => {
      const cardDue = c.due ?? c.dueDate ?? 0;
      const fsrs = ensureFSRSCard(c);
      return cardDue <= now || fsrs.state === 0 || fsrs.state === 1 || fsrs.state === 3 || c.state === 'learning' || c.state === 'new';
    });
  }

  // Sắp xếp ưu tiên: Learning -> New -> Due Review
  targetCards.sort((a, b) => {
    const fsrsA = ensureFSRSCard(a);
    const fsrsB = ensureFSRSCard(b);
    if ((fsrsA.state === 1 || fsrsA.state === 3) && fsrsB.state !== 1 && fsrsB.state !== 3) return -1;
    if ((fsrsB.state === 1 || fsrsB.state === 3) && fsrsA.state !== 1 && fsrsA.state !== 3) return 1;
    const dueA = a.due ?? a.dueDate ?? 0;
    const dueB = b.due ?? b.dueDate ?? 0;
    return dueA - dueB;
  });

  const wordsMap = new Map<string, WordItem>();
  const words = await db.words.toArray();
  words.forEach(w => wordsMap.set(w.id, w));

  const result: { card: Flashcard; word: WordItem }[] = [];
  for (const rawCard of targetCards) {
    const word = wordsMap.get(rawCard.wordId);
    if (word) {
      const card: Flashcard = {
        ...rawCard,
        due: rawCard.due ?? rawCard.dueDate ?? now,
        fsrsCard: ensureFSRSCard(rawCard)
      };
      result.push({ card, word });
    }
  }

  return result;
}

/**
 * Xóa một từ và toàn bộ thẻ của từ đó
 */
export async function deleteWord(wordId: string): Promise<void> {
  await db.transaction('rw', db.words, db.flashcards, async () => {
    await db.words.delete(wordId);
    await db.flashcards.where('wordId').equals(wordId).delete();
  });
}

/**
 * Thống kê tổng quan
 */
export async function getDeckStats(): Promise<DeckStats> {
  const totalWords = await db.words.count();
  const totalFolders = await db.folders.count();
  const allCards = await db.flashcards.toArray();
  const now = Date.now();

  const totalCards = allCards.length;
  let dueCards = 0;
  let learningCards = 0;
  let newCards = 0;
  let reviewedCards = 0;

  for (const card of allCards) {
    const fsrs = ensureFSRSCard(card);
    const cardDue = card.due ?? card.dueDate ?? 0;

    if (fsrs.state === 0 || card.state === 'new') {
      newCards++;
    } else if (fsrs.state === 1 || fsrs.state === 3 || card.state === 'learning') {
      learningCards++;
    } else {
      reviewedCards++;
    }

    if (cardDue <= now) {
      dueCards++;
    }
  }

  return {
    totalWords,
    totalCards,
    dueCards,
    learningCards,
    newCards,
    reviewedCards,
    totalFolders
  };
}

