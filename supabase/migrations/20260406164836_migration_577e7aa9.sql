-- Aktiviere pgcrypto für die Passwort-Verschlüsselung (falls nicht aktiv)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Füge den Admin-User direkt in die auth.users Tabelle ein (umgeht das Email-Limit)
WITH new_user AS (
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'sdsadjh433jh43@atomicmail.io',
    crypt('rRx.38jL2+', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id
)
SELECT id FROM new_user;