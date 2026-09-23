
-- Library catalogue
CREATE TABLE public.library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  isbn text,
  cover_url text,
  total_copies integer NOT NULL DEFAULT 1,
  available_copies integer NOT NULL DEFAULT 1,
  location text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.library_books TO authenticated;
GRANT ALL ON public.library_books TO service_role;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can browse books" ON public.library_books FOR SELECT TO authenticated USING (true);
CREATE POLICY "Librarians manage books" ON public.library_books FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'materials.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'materials.manage'));
CREATE TRIGGER t_books_u BEFORE UPDATE ON public.library_books FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.book_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'reserved',
  reserved_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  returned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_loans TO authenticated;
GRANT ALL ON public.book_loans TO service_role;
ALTER TABLE public.book_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own loans readable" ON public.book_loans FOR SELECT TO authenticated USING (profile_id = public.my_profile_id());
CREATE POLICY "Own loans insertable" ON public.book_loans FOR INSERT TO authenticated WITH CHECK (profile_id = public.my_profile_id());
CREATE POLICY "Own loans updatable" ON public.book_loans FOR UPDATE TO authenticated USING (profile_id = public.my_profile_id()) WITH CHECK (profile_id = public.my_profile_id());
CREATE POLICY "Own loans deletable" ON public.book_loans FOR DELETE TO authenticated USING (profile_id = public.my_profile_id());
CREATE TRIGGER t_loans_u BEFORE UPDATE ON public.book_loans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Placements
CREATE TABLE public.job_openings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  role_title text NOT NULL,
  kind text NOT NULL DEFAULT 'internship',
  location text,
  mode text,
  stipend text,
  package_lpa numeric,
  skills text[] NOT NULL DEFAULT '{}',
  eligibility text,
  description text,
  apply_by date,
  posted_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.job_openings TO authenticated;
GRANT ALL ON public.job_openings TO service_role;
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view openings" ON public.job_openings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage openings" ON public.job_openings FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'students.view'))
  WITH CHECK (public.has_permission(auth.uid(), 'students.view'));
CREATE TRIGGER t_jobs_u BEFORE UPDATE ON public.job_openings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'applied',
  saved boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, profile_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own applications readable" ON public.job_applications FOR SELECT TO authenticated
  USING (profile_id = public.my_profile_id() OR public.has_permission(auth.uid(), 'students.view'));
CREATE POLICY "Own applications insertable" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (profile_id = public.my_profile_id());
CREATE POLICY "Own applications updatable" ON public.job_applications FOR UPDATE TO authenticated USING (profile_id = public.my_profile_id()) WITH CHECK (profile_id = public.my_profile_id());
CREATE POLICY "Own applications deletable" ON public.job_applications FOR DELETE TO authenticated USING (profile_id = public.my_profile_id());
CREATE TRIGGER t_job_apps_u BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Research
CREATE TABLE public.research_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  authors text[] NOT NULL DEFAULT '{}',
  venue text,
  year integer,
  abstract text,
  url text,
  tags text[] NOT NULL DEFAULT '{}',
  department_id uuid REFERENCES public.departments(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.research_papers TO authenticated;
GRANT ALL ON public.research_papers TO service_role;
ALTER TABLE public.research_papers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view papers" ON public.research_papers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Faculty manage papers" ON public.research_papers FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'materials.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'materials.manage'));
CREATE TRIGGER t_papers_u BEFORE UPDATE ON public.research_papers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.paper_bookmarks (
  paper_id uuid NOT NULL REFERENCES public.research_papers(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (paper_id, profile_id)
);
GRANT SELECT, INSERT, DELETE ON public.paper_bookmarks TO authenticated;
GRANT ALL ON public.paper_bookmarks TO service_role;
ALTER TABLE public.paper_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own paper bookmarks readable" ON public.paper_bookmarks FOR SELECT TO authenticated USING (profile_id = public.my_profile_id());
CREATE POLICY "Own paper bookmarks insertable" ON public.paper_bookmarks FOR INSERT TO authenticated WITH CHECK (profile_id = public.my_profile_id());
CREATE POLICY "Own paper bookmarks deletable" ON public.paper_bookmarks FOR DELETE TO authenticated USING (profile_id = public.my_profile_id());

-- Achievements
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'academic',
  description text,
  issuer text,
  awarded_on date,
  points integer NOT NULL DEFAULT 0,
  evidence_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own achievements readable" ON public.achievements FOR SELECT TO authenticated
  USING (profile_id = public.my_profile_id() OR public.has_permission(auth.uid(), 'students.view'));
CREATE POLICY "Own achievements insertable" ON public.achievements FOR INSERT TO authenticated WITH CHECK (profile_id = public.my_profile_id());
CREATE POLICY "Own achievements updatable" ON public.achievements FOR UPDATE TO authenticated USING (profile_id = public.my_profile_id()) WITH CHECK (profile_id = public.my_profile_id());
CREATE POLICY "Own achievements deletable" ON public.achievements FOR DELETE TO authenticated USING (profile_id = public.my_profile_id());
CREATE TRIGGER t_ach_u BEFORE UPDATE ON public.achievements FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Personal reminders
CREATE TABLE public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text,
  due_at timestamptz NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own reminders readable" ON public.reminders FOR SELECT TO authenticated USING (profile_id = public.my_profile_id());
CREATE POLICY "Own reminders insertable" ON public.reminders FOR INSERT TO authenticated WITH CHECK (profile_id = public.my_profile_id());
CREATE POLICY "Own reminders updatable" ON public.reminders FOR UPDATE TO authenticated USING (profile_id = public.my_profile_id()) WITH CHECK (profile_id = public.my_profile_id());
CREATE POLICY "Own reminders deletable" ON public.reminders FOR DELETE TO authenticated USING (profile_id = public.my_profile_id());
CREATE TRIGGER t_reminders_u BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Preferences
CREATE TABLE public.user_preferences (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'light',
  language text NOT NULL DEFAULT 'English',
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  reduce_motion boolean NOT NULL DEFAULT false,
  large_text boolean NOT NULL DEFAULT false,
  notifications jsonb NOT NULL DEFAULT '{"enabled":true,"email":true,"push":true,"events":true,"assignments":true,"messages":true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own preferences readable" ON public.user_preferences FOR SELECT TO authenticated USING (profile_id = public.my_profile_id());
CREATE POLICY "Own preferences insertable" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (profile_id = public.my_profile_id());
CREATE POLICY "Own preferences updatable" ON public.user_preferences FOR UPDATE TO authenticated USING (profile_id = public.my_profile_id()) WITH CHECK (profile_id = public.my_profile_id());
CREATE TRIGGER t_prefs_u BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
