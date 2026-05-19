-- AIjarin Phase 1.1: PostgreSQL extensions and domain enum types

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('siswa', 'guru', 'tutor_sebaya', 'super_admin');
CREATE TYPE misi_type AS ENUM ('drag_drop', 'fill_blank', 'multiple_choice', 'code_typing', 'project');
CREATE TYPE misi_status AS ENUM ('locked', 'available', 'in_progress', 'completed');
CREATE TYPE ngain_category AS ENUM ('rendah', 'sedang', 'tinggi');
