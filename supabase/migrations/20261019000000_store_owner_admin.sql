-- Store owner/admin bootstrap for Elegância Modesta Boutique.
-- Run through Supabase SQL Editor or apply as a Supabase migration.
-- Only the exact, verified owner email is granted the admin role.

CREATE OR REPLACE FUNCTION public.assign_store_owner_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF lower(coalesce(NEW.email, '')) = 'gustavodiasreis011@gmail.com'
     AND NEW.email_confirmed_at IS NOT NULL
  THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT NEW.id, 'admin'::public.app_role
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = NEW.id
        AND ur.role = 'admin'::public.app_role
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_store_owner_admin ON auth.users;
CREATE TRIGGER assign_store_owner_admin
AFTER INSERT OR UPDATE OF email, email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_store_owner_admin();

-- Promote the owner immediately if this verified account already exists.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'gustavodiasreis011@gmail.com'
  AND u.email_confirmed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = u.id
      AND ur.role = 'admin'::public.app_role
  );

-- Product mutations are permitted only for users with the admin role.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS products_admin_insert ON public.products;
CREATE POLICY products_admin_insert
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'::public.app_role, auth.uid()));

DROP POLICY IF EXISTS products_admin_update ON public.products;
CREATE POLICY products_admin_update
ON public.products
FOR UPDATE
TO authenticated
USING (public.has_role('admin'::public.app_role, auth.uid()))
WITH CHECK (public.has_role('admin'::public.app_role, auth.uid()));

DROP POLICY IF EXISTS products_admin_delete ON public.products;
CREATE POLICY products_admin_delete
ON public.products
FOR DELETE
TO authenticated
USING (public.has_role('admin'::public.app_role, auth.uid()));
