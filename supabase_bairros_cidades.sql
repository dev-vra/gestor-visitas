-- ============================================================
-- PASSO 1 DE 2: Rodar este script no SQL Editor do Supabase
-- Cria as tabelas e popula os dados.
-- As políticas de ESCRITA são configuradas no PASSO 2 (Dashboard).
-- ============================================================

-- 1. Tabela de Cidades
CREATE TABLE IF NOT EXISTS public.cidades (
  id   BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL
);

-- 2. Tabela de Bairros (vinculada à cidade)
CREATE TABLE IF NOT EXISTS public.bairros (
  id         BIGSERIAL PRIMARY KEY,
  nome       TEXT NOT NULL,
  cidade_id  BIGINT NOT NULL REFERENCES public.cidades(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índice para performance
CREATE INDEX IF NOT EXISTS idx_bairros_cidade_id ON public.bairros(cidade_id);

-- ============================================================
-- RLS - Habilita e permite LEITURA para todos autenticados
-- (Políticas de escrita: configure via Supabase Dashboard > Auth > Policies)
-- ============================================================

ALTER TABLE public.cidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bairros  ENABLE ROW LEVEL SECURITY;

-- Leitura liberada para qualquer usuário autenticado
CREATE POLICY "Leitura autenticada - cidades"
  ON public.cidades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Leitura autenticada - bairros"
  ON public.bairros FOR SELECT
  TO authenticated
  USING (true);

-- Escrita temporariamente liberada para autenticados
-- (restrinja no dashboard depois conforme o PASSO 2)
CREATE POLICY "Escrita autenticada - cidades"
  ON public.cidades FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Escrita autenticada - bairros"
  ON public.bairros FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SEED: Cidades
-- ============================================================

INSERT INTO public.cidades (id, nome) VALUES
  (1,  'Cuiabá'),
  (2,  'Várzea Grande'),
  (3,  'Tangará da Serra'),
  (4,  'Nova Marilândia'),
  (5,  'Santo Afonso'),
  (6,  'São José do Rio Claro'),
  (7,  'Campo Novo do Parecis'),
  (8,  'Nova Olímpia'),
  (9,  'Barra do Bugres'),
  (10, 'Nobres'),
  (11, 'Denise'),
  (12, 'Nova Maringá'),
  (13, 'Castanheira'),
  (15, 'Juína'),
  (20, 'Aripuanã')
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.cidades_id_seq', (SELECT MAX(id) FROM public.cidades));

-- ============================================================
-- SEED: Bairros
-- ============================================================

INSERT INTO public.bairros (id, nome, cidade_id) VALUES
  -- Cuiabá (cidade_id = 1)
  (4,   'CONJUNTO HABITACIONAL JARDIM PRESIDENTE II', 1),
  (53,  'Residencial São Carlos', 1),
  (32,  'CONJUNTO HABITACIONAL CPA III - SETOR 05', 1),
  (6,   'JARDIM SANTA AMALIA', 1),
  (30,  'NÚCLEO HABITACIONAL SÃO GONÇALO', 1),
  (46,  'SETOR 02 DO NÚCLEO HABITACIONAL CPA I', 1),
  (54,  'São João Del Rey', 1),
  (47,  'SETOR 01 DO NÚCLEO HABITACIONAL CPA I', 1),
  (48,  'SETOR 03 DO NÚCLEO HABITACIONAL CPA I', 1),
  (20,  'CONJUNTO HABITACIONAL CPA II', 1),
  (40,  'CONJUNTO HABITACIONAL GRANDE TERCEIRO', 1),
  (44,  'CONJUNTO HABITACIONAL CPA III - SETOR 01', 1),
  (45,  'CONJUNTO HABITACIONAL CPA III - SETOR 02', 1),
  (33,  'CONJUNTO HABITACIONAL CPA III - SETOR 03', 1),
  (22,  'CPA I', 1),
  (11,  'CONJUNTO HABITACIONAL CPA III - SETOR 04', 1),
  (57,  'JARDIM VITÓRIA', 1),
  (13,  'NÚCLEO HABITACIONAL CPA IV - 1ª ETAPA', 1),
  (16,  'NÚCLEO HABITACIONAL CPA IV - 4ª ETAPA', 1),
  (10,  'NÚCLEO HABITACIONAL CPA IV - 5ª ETAPA', 1),
  (58,  'JARDIM BRASIL PARTE 1', 1),
  (25,  'SANTA INES', 1),
  (26,  'NÚCLEO HABITACIONAL CPA IV - 2ª ETAPA', 1),
  (27,  'NÚCLEO HABITACIONAL CPA IV - 3ª ETAPA', 1),
  (31,  'NÚCLEO HABITACIONAL CIDADE VERDE', 1),
  (9,   'NÚCLEO HABITACIONAL NOVA CUIABÁ', 1),
  (59,  'JARDIM BRASIL PARTE 2', 1),
  (15,  'RESIDENCIAL ITAPAJÉ', 1),
  (37,  'CONJUNTO HABITACIONAL VILA REAL', 1),
  (62,  'Renascer', 1),
  (56,  '1º DE MARÇO - 2ª FASE', 1),
  (55,  '1º DE MARÇO - 1ª FASE', 1),
  (65,  'NÚCLEO HABITACIONAL JARDIM INDUSTRIÁRIO II - 2ª ETAPA', 1),
  (60,  'JARDIM BRASIL PARTE 3', 1),
  (61,  'JARDIM BRASIL PARTE 4', 1),
  (63,  'JARDIM FLORIANÓPOLIS', 1),
  (64,  'JARDIM UNIÃO', 1),
  (66,  'NÚCLEO HABITACIONAL JARDIM INDUSTRIÁRIO II - 3ª ETAPA', 1),
  (29,  'NÚCLEO HABITACIONAL JARDIM INDUSTRIÁRIO II - 1ª ETAPA', 1),
  (14,  'Núcleo Habitacional - Tijucal', 1),
  (49,  'NÚCLEO HABITACIONAL - TIJUCAL SETOR I', 1),
  (50,  'NÚCLEO HABITACIONAL - TIJUCAL SETOR II', 1),
  (51,  'NÚCLEO HABITACIONAL - TIJUCAL SETOR 3', 1),
  (52,  'NÚCLEO HABITACIONAL - TIJUCAL SETOR 4', 1),
  (67,  'Santo Antonio do Pedregal', 1),
  (77,  'Sonho Meu', 1),
  (78,  'Vista da Chapada', 1),
  (79,  'Voluntários da Pátria', 1),
  (88,  'Jardim Fortaleza', 1),
  -- Várzea Grande (cidade_id = 2)
  (1,   'NÚCLEO HABITACIONAL CRISTO REI', 2),
  (43,  'CONJUNTO HABITACIONAL DOM BOSCO', 2),
  (39,  'CONJUNTO HABITACIONAL DOM ORLANDO CHAVES', 2),
  (23,  'CONJUNTO HABITACIONAL CABO MICHEL', 2),
  (3,   'NÚCLEO HABITACIONAL JARDIM PRIMAVERA', 2),
  (8,   'NÚCLEO HABITACIONAL SANTA IZABEL', 2),
  (21,  'CONJUNTO HABITACIONAL TARUMÃ I', 2),
  (24,  'NÚCLEO HABITACIONAL NOSSA SENHORA DA GUIA', 2),
  (34,  'CONJUNTO HABITACIONAL JAIME VERÍSSIMO DE CAMPOS', 2),
  (41,  'RESIDENCIAL ALBERTO CANELLAS', 2),
  (36,  'RESIDENCIAL ASA BRANCA', 2),
  (2,   'ASA BELLA', 2),
  (7,   'RESIDENCIAL JR II', 2),
  (5,   'RESIDENCIAL AM', 2),
  (90,  'Jardim Eldorado', 2),
  (104, 'Loteamento Terra Nova', 2),
  (109, 'Vitória Régia', 2),
  (123, 'Loteamento 15 de Maio', 2),
  (124, 'Loteamento Parque Sabiá I', 2),
  -- Tangará da Serra (cidade_id = 3)
  (70,  'Núcleo Habitacional 13 de Maio', 3),
  (68,  'Núcleo Habitacional Tarumã', 3),
  (74,  'JARDIM SÃO ROSALINO', 3),
  (76,  'Jardim Morada do Sol', 3),
  (71,  'Quadras R1 e R2 do Jardim 13 de Maio', 3),
  (83,  'Jardim dos Ipês', 3),
  (84,  'Jardim Presidente', 3),
  (85,  'Vila Esmeralda I', 3),
  (86,  'Vila Esmeralda II', 3),
  (89,  'Vila Goiás', 3),
  (91,  'Jardim Bela Vista', 3),
  (98,  'Jardim Maringá', 3),
  (99,  'Jardim Vitória', 3),
  -- Nova Marilândia (cidade_id = 4)
  (73,  'Jardim Planalto II', 4),
  (72,  'Jardim Planalto', 4),
  -- Santo Afonso (cidade_id = 5)
  (75,  'Loteamento Urbano do Distrito Boa Esperança', 5),
  -- São José do Rio Claro (cidade_id = 6)
  (80,  'Jardim Arco Íris', 6),
  (81,  'Jardim Olinda', 6),
  (82,  'Residencial Casa Nova', 6),
  -- Campo Novo do Parecis (cidade_id = 7)
  (100, 'Patrimônio de Campo Novo do Parecis', 7),
  (87,  'Patrimônio de Campo Novo do Parecis - Fase II', 7),
  (121, 'Marechal Rondon - Fase I', 7),
  (122, 'Marechal Rondon - Fase II', 7),
  -- Nova Olímpia (cidade_id = 8)
  (92,  'Jardim Boa Esperança', 8),
  (93,  'Vila Alvorada', 8),
  (94,  'Jardim Santa Rosa', 8),
  (106, 'Jardim Ouro Verde', 8),
  -- Barra do Bugres (cidade_id = 9)
  (95,  'João Cristante', 9),
  (97,  'Cohab São Raimundo', 9),
  (96,  'Núcleo Habitacional Nhambiquara', 9),
  -- Nobres (cidade_id = 10)
  (101, 'Roda D''água', 10),
  (102, 'Bom Jardim', 10),
  (105, 'Jardim Petrópolis', 10),
  -- Denise (cidade_id = 11)
  (119, 'Jardim Boa Esperança', 11),
  (120, 'Loteamento Jardim Boa Esperança II', 11),
  (103, 'Loteamento Jardim Alvorecer', 11),
  -- Nova Maringá (cidade_id = 12)
  (107, 'Jardim Tropical', 12),
  (108, 'Mário Duílio Henry', 12),
  -- Castanheira (cidade_id = 13)
  (110, 'Núcleo Urbano de Castanheira - Centro', 13),
  (111, 'Loteamento Noga II', 13),
  -- Juína (cidade_id = 15)
  (142, 'Palmiteira', 15),
  (118, 'Loteamento Padre Duílio', 15),
  (125, 'Loteamento Portal do Sol', 15),
  -- Aripuanã (cidade_id = 20)
  (127, 'Jardim Planalto', 20)
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.bairros_id_seq', (SELECT MAX(id) FROM public.bairros));
