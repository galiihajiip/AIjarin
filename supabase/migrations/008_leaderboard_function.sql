-- AIjarin Phase 1.8: refresh denormalized leaderboard cache per sekolah

CREATE OR REPLACE FUNCTION refresh_leaderboard(p_sekolah_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO leaderboard_cache (siswa_id, sekolah_id, total_xp, current_streak, rank, updated_at)
  SELECT
    p.id,
    p.sekolah_id,
    COALESCE(ss.total_xp, 0),
    COALESCE(ss.current_streak, 0),
    ROW_NUMBER() OVER (
      PARTITION BY p.sekolah_id
      ORDER BY COALESCE(ss.total_xp, 0) DESC
    ),
    NOW()
  FROM profiles p
  LEFT JOIN siswa_stats ss ON ss.siswa_id = p.id
  WHERE p.role = 'siswa'::user_role
    AND (p_sekolah_id IS NULL OR p.sekolah_id = p_sekolah_id)
  ON CONFLICT (siswa_id) DO UPDATE
  SET
    total_xp = EXCLUDED.total_xp,
    current_streak = EXCLUDED.current_streak,
    rank = EXCLUDED.rank,
    sekolah_id = EXCLUDED.sekolah_id,
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_leaderboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_leaderboard(UUID) TO service_role;
