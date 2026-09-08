import React from 'react';
import { Sparkles, BookOpen, Layers, Volume2 } from 'lucide-react';
import { DeckStats } from '../types';

interface HeaderProps {
  currentTab: 'study' | 'library';
  onTabChange: (tab: 'study' | 'library') => void;
  onOpenAISync: () => void;
  stats: DeckStats;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenAISync,
  stats
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* App Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <span className="font-bold text-sm tracking-tighter">Syll</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">SyllableCloze</h1>
            <span className="text-[10px] text-slate-400 font-medium">SRS & Kinesthetic</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => onTabChange('study')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'study'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Học</span>
            {stats.dueCards > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                {stats.dueCards}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('library')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'library'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kho từ</span>
          </button>
        </div>

        {/* AI Sync Button */}
        <button
          onClick={onOpenAISync}
          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-200 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">Đồng bộ</span> AI
        </button>
      </div>
    </header>
  );
};
