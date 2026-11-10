-- ==============================================================================
-- SEED DATA — SISTEM ABSENSI KERJA BAKTI ASRAMA
-- ==============================================================================

-- 1. KEGIATAN AKTIF UTAMA
INSERT INTO public.events (id, name, event_date, event_time, location, description, is_active)
VALUES (
    'e1111111-1111-1111-1111-111111111111',
    'Kerja Bakti Asrama',
    '2026-11-10',
    '17.00 WIB',
    'Lorong 3 & 4',
    'Pembersihan kamar mandi baru dan wastafel',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 2. DATA PENGHUNI (LORONG 3 & LORONG 4)
INSERT INTO public.residents (id, name, hallway, is_active)
VALUES
    ('r1111111-0001-0000-0000-000000000001', 'Ahmad Fauzi', 'Lorong 3', true),
    ('r1111111-0001-0000-0000-000000000002', 'Budi Santoso', 'Lorong 3', true),
    ('r1111111-0001-0000-0000-000000000003', 'Dimas Pratama', 'Lorong 3', true),
    ('r1111111-0001-0000-0000-000000000004', 'Fajar Ramadhan', 'Lorong 3', true),
    ('r1111111-0001-0000-0000-000000000005', 'Gilang Perkasa', 'Lorong 3', true),
    ('r1111111-0001-0000-0000-000000000006', 'Hendra Wijaya', 'Lorong 3', true),
    ('r1111111-0001-0000-0000-000000000007', 'Irfan Hakim', 'Lorong 3', true),
    ('r1111111-0002-0000-0000-000000000001', 'Aditya Pratama', 'Lorong 4', true),
    ('r1111111-0002-0000-0000-000000000002', 'Bagus Nugroho', 'Lorong 4', true),
    ('r1111111-0002-0000-0000-000000000003', 'Candra Kusuma', 'Lorong 4', true),
    ('r1111111-0002-0000-0000-000000000004', 'Dwi Saputra', 'Lorong 4', true),
    ('r1111111-0002-0000-0000-000000000005', 'Farhan Maulana', 'Lorong 4', true),
    ('r1111111-0002-0000-0000-000000000006', 'Hafizh Firdaus', 'Lorong 4', true),
    ('r1111111-0002-0000-0000-000000000007', 'Rizky Alamsyah', 'Lorong 4', true)
ON CONFLICT (id) DO NOTHING;

-- 3. PEMBUATAN AKUN ADMIN AWAL (SUPABASE AUTH)
-- Username: admin / Email: admin@asrama.local
-- Password: admingacor123
-- Menggunakan extension pgcrypto bawaan Supabase untuk hash password:
DO $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_encrypted_pw TEXT;
BEGIN
    -- Hanya buat jika belum ada admin@asrama.local
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@asrama.local') THEN
        v_encrypted_pw := crypt('admingacor123', gen_salt('bf'));

        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
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
            v_user_id,
            'authenticated',
            'authenticated',
            'admin@asrama.local',
            v_encrypted_pw,
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"username":"admin","full_name":"Pengurus Asrama"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        );

        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_user_id,
            format('{"sub":"%s","email":"admin@asrama.local"}', v_user_id)::jsonb,
            'email',
            now(),
            now(),
            now()
        );
    END IF;
END $$;
