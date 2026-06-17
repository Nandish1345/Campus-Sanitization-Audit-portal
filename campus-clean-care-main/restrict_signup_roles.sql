-- Update the trigger function to restrict roles during signup
-- Only 'Student' and 'Lecturer' are allowed via public signup.
-- Any request for 'Staff' or 'Admin' will be defaulted to 'Student'.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    requested_role TEXT;
BEGIN
    -- Extract requested role and default to Student if not provided or restricted
    requested_role := COALESCE(new.raw_user_meta_data->>'role', 'Student');
    
    -- Force 'Student' if someone tries to sign up as Admin or Staff via metadata manipulation
    IF requested_role IN ('Admin', 'Staff') THEN
        requested_role := 'Student';
    END IF;

    INSERT INTO public.profiles (id, full_name, email, role, department)
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'full_name', 
        new.email, 
        requested_role,
        new.raw_user_meta_data->>'department'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger (not strictly necessary but ensures it's fresh)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
