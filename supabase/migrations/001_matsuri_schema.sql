-- MATSURI RPG — Schema MVP v0.1
-- Aplicar no Editor SQL do Supabase ou via Supabase CLI

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  username text UNIQUE,
  xp integer DEFAULT 0,
  yuan integer DEFAULT 0,
  avatar_config jsonb DEFAULT '{"color": "red"}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Characters (already created)
-- id, user_id, name, avatar, level, xp, qi, position_x, position_y

-- 3. Hanzi Master Dictionary
CREATE TABLE IF NOT EXISTS public.hanzi_master (
  id serial PRIMARY KEY,
  hanzi text UNIQUE NOT NULL,
  pinyin text NOT NULL,
  pinyin_base text NOT NULL,
  tone integer NOT NULL CHECK (tone BETWEEN 1 AND 5),
  meaning_pt text NOT NULL,
  meaning_en text,
  hsk_level integer DEFAULT 1,
  stroke_count integer,
  etymology text,
  audio_file text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.hanzi_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hanzi_public_read" ON public.hanzi_master FOR SELECT TO anon, authenticated USING (true);

-- Seed: 5 MVP Hanzi (números 1-5)
INSERT INTO public.hanzi_master (hanzi, pinyin, pinyin_base, tone, meaning_pt, meaning_en, hsk_level, stroke_count, etymology, audio_file)
VALUES
  ('一', 'yī',  'yi',  1, 'um',     'one',   1, 1, 'Um único traço horizontal — simples como o início de toda jornada no Caminho.', 'yi1.mp3'),
  ('二', 'èr',  'er',  2, 'dois',   'two',   1, 2, 'Dois traços paralelos: o Céu acima, a Terra abaixo — os dois pilares do cosmos.', 'er2.mp3'),
  ('三', 'sān', 'san', 1, 'três',   'three', 1, 3, 'Três traços: Céu, Humanidade e Terra — a sagrada tríade do Tao.', 'san1.mp3'),
  ('四', 'sì',  'si',  4, 'quatro', 'four',  1, 5, 'Uma boca dentro de um quadrado: os quatro cantos do mundo mundano.', 'si4.mp3'),
  ('五', 'wǔ',  'wu',  3, 'cinco',  'five',  1, 4, 'Os Cinco Elementos — Madeira, Fogo, Terra, Metal e Água — em equilíbrio.', 'wu3.mp3')
ON CONFLICT (hanzi) DO NOTHING;

-- 4. Player Learning Stats (SRS – SM-2)
CREATE TABLE IF NOT EXISTS public.player_learning_stats (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  hanzi text NOT NULL,
  interval_days integer DEFAULT 1,
  ease_factor numeric(4,2) DEFAULT 2.5,
  repetitions integer DEFAULT 0,
  next_review_at timestamptz DEFAULT now(),
  last_reviewed_at timestamptz,
  correct_count integer DEFAULT 0,
  incorrect_count integer DEFAULT 0,
  UNIQUE(character_id, hanzi)
);
ALTER TABLE public.player_learning_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learning_stats_own" ON public.player_learning_stats
  FOR ALL USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- 5. Story Flags
CREATE TABLE IF NOT EXISTS public.story_flags (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  flag_key text NOT NULL,
  flag_value jsonb DEFAULT 'true'::jsonb,
  set_at timestamptz DEFAULT now(),
  UNIQUE(character_id, flag_key)
);
ALTER TABLE public.story_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "story_flags_own" ON public.story_flags
  FOR ALL USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
