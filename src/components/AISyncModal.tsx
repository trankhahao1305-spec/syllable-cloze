import React, { useState, useEffect } from 'react';
import { X, Copy, ExternalLink, Trash2, CheckCircle2, Sparkles, AlertCircle, Folder, Plus } from 'lucide-react';
import { generatePrompt, parseAIResponse } from '../utils/aiParser';
import { addBatchWords, getAllFolders, createFolder, DEFAULT_FOLDER_ID } from '../db';
import { WordItem, FolderItem } from '../types';

interface AISyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (wordCount: number, cardCount: number) => void;
  initialFolderId?: string;
}

export const AISyncModal: React.FC<AISyncModalProps> = ({ isOpen, onClose, onSuccess, initialFolderId }) => {
  const [wordsInput, setWordsInput] = useState('imperative, communication, comfortable, necessary, perseverance');
  const [aiOutput, setAiOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Folder states
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(initialFolderId || DEFAULT_FOLDER_ID);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadFolders();
      if (initialFolderId) {
        setSelectedFolderId(initialFolderId);
      }
    }
  }, [isOpen, initialFolderId]);

  const loadFolders = async () => {
    try {
      const list = await getAllFolders();
      setFolders(list);
      if (!selectedFolderId && list.length > 0) {
        setSelectedFolderId(list[0].id);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách thư mục:', err);
    }
  };

  if (!isOpen) return null;

  const currentPrompt = generatePrompt(wordsInput);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(currentPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = currentPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleImportAI = async () => {
    setError(null);
    if (!aiOutput.trim()) {
      setError('Vui lòng dán kết quả JSON từ AI vào ô bên dưới.');
      return;
    }

    setLoading(true);
    try {
      let targetFolderId = selectedFolderId;
      if (isCreatingFolder) {
        if (!newFolderName.trim()) {
          throw new Error('Vui lòng nhập tên thư mục mới muốn tạo.');
        }
        const created = await createFolder(newFolderName.trim());
        targetFolderId = created.id;
      }

      const parsedWords: WordItem[] = parseAIResponse(aiOutput);
      const totalCards = await addBatchWords(parsedWords, targetFolderId);
      onSuccess(parsedWords.length, totalCards);
      setAiOutput('');
      setIsCreatingFolder(false);
      setNewFolderName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xử lý dữ liệu AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-sky-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Đồng Bộ AI (Clipboard Bridge)</h2>
              <p className="text-xs text-slate-500">Tạo bộ thẻ âm tiết từ thiện chuẩn Oxford/Merriam-Webster</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Chọn Thư Mục Lưu Trữ */}
          <div className="bg-indigo-50/60 rounded-2xl p-3.5 border border-indigo-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-indigo-600" />
                Lưu bộ từ vào Thư mục chủ đề:
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreatingFolder ? 'Chọn thư mục có sẵn' : 'Tạo thư mục mới'}</span>
              </button>
            </div>

            {!isCreatingFolder ? (
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              >
                {folders.map(f => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-1">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nhập tên thư mục mới (VD: IELTS Topic 01 - Environment)..."
                  className="w-full text-xs px-3 py-2 bg-white border border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                <p className="text-[10px] text-indigo-500 font-medium">
                  * Thư mục mới này sẽ được tự động tạo và gán cho các từ vựng bên dưới.
                </p>
              </div>
            )}
          </div>

          {/* Khu vực 1: Sao chép Prompt */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                Khu vực 1: Chuẩn bị Prompt
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="https://gemini.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm"
                >
                  Mở Gemini <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://chatgpt.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm"
                >
                  Mở ChatGPT <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Danh sách từ vựng muốn học (cách nhau bởi dấu phẩy hoặc xuống dòng):
              </label>
              <input
                type="text"
                value={wordsInput}
                onChange={(e) => setWordsInput(e.target.value)}
                placeholder="ví dụ: imperative, communication, comfortable..."
                className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="relative">
              <pre className="text-xs bg-slate-900 text-slate-200 p-3 rounded-xl max-h-32 overflow-y-auto whitespace-pre-wrap font-mono select-all">
                {currentPrompt}
              </pre>
              <button
                onClick={handleCopyPrompt}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    Đã sao chép vào Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Sao chép Prompt (Copy)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Khu vực 2: Dán kết quả AI */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                Khu vực 2: Dán kết quả AI
              </span>
              {aiOutput && (
                <button
                  onClick={() => setAiOutput('')}
                  className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa trắng
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Dán toàn bộ kết quả JSON nhận được từ Gemini hoặc ChatGPT vào đây:
            </p>

            <textarea
              rows={6}
              value={aiOutput}
              onChange={(e) => {
                setAiOutput(e.target.value);
                if (error) setError(null);
              }}
              placeholder={`[\n  {\n    "word": "imperative",\n    "ipa": "/ɪmˈper.ə.tɪv/",\n    "type": "adj",\n    "meaning": "cấp bách",\n    "chunks": ["im", "per", "a", "tive"],\n    "example": "It is imperative to act.",\n    "example_vi": "Cấp bách phải hành động."\n  }\n]`}
              className="w-full text-xs font-mono p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {error && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            Đóng
          </button>
          <button
            onClick={handleImportAI}
            disabled={loading || !aiOutput.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-200 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? 'Đang phân tích & lưu...' : 'Cập nhật & Sinh bộ thẻ'}
          </button>
        </div>
      </div>
    </div>
  );
};
