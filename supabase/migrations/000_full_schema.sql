-- ══════════════════════════════════════════════════════════════
-- MATSURI RPG — Schema Completo v0.2
-- Cole este arquivo inteiro no Editor SQL do Supabase
-- ══════════════════════════════════════════════════════════════

-- 1. PERSONAGENS
CREATE TABLE IF NOT EXISTS public.characters (
  id           uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id),
  name         text NOT NULL,
  avatar       jsonb DEFAULT '{}'::jsonb,
  level        integer DEFAULT 1,
  xp           integer DEFAULT 0,
  qi           integer DEFAULT 100,
  position_x   float DEFAULT 450,
  position_y   float DEFAULT 300,
  -- RPG v0.2
  strength     integer DEFAULT 1,
  spirit       integer DEFAULT 1,
  wisdom       integer DEFAULT 1,
  agility      integer DEFAULT 1,
  stat_points  integer DEFAULT 0,
  talent_points integer DEFAULT 0,
  yuan         integer DEFAULT 100,
  max_hp       integer DEFAULT 100,
  current_hp   integer DEFAULT 100,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "characters_own" ON public.characters;
CREATE POLICY "characters_own" ON public.characters
  FOR ALL USING (user_id = auth.uid());

-- 2. PERFIS
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  username     text UNIQUE,
  xp           integer DEFAULT 0,
  yuan         integer DEFAULT 0,
  avatar_config jsonb DEFAULT '{"color": "red"}'::jsonb,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

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

-- 3. DICIONÁRIO HANZI
CREATE TABLE IF NOT EXISTS public.hanzi_master (
  id          serial PRIMARY KEY,
  hanzi       text UNIQUE NOT NULL,
  pinyin      text NOT NULL,
  pinyin_base text NOT NULL,
  tone        integer NOT NULL CHECK (tone BETWEEN 1 AND 5),
  meaning_pt  text NOT NULL,
  meaning_en  text,
  hsk_level   integer DEFAULT 1,
  stroke_count integer,
  etymology   text,
  audio_file  text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.hanzi_master ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hanzi_public_read" ON public.hanzi_master;
CREATE POLICY "hanzi_public_read" ON public.hanzi_master
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.hanzi_master (hanzi, pinyin, pinyin_base, tone, meaning_pt, meaning_en, hsk_level, stroke_count, etymology)
VALUES
  ('一','yī', 'yi', 1,'um',    'one',  1,1,'Um único traço horizontal — simples como o início de toda jornada.'),
  ('二','èr', 'er', 2,'dois',  'two',  1,2,'Dois traços: o Céu acima, a Terra abaixo.'),
  ('三','sān','san',1,'três',  'three',1,3,'Três traços: Céu, Humanidade e Terra.'),
  ('四','sì', 'si', 4,'quatro','four', 1,5,'Uma boca dentro de um quadrado: os quatro cantos do mundo.'),
  ('五','wǔ', 'wu', 3,'cinco', 'five', 1,4,'Os Cinco Elementos em equilíbrio.')
ON CONFLICT (hanzi) DO NOTHING;

-- 4. PROGRESSO DE APRENDIZADO (legado)
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id           uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  hanzi        text NOT NULL,
  mastery_level integer DEFAULT 1,
  reviewed_at  timestamptz DEFAULT now()
);
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "learning_progress_own" ON public.learning_progress;
CREATE POLICY "learning_progress_own" ON public.learning_progress
  FOR ALL USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- 5. STATS SRS (SM-2)
CREATE TABLE IF NOT EXISTS public.player_learning_stats (
  id              uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  character_id    uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  hanzi           text NOT NULL,
  interval_days   integer DEFAULT 1,
  ease_factor     numeric(4,2) DEFAULT 2.5,
  repetitions     integer DEFAULT 0,
  next_review_at  timestamptz DEFAULT now(),
  last_reviewed_at timestamptz,
  correct_count   integer DEFAULT 0,
  incorrect_count integer DEFAULT 0,
  UNIQUE(character_id, hanzi)
);
ALTER TABLE public.player_learning_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "learning_stats_own" ON public.player_learning_stats;
CREATE POLICY "learning_stats_own" ON public.player_learning_stats
  FOR ALL USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- 6. FLAGS DE HISTÓRIA
