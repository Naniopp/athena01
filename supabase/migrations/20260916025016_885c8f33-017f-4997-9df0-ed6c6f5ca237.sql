-- 1. Institution (singleton)
CREATE TABLE public.institution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  owner_user_id uuid,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.institution TO authenticated;
GRANT ALL ON public.institution TO service_role;

ALTER TABLE public.institution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can read the institution"
  ON public.institution FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can update the institution"
  ON public.institution FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE UNIQUE INDEX institution_singleton ON public.institution ((true));

CREATE TRIGGER institution_updated_at
  BEFORE UPDATE ON public.institution
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Ownership + role-request state on profiles
ALTER TABLE public.profiles
  ADD COLUMN is_owner boolean NOT NULL DEFAULT false,
  ADD COLUMN requested_role public.app_role,
  ADD COLUMN approval_status text NOT NULL DEFAULT 'none';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_approval_status_check
  CHECK (approval_status IN ('none', 'pending', 'approved', 'rejected', 'revoked'));

CREATE UNIQUE INDEX profiles_single_owner ON public.profiles (is_owner) WHERE is_owner;

-- 3. Role request metadata on approvals
ALTER TABLE public.approvals
  ADD COLUMN requested_role public.app_role,
  ADD COLUMN target_user_id uuid;

-- 4. Public setup probe: is there still no super admin?
CREATE OR REPLACE FUNCTION public.athena_needs_setup()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin');
$$;

GRANT EXECUTE ON FUNCTION public.athena_needs_setup() TO anon, authenticated;

-- 5. No self-granted super admin from a signed-in session
CREATE OR REPLACE FUNCTION public.guard_super_admin_grant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'super_admin'
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only an existing super admin can grant the super_admin role';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_roles_guard_super_admin
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.guard_super_admin_grant();

-- 6. Never remove the final super admin
CREATE OR REPLACE FUNCTION public.guard_last_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'super_admin'
     AND (SELECT count(*) FROM public.user_roles WHERE role = 'super_admin') <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last super admin: transfer ownership first';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER user_roles_guard_last_super_admin
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.guard_last_super_admin();
