-- This script converts an existing User account into a Staff account
-- so that they can be assigned complaints in the Admin Dashboard.

-- Instructions: Replace 'staff@example.com' with the actual email
-- of the user you want to upgrade.
UPDATE profiles
SET role = 'Staff'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'staff@example.com' -- <-- CHANGE THIS EMAIL
);
