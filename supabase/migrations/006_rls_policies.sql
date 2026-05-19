-- AIjarin Phase 1.6: Row Level Security (RBAC) for all public tables

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER — read profiles without policy recursion)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'::user_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_guru_or_tutor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('guru'::user_role, 'tutor_sebaya'::user_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_sekolah_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sekolah_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.can_guru_access_siswa(target_siswa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles guru
    INNER JOIN public.profiles siswa ON siswa.id = target_siswa_id
    WHERE guru.id = auth.uid()
      AND guru.role IN ('guru'::user_role, 'tutor_sebaya'::user_role)
      AND guru.sekolah_id IS NOT NULL
      AND guru.sekolah_id = siswa.sekolah_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_same_sekolah(target_sekolah_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT target_sekolah_id IS NOT NULL
    AND public.auth_sekolah_id() = target_sekolah_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_guru_or_tutor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_sekolah_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_guru_access_siswa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_same_sekolah(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Siswa bisa baca profil sendiri"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Siswa bisa update profil sendiri"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Guru bisa baca profil di sekolahnya"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles guru_profile
      WHERE guru_profile.id = auth.uid()
        AND guru_profile.role IN ('guru'::user_role, 'tutor_sebaya'::user_role)
        AND guru_profile.sekolah_id IS NOT NULL
        AND guru_profile.sekolah_id = profiles.sekolah_id
    )
  );

CREATE POLICY "Admin bisa kelola semua profil"
  ON profiles FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- sekolah
-- ---------------------------------------------------------------------------

ALTER TABLE sekolah ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated bisa baca sekolah"
  ON sekolah FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin bisa kelola sekolah"
  ON sekolah FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- levels, misi, soal, badges (read: authenticated; write: super_admin / service)
-- ---------------------------------------------------------------------------

ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE misi ENABLE ROW LEVEL SECURITY;
ALTER TABLE soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated bisa baca levels"
  ON levels FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin bisa kelola levels"
  ON levels FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "Authenticated bisa baca misi"
  ON misi FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin bisa kelola misi"
  ON misi FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "Authenticated bisa baca soal"
  ON soal FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin bisa kelola soal"
  ON soal FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "Authenticated bisa baca badges"
  ON badges FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin bisa kelola badges"
  ON badges FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- siswa_progress
-- ---------------------------------------------------------------------------

ALTER TABLE siswa_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Siswa bisa baca progress sendiri"
  ON siswa_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = siswa_id);

CREATE POLICY "Siswa bisa tulis progress sendiri"
  ON siswa_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = siswa_id);

CREATE POLICY "Siswa bisa update progress sendiri"
  ON siswa_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = siswa_id)
  WITH CHECK (auth.uid() = siswa_id);

CREATE POLICY "Guru bisa baca progress siswanya"
  ON siswa_progress FOR SELECT
  TO authenticated
  USING (public.can_guru_access_siswa(siswa_id));

CREATE POLICY "Admin bisa kelola semua progress"
  ON siswa_progress FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- siswa_stats
-- ---------------------------------------------------------------------------

ALTER TABLE siswa_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Siswa bisa baca stats sendiri"
  ON siswa_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = siswa_id);

CREATE POLICY "Siswa bisa tulis stats sendiri"
  ON siswa_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = siswa_id);

CREATE POLICY "Siswa bisa update stats sendiri"
  ON siswa_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = siswa_id)
  WITH CHECK (auth.uid() = siswa_id);

CREATE POLICY "Guru bisa baca stats siswanya"
  ON siswa_stats FOR SELECT
  TO authenticated
  USING (public.can_guru_access_siswa(siswa_id));

CREATE POLICY "Admin bisa kelola semua stats"
  ON siswa_stats FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- siswa_badges
-- ---------------------------------------------------------------------------

ALTER TABLE siswa_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Siswa bisa baca badge sendiri"
  ON siswa_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = siswa_id);

CREATE POLICY "Guru bisa baca badge siswanya"
  ON siswa_badges FOR SELECT
  TO authenticated
  USING (public.can_guru_access_siswa(siswa_id));

CREATE POLICY "Admin bisa kelola semua siswa_badges"
  ON siswa_badges FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- leaderboard_cache (read: same sekolah; write: service role only — no INSERT/UPDATE policy)
-- ---------------------------------------------------------------------------

ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated bisa baca leaderboard sekolahnya"
  ON leaderboard_cache FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_same_sekolah(sekolah_id)
  );

