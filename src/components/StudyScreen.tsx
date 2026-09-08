import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, CheckCircle, RefreshCw, RotateCcw, Eye } from 'lucide-react';
import { CardWithWord, FSRSRating } from '../types';
import { StudyCardData } from '../types/card';
import { StudyCard } from './StudyCard';
import { Scratchpad, ScratchpadHandle } from './Scratchpad';
import { SRSService } from '../services/srsService';
import { soundEngine } from '../services/audioService';
import { ensureFSRSCard, db } from '../db';

interface StudyScreenProps {
  cards: CardWithWord[];
  onRefreshDueCards: () => void;
  onOpenAISync: () => void;
  folderName?: string;
  onExitFolderStudy?: () => void;
}

export const StudyScreen: React.FC<StudyScreenProps> = ({
  cards,
  onRefreshDueCards,
  onOpenAISync,
  folderName,
  onExitFolderStudy
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const scratchpadRef = useRef<ScratchpadHandle | null>(null);

  const currentItem = cards[currentIndex];

  // Khởi tạo & đảm bảo đối tượng FSRS Card
  const currentFSRSCard = useMemo(() => {
    return currentItem ? ensureFSRSCard(currentItem.card) : null;
  }, [currentItem]);

  // Tính toán trước nhãn 4 mốc thời gian FSRS: Lại, Khó, Tốt, Dễ
  const intervals = useMemo(() => {
    if (!currentFSRSCard) return null;
    return SRSService.getPreviewIntervals(currentFSRSCard);
  }, [currentFSRSCard]);

  // Hàm phát âm thanh chuẩn Studio 3 tầng (Human MP3 -> Google CDN -> Natural Speech)
  const handleSpeak = (textToSpeak?: string) => {
    const wordToSpeak = textToSpeak || currentItem?.word?.word;
    if (!wordToSpeak) return;
    soundEngine.playPronunciation(wordToSpeak);
  };

  // AC-1 & TASK-AUDIO-FRONT-TRIGGER: Tự động phát âm ngay khi thẻ mới xuất hiện ở Mặt Trước
  useEffect(() => {
    if (currentItem?.word?.word) {
      setIsFlipped(false);
      setIsAnswerRevealed(false);
      // Preload ngay lập tức để âm thanh có sẵn trong RAM (< 10ms)
      soundEngine.preload(currentItem.word.word);
      handleSpeak(currentItem.word.word);

      // Preload trước từ của thẻ kế tiếp trong phiên học để khi chuyển thẻ phát tức thì
      if (cards[currentIndex + 1]?.word?.word) {
        soundEngine.preload(cards[currentIndex + 1].word.word);
      }
    }
  }, [currentIndex, currentItem?.card?.id]);

  const handleFlipCard = () => {
    setIsFlipped(prev => !prev);
  };

  const handleRevealAnswer = () => {
    setIsAnswerRevealed(true);
  };

  const handleRateSRS = async (rating: FSRSRating) => {
    if (!currentItem || !currentFSRSCard) return;

    // 1. Áp dụng đánh giá và tính Card FSRS mới
    const updatedFSRSCard = SRSService.rateCard(currentFSRSCard, rating);

    // 2. Cập nhật thẻ vào IndexedDB
    await db.flashcards.update(currentItem.card.id, {
      fsrsCard: updatedFSRSCard,
      due: updatedFSRSCard.due.getTime(),
      dueDate: updatedFSRSCard.due.getTime()
    });

    // 3. Tự động xóa bảng vẽ tay (Auto-clear)
    scratchpadRef.current?.clear();

    // 4. Luôn đặt lại Mặt Trước và trạng thái chưa hiện đáp án cho thẻ tiếp theo
    setIsFlipped(false);
    setIsAnswerRevealed(false);

    // 5. Chuyển sang thẻ tiếp theo
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onRefreshDueCards();
      setCurrentIndex(0);
    }
  };

  const handleClearScratchpad = () => {
    scratchpadRef.current?.clear();
  };

  if (!currentItem || cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Tuyệt vời! Bạn đã hoàn thành bài học</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Hiện tại không còn thẻ nào cần ôn tập hôm nay. Bạn có thể nạp thêm từ vựng mới bằng AI hoặc xem lại danh sách.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onRefreshDueCards}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Kiểm tra lại
          </button>
          <button
            onClick={onOpenAISync}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm shadow-md shadow-indigo-200 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> Thêm từ mới
          </button>
        </div>
      </div>
    );
  }

  const { word, card } = currentItem;

  const cardData: StudyCardData = {
    id: card.id,
    word: word.word,
    ipa: word.ipa,
    type: word.type,
    meaning: word.meaning,
    definition_en: word.definition_en,
    collocations: word.collocations,
    chunks: word.chunks,
    hiddenChunkIndex: card.hiddenChunkIndex,
    example: word.example,
    example_vi: word.example_vi
  };

  return (
    <div className="flex-1 flex flex-col max-w-md w-full mx-auto px-3 py-2 select-none h-[calc(100vh-62px)]">
      {/* VÙNG TRÊN - Thẻ Đục Lỗ 2 Mặt Thông Minh (Tap-to-Flip) */}
      <div className="mb-2.5">
        {/* Thông tin thư mục nếu đang học riêng theo thư mục */}
        {folderName && (
          <div className="flex items-center justify-between text-xs mb-1 px-1">
            <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
              📁 Thư mục: {folderName}
            </span>
            {onExitFolderStudy && (
              <button
                onClick={onExitFolderStudy}
                className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 transition"
              >
                Ôn tất cả ✕
              </button>
            )}
          </div>
        )}

        {/* Thông tin số thứ tự thẻ */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 px-1">
          <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            Thẻ {currentIndex + 1} / {cards.length}
          </span>
          <span className="text-[11px] text-slate-400">
            {isFlipped ? 'Mặt sau (Đáp án)' : isAnswerRevealed ? 'Mặt trước (Đã hiện đáp án)' : 'Mặt trước (Gợi nhớ)'}
          </span>
        </div>

        {/* Component Thẻ 2 Mặt Thông Minh */}
        <StudyCard
          card={cardData}
          isFlipped={isFlipped}
          isAnswerRevealed={isAnswerRevealed}
          onFlip={handleFlipCard}
          onSpeak={() => handleSpeak(word.word)}
        />
      </div>

      {/* VÙNG GIỮA - Bảng Viết Tay Cảm Ứng Scratchpad */}
      <div className="flex-1 min-h-0 mb-2.5 relative">
        <Scratchpad
          ref={scratchpadRef}
          strokeColor="#0f172a"
          lineWidth={3.5}
          className="w-full h-full"
        />
        {/* Nút Xóa nhanh bảng viết tay */}
        <button
          onClick={handleClearScratchpad}
          className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm text-slate-600 hover:text-slate-900 active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
          title="Xóa chữ trên bảng"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Xóa bảng</span>
        </button>
      </div>

      {/* VÙNG DƯỚI - Nút Hiện Đáp Án (Mặt trước) & Cụm 4 Nút FSRS (Mặt sau hoặc khi đã hiện đáp án) */}
      <div className="h-16 flex items-center">
        {!isFlipped && !isAnswerRevealed ? (
          <button
            onClick={handleRevealAnswer}
            className="w-full h-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Eye className="w-5 h-5" />
            <span>Hiện đáp án</span>
          </button>
        ) : (
          <div className="w-full h-full grid grid-cols-4 gap-1.5 sm:gap-2">
            {/* Lại (Again) */}
            <button
              onClick={() => handleRateSRS('again')}
              className="flex flex-col items-center justify-center rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold active:scale-95 transition-all p-1 cursor-pointer"
            >
              <span className="text-xs sm:text-sm">Lại</span>
              <span className="text-[10px] font-normal text-rose-500">
                {intervals?.again.label || '< 10p'}
              </span>
            </button>

            {/* Khó (Hard) */}
            <button
              onClick={() => handleRateSRS('hard')}
              className="flex flex-col items-center justify-center rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold active:scale-95 transition-all p-1 cursor-pointer"
            >
              <span className="text-xs sm:text-sm">Khó</span>
              <span className="text-[10px] font-normal text-amber-600">
                {intervals?.hard.label || '< 15p'}
              </span>
            </button>

            {/* Tốt (Good) */}
            <button
              onClick={() => handleRateSRS('good')}
              className="flex flex-col items-center justify-center rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-md shadow-sky-200 active:scale-95 transition-all p-1 cursor-pointer"
            >
              <span className="text-xs sm:text-sm">Tốt</span>
              <span className="text-[10px] font-normal text-sky-100">
                {intervals?.good.label || '1 ngày'}
              </span>
            </button>

            {/* Dễ (Easy) */}
            <button
              onClick={() => handleRateSRS('easy')}
              className="flex flex-col items-center justify-center rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200 active:scale-95 transition-all p-1 cursor-pointer"
            >
              <span className="text-xs sm:text-sm">Dễ</span>
              <span className="text-[10px] font-normal text-emerald-100">
                {intervals?.easy.label || '4 ngày'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
