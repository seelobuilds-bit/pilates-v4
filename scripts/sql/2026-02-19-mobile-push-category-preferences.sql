DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'MobilePushCategory'
  ) THEN
    CREATE TYPE "MobilePushCategory" AS ENUM ('INBOX', 'BOOKINGS', 'SYSTEM');
  END IF;
END$$;

ALTER TABLE "MobilePushDevice"
ADD COLUMN IF NOT EXISTS "notificationCategories" "MobilePushCategory"[] NOT NULL DEFAULT ARRAY['INBOX', 'BOOKINGS', 'SYSTEM']::"MobilePushCategory"[];
