import React, { useState, useEffect, useCallback } from 'react';
import { NavigationDrawer } from './components/NavigationDrawer';
import { StudyScreen } from './components/StudyScreen';
import { DeckManager } from './components/DeckManager';
import { FolderListView } from './components/FolderListView';
import { AISyncModal } from './components/AISyncModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthProvider } from './context/AuthContext';
import { initializeDatabase, getDueFlashcards, getDeckStats, db } from './db';
import { CardWithWord, DeckStats } from './types';
import { CheckCircle2 } from 'lucide-react';

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'study' | 'folders' | 'words' | 'stats'>('study');
  const [isAISyncOpen, setIsAISyncOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [activeFolderName, setActiveFolderName] = useState<string | undefined>(undefined);
  const [prefilledFolderId, setPrefilledFolderId] = useState<string | undefined>(undefined);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'en-GB'>('en-US');
  const [dueCards, setDueCards] = useState<CardWithWord[]>([]);
  const [stats, setStats] = useState<DeckStats>({
    totalWords: 0,
    totalCards: 0,
    dueCards: 0,
    learningCards: 0,
    newCards: 0,
    reviewedCards: 0
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const refreshData = useCallback(async () => {
    try {
      const cards = await getDueFlashcards(activeFolderId);
      const s = await getDeckStats();
      setDueCards(cards);
      setStats(s);

      if (activeFolderId) {
        const folder = await db.folders.get(activeFolderId);
        setActiveFolderName(folder ? folder.name : undefined);
      } else {
        setActiveFolderName(undefined);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFolderId]);

  const handleStartStudy = async (folderId?: string) => {
    setActiveFolderId(folderId);
    if (folderId) {
      const f = await db.folders.get(folderId);
      setActiveFolderName(f?.name);
    } else {
      setActiveFolderName(undefined);
    }
    setCurrentTab('study');
  };

  const handleExitFolderStudy = () => {
    handleStartStudy(undefined);
  };

  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      await refreshData();
    };
    init();
  }, [refreshData]);

  const handleAISyncSuccess = async (wordCount: number, cardCount: number) => {
    await refreshData();
    showToast(`Đã nạp thành công ${wordCount} từ và sinh ${cardCount} thẻ flashcards!`);
  };

  const handleExportBackup = async () => {
    const allWords = await db.words.toArray();
    const allCards = await db.flashcards.toArray();
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      words: allWords,
      flashcards: allCards
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syllable_cloze_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất tệp sao lưu JSON thành công!');
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
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
            showToast('Khôi phục dữ liệu thành công!');
            await refreshData();
          } else {
            alert('Tệp sao lưu không đúng định dạng!');
          }
        } catch (err) {
          alert('Không thể đọc tệp sao lưu: ' + err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-xl border border-white/10 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Gemini-style Navigation Drawer & Top Header */}
      <NavigationDrawer
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAISync={() => setIsAISyncOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onExport={handleExportBackup}
        onImport={handleImportBackup}
        stats={stats}
        voiceLang={voiceLang}
        onChangeVoiceLang={setVoiceLang}
      />

      {/* Content Area */}
      <main className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentTab === 'study' ? (
          <StudyScreen
            cards={dueCards}
            onRefreshDueCards={refreshData}
            onOpenAISync={() => setIsAISyncOpen(true)}
            folderName={activeFolderName}
            onExitFolderStudy={activeFolderId ? handleExitFolderStudy : undefined}
          />
        ) : currentTab === 'folders' ? (
          <FolderListView
            onStartStudy={handleStartStudy}
            onOpenAISync={(fId) => {
              setPrefilledFolderId(fId);
              setIsAISyncOpen(true);
            }}
          />
        ) : (
          <DeckManager
            onOpenAISync={() => setIsAISyncOpen(true)}
            onRefresh={refreshData}
            stats={stats}
          />
        )}
      </main>

      {/* AI Sync Modal */}
      <AISyncModal
        isOpen={isAISyncOpen}
        onClose={() => {
          setIsAISyncOpen(false);
          setPrefilledFolderId(undefined);
        }}
        onSuccess={handleAISyncSuccess}
        initialFolderId={prefilledFolderId || activeFolderId}
      />

      {/* Supabase Auth Modal (Google & Email/Password) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
