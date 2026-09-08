import React, { useEffect, useState } from 'react';
import { Folder, Play, Plus, Trash2, FolderPlus, Sparkles, Check } from 'lucide-react';
import { getFolderWithStatsList, createFolder, deleteFolder, DEFAULT_FOLDER_ID, db } from '../db';
import { FolderWithStats } from '../types';

interface FolderListViewProps {
  onStartStudy: (folderId?: string) => void;
  onOpenAISync: (folderId?: string) => void;
}

const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Rose
  '#7c3aed', // Purple
  '#0284c7'  // Sky
];

export const FolderListView: React.FC<FolderListViewProps> = ({
  onStartStudy,
  onOpenAISync
}) => {
  const [folders, setFolders] = useState<FolderWithStats[]>([]);
  const [totalDue, setTotalDue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#4f46e5');

  const loadData = async () => {
    try {
      const now = Date.now();
      const statsList = await getFolderWithStatsList(now);
      setFolders(statsList);

      const allCards = await db.flashcards.toArray();
      const globalDue = allCards.filter(c => {
        const cardDue = c.due ?? c.dueDate ?? 0;
        return cardDue <= now;
      }).length;
      setTotalDue(globalDue);
    } catch (err) {
      console.error('Lỗi khi tải danh sách thư mục:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim(), selectedColor);
      setNewFolderName('');
      setIsCreating(false);
      await loadData();
    } catch (err) {
      alert('Không thể tạo thư mục: ' + err);
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folder: FolderWithStats) => {
    e.stopPropagation();
    if (folder.id === DEFAULT_FOLDER_ID) {
      alert('Đây là thư mục mặc định của hệ thống, không thể xóa.');
      return;
    }

    if (confirm(`Bạn có chắc muốn xóa thư mục "${folder.name}" và toàn bộ ${folder.wordCount} từ vựng bên trong?`)) {
      try {
        await deleteFolder(folder.id);
        await loadData();
      } catch (err) {
        alert('Lỗi khi xóa thư mục: ' + err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-md w-full mx-auto p-4 space-y-4 select-none pb-24 overflow-y-auto">
      {/* 1. HERO BANNER: Ôn tập toàn bộ theo chuẩn Phương án 1 */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Lộ trình FSRS toàn hệ thống
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-black backdrop-blur-xs">
            {totalDue} thẻ đến hạn
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-black mb-1 leading-snug">
          Ôn tập tổng hợp tất cả chủ đề
        </h2>
        <p className="text-xs text-indigo-100/80 mb-4 leading-relaxed">
          Tối ưu hóa khả năng ghi nhớ dài hạn bằng thuật toán FSRS qua việc kết hợp từ vựng của mọi thư mục.
        </p>

        <button
          onClick={() => onStartStudy(undefined)}
          className="w-full py-3.5 px-4 rounded-2xl bg-white text-indigo-700 font-black text-sm flex items-center justify-center gap-2 active:scale-98 hover:bg-indigo-50 transition shadow-sm"
        >
          <Play className="w-4 h-4 fill-current text-indigo-600" />
          <span>{totalDue > 0 ? `Bắt đầu ôn ${totalDue} thẻ ngay` : 'Luyện tập toàn bộ từ vựng'}</span>
        </button>
      </div>

      {/* 2. KHU VỰC THƯ MỤC CHỦ ĐỀ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Thư mục chủ đề ({folders.length})
          </h3>
          <button
            onClick={() => setIsCreating(true)}
            className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo thư mục</span>
          </button>
        </div>

        {/* Modal / Form tạo nhanh thư mục mới */}
        {isCreating && (
          <form
            onSubmit={handleCreateFolder}
            className="p-4 bg-white rounded-2xl border-2 border-indigo-200 shadow-md space-y-3 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-800">Tạo thư mục chủ đề mới</h4>
            </div>

            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="VD: IELTS Band 6.5, Giao tiếp công sở..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Màu sắc nhận diện */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Màu sắc:</span>
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color }}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white transition active:scale-90"
                  >
                    {selectedColor === color && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewFolderName('');
                }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition"
              >
                Lưu thư mục
              </button>
            </div>
          </form>
        )}

        {/* Danh sách thẻ Folder */}
        {folders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            Chưa có thư mục nào. Bấm "Tạo thư mục" để bắt đầu.
          </div>
        ) : (
          folders.map((f) => (
            <div
              key={f.id}
              onClick={() => onStartStudy(f.id)}
              className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-indigo-300 transition cursor-pointer active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: f.color || '#4f46e5' }}
                >
                  <Folder className="w-5 h-5 fill-white/20" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition">
                    {f.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {f.wordCount} từ vựng
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {f.dueCount > 0 ? (
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-black">
                    {f.dueCount} cần ôn
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-full">
                    Xong
                  </span>
                )}

                {f.id !== DEFAULT_FOLDER_ID && (
                  <button
                    onClick={(e) => handleDeleteFolder(e, f)}
                    title="Xóa thư mục"
                    className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
