-- Deduplicate colleagues created by invite/approve flow and prevent future duplicates.
-- Strategy:
-- 1) Collapse duplicates that share the same normalized email and same profile_id.
-- 2) Rewire all foreign-key references from dropped colleague IDs to kept IDs.
-- 3) Enforce uniqueness for profile_id and case-insensitive email.

DO $$
DECLARE
  fk_record RECORD;
BEGIN
  CREATE TEMP TABLE tmp_colleague_dedupe_map (
    drop_id UUID PRIMARY KEY,
    keep_id UUID NOT NULL
  ) ON COMMIT DROP;

  WITH ranked AS (
    SELECT
      c.id,
      c.profile_id,
      lower(c.email) AS email_norm,
      c.created_at,
      -- Keep the most complete row first; tie-break by oldest row.
      (
        (CASE WHEN c.phone IS NOT NULL AND btrim(c.phone) <> '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.personal_email IS NOT NULL AND btrim(c.personal_email) <> '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.ico IS NOT NULL AND btrim(c.ico) <> '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.dic IS NOT NULL AND btrim(c.dic) <> '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.company_name IS NOT NULL AND btrim(c.company_name) <> '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.billing_street IS NOT NULL AND btrim(c.billing_street) <> '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.billing_city IS NOT NULL AND btrim(c.billing_city) <> '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.billing_zip IS NOT NULL AND btrim(c.billing_zip) <> '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.bank_account IS NOT NULL AND btrim(c.bank_account) <> '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.internal_hourly_cost IS NOT NULL AND c.internal_hourly_cost > 0 THEN 1 ELSE 0 END) +
        (CASE WHEN c.monthly_fixed_cost IS NOT NULL AND c.monthly_fixed_cost > 0 THEN 1 ELSE 0 END)
      ) AS completeness_score,
      row_number() OVER (
        PARTITION BY lower(c.email), c.profile_id
        ORDER BY
          (
            (CASE WHEN c.phone IS NOT NULL AND btrim(c.phone) <> '' THEN 1 ELSE 0 END) +
            (CASE WHEN c.personal_email IS NOT NULL AND btrim(c.personal_email) <> '' THEN 1 ELSE 0 END) +
            (CASE WHEN c.ico IS NOT NULL AND btrim(c.ico) <> '' THEN 1 ELSE 0 END) +
            (CASE WHEN c.dic IS NOT NULL AND btrim(c.dic) <> '' THEN 1 ELSE 0 END) +
            (CASE WHEN c.company_name IS NOT NULL AND btrim(c.company_name) <> '' THEN 1 ELSE 0 END) +
            (CASE WHEN c.billing_street IS NOT NULL AND btrim(c.billing_street) <> '' THEN 1 ELSE 0 END) +
            (CASE WHEN c.billing_city IS NOT NULL AND btrim(c.billing_city) <> '' THEN 1 ELSE 0 END) +
            (CASE WHEN c.billing_zip IS NOT NULL AND btrim(c.billing_zip) <> '' THEN 1 ELSE 0 END) +
            (CASE WHEN c.bank_account IS NOT NULL AND btrim(c.bank_account) <> '' THEN 1 ELSE 0 END) +
            (CASE WHEN c.internal_hourly_cost IS NOT NULL AND c.internal_hourly_cost > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN c.monthly_fixed_cost IS NOT NULL AND c.monthly_fixed_cost > 0 THEN 1 ELSE 0 END)
          ) DESC,
          c.created_at ASC,
          c.id ASC
      ) AS rn
    FROM public.colleagues c
    WHERE c.email IS NOT NULL
      AND c.profile_id IS NOT NULL
  ),
  duplicate_groups AS (
    SELECT email_norm, profile_id
    FROM ranked
    GROUP BY email_norm, profile_id
    HAVING count(*) > 1
  ),
  kept AS (
    SELECT r.email_norm, r.profile_id, r.id AS keep_id
    FROM ranked r
    JOIN duplicate_groups g
      ON g.email_norm = r.email_norm
     AND g.profile_id = r.profile_id
    WHERE r.rn = 1
  ),
  dropped AS (
    SELECT r.email_norm, r.profile_id, r.id AS drop_id
    FROM ranked r
    JOIN duplicate_groups g
      ON g.email_norm = r.email_norm
     AND g.profile_id = r.profile_id
    WHERE r.rn > 1
  )
  INSERT INTO tmp_colleague_dedupe_map (drop_id, keep_id)
  SELECT d.drop_id, k.keep_id
  FROM dropped d
  JOIN kept k
    ON k.email_norm = d.email_norm
   AND k.profile_id = d.profile_id;

  -- Repoint all foreign keys referencing public.colleagues(id).
  FOR fk_record IN
    SELECT
      c.conrelid::regclass::text AS table_name,
      a.attname AS column_name
    FROM pg_constraint c
    JOIN unnest(c.conkey) AS conkey(attnum) ON TRUE
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = conkey.attnum
    WHERE c.contype = 'f'
      AND c.confrelid = 'public.colleagues'::regclass
  LOOP
    EXECUTE format(
      'UPDATE %s AS t
       SET %I = m.keep_id
       FROM tmp_colleague_dedupe_map AS m
       WHERE t.%I = m.drop_id',
      fk_record.table_name,
      fk_record.column_name,
      fk_record.column_name
    );
  END LOOP;

  DELETE FROM public.colleagues c
  USING tmp_colleague_dedupe_map m
  WHERE c.id = m.drop_id;

  -- If duplicates remain, stop the migration so data can be inspected manually.
  IF EXISTS (
    SELECT 1
    FROM public.colleagues
    GROUP BY lower(email)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate colleague emails still exist after dedupe. Manual intervention required.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.colleagues
    WHERE profile_id IS NOT NULL
    GROUP BY profile_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Multiple colleagues still linked to the same profile_id after dedupe. Manual intervention required.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_colleagues_profile_unique
  ON public.colleagues (profile_id)
  WHERE profile_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_colleagues_email_ci_unique
  ON public.colleagues (lower(email));
