-- ============================================================
-- SUPABASE AUTH.USERS SETUP - HACKQUALI APP
-- ============================================================
-- IMPORTANTE: Este script usa funções de autenticação do Supabase
-- Execute isto como SUPER USER ou use a função auth.users() apropriadamente
-- ============================================================

-- ============================================================
-- MÉTODO 1: Inserir diretamente via SQL (Admin)
-- Execute como Super User no console do Supabase
-- ============================================================

-- Contractor
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440001',
  'authenticated',
  'authenticated',
  'contractor@example.com',
  crypt('Senha@123', gen_salt('bf')),
  now(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"QualiConstrutora LTDA","role":"contractor"}'::jsonb,
  false,
  now(),
  now(),
  '6133334444',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Resident 1
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440002',
  'authenticated',
  'authenticated',
  'joao.silva@example.com',
  crypt('Senha@123', gen_salt('bf')),
  now(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"João Silva","role":"resident"}'::jsonb,
  false,
  now(),
  now(),
  '61999998888',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Resident 2
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440003',
  'authenticated',
  'authenticated',
  'maria.santos@example.com',
  crypt('Senha@123', gen_salt('bf')),
  now(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Maria Santos","role":"resident"}'::jsonb,
  false,
  now(),
  now(),
  '61999997777',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Resident 3
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440004',
  'authenticated',
  'authenticated',
  'carlos.oliveira@example.com',
  crypt('Senha@123', gen_salt('bf')),
  now(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Carlos Oliveira","role":"resident"}'::jsonb,
  false,
  now(),
  now(),
  '61999996666',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Technician 1
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440005',
  'authenticated',
  'authenticated',
  'tecnico.pedro@example.com',
  crypt('Senha@123', gen_salt('bf')),
  now(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Pedro Técnico","role":"technician","specialization":"Hidráulica"}'::jsonb,
  false,
  now(),
  now(),
  '61988885555',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Technician 2
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440006',
  'authenticated',
  'authenticated',
  'tecnico.ana@example.com',
  crypt('Senha@123', gen_salt('bf')),
  now(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Ana Técnica","role":"technician","specialization":"Elétrica"}'::jsonb,
  false,
  now(),
  now(),
  '61988884444',
  now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- ============================================================
-- MÉTODO 2: Via API REST (Recomendado)
-- ============================================================
-- Use a API do Supabase com sua chave de serviço
-- 
-- curl -X POST 'https://YOUR_SUPABASE_URL/auth/v1/admin/users' \
--   -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--   -H 'Content-Type: application/json' \
--   -d '{
--     "email": "contractor@example.com",
--     "password": "Senha@123",
--     "email_confirm": true,
--     "user_metadata": {
--       "full_name": "QualiConstrutora LTDA",
--       "role": "contractor"
--     }
--   }'

-- ============================================================
-- MÉTODO 3: Via SDK Supabase (TypeScript/JavaScript)
-- ============================================================
-- Exemplo em TypeScript:
--
-- const { data, error } = await supabase.auth.admin.createUser({
--   email: 'contractor@example.com',
--   password: 'Senha@123',
--   email_confirm: true,
--   user_metadata: {
--     full_name: 'QualiConstrutora LTDA',
--     role: 'contractor'
--   }
-- });

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- 1. Senhas: Use um gerador de senhas seguras em produção
-- 2. Instance ID: Deve corresponder ao instance_id do seu Supabase
-- 3. Confirmar emails: email_confirmed_at está definido como now()
-- 4. Vincular usuários: As IDs em auth.users devem corresponder às IDs em public.users
-- 5. RLS Policies: Verificar que as políticas permitem acesso aos dados corretos
