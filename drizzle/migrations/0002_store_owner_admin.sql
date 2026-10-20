CREATE OR REPLACE FUNCTION public.assign_store_owner_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF lower(coalesce(NEW.email, '')) = 'gustavodiasreis011@gmail.com' AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT NEW.id, 'admin'::public.app_role
    WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = NEW.id AND ur.role = 'admin'::public.app_role);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.assign_store_owner_admin() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS assign_store_owner_admin ON auth.users;
CREATE TRIGGER assign_store_owner_admin
AFTER INSERT OR UPDATE OF email, email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_store_owner_admin();

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role FROM auth.users u
WHERE lower(u.email) = 'gustavodiasreis011@gmail.com' AND u.email_confirmed_at IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin'::public.app_role);