CREATE OR REPLACE FUNCTION public.assign_store_owner_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF lower(coalesce(NEW.email, '')) = 'gustavodiasreis0111@gmail.com' AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT NEW.id, 'admin'::public.app_role
    WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = NEW.id AND ur.role = 'admin'::public.app_role);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.assign_store_owner_admin() FROM PUBLIC, anon, authenticated;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role FROM auth.users u
WHERE lower(u.email) = 'gustavodiasreis0111@gmail.com' AND u.email_confirmed_at IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin'::public.app_role);

DELETE FROM public.user_roles
WHERE role = 'admin'::public.app_role
  AND user_id IN (SELECT id FROM auth.users WHERE lower(email) = 'gustavodiasreis011@gmail.com');