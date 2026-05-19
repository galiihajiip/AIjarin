-- AIjarin Phase 1.2: sekolah registry and user profiles (replaces Phase 0 draft profiles)

-- Phase 0 draft tables used a different profiles shape; drop before recreating
DROP TABLE IF EXISTS siswa_stats CASCADE;
DROP TABLE IF EXISTS siswa_progress CASCADE;
DROP TABLE IF EXISTS misi CASCADE;
DROP TABLE IF EXISTS levels CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS sekolah CASCADE;

CREATE TABLE sekolah (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  kota TEXT NOT NULL,
  npsn TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'siswa',
  sekolah_id UUID REFERENCES sekolah(id),
  kelas TEXT,
  avatar_url TEXT,
  nisn TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama_lengkap, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'nama_lengkap',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'siswa')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
