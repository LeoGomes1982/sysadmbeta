-- Add quantity column to data_entries table for uniform and EPI items
ALTER TABLE data_entries
ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1;

-- Update existing records to have quantity = 1
UPDATE data_entries
SET quantity = 1
WHERE quantity IS NULL;
