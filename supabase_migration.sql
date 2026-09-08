-- ======================================================================
-- SUPABASE POSTGRESQL MIGRATION: SyllableCloze Cloud Architecture (v0.9.1)
-- ======================================================================

-- 1. Bật UUID generator
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Bảng Folders (Thư mục chủ đề)
CREATE TABLE IF NOT EXISTS public.folders (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4f46e5',
    icon TEXT DEFAULT 'Folder',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Words (Kho từ vựng & Dữ liệu ngôn ngữ học)
CREATE TABLE IF NOT EXISTS public.words (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    folder_id TEXT REFERENCES public.folders(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    ipa TEXT,
    type TEXT,
    meaning TEXT NOT NULL,
    definition_en TEXT,
    collocations JSONB DEFAULT '[]'::jsonb,
    chunks JSONB NOT NULL,
    image_prompt TEXT,
    image_url TEXT,
    custom_image TEXT,
    example TEXT,
    example_vi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng Flashcards (Thẻ đục lỗ FSRS)
CREATE TABLE IF NOT EXISTS public.flashcards (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word_id TEXT NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
    folder_id TEXT REFERENCES public.folders(id) ON DELETE CASCADE,
    hidden_chunk_index INT NOT NULL,
    due TIMESTAMPTZ NOT NULL,
    fsrs_card JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Kích hoạt Row Level Security (RLS) bảo vệ dữ liệu người dùng
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- 6. Thiết lập Policies đảm bảo cô lập dữ liệu theo auth.uid()
DROP POLICY IF EXISTS "Users can manage own folders" ON public.folders;
CREATE POLICY "Users can manage own folders" 
ON public.folders FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own words" ON public.words;
CREATE POLICY "Users can manage own words" 
ON public.words FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own flashcards" ON public.flashcards;
CREATE POLICY "Users can manage own flashcards" 
ON public.flashcards FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. Indexes tăng tốc truy vấn theo người dùng và hạn ôn FSRS
CREATE INDEX IF NOT EXISTS idx_folders_user ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_words_user ON public.words(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_due ON public.flashcards(user_id, due);
