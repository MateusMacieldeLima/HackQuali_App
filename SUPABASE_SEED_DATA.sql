-- ============================================================
-- SUPABASE SEED DATA - HACKQUALI APP
-- Dados de exemplo para testes
-- ============================================================

-- ============================================================
-- 1. INSERIR USERS (Contractor, Residents, Technicians)
-- ============================================================

-- Contractor (Empresa de Construção)
INSERT INTO public.users (id, email, full_name, role, phone_number, cpf, metadata)
VALUES (
  'ae8132c7-4851-44f1-a869-daea760bb163',
  'gustavo.fc.cfc@gmail.com',
  'QualiConstrutora LTDA',
  'contractor',
  '6133334444',
  '12345678901',
  '{"company_name": "QualiConstrutora", "cnpj": "12345678000190"}'::jsonb
) ON CONFLICT DO NOTHING;

-- Residents (Moradores)
INSERT INTO public.users (id, email, full_name, role, phone_number, cpf, metadata)
VALUES 
  ('743edad0-d7ce-4431-9238-7b57984a6430', 'gu@gu', 'João Silva', 'resident', '61999998888', '12345678902', '{"verified": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- Technicians (Técnicos)
INSERT INTO public.users (id, email, full_name, role, company_id, phone_number, cpf, metadata)
VALUES 
  ('1142e2d6-3306-49fb-8bcb-e6c387395f35', 'tecnico.pedro@example.com', 'Pedro Técnico', 'technician', '550e8400-e29b-41d4-a716-446655440001', '61988885555', '12345678905', '{"specialization": "Hidráulica"}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. INSERIR BUILDINGS (Empreendimentos)
-- ============================================================

INSERT INTO public.buildings (id, contractor_id, name, address, city, state, zip_code, total_units, description, metadata)
VALUES 
  (
    '650e8400-e29b-41d4-a716-446655440001',
    'ae8132c7-4851-44f1-a869-daea760bb163',
    'Residencial Central Park',
    'Rua das Flores, 123',
    'Porto Velho',
    'RO',
    '78000000',
    12,
    'Condomínio residencial com 12 unidades, piscina e área de lazer',
    '{"amenities": ["piscina", "academia", "playground"]}'::jsonb
  ),
  (
    '650e8400-e29b-41d4-a716-446655440002',
    'ae8132c7-4851-44f1-a869-daea760bb163',
    'Edifício Vila Moderna',
    'Avenida Principal, 456',
    'Porto Velho',
    'RO',
    '78001000',
    8,
    'Edifício moderno com 8 apartamentos',
    '{"amenities": ["elevador", "portaria"]}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. INSERIR UNITS (Unidades)
-- ============================================================

INSERT INTO public.units (id, building_id, unit_number, floor, resident_id, block, type, area_sqm, unit_code, description, metadata)
VALUES 
  -- Central Park - Units
  ('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '101', 1, '550e8400-e29b-41d4-a716-446655440002', 'A', 'apartment', 85.50, 'CP-001-QRST', 'Apartamento 101 - 2 quartos', '{"rooms": 2, "bathrooms": 1}'::jsonb),
  ('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', '102', 1, '550e8400-e29b-41d4-a716-446655440003', 'A', 'apartment', 85.50, 'CP-002-UVWX', 'Apartamento 102 - 2 quartos', '{"rooms": 2, "bathrooms": 1}'::jsonb),
  ('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', '103', 1, NULL, 'A', 'apartment', 85.50, 'CP-003-YZAB', 'Apartamento 103 - 2 quartos', '{"rooms": 2, "bathrooms": 1}'::jsonb),
  ('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440001', '201', 2, '550e8400-e29b-41d4-a716-446655440004', 'B', 'apartment', 95.00, 'CP-004-CDEF', 'Apartamento 201 - 3 quartos', '{"rooms": 3, "bathrooms": 2}'::jsonb),
  ('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440001', '202', 2, NULL, 'B', 'apartment', 95.00, 'CP-005-GHIJ', 'Apartamento 202 - 3 quartos', '{"rooms": 3, "bathrooms": 2}'::jsonb),
  
  -- Vila Moderna - Units
  ('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440002', '301', 3, NULL, 'C', 'apartment', 120.00, 'VM-001-KLMN', 'Apartamento 301 - 3 quartos', '{"rooms": 3, "bathrooms": 2}'::jsonb),
  ('750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440002', '302', 3, NULL, 'C', 'apartment', 120.00, 'VM-002-OPQR', 'Apartamento 302 - 3 quartos', '{"rooms": 3, "bathrooms": 2}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. INSERIR SERVICE_REQUESTS (Chamados)
-- ============================================================

INSERT INTO public.service_requests (
  id, unit_id, building_id, requester_id, assigned_to, status, priority, 
  title, description, category, photos, estimated_cost, actual_cost, 
  scheduled_date, started_at, completed_at, evaluation_completed, notes
)
VALUES 
  -- Chamado 1: Vazamento na cozinha (Aberto)
  (
    '850e8400-e29b-41d4-a716-446655440001',
    '750e8400-e29b-41d4-a716-446655440001',
    '650e8400-e29b-41d4-a716-446655440001',
    '743edad0-d7ce-4431-9238-7b57984a6430',
    NULL,
    'open',
    'urgent',
    'Vazamento na cozinha',
    'Torneira da pia vazando água. Problema urgente, está molhando o piso.',
    'hidráulica',
    ARRAY['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    250.00,
    NULL,
    '2025-11-28 14:00:00+00'::TIMESTAMP WITH TIME ZONE,
    NULL,
    NULL,
    FALSE,
    'Morador relata problema desde esta manhã'
  ),
  
  -- Chamado 2: Lâmpada queimada (Atribuído)
  (
    '850e8400-e29b-41d4-a716-446655440002',
    '750e8400-e29b-41d4-a716-446655440002',
    '650e8400-e29b-41d4-a716-446655440001',
    '743edad0-d7ce-4431-9238-7b57984a6430',
    '1142e2d6-3306-49fb-8bcb-e6c387395f35',
    'assigned',
    'normal',
    'Lâmpada queimada no quarto',
    'Lâmpada do lustre principal do quarto não acende mais.',
    'elétrica',
    ARRAY['https://example.com/photo3.jpg'],
    45.00,
    NULL,
    '2025-11-29 10:00:00+00'::TIMESTAMP WITH TIME ZONE,
    NULL,
    NULL,
    FALSE,
    'Atribuído ao técnico Ana'
  ),
  
  -- Chamado 3: Tinta descascando (Em andamento)
  (
    '850e8400-e29b-41d4-a716-446655440003',
    '750e8400-e29b-41d4-a716-446655440003',
    '650e8400-e29b-41d4-a716-446655440001',
    '743edad0-d7ce-4431-9238-7b57984a6430',
    '1142e2d6-3306-49fb-8bcb-e6c387395f35',
    'in_progress',
    'normal',
    'Tinta descascando na sala',
    'A pintura da parede está descascando em vários pontos.',
    'pintura',
    ARRAY['https://example.com/photo4.jpg'],
    150.00,
    NULL,
    '2025-11-27 09:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-27 09:30:00+00'::TIMESTAMP WITH TIME ZONE,
    NULL,
    FALSE,
    'Técnico iniciou o trabalho esta manhã'
  ),
  
  -- Chamado 4: Porta do guarda-roupa travada (Concluído)
  (
    '850e8400-e29b-41d4-a716-446655440004',
    '750e8400-e29b-41d4-a716-446655440004',
    '650e8400-e29b-41d4-a716-446655440001',
    '743edad0-d7ce-4431-9238-7b57984a6430',
    '1142e2d6-3306-49fb-8bcb-e6c387395f35',
    'completed',
    'high',
    'Porta do guarda-roupa travada',
    'A porta deslizante do guarda-roupa não abre. Está completamente travada.',
    'marcenaria',
    ARRAY['https://example.com/photo5.jpg'],
    180.00,
    180.00,
    '2025-11-26 14:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-26 14:30:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-26 15:30:00+00'::TIMESTAMP WITH TIME ZONE,
    TRUE,
    'Substituição do trilho. Morador avaliou o serviço.'
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. INSERIR SCHEDULING (Agendamentos)
-- ============================================================

INSERT INTO public.scheduling (
  id, service_request_id, technician_id, scheduled_start, scheduled_end, 
  actual_start, actual_end, status, notes
)
VALUES 
  -- Agendamento para lâmpada queimada
  (
    '950e8400-e29b-41d4-a716-446655440001',
    '850e8400-e29b-41d4-a716-446655440002',
    '',
    '2025-11-29 10:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-29 11:00:00+00'::TIMESTAMP WITH TIME ZONE,
    NULL,
    NULL,
    'scheduled',
    'Agendado para amanhã de manhã'
  ),
  
  -- Agendamento para tinta descascando (Em andamento)
  (
    '950e8400-e29b-41d4-a716-446655440002',
    '850e8400-e29b-41d4-a716-446655440003',
    '1142e2d6-3306-49fb-8bcb-e6c387395f35',
    '2025-11-27 09:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-27 13:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-27 09:30:00+00'::TIMESTAMP WITH TIME ZONE,
    NULL,
    'in_progress',
    'Técnico no local realizando o serviço'
  ),
  
  -- Agendamento para porta do guarda-roupa (Concluído)
  (
    '950e8400-e29b-41d4-a716-446655440003',
    '850e8400-e29b-41d4-a716-446655440004',
    '1142e2d6-3306-49fb-8bcb-e6c387395f35',
    '2025-11-26 14:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-26 16:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-26 14:30:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-26 15:30:00+00'::TIMESTAMP WITH TIME ZONE,
    'completed',
    'Serviço concluído com sucesso'
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. INSERIR FEEDBACK (Avaliações)
-- ============================================================

INSERT INTO public.feedback (
  id, service_request_id, resident_id, technician_id, 
  quality_rating, speed_rating, professionalism_rating, nps_score, 
  comments, suggestions
)
VALUES 
  -- Feedback para porta do guarda-roupa
  (
    'a50e8400-e29b-41d4-a716-446655440001',
    '850e8400-e29b-41d4-a716-446655440004',
    '743edad0-d7ce-4431-9238-7b57984a6430',
    '1142e2d6-3306-49fb-8bcb-e6c387395f35',
    5,
    4,
    5,
    9,
    'Técnico muito profissional, trabalho bem executado. Porta funcionando perfeitamente agora.',
    'Poderia ter deixado o local mais limpo após o trabalho. No geral, excelente!'
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. INSERIR MAINTENANCE_HISTORY (Histórico)
-- ============================================================

INSERT INTO public.maintenance_history (
  id, service_request_id, technician_id, status_change_from, status_change_to, 
  hours_worked, materials_used, notes
)
VALUES 
  -- Histórico: Porta do guarda-roupa
  (
    'b50e8400-e29b-41d4-a716-446655440001',
    '850e8400-e29b-41d4-a716-446655440004',
    '1142e2d6-3306-49fb-8bcb-e6c387395f35',
    'open',
    'assigned',
    NULL,
    NULL,
    'Chamado atribuído ao técnico Pedro'
  ),
  (
    'b50e8400-e29b-41d4-a716-446655440002',
    '850e8400-e29b-41d4-a716-446655440004',
    '1142e2d6-3306-49fb-8bcb-e6c387395f35',
    'assigned',
    'in_progress',
    NULL,
    NULL,
    'Técnico iniciou o atendimento'
  ),
  (
    'b50e8400-e29b-41d4-a716-446655440003',
    '850e8400-e29b-41d4-a716-446655440004',
    '1142e2d6-3306-49fb-8bcb-e6c387395f35',
    'in_progress',
    'completed',
    1.0,
    'Trilho deslizante, parafusos, lubrificante',
    'Substituição do trilho e lubrificação. Porta testada e funcionando.'
  ),
  
  -- Histórico: Tinta descascando
  (
    'b50e8400-e29b-41d4-a716-446655440004',
    '850e8400-e29b-41d4-a716-446655440003',
    '1142e2d6-3306-49fb-8bcb-e6c387395f35',
    'open',
    'assigned',
    NULL,
    NULL,
    'Chamado atribuído ao técnico Pedro'
  ),
  (
    'b50e8400-e29b-41d4-a716-446655440005',
    '850e8400-e29b-41d4-a716-446655440003',
    '1142e2d6-3306-49fb-8bcb-e6c387395f35',
    'assigned',
    'in_progress',
    NULL,
    NULL,
    'Técnico iniciou o trabalho'
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. INSERIR COSTS (Custos)
-- ============================================================

INSERT INTO public.costs (
  id, service_request_id, type, description, amount, quantity, unit_price
)
VALUES 
  -- Custos: Porta do guarda-roupa
  (
    'c50e8400-e29b-41d4-a716-446655440001',
    '850e8400-e29b-41d4-a716-446655440004',
    'material',
    'Trilho deslizante de alumínio',
    80.00,
    1,
    80.00
  ),
  (
    'c50e8400-e29b-41d4-a716-446655440002',
    '850e8400-e29b-41d4-a716-446655440004',
    'material',
    'Parafusos e bucha',
    20.00,
    1,
    20.00
  ),
  (
    'c50e8400-e29b-41d4-a716-446655440003',
    '850e8400-e29b-41d4-a716-446655440004',
    'labor',
    'Mão de obra - 1 hora',
    80.00,
    1,
    80.00
  ),
  
  -- Custos: Tinta descascando (estimado)
  (
    'c50e8400-e29b-41d4-a716-446655440004',
    '850e8400-e29b-41d4-a716-446655440003',
    'material',
    'Tinta acrílica',
    60.00,
    2,
    30.00
  ),
  (
    'c50e8400-e29b-41d4-a716-446655440005',
    '850e8400-e29b-41d4-a716-446655440003',
    'labor',
    'Mão de obra - 4 horas',
    120.00,
    4,
    30.00
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- ============================================================

-- Verificar usuários criados
SELECT 'Users' as table_name, COUNT(*) as total FROM public.users;

-- Verificar edifícios
SELECT 'Buildings' as table_name, COUNT(*) as total FROM public.buildings;

-- Verificar unidades
SELECT 'Units' as table_name, COUNT(*) as total FROM public.units;

-- Verificar chamados
SELECT 'Service Requests' as table_name, COUNT(*) as total FROM public.service_requests;

-- Verificar agendamentos
SELECT 'Scheduling' as table_name, COUNT(*) as total FROM public.scheduling;

-- Verificar feedback
SELECT 'Feedback' as table_name, COUNT(*) as total FROM public.feedback;

-- Verificar histórico
SELECT 'Maintenance History' as table_name, COUNT(*) as total FROM public.maintenance_history;

-- Verificar custos
SELECT 'Costs' as table_name, COUNT(*) as total FROM public.costs;

-- Resumo por status de chamados
SELECT status, COUNT(*) as total FROM public.service_requests GROUP BY status;

-- Resumo por prioridade
SELECT priority, COUNT(*) as total FROM public.service_requests GROUP BY priority;
