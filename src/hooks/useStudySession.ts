import { useState, useEffect, useCallback } from 'react';
import { getDueFlashcards } from '../db';
import { CardWithWord } from '../types';

export function useStudySession(folderId?: string) {
  const [sessionCards, setSessionCards] = useState<CardWithWord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const cards = await getDueFlashcards(folderId);
      setSessionCards(cards);
    } catch (err) {
      console.error('Lỗi khi tải phiên học:', err);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  return { sessionCards, loading, refreshSession: loadCards };
}
