-- MATSURI RPG — Progressão v0.2
-- Se o Supabase MCP estiver instável, cole este script no Editor SQL do painel

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS strength      integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS spirit        integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS wisdom        integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS agility       integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS stat_points   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS talent_points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yuan          integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_hp        integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS current_hp    integer DEFAULT 100;

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
CREATE POLICY "items_public_read" ON public.items FOR SELECT TO anon, authenticated USING (true);

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

CREATE TABLE IF NOT EXISTS public.talents (
  id        serial PRIMARY KEY,
  element   text NOT NULL,
  name      text NOT NULL,
  name_cn   text,
  description text,
  req_level integer DEFAULT 1,
  tier      integer DEFAULT 1,
  effect    jsonb DEFAULT '{}',
  cost      integer DEFAULT 1,
  prereq_id integer REFERENCES public.talents(id),
  icon      text DEFAULT '⭐'
);
ALTER TABLE public.talents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "talents_public_read" ON public.talents;
CREATE POLICY "talents_public_read" ON public.talents FOR SELECT TO anon, authenticated USING (true);

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

-- SEED Items
INSERT INTO public.items (name,name_cn,type,slot,rarity,stats,description,icon,yuan_value,req_level) VALUES
('Faixa de Aprendiz','學子頭巾','equipment','head','common','{"wisdom":2}','A faixa branca do iniciado.','🎽',15,1),
('Robe de Algodão','棉布道袍','equipment','body','common','{"max_hp":10}','Veste simples para longas jornadas.','👘',20,1),
('Pincel de Bambu','竹筆','equipment','weapon','common','{"spirit":2,"xp_bonus":0.05}','+5% XP ao aprender Hanzi.','✍️',25,1),
('Amuleto de Jade','玉符','equipment','accessory','common','{"strength":1,"wisdom":1,"agility":1}','Equilíbrio entre os atributos.','💎',30,1),
('Tiara de Seda Dourada','金絲抹額','equipment','head','uncommon','{"wisdom":5,"spirit":2}','Bordada por monges do templo.','👑',80,5),
('Manto de Discípulo','弟子道袍','equipment','body','uncommon','{"max_hp":25,"spirit":3}','O manto azul do discípulo.','🥋',90,5),
('Pincel de Cedro Sagrado','雪松神筆','equipment','weapon','uncommon','{"spirit":5,"wisdom":3,"xp_bonus":0.12}','+12% XP ao escrever Hanzi.','🖌️',110,5),
('Anel do Vento','風戒指','equipment','accessory','uncommon','{"agility":5,"strength":2}','Leveza do vento aos movimentos.','💍',95,5),
('Capacete do Letrado','文冠','equipment','head','rare','{"wisdom":10,"spirit":5}','A coroa do guerreiro-letrado.','⛩️',300,15),
('Armadura de Jade','翡翠甲','equipment','body','rare','{"max_hp":60,"strength":8,"agility":4}','Cada escama é um Hanzi gravado.','🛡️',350,15),
('Pincel do Imortal','仙人筆','equipment','weapon','epic','{"spirit":12,"wisdom":8,"xp_bonus":0.25}','+25% XP. Traça Hanzi enquanto o mestre dorme.','🪄',800,30),
('Chá de Ginseng','人參茶','consumable',null,'common','{"heal_qi":30}','Restaura 30 Qi.','🍵',10,1),
('Pergaminho de Sabedoria','智慧卷軸','consumable',null,'uncommon','{"xp_multiplier":2,"duration":300}','+100% XP por 5 minutos.','📜',50,1),
('Pedra de Afiação','磨刀石','consumable',null,'common','{"heal_qi":10}','Restaura 10 de Qi.','🪨',8,1)
ON CONFLICT DO NOTHING;

-- SEED Talents
INSERT INTO public.talents (element,name,name_cn,description,req_level,tier,effect,cost,icon) VALUES
('madeira','Raiz Profunda','根深','+10% XP de Hanzi.',1,1,'{"xp_bonus":0.10}',1,'🌱'),
('madeira','Brotar do Qi','發芽','SRS 20% mais rápido.',5,2,'{"srs_reduction":0.20}',2,'🌿'),
('madeira','Grande Árvore','參天木','+25% XP permanente.',15,3,'{"xp_bonus":0.25}',3,'🌳'),
('fogo','Centelha Interior','火花','+15% velocidade.',1,1,'{"action_speed":0.15}',1,'✨'),
('fogo','Chama Dupla','雙火','Crítico 15%: XP dobrado.',5,2,'{"crit_chance":0.15}',2,'🔥'),
('fogo','Inferno Sagrado','聖火','+50% dano em Boss.',15,3,'{"boss_damage":0.50}',3,'🌋'),
('terra','Fundação Sólida','根基','+30 HP máximo.',1,1,'{"max_hp":30}',1,'⛰️'),
('terra','Abundância','豐收','+20% Yuan ganho.',5,2,'{"yuan_bonus":0.20}',2,'💰'),
('terra','Plenitude','圓滿','+15 slots de inventário.',15,3,'{"inventory_slots":15}',3,'🏔️'),
('metal','Afiação da Mente','磨礪','+10% Sabedoria efetiva.',1,1,'{"wisdom_pct":0.10}',1,'⚔️'),
('metal','Forja do Guerreiro','鍛造','20% drop raro pós-batalha.',5,2,'{"rare_drop":0.20}',2,'🔨'),
('metal','Armadura Imortal','金剛甲','-25% dano recebido.',15,3,'{"dmg_reduction":0.25}',3,'🛡️'),
('agua','Fluxo Natural','自然流','+15% Sabedoria base.',1,1,'{"wisdom_bonus":0.15}',1,'💧'),
('agua','Corrente Profunda','深流','+25% Hanzi raros.',5,2,'{"rare_hanzi":0.25}',2,'🌊'),
('agua','Oceano do Saber','知識海','Desbloqueia HSK 2 cedo.',15,3,'{"unlock_hsk2":true}',3,'🌏')
ON CONFLICT DO NOTHING;
