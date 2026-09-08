// src/services/syncService.ts
import { db, DEFAULT_FOLDER_ID, DEFAULT_FOLDER_NAME, ensureFSRSCard } from '../db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FolderItem, WordItem, Flashcard } from '../types';

/**
 * Dịch vụ Đồng bộ Hợp nhất Dữ liệu Đa Nền Tảng (Hybrid Data Reconciliation)
 * Đẩy dữ liệu cục bộ lên Supabase và kéo dữ liệu mới nhất từ Supabase về máy
 */
export async function syncLocalDataToCloud(userId: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured || !userId) {
    return { success: false, error: 'Chưa cấu hình Supabase hoặc chưa đăng nhập' };
  }

  try {
    console.log('[SyncService] Bắt đầu đồng bộ dữ liệu với tài khoản:', userId);

    // ==========================================
    // 1. PUSH: ĐỒNG BỘ LOCAL INDEXEDDB LÊN CLOUD
    // ==========================================

    // 1.1 Folders
    const localFolders = await db.folders.toArray();
    for (const f of localFolders) {
      await supabase.from('folders').upsert({
        id: f.id,
        user_id: userId,
        name: f.name,
        color: f.color || '#4f46e5',
        icon: f.icon || 'Folder',
        created_at: new Date(f.createdAt || Date.now()).toISOString(),
        updated_at: new Date(f.updatedAt || Date.now()).toISOString(),
      });
    }

    // 1.2 Words
    const localWords = await db.words.toArray();
    for (const w of localWords) {
      await supabase.from('words').upsert({
        id: w.id,
        user_id: userId,
        folder_id: w.folderId || DEFAULT_FOLDER_ID,
        word: w.word,
        ipa: w.ipa || '',
        type: w.type || 'n',
        meaning: w.meaning,
        definition_en: w.definition_en || '',
        collocations: w.collocations || [],
        chunks: w.chunks,
        example: w.example || '',
        example_vi: w.example_vi || '',
        created_at: new Date(w.createdAt || Date.now()).toISOString(),
        updated_at: new Date(w.updatedAt || Date.now()).toISOString(),
      });
    }

    // 1.3 Flashcards (FSRS State)
    const localCards = await db.flashcards.toArray();
    for (const c of localCards) {
      const fsrs = ensureFSRSCard(c);
      await supabase.from('flashcards').upsert({
        id: c.id,
        user_id: userId,
        word_id: c.wordId,
        folder_id: c.folderId || DEFAULT_FOLDER_ID,
        hidden_chunk_index: c.hiddenChunkIndex,
        due: new Date(c.due || c.dueDate || Date.now()).toISOString(),
        fsrs_card: fsrs,
        updated_at: new Date(c.updatedAt || Date.now()).toISOString(),
      });
    }

    // ==========================================
    // 2. PULL: KÉO DỮ LIỆU TỪ CLOUD VỀ LOCAL
    // ==========================================

    // 2.1 Kéo Folders
    const { data: remoteFolders, error: foldersErr } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId);

    if (!foldersErr && remoteFolders && remoteFolders.length > 0) {
      for (const rf of remoteFolders) {
        const folderItem: FolderItem = {
          id: rf.id,
          name: rf.name,
          color: rf.color,
          icon: rf.icon,
          createdAt: new Date(rf.created_at).getTime(),
          updatedAt: new Date(rf.updated_at).getTime(),
        };
        await db.folders.put(folderItem);
      }
    }

    // 2.2 Kéo Words
    const { data: remoteWords, error: wordsErr } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', userId);

    if (!wordsErr && remoteWords && remoteWords.length > 0) {
      for (const rw of remoteWords) {
        const wordItem: WordItem = {
          id: rw.id,
          folderId: rw.folder_id,
          word: rw.word,
          ipa: rw.ipa,
          type: rw.type,
          meaning: rw.meaning,
          definition_en: rw.definition_en,
          collocations: Array.isArray(rw.collocations) ? rw.collocations : [],
          chunks: Array.isArray(rw.chunks) ? rw.chunks : [rw.word],
          example: rw.example,
          example_vi: rw.example_vi,
          createdAt: new Date(rw.created_at).getTime(),
          updatedAt: new Date(rw.updated_at).getTime(),
        };
        await db.words.put(wordItem);
      }
    }

    // 2.3 Kéo Flashcards
    const { data: remoteCards, error: cardsErr } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId);

    if (!cardsErr && remoteCards && remoteCards.length > 0) {
      for (const rc of remoteCards) {
        const dueTimestamp = new Date(rc.due).getTime();
        const flashcard: Flashcard = {
          id: rc.id,
          wordId: rc.word_id,
          folderId: rc.folder_id,
          hiddenChunkIndex: rc.hidden_chunk_index,
          due: dueTimestamp,
          dueDate: dueTimestamp,
          fsrsCard: rc.fsrs_card,
          updatedAt: new Date(rc.updated_at).getTime(),
        };
        await db.flashcards.put(flashcard);
      }
    }

    console.log('[SyncService] Hoàn tất đồng bộ 2 chiều IndexedDB <-> Supabase!');
    return { success: true };
  } catch (err) {
    console.error('[SyncService] Lỗi trong quá trình đồng bộ:', err);
    return { success: false, error: err };
  }
}
