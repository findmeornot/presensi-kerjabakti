-- ==============================================================================
-- SISTEM ABSENSI KERJA BAKTI ASRAMA — SUPABASE INITIAL SCHEMA
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL RESIDENTS (PENGHUNI)
CREATE TABLE IF NOT EXISTS public.residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    hallway TEXT NOT NULL CHECK (hallway IN ('Lorong 3', 'Lorong 4')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABEL EVENTS (KEGIATAN)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABEL ATTENDANCES (ABSENSI)
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Izin')),
    excuse_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_event_resident UNIQUE (event_id, resident_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_residents_active ON public.residents(is_active);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_attendances_event_id ON public.attendances(event_id);
CREATE INDEX IF NOT EXISTS idx_attendances_resident_id ON public.attendances(resident_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- Residents Policies
-- Public can view active residents (for attendance dropdown)
CREATE POLICY "Public can view active residents"
    ON public.residents
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Authenticated admin has full access to residents
CREATE POLICY "Admin has full access to residents"
    ON public.residents
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Events Policies
-- Public can view active events
CREATE POLICY "Public can view active events"
    ON public.events
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Authenticated admin has full access to events
CREATE POLICY "Admin has full access to events"
    ON public.events
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Attendances Policies
-- Public can read attendances (to check if already recorded)
CREATE POLICY "Public can read attendances"
    ON public.attendances
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Authenticated admin has full access to attendances
CREATE POLICY "Admin has full access to attendances"
    ON public.attendances
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- SECURE STORED PROCEDURE (RPC) FOR RESIDENT ATTENDANCE
-- Memproses absensi dari sisi backend yang aman tanpa memerlukan service role key di browser.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.submit_attendance(
    p_event_id UUID,
    p_resident_id UUID,
    p_status TEXT,
    p_excuse_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_record RECORD;
    v_resident_record RECORD;
    v_existing_attendance RECORD;
    v_new_attendance RECORD;
    v_clean_reason TEXT;
BEGIN
    -- 1. Validasi Kegiatan Aktif
    SELECT id, name, is_active INTO v_event_record
    FROM public.events
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kegiatan tidak ditemukan.');
    END IF;

    IF NOT v_event_record.is_active THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kegiatan ini sudah tidak aktif.');
    END IF;

    -- 2. Validasi Penghuni Aktif
    SELECT id, name, hallway, is_active INTO v_resident_record
    FROM public.residents
    WHERE id = p_resident_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Data penghuni tidak ditemukan.');
    END IF;

    IF NOT v_resident_record.is_active THEN
        RETURN jsonb_build_object('success', false, 'error', 'Penghuni sudah nonaktif.');
    END IF;

    -- 3. Validasi Status Kehadiran
    IF p_status NOT IN ('Hadir', 'Izin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Status kehadiran tidak valid.');
    END IF;

    v_clean_reason := TRIM(COALESCE(p_excuse_reason, ''));

    IF p_status = 'Izin' AND LENGTH(v_clean_reason) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alasan izin wajib diisi.');
    END IF;

    IF p_status = 'Hadir' THEN
        v_clean_reason := NULL;
    END IF;

    -- 4. Cegah Duplikasi Absensi (Cek catatan yang sudah ada)
    SELECT id, status, created_at INTO v_existing_attendance
    FROM public.attendances
    WHERE event_id = p_event_id AND resident_id = p_resident_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'already_recorded', true,
            'error', 'Absensi sudah tercatat sebelumnya.',
            'attendance', jsonb_build_object(
                'residentName', v_resident_record.name,
                'hallway', v_resident_record.hallway,
                'status', v_existing_attendance.status,
                'recordedAt', v_existing_attendance.created_at
            )
        );
    END IF;

    -- 5. Masukkan Catatan Absensi
    INSERT INTO public.attendances (
        event_id,
        resident_id,
        status,
        excuse_reason
    ) VALUES (
        p_event_id,
        p_resident_id,
        p_status,
        v_clean_reason
    )
    RETURNING id, status, excuse_reason, created_at INTO v_new_attendance;

    RETURN jsonb_build_object(
        'success', true,
        'already_recorded', false,
        'attendance', jsonb_build_object(
            'id', v_new_attendance.id,
            'residentName', v_resident_record.name,
            'hallway', v_resident_record.hallway,
            'status', v_new_attendance.status,
            'excuseReason', v_new_attendance.excuse_reason,
            'recordedAt', v_new_attendance.created_at
        )
    );
END;
$$;

-- Berikan izin eksekusi fungsi ke anon & authenticated
GRANT EXECUTE ON FUNCTION public.submit_attendance(UUID, UUID, TEXT, TEXT) TO anon, authenticated;
