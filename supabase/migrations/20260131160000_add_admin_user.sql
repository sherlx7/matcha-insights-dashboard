-- Auto-approve and make admin for specific admin email on signup
-- This modifies the handle_new_user function to check for admin email

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_email TEXT := 'admin123@matsumatcha.com';
    is_admin_user BOOLEAN;
BEGIN
    -- Check if this is the admin user
    is_admin_user := (NEW.email = admin_email);

    -- Insert profile (auto-approve if admin)
    INSERT INTO public.profiles (user_id, email, full_name, avatar_url, approval_status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        CASE WHEN is_admin_user THEN 'approved'::approval_status ELSE 'pending'::approval_status END
    );

    -- Insert permissions (all permissions for admin)
    INSERT INTO public.user_permissions (user_id, can_access_financials, can_access_operations, can_access_sandbox)
    VALUES (
        NEW.id,
        is_admin_user,
        is_admin_user,
        is_admin_user
    );

    -- Insert role (admin role if admin user, otherwise regular user)
    IF is_admin_user THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin');
    ELSE
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'user');
    END IF;

    RETURN NEW;
END;
$$;

-- If the admin user already exists, update their status
DO $$
DECLARE
    admin_email TEXT := 'admin123@matsumatcha.com';
    admin_user_id UUID;
BEGIN
    -- Find the user ID for the admin email
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email;

    -- If found, update their profile and roles
    IF admin_user_id IS NOT NULL THEN
        -- Update profile to approved
        UPDATE public.profiles
        SET approval_status = 'approved'
        WHERE user_id = admin_user_id;

        -- Update permissions to full access
        UPDATE public.user_permissions
        SET
            can_access_financials = true,
            can_access_operations = true,
            can_access_sandbox = true
        WHERE user_id = admin_user_id;

        -- Ensure admin role exists
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END;
$$;
