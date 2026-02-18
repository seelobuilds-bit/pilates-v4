-- Enable RLS on all public tables (ordinary + partitioned).
-- Safe to run multiple times.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schemaname, c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
  END LOOP;
END $$;

