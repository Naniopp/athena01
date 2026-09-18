ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS setup_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS phone text;

CREATE OR REPLACE FUNCTION public.validate_onboarding_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.onboarding_status NOT IN ('not_started','in_progress','completed') THEN
    RAISE EXCEPTION 'Invalid onboarding status: %', NEW.onboarding_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_validate_onboarding ON public.profiles;
CREATE TRIGGER profiles_validate_onboarding
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_onboarding_status();

-- Student details
CREATE TABLE IF NOT EXISTS public.student_profiles (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  roll_no text,
  institution text,
  department_id uuid REFERENCES public.departments(id),
  program_id uuid REFERENCES public.programs(id),
  academic_year integer,
  semester integer,
  section text,
  admission_year integer,
  date_of_birth date,
  gender text,
  interests text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  hobbies text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Faculty details
CREATE TABLE IF NOT EXISTS public.faculty_profiles (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id text,
  department_id uuid REFERENCES public.departments(id),
  designation text,
  qualification text,
  specialisation text,
  experience_years integer,
  joining_year integer,
  subjects text[] NOT NULL DEFAULT '{}',
  programs text[] NOT NULL DEFAULT '{}',
  office_room text,
  office_hours text,
  expertise text[] NOT NULL DEFAULT '{}',
  research_interests text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.faculty_profiles TO authenticated;
GRANT ALL ON public.faculty_profiles TO service_role;
ALTER TABLE public.faculty_profiles ENABLE ROW LEVEL SECURITY;

-- HOD details
CREATE TABLE IF NOT EXISTS public.hod_profiles (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id text,
  department_id uuid REFERENCES public.departments(id),
  department_code text,
  designation text,
  qualification text,
  experience_years integer,
  joining_year integer,
  programs text[] NOT NULL DEFAULT '{}',
  responsibilities text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.hod_profiles TO authenticated;
GRANT ALL ON public.hod_profiles TO service_role;
ALTER TABLE public.hod_profiles ENABLE ROW LEVEL SECURITY;

-- Administrator details
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id text,
  designation text,
  admin_department text,
  institution text,
  experience_years integer,
  responsibilities text,
  requested_areas text[] NOT NULL DEFAULT '{}',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.admin_profiles TO authenticated;
GRANT ALL ON public.admin_profiles TO service_role;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['student_profiles','faculty_profiles','hod_profiles','admin_profiles'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "own_select" ON public.%I', t);
    EXECUTE format('CREATE POLICY "own_select" ON public.%I FOR SELECT TO authenticated USING (profile_id = public.my_profile_id() OR public.has_permission(auth.uid(), ''users.view''))', t);
    EXECUTE format('DROP POLICY IF EXISTS "own_insert" ON public.%I', t);
    EXECUTE format('CREATE POLICY "own_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (profile_id = public.my_profile_id())', t);
    EXECUTE format('DROP POLICY IF EXISTS "own_update" ON public.%I', t);
    EXECUTE format('CREATE POLICY "own_update" ON public.%I FOR UPDATE TO authenticated USING (profile_id = public.my_profile_id() OR public.has_permission(auth.uid(), ''users.update'')) WITH CHECK (profile_id = public.my_profile_id() OR public.has_permission(auth.uid(), ''users.update''))', t);
    EXECUTE format('DROP TRIGGER IF EXISTS t_%s_u ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER t_%s_u BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;