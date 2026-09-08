import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { getBadgeColorClass, formatCardType, StudyCardProps } from '../types/card';

export const StudyCard: React.FC<StudyCardProps> = ({
  card,
  isFlipped,
  isAnswerRevealed = false,
  onFlip,
  onSpeak
}) => {
  const [imgError, setImgError] = useState(false);
  const formattedType = formatCardType(card.type);

  const fallbackImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    card.word + ' cute minimal 2d flat vector cartoon illustration white background'
  )}?width=400&height=300&nologo=true`;

  return (
    <div
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-label="Chạm vào thẻ để lật kiểm tra đáp án"
      className="w-full min-h-[240px] cursor-pointer select-none rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 active:scale-[0.99] hover:border-indigo-300 flex flex-col items-center justify-center text-center relative overflow-hidden"
    >
      {/* Hint tap icon */}
      <div className="absolute top-3 right-3 text-[10px] font-semibold text-slate-300 flex items-center gap-1 pointer-events-none">
        <span>{isFlipped ? 'Chạm để úp ↺' : 'Chạm để lật ↷'}</span>
      </div>

      {!isFlipped ? (
        /* ==================== MẶT TRƯỚC (CÂU HỎI & PHONICS) ==================== */
        <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          {/* 1. Nhãn Loại Từ Nổi Bật */}
          <span
            className={`text-[10px] font-black tracking-wider px-3 py-0.5 rounded-full uppercase border mb-2 shadow-xs ${getBadgeColorClass(
              card.type
            )}`}
          >
            {formattedType}
          </span>

          {/* 2. Hình Ảnh Minh Họa 2D (Cute Cartoon Vector) */}
          <div className="w-full h-28 sm:h-32 max-w-[220px] rounded-2xl overflow-hidden border border-slate-100 bg-slate-50/80 mb-2.5 flex items-center justify-center">
            {!imgError ? (
              <img
                src={card.imageUrl || fallbackImageUrl}
                alt={card.word}
                onError={() => setImgError(true)}
                className="w-full h-full object-contain p-1"
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 p-2">
                <span className="text-3xl mb-1">🎨</span>
                <span className="text-[10px] font-medium">{card.word}</span>
              </div>
            )}
          </div>

          {/* 3. Hàng Âm Tiết Đục Lỗ */}
          <div className="flex items-center justify-center gap-1.5 mb-2 flex-wrap">
            {card.chunks.map((chunk, idx) => {
              const isHidden = idx === card.hiddenChunkIndex;
              if (isHidden) {
                if (isAnswerRevealed) {
                  return (
                    <span
                      key={idx}
                      className="min-w-[46px] h-9 px-3 border-2 border-emerald-500 bg-emerald-50 text-emerald-600 rounded-xl font-black text-lg sm:text-xl flex items-center justify-center shadow-xs animate-in zoom-in-95 duration-200"
                    >
                      {chunk}
                    </span>
                  );
                }
                return (
                  <span
                    key={idx}
                    className="min-w-[46px] h-9 px-3 border-2 border-dashed border-indigo-500 bg-indigo-50/80 text-indigo-600 rounded-xl font-black text-lg sm:text-xl flex items-center justify-center animate-pulse shadow-xs"
                  >
                    ?
                  </span>
                );
              }
              return (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-slate-100/90 text-slate-800 rounded-xl font-bold text-base sm:text-lg border border-slate-200 shadow-xs"
                >
                  {chunk}
                </span>
              );
            })}
          </div>

          {/* Nghĩa Tiếng Việt ngắn gọn khi hiện đáp án tại chỗ */}
          {isAnswerRevealed && card.meaning && (
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {card.meaning}
            </div>
          )}

          {/* 4. Phiên Âm IPA & Nút Loa Nghe Lại */}
          <div className="flex items-center justify-center gap-2 text-slate-500 font-mono text-xs">
            <span className="tracking-wide">{card.ipa}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // Ngăn sự kiện click làm lật thẻ
                onSpeak();
              }}
              className="p-1.5 rounded-full hover:bg-indigo-50 active:scale-90 text-indigo-600 bg-slate-100 transition pointer-events-auto shadow-xs"
              title="Nghe lại phát âm (không lật thẻ)"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* ==================== MẶT SAU (LEAN CONTEXT & COLLOCATIONS) ==================== */
        <div className="w-full max-h-[260px] overflow-y-auto flex flex-col justify-center space-y-2.5 py-1 text-left animate-in fade-in zoom-in-95 duration-200 pointer-events-none no-scrollbar">
          {/* 1. Định nghĩa tiếng Anh chuẩn Oxford */}
          {(card.definition_en || card.meaning) && (
            <div className="bg-slate-50/90 rounded-xl p-2.5 sm:p-3 border border-slate-100 leading-relaxed shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">
                {card.definition_en ? 'Oxford Definition' : 'Definition'}
              </span>
              <p className="text-xs text-slate-700 italic font-medium leading-relaxed">
                "{card.definition_en || card.meaning}"
              </p>
            </div>
          )}

          {/* 2. Cụm từ đi kèm thông dụng (Collocations Chips) */}
          {card.collocations && card.collocations.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-0.5">
                Common Collocations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {card.collocations.map((colloc, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold shadow-2xs"
                  >
                    {colloc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3. Câu ví dụ ngữ cảnh & dịch nghĩa câu */}
          {(card.example || card.example_vi) && (
            <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-100 text-xs space-y-0.5">
              {card.example && (
                <p className="font-medium text-slate-800 leading-snug">
                  • {card.example}
                </p>
              )}
              {card.example_vi && (
                <p className="text-slate-500 text-[11px] pl-2.5 leading-snug">
                  {card.example_vi}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
