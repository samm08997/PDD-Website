-- ============================================================
-- CramAI — Supabase Schema
-- Run this in your Supabase project: Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. DECKS
CREATE TABLE public.decks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own decks"
  ON public.decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks"
  ON public.decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
  ON public.decks FOR DELETE
  USING (auth.uid() = user_id);

-- 2. FLASHCARDS
CREATE TABLE public.flashcards (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id     UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view flashcards for their decks"
  ON public.flashcards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = flashcards.deck_id
        AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert flashcards for their decks"
  ON public.flashcards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = flashcards.deck_id
        AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete flashcards for their decks"
  ON public.flashcards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = flashcards.deck_id
        AND decks.user_id = auth.uid()
    )
  );

-- ============================================================
-- Done! Now add your Supabase URL and Anon Key to Replit Secrets.
-- ============================================================
