-- RPC function to allow Admins to securely create Staff users
-- This bypasses the normal GoTrue signup to avoid logging the Admin out,
-- and allows setting the role explicitly to 'Staff'.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.create_staff_user(
    staff_email TEXT,
    staff_password TEXT,
    staff_name TEXT,
    staff_department TEXT
) RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    encrypted_pw TEXT;
    admin_check TEXT;
BEGIN
    -- 1. Check if the person calling this function is an Admin
    SELECT role INTO admin_check FROM public.profiles WHERE id = auth.uid();
    IF admin_check != 'Admin' THEN
        RAISE EXCEPTION 'Only Admins can create staff accounts';
    END IF;

    -- 2. Generate new UUID
    new_user_id := gen_random_uuid();
    
    -- 3. Encrypt password
    encrypted_pw := crypt(staff_password, gen_salt('bf'));

    -- 4. Insert into auth.users (GoTrue)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', staff_email, encrypted_pw, now(), now(), now(), '{"provider":"email","providers":["email"]}',
        json_build_object('full_name', staff_name, 'role', 'Staff', 'department', staff_department),
        now(), now(), '', '', '', ''
    );

    -- 5. The auth trigger `handle_new_user` will fire and might try to make them a Student.
    -- However, because this is an insert into auth.users from inside a function, the trigger will run.
    -- If the trigger forces them to Student, we must update the profile to Staff immediately after.

    -- Attempt to update the newly created profile back to Staff
    UPDATE public.profiles
    SET role = 'Staff',
        department = staff_department,
        full_name = staff_name
    WHERE id = new_user_id;

    RETURN json_build_object('success', true, 'user_id', new_user_id, 'message', 'Staff account created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