-- ---------------------------------------------------------------------------
-- chatbot_logs
-- ---------------------------------------------------------------------------

ALTER TABLE chatbot_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Siswa bisa baca log chat sendiri"
  ON chatbot_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = siswa_id);

CREATE POLICY "Siswa bisa tulis log chat sendiri"
  ON chatbot_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = siswa_id);

CREATE POLICY "Guru bisa baca log chat siswanya"
  ON chatbot_logs FOR SELECT
  TO authenticated
  USING (public.can_guru_access_siswa(siswa_id));

CREATE POLICY "Admin bisa kelola semua chatbot_logs"
  ON chatbot_logs FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- survey_responses
-- ---------------------------------------------------------------------------

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Siswa bisa baca survey sendiri"
  ON survey_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = siswa_id);

CREATE POLICY "Siswa bisa tulis survey sendiri"
  ON survey_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = siswa_id);

CREATE POLICY "Guru bisa baca survey siswanya"
  ON survey_responses FOR SELECT
  TO authenticated
  USING (public.can_guru_access_siswa(siswa_id));

CREATE POLICY "Admin bisa kelola semua survey"
  ON survey_responses FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- pretest_results, posttest_results, ngain_scores
-- ---------------------------------------------------------------------------

ALTER TABLE pretest_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE posttest_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngain_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Siswa bisa baca pretest sendiri"
  ON pretest_results FOR SELECT TO authenticated USING (auth.uid() = siswa_id);

CREATE POLICY "Siswa bisa tulis pretest sendiri"
  ON pretest_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = siswa_id);

CREATE POLICY "Siswa bisa update pretest sendiri"
  ON pretest_results FOR UPDATE TO authenticated
  USING (auth.uid() = siswa_id) WITH CHECK (auth.uid() = siswa_id);

CREATE POLICY "Guru bisa baca pretest siswanya"
  ON pretest_results FOR SELECT TO authenticated
  USING (public.can_guru_access_siswa(siswa_id));

CREATE POLICY "Admin bisa kelola semua pretest"
  ON pretest_results FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "Siswa bisa baca posttest sendiri"
  ON posttest_results FOR SELECT TO authenticated USING (auth.uid() = siswa_id);

CREATE POLICY "Siswa bisa tulis posttest sendiri"
  ON posttest_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = siswa_id);

CREATE POLICY "Guru bisa baca posttest siswanya"
  ON posttest_results FOR SELECT TO authenticated
  USING (public.can_guru_access_siswa(siswa_id));

CREATE POLICY "Admin bisa kelola semua posttest"
  ON posttest_results FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "Siswa bisa baca ngain sendiri"
  ON ngain_scores FOR SELECT TO authenticated USING (auth.uid() = siswa_id);

CREATE POLICY "Guru bisa baca ngain siswanya"
  ON ngain_scores FOR SELECT TO authenticated
  USING (public.can_guru_access_siswa(siswa_id));

CREATE POLICY "Admin bisa kelola semua ngain"
  ON ngain_scores FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- adaptive_recommendations, time_on_task
-- ---------------------------------------------------------------------------

ALTER TABLE adaptive_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_on_task ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Siswa bisa baca rekomendasi sendiri"
  ON adaptive_recommendations FOR SELECT TO authenticated USING (auth.uid() = siswa_id);

CREATE POLICY "Siswa bisa update rekomendasi sendiri"
  ON adaptive_recommendations FOR UPDATE TO authenticated
  USING (auth.uid() = siswa_id) WITH CHECK (auth.uid() = siswa_id);

CREATE POLICY "Guru bisa baca rekomendasi siswanya"
  ON adaptive_recommendations FOR SELECT TO authenticated
  USING (public.can_guru_access_siswa(siswa_id));

CREATE POLICY "Admin bisa kelola semua rekomendasi"
  ON adaptive_recommendations FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "Siswa bisa baca time_on_task sendiri"
  ON time_on_task FOR SELECT TO authenticated USING (auth.uid() = siswa_id);

CREATE POLICY "Siswa bisa tulis time_on_task sendiri"
  ON time_on_task FOR INSERT TO authenticated WITH CHECK (auth.uid() = siswa_id);

CREATE POLICY "Guru bisa baca time_on_task siswanya"
  ON time_on_task FOR SELECT TO authenticated
  USING (public.can_guru_access_siswa(siswa_id));

CREATE POLICY "Admin bisa kelola semua time_on_task"
  ON time_on_task FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
