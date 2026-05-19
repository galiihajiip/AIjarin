-- AIjarin Phase 1.7: N-Gain calculation helpers and posttest auto-update trigger

CREATE OR REPLACE FUNCTION calculate_ngain(pre NUMERIC, post NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  gain NUMERIC;
BEGIN
  IF pre >= 100 THEN
    RETURN 0;
  END IF;
  gain := (post - pre) / (100 - pre);
  RETURN ROUND(gain::NUMERIC, 4);
END;
$$;

CREATE OR REPLACE FUNCTION get_ngain_category(ngain_value NUMERIC)
RETURNS ngain_category
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF ngain_value >= 0.7 THEN
    RETURN 'tinggi';
  ELSIF ngain_value >= 0.3 THEN
    RETURN 'sedang';
  ELSE
    RETURN 'rendah';
  END IF;
END;
$$;

-- Trigger: auto-calculate N-Gain when posttest is submitted
CREATE OR REPLACE FUNCTION update_ngain_on_posttest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pre_score NUMERIC;
  new_ngain NUMERIC;
BEGIN
  SELECT skor INTO pre_score
  FROM pretest_results
  WHERE siswa_id = NEW.siswa_id
    AND level_id = NEW.level_id;

  IF pre_score IS NOT NULL THEN
    new_ngain := calculate_ngain(pre_score, NEW.skor);
    INSERT INTO ngain_scores (siswa_id, level_id, skor_pretest, skor_posttest, ngain, kategori)
    VALUES (
      NEW.siswa_id,
      NEW.level_id,
      pre_score,
      NEW.skor,
      new_ngain,
      get_ngain_category(new_ngain)
    )
    ON CONFLICT (siswa_id, level_id) DO UPDATE
    SET
      skor_posttest = EXCLUDED.skor_posttest,
      ngain = EXCLUDED.ngain,
      kategori = EXCLUDED.kategori,
      calculated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_posttest_insert
  AFTER INSERT ON posttest_results
  FOR EACH ROW
  EXECUTE FUNCTION update_ngain_on_posttest();