CREATE TABLE IF NOT EXISTS public.story_flags (
  id           uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  flag_key     text NOT NULL,
  flag_value   jsonb DEFAULT 'true'::jsonb,
  set_at       timestamptz DEFAULT now(),
  UNIQUE(character_id, flag_key)
);
ALTER TABLE public.story_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_flags_own" ON public.story_flags;
CREATE POLICY "story_flags_own" ON public.story_flags
  FOR ALL USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- 7. CATÁLOGO DE ITENS
CREATE TABLE IF NOT EXISTS public.items (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  name_cn     text,
  type        text NOT NULL DEFAULT 'equipment',
  slot        text,
  rarity      text NOT NULL DEFAULT 'common',
  stats       jsonb NOT NULL DEFAULT '{}',
  description text,
  icon        text DEFAULT '📦',
  yuan_value  integer DEFAULT 10,
  req_level   integer DEFAULT 1,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "items_public_read" ON public.items;
CREATE POLICY "items_public_read" ON public.items
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.items (name,name_cn,type,slot,rarity,stats,description,icon,yuan_value,req_level) VALUES
('Faixa de Aprendiz',       '學子頭巾','equipment','head',     'common',  '{"wisdom":2}',                        'A faixa branca do iniciado.',              '🎽', 15,  1),
('Robe de Algodão',         '棉布道袍','equipment','body',     'common',  '{"max_hp":10}',                       'Veste simples para longas jornadas.',       '👘', 20,  1),
('Pincel de Bambu',         '竹筆',    'equipment','weapon',   'common',  '{"spirit":2,"xp_bonus":0.05}',        '+5% XP ao aprender Hanzi.',                 '✍️', 25,  1),
('Amuleto de Jade',         '玉符',    'equipment','accessory','common',  '{"strength":1,"wisdom":1,"agility":1}','Equilíbrio entre os atributos.',            '💎', 30,  1),
('Tiara de Seda Dourada',   '金絲抹額','equipment','head',     'uncommon','{"wisdom":5,"spirit":2}',             'Bordada por monges do templo.',             '👑', 80,  5),
('Manto de Discípulo',      '弟子道袍','equipment','body',     'uncommon','{"max_hp":25,"spirit":3}',            'O manto azul do discípulo.',                '🥋', 90,  5),
('Pincel de Cedro Sagrado', '雪松神筆','equipment','weapon',   'uncommon','{"spirit":5,"wisdom":3,"xp_bonus":0.12}','+12% XP ao escrever Hanzi.',             '🖌️',110,  5),
('Anel do Vento',           '風戒指',  'equipment','accessory','uncommon','{"agility":5,"strength":2}',          'Leveza do vento.',                          '💍', 95,  5),
('Capacete do Letrado',     '文冠',    'equipment','head',     'rare',    '{"wisdom":10,"spirit":5}',            'A coroa do guerreiro-letrado.',             '⛩️',300, 15),
('Armadura de Jade',        '翡翠甲',  'equipment','body',     'rare',    '{"max_hp":60,"strength":8,"agility":4}','Cada escama é um Hanzi gravado.',         '🛡️',350, 15),
('Pincel do Imortal',       '仙人筆',  'equipment','weapon',   'epic',    '{"spirit":12,"wisdom":8,"xp_bonus":0.25}','+25% XP permanente.',                  '🪄', 800, 30),
('Chá de Ginseng',          '人參茶',  'consumable',null,      'common',  '{"heal_qi":30}',                      'Restaura 30 de Qi.',                        '🍵', 10,  1),
('Pergaminho de Sabedoria', '智慧卷軸','consumable',null,      'uncommon','{"xp_multiplier":2,"duration":300}',  '+100% XP por 5 minutos.',                   '📜', 50,  1),
('Pedra de Afiação',        '磨刀石',  'consumable',null,      'common',  '{"heal_qi":10}',                      'Restaura 10 de Qi.',                        '🪨',  8,  1)
ON CONFLICT DO NOTHING;

-- 8. INVENTÁRIO DO JOGADOR
CREATE TABLE IF NOT EXISTS public.player_inventory (
  id            uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  character_id  uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  item_id       integer REFERENCES public.items(id),
  quantity      integer DEFAULT 1,
  equipped      boolean DEFAULT false,
  equipped_slot text,
  acquired_at   timestamptz DEFAULT now()
);
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_own" ON public.player_inventory;
CREATE POLICY "inventory_own" ON public.player_inventory
  FOR ALL USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- 9. ÁRVORE DE TALENTOS
CREATE TABLE IF NOT EXISTS public.talents (
  id          serial PRIMARY KEY,
  element     text NOT NULL,
  name        text NOT NULL,
  name_cn     text,
  description text,
  req_level   integer DEFAULT 1,
  tier        integer DEFAULT 1,
  effect      jsonb DEFAULT '{}',
  cost        integer DEFAULT 1,
  prereq_id   integer REFERENCES public.talents(id),
  icon        text DEFAULT '⭐'
);
ALTER TABLE public.talents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "talents_public_read" ON public.talents;
CREATE POLICY "talents_public_read" ON public.talents
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.talents (element,name,name_cn,description,req_level,tier,effect,cost,icon) VALUES
('madeira','Raiz Profunda',      '根深',  '+10% XP de Hanzi.',             1, 1,'{"xp_bonus":0.10}',       1,'🌱'),
('madeira','Brotar do Qi',       '發芽',  'SRS 20% mais rápido.',          5, 2,'{"srs_reduction":0.20}',  2,'🌿'),
('madeira','Grande Árvore',      '參天木','+25% XP permanente.',          15, 3,'{"xp_bonus":0.25}',       3,'🌳'),
('fogo',   'Centelha Interior',  '火花',  '+15% velocidade.',              1, 1,'{"action_speed":0.15}',   1,'✨'),
('fogo',   'Chama Dupla',        '雙火',  'Crítico 15%: XP dobrado.',      5, 2,'{"crit_chance":0.15}',    2,'🔥'),
('fogo',   'Inferno Sagrado',    '聖火',  '+50% dano em Boss.',           15, 3,'{"boss_damage":0.50}',    3,'🌋'),
('terra',  'Fundação Sólida',    '根基',  '+30 HP máximo.',                1, 1,'{"max_hp":30}',            1,'⛰️'),
('terra',  'Abundância',         '豐收',  '+20% Yuan ganho.',              5, 2,'{"yuan_bonus":0.20}',     2,'💰'),
('terra',  'Plenitude',          '圓滿',  '+15 slots de inventário.',     15, 3,'{"inventory_slots":15}',  3,'🏔️'),
('metal',  'Afiação da Mente',   '磨礪',  '+10% Sabedoria efetiva.',       1, 1,'{"wisdom_pct":0.10}',     1,'⚔️'),
('metal',  'Forja do Guerreiro', '鍛造',  '20% drop raro pós-batalha.',    5, 2,'{"rare_drop":0.20}',      2,'🔨'),
('metal',  'Armadura Imortal',   '金剛甲','-25% dano recebido.',          15, 3,'{"dmg_reduction":0.25}',  3,'🛡️'),
('agua',   'Fluxo Natural',      '自然流','+15% Sabedoria base.',          1, 1,'{"wisdom_bonus":0.15}',   1,'💧'),
('agua',   'Corrente Profunda',  '深流',  '+25% Hanzi raros.',             5, 2,'{"rare_hanzi":0.25}',     2,'🌊'),
('agua',   'Oceano do Saber',    '知識海','Desbloqueia HSK 2 cedo.',      15, 3,'{"unlock_hsk2":true}',    3,'🌏')
ON CONFLICT DO NOTHING;

-- 10. TALENTOS DO JOGADOR
CREATE TABLE IF NOT EXISTS public.player_talents (
  id           uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  talent_id    integer REFERENCES public.talents(id),
  unlocked_at  timestamptz DEFAULT now(),
  UNIQUE(character_id, talent_id)
);
ALTER TABLE public.player_talents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "player_talents_own" ON public.player_talents;
CREATE POLICY "player_talents_own" ON public.player_talents
  FOR ALL USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
