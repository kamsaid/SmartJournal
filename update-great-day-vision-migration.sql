-- Migration to update great_day_vision field to support array of strings
-- This allows storing up to 3 items for "What will make today great?"

-- Step 1: Add a new column for the JSON array
ALTER TABLE morning_check_ins 
ADD COLUMN great_day_vision_list JSONB;

-- Step 2: Migrate existing data - convert single strings to single-item arrays
UPDATE morning_check_ins 
SET great_day_vision_list = json_build_array(great_day_vision)
WHERE great_day_vision IS NOT NULL AND great_day_vision != '';

-- Step 3: Handle empty/null values
UPDATE morning_check_ins 
SET great_day_vision_list = '[]'::jsonb
WHERE great_day_vision_list IS NULL;

-- Step 4: Drop the old column and rename the new one
ALTER TABLE morning_check_ins DROP COLUMN great_day_vision;
ALTER TABLE morning_check_ins RENAME COLUMN great_day_vision_list TO great_day_vision;

-- Step 5: Add constraints to ensure valid data
ALTER TABLE morning_check_ins 
ALTER COLUMN great_day_vision SET NOT NULL;

-- Add check constraint to limit array size to maximum 3 items
ALTER TABLE morning_check_ins 
ADD CONSTRAINT great_day_vision_max_items 
CHECK (jsonb_array_length(great_day_vision) <= 3);

-- Add check constraint to ensure all items are non-empty strings
ALTER TABLE morning_check_ins 
ADD CONSTRAINT great_day_vision_valid_items 
CHECK (
  great_day_vision = '[]'::jsonb OR 
  (
    jsonb_typeof(great_day_vision) = 'array' AND
    NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(great_day_vision) AS item 
      WHERE trim(item) = ''
    )
  )
);

-- Create index for better query performance on the JSON column
CREATE INDEX idx_morning_check_ins_great_day_vision 
ON morning_check_ins USING GIN (great_day_vision);

-- Add comment for documentation
COMMENT ON COLUMN morning_check_ins.great_day_vision 
IS 'JSON array of up to 3 items representing what would make today great'; 