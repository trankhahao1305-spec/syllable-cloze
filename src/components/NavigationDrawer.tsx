import React, { useState } from 'react';
import {
  Menu,
  X,
  Sparkles,
  BookOpen,
  Layers,
  BarChart2,
  Download,
  Upload,
  Settings,
  Folder,
  Cloud,
  LogOut
} from 'lucide-react';
import { DeckStats } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: 'study' | 'folders' | 'words' | 'stats';
  onSelectTab: (tab: 'study' | 'folders' | 'words' | 'stats') => void;
  onOpenAISync: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenAuth?: () => void;
  stats: DeckStats;
  voiceLang: 'en-US' | 'en-GB';
  onChangeVoiceLang: (lang: 'en-US' | 'en-GB') => void;
}

export const NavigationDrawer: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAISync,
  onExport,
  onImport,
  onOpenAuth,
  stats,
  voiceLang,
  onChangeVoiceLang
}) => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleNavClick = (callback: () => void) => {
    callback();
    setIsOpen(false);
  };

  return (
    <>
      {/* Top Header Bar - Tối giản, cố định, phong cách kính mờ */}
      <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 flex items-center justify-between">
        {/* Bên trái: Nút Logo + Tên + Hamburger mở Sidebar */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 p-1.5 -ml-1.5 rounded-xl hover:bg-slate-100 active:scale-95 transition text-slate-800"
          aria-label="Mở menu"
        >
          {/* Logo Brand Icon */}
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-indigo-200">
            SC
          </div>
          <span className="font-bold text-slate-800 text-sm tracking-tight">SyllableCloze</span>
          <Menu className="w-4 h-4 text-slate-500 ml-0.5" />
        </button>

        {/* Bên phải: Trạng thái thẻ cần ôn & Avatar tài khoản */}
        <div className="flex items-center gap-2">
          {stats.dueCards > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-full">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-xs font-bold text-rose-600">{stats.dueCards} cần ôn</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold text-emerald-600">Đã xong</span>
            </div>
          )}

          {user ? (
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-1 p-0.5 rounded-full hover:ring-2 hover:ring-indigo-400 transition"
              title={user.user_metadata?.full_name || user.email || 'Tài khoản'}
            >
              {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                <img
                  src={user.user_metadata.avatar_url || user.user_metadata.picture}
                  alt={user.user_metadata?.full_name || 'Avatar'}
                  className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500 shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
              }}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
              title="Đăng nhập / Đồng bộ Cloud"
            >
              <Cloud className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Backdrop - Lớp phủ nền mờ z-40 nằm đè lên Canvas */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Sidebar (Gemini Style) - z-50 */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 sm:w-80 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ touchAction: 'pan-y' }}
      >
        {/* Drawer Header */}
        <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              SC
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm">SyllableCloze</span>
              <span className="block text-[10px] text-slate-400 font-medium">SRS & Kinesthetic</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button (Gemini-like New Chat button) */}
        <div className="p-3">
          <button
            onClick={() => handleNavClick(onOpenAISync)}
            className="w-full flex items-center gap-2.5 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 active:scale-[0.98] text-indigo-700 font-semibold rounded-2xl transition text-sm shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Thêm từ mới (AI Sync)</span>
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => handleNavClick(() => onSelectTab('study'))}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentTab === 'study'
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Sàn ôn tập</span>
            </div>
            {stats.dueCards > 0 && (
              <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                {stats.dueCards}
              </span>
            )}
          </button>

          <button
            onClick={() => handleNavClick(() => onSelectTab('folders'))}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentTab === 'folders'
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Folder className="w-4 h-4 text-indigo-600" />
              <span>Thư mục chủ đề</span>
            </div>
            <span className="text-xs text-slate-400 font-normal">
              {stats.totalFolders || 1} thư mục
            </span>
          </button>

          <button
            onClick={() => handleNavClick(() => onSelectTab('words'))}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentTab === 'words'
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>Kho từ vựng</span>
            </div>
            <span className="text-xs text-slate-400 font-normal">
              {stats.totalWords} từ
            </span>
          </button>

          <button
            onClick={() => handleNavClick(() => onSelectTab('stats'))}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentTab === 'stats'
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart2 className="w-4 h-4 text-amber-500" />
              <span>Thống kê SRS</span>
            </div>
            <span className="text-xs text-slate-400 font-normal">
              {stats.totalCards} thẻ
            </span>
          </button>

          {/* Cài đặt âm thanh thu gọn */}
          <div className="pt-3 pb-1 px-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Cài đặt phát âm</span>
              </div>
              <span>{showSettings ? '▲' : '▼'}</span>
            </button>

            {showSettings && (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Giọng chuẩn:</span>
                  <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => onChangeVoiceLang('en-US')}
                      className={`px-2 py-0.5 rounded font-semibold ${
                        voiceLang === 'en-US' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Mỹ (US)
                    </button>
                    <button
                      onClick={() => onChangeVoiceLang('en-GB')}
                      className={`px-2 py-0.5 rounded font-semibold ${
                        voiceLang === 'en-GB' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Anh (UK)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Data Actions - Chân trang */}
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
          {/* Khu vực Tài khoản / Xác thực */}
          {user ? (
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                    <img
                      src={user.user_metadata.avatar_url || user.user_metadata.picture}
                      alt={user.user_metadata?.full_name || 'Avatar'}
                      className="w-9 h-9 rounded-full object-cover border-2 border-indigo-200 shrink-0 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                      {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5" title={user.email}>
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span>Đã kết nối Google Cloud Sync</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                if (onOpenAuth) handleNavClick(onOpenAuth);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs shadow-indigo-200 active:scale-98 cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>Đăng nhập / Đồng bộ Cloud</span>
            </button>
          )}

          <div className="space-y-0.5 pt-1">
            <button
              onClick={() => handleNavClick(onExport)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-white hover:text-indigo-600 transition"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Xuất sao lưu (JSON)</span>
            </button>
            <button
              onClick={() => handleNavClick(onImport)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-white hover:text-emerald-600 transition"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              <span>Nhập tệp sao lưu</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
