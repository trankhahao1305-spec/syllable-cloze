import React, { useState, useEffect } from 'react';
import { WordItem, Flashcard, DeckStats } from '../types';
import { db, deleteWord } from '../db';
import { soundEngine } from '../services/audioService';
import { Search, Trash2, Volume2, Download, Upload, Sparkles, BookOpen } from 'lucide-react';

interface DeckManagerProps {
  onOpenAISync: () => void;
  onRefresh: () => void;
  stats: DeckStats;
}

export const DeckManager: React.FC<DeckManagerProps> = ({
  onOpenAISync,
  onRefresh,
  stats
}) => {
  const [words, setWords] = useState<WordItem[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'due' | 'new'>('all');

  const loadData = async () => {
    const allWords = await db.words.orderBy('createdAt').reverse().toArray();
    const allCards = await db.flashcards.toArray();
    setWords(allWords);
    setCards(allCards);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSpeak = (word: string) => {
    soundEngine.playPronunciation(word);
  };

  const handleDeleteWord = async (wordId: string, wordName: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa từ "${wordName}" và toàn bộ thẻ ôn tập của từ này?`)) {
      await deleteWord(wordId);
      await loadData();
      onRefresh();
    }
  };

  const handleExportBackup = async () => {
    const allWords = await db.words.toArray();
    const allCards = await db.flashcards.toArray();
    const backupData = {
      version: 2,
      engine: 'FSRS',
      exportedAt: new Date().toISOString(),
      words: allWords,
      flashcards: allCards
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syllable_cloze_fsrs_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        if (data.words && data.flashcards) {
          await db.transaction('rw', db.words, db.flashcards, async () => {
            await db.words.bulkPut(data.words);
            await db.flashcards.bulkPut(data.flashcards);
          });
          alert('Khôi phục dữ liệu FSRS thành công!');
          await loadData();
          onRefresh();
        } else {
          alert('Tệp sao lưu không đúng định dạng!');
        }
      } catch (err) {
        alert('Không thể đọc tệp sao lưu: ' + err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredWords = words.filter((w: WordItem) => {
    const matchQuery = w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.meaning.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchQuery) return false;

    if (filterState === 'due') {
      const wordCards = cards.filter((c: Flashcard) => c.wordId === w.id);
      return wordCards.some((c: Flashcard) => (c.due ?? c.dueDate ?? 0) <= Date.now());
    }

    if (filterState === 'new') {
      const wordCards = cards.filter((c: Flashcard) => c.wordId === w.id);
      return wordCards.some((c: Flashcard) => c.state === 'new' || c.fsrsCard?.state === 0);
    }

    return true;
  });

  return (
    <div className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-4 overflow-y-auto">
      {/* Thẻ Thống Kê Tổng Quan */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-5 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Tiến độ học tập (FSRS Anki)
          </span>
          <span className="text-xs text-slate-300">
            Tổng {stats.totalWords} từ vựng
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
            <span className="block text-2xl font-black text-rose-300">{stats.dueCards}</span>
            <span className="text-[11px] text-slate-300">Cần ôn</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
            <span className="block text-2xl font-black text-amber-300">{stats.learningCards}</span>
            <span className="text-[11px] text-slate-300">Đang học</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
            <span className="block text-2xl font-black text-emerald-300">{stats.reviewedCards}</span>
            <span className="text-[11px] text-slate-300">Đã nhớ</span>
          </div>
        </div>
      </div>

      {/* Thanh Tìm Kiếm & Nút Chức Năng */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Tìm kiếm từ vựng hoặc nghĩa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        {/* Nút Sao lưu & Khôi phục */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportBackup}
              title="Tải về file JSON sao lưu"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Xuất sao lưu</span>
            </button>
            <label className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nhập file</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>

          <button
            onClick={onOpenAISync}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Thêm từ</span>
          </button>
        </div>
      </div>

      {/* Danh Sách Từ Vựng */}
      <div className="space-y-2.5">
        {filteredWords.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-6">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Không tìm thấy từ vựng nào</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Bạn có thể dùng tính năng Đồng bộ AI để nạp thêm từ mới.</p>
            <button
              onClick={onOpenAISync}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-200"
            >
              Mở Đồng bộ AI
            </button>
          </div>
        ) : (
          filteredWords.map((w: WordItem) => {
            const wordCards = cards.filter((c: Flashcard) => c.wordId === w.id);
            const dueCount = wordCards.filter((c: Flashcard) => (c.due ?? c.dueDate ?? 0) <= Date.now()).length;

            return (
              <div
                key={w.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:border-indigo-200 transition-all space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-800">{w.word}</span>
                    <button
                      onClick={() => handleSpeak(w.word)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50"
                      title="Phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono text-slate-400">{w.ipa}</span>
                    <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {w.type}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteWord(w.id, w.word)}
                    className="p-1 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                    title="Xóa từ này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Âm tiết */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {w.chunks.map((chunk: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      {chunk}
                    </span>
                  ))}
                  <span className="text-[11px] text-slate-400 ml-1">
                    ({w.chunks.length} thẻ cloze)
                  </span>
                </div>

                {/* Nghĩa & Ví dụ */}
                <p className="text-xs font-medium text-slate-700">{w.meaning}</p>
                <p className="text-[11px] text-slate-400 italic">"{w.example}"</p>

                {/* Trạng thái thẻ của từ */}
                <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[11px]">
                  <span className="text-slate-400">
                    Trạng thái thẻ:
                  </span>
                  <span className={dueCount > 0 ? 'text-rose-500 font-semibold' : 'text-emerald-600 font-semibold'}>
                    {dueCount > 0 ? `Có ${dueCount} thẻ cần ôn` : 'Đang trong chu kỳ FSRS'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
