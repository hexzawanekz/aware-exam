-- Update Somchai's email address
-- From: somchai@email.com
-- To: phap.s.dev@gmail.com

-- First, let's check if the candidate exists
SELECT id, first_name, last_name, email, phone 
FROM candidates 
WHERE email = 'somchai@email.com';

-- Update the email address
UPDATE candidates 
SET email = 'phap.s.dev@gmail.com', 
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'somchai@email.com';

-- Verify the update
SELECT id, first_name, last_name, email, phone, updated_at
FROM candidates 
WHERE email = 'phap.s.dev@gmail.com';

-- Show the number of affected rows
SELECT ROW_COUNT() as affected_rows; 