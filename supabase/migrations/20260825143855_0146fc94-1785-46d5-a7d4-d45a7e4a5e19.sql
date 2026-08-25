-- =========================================================
-- ATHENA foundation: RBAC + academics + social + governance
-- =========================================================

-- ---------- enums ----------
create type public.app_role as enum ('student','faculty','hod','admin','super_admin');
create type public.post_kind as enum ('text','image','announcement','question','poll','event','academic');
create type public.post_scope as enum ('campus','department','community');
create type public.privacy_level as enum ('public','campus','private');
create type public.report_status as enum ('open','reviewing','resolved','dismissed');
create type public.report_target as enum ('post','comment','user','community');
create type public.attendance_status as enum ('present','absent','late','excused');
create type public.account_status as enum ('active','invited','suspended','deactivated');

-- ---------- shared trigger fn ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- =========================================================
-- 1. Departments / programs / sections
-- =========================================================
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.departments to anon, authenticated;
grant all on public.departments to service_role;
alter table public.departments enable row level security;

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  name text not null,
  code text not null,
  duration_years int not null default 4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (department_id, code)
);
grant select on public.programs to anon, authenticated;
grant all on public.programs to service_role;
alter table public.programs enable row level security;

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  name text not null,
  year int not null,
  semester int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, name, year, semester)
);
grant select on public.sections to anon, authenticated;
grant all on public.sections to service_role;
alter table public.sections enable row level security;

-- =========================================================
-- 2. Profiles (may exist without a login: demo/roster people)
-- =========================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  full_name text not null,
  email text,
  photo_url text,
  bio text,
  department_id uuid references public.departments(id) on delete set null,
  program_id uuid references public.programs(id) on delete set null,
  section_id uuid references public.sections(id) on delete set null,
  year int,
  roll_no text,
  designation text,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  links jsonb not null default '{}'::jsonb,
  privacy public.privacy_level not null default 'campus',
  status public.account_status not null default 'active',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create trigger t_profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();

-- =========================================================
-- 3. Roles & granular permissions
-- =========================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  department_id uuid references public.departments(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create table public.permissions (
  key text primary key,
  description text not null,
  category text not null
);
grant select on public.permissions to authenticated;
grant all on public.permissions to service_role;
alter table public.permissions enable row level security;

create table public.role_permissions (
  role public.app_role not null,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role, permission_key)
);
grant select on public.role_permissions to authenticated;
grant all on public.role_permissions to service_role;
alter table public.role_permissions enable row level security;

-- security definer helpers
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.has_permission(_user_id uuid, _permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role = ur.role
    where ur.user_id = _user_id and rp.permission_key = _permission
  );
$$;

create or replace function public.my_department()
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(
    (select department_id from public.user_roles where user_id = auth.uid() and department_id is not null limit 1),
    (select department_id from public.profiles where user_id = auth.uid() limit 1)
  );
$$;

create or replace function public.my_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where user_id = auth.uid() limit 1;
$$;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.has_permission(uuid, text) to authenticated;
grant execute on function public.my_department() to authenticated;
grant execute on function public.my_profile_id() to authenticated;

-- profile policies (need helpers first)
create policy "profiles readable by campus" on public.profiles for select to authenticated
  using (privacy <> 'private' or user_id = auth.uid() or public.has_permission(auth.uid(),'users.view'));
create policy "profiles public read" on public.profiles for select to anon using (privacy = 'public');
create policy "insert own profile" on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated
  using (user_id = auth.uid() or public.has_permission(auth.uid(),'users.update'))
  with check (user_id = auth.uid() or public.has_permission(auth.uid(),'users.update'));

create policy "read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_permission(auth.uid(),'users.view'));
create policy "permissions readable" on public.permissions for select to authenticated using (true);
create policy "role permissions readable" on public.role_permissions for select to authenticated using (true);

create policy "departments readable" on public.departments for select to authenticated using (true);
create policy "departments public" on public.departments for select to anon using (true);
create policy "departments manage" on public.departments for all to authenticated
  using (public.has_permission(auth.uid(),'departments.manage'))
  with check (public.has_permission(auth.uid(),'departments.manage'));
create policy "programs readable" on public.programs for select to authenticated using (true);
create policy "programs public" on public.programs for select to anon using (true);
create policy "sections readable" on public.sections for select to authenticated using (true);
create policy "sections public" on public.sections for select to anon using (true);

-- =========================================================
-- 4. Academics
-- =========================================================
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  code text not null unique,
  title text not null,
  credits int not null default 3,
  semester int not null default 1,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.subjects to authenticated;
grant all on public.subjects to service_role;
alter table public.subjects enable row level security;
create policy "subjects readable" on public.subjects for select to authenticated using (true);
create policy "subjects manage by dept" on public.subjects for all to authenticated
  using (public.has_permission(auth.uid(),'subjects.manage') and (department_id = public.my_department() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'super_admin')))
  with check (public.has_permission(auth.uid(),'subjects.manage') and (department_id = public.my_department() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'super_admin')));

create table public.faculty_assignments (
  id uuid primary key default gen_random_uuid(),
  faculty_profile_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  section_id uuid references public.sections(id) on delete set null,
  academic_term text not null default '2026-ODD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (faculty_profile_id, subject_id, section_id, academic_term)
);
grant select, insert, update, delete on public.faculty_assignments to authenticated;
grant all on public.faculty_assignments to service_role;
alter table public.faculty_assignments enable row level security;
create policy "assignments readable" on public.faculty_assignments for select to authenticated using (true);
create policy "assignments manage" on public.faculty_assignments for all to authenticated
  using (public.has_permission(auth.uid(),'faculty.assign'))
  with check (public.has_permission(auth.uid(),'faculty.assign'));

create or replace function public.teaches_subject(_user_id uuid, _subject_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.faculty_assignments fa
    join public.profiles p on p.id = fa.faculty_profile_id
    where p.user_id = _user_id and fa.subject_id = _subject_id
  );
$$;
grant execute on function public.teaches_subject(uuid, uuid) to authenticated;

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  section_id uuid references public.sections(id) on delete set null,
  academic_term text not null default '2026-ODD',
  created_at timestamptz not null default now(),
  unique (student_profile_id, subject_id, academic_term)
);
grant select, insert, delete on public.enrollments to authenticated;
grant all on public.enrollments to service_role;
alter table public.enrollments enable row level security;
create policy "enrollments own or staff" on public.enrollments for select to authenticated
  using (student_profile_id = public.my_profile_id()
    or public.teaches_subject(auth.uid(), subject_id)
    or public.has_permission(auth.uid(),'students.view'));
create policy "enrollments manage" on public.enrollments for all to authenticated
  using (public.has_permission(auth.uid(),'subjects.manage'))
  with check (public.has_permission(auth.uid(),'subjects.manage'));

create table public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  section_id uuid references public.sections(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  faculty_profile_id uuid references public.profiles(id) on delete set null,
  weekday int not null check (weekday between 1 and 6),
  start_min int not null,
  end_min int not null,
  room text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.timetable_slots to authenticated;
grant all on public.timetable_slots to service_role;
alter table public.timetable_slots enable row level security;
create policy "timetable readable" on public.timetable_slots for select to authenticated using (true);
create policy "timetable manage" on public.timetable_slots for all to authenticated
  using (public.has_permission(auth.uid(),'timetable.manage') and (department_id = public.my_department() or public.has_role(auth.uid(),'super_admin')))
  with check (public.has_permission(auth.uid(),'timetable.manage') and (department_id = public.my_department() or public.has_role(auth.uid(),'super_admin')));

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  session_date date not null,
  status public.attendance_status not null default 'present',
  marked_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_profile_id, subject_id, session_date)
);
grant select, insert, update on public.attendance_records to authenticated;
grant all on public.attendance_records to service_role;
alter table public.attendance_records enable row level security;
create policy "attendance own or teacher or dept" on public.attendance_records for select to authenticated
  using (student_profile_id = public.my_profile_id()
    or public.teaches_subject(auth.uid(), subject_id)
    or public.has_permission(auth.uid(),'attendance.view_all'));
create policy "attendance mark by teacher" on public.attendance_records for insert to authenticated
  with check (public.teaches_subject(auth.uid(), subject_id) and public.has_permission(auth.uid(),'attendance.mark'));
create policy "attendance edit by teacher" on public.attendance_records for update to authenticated
  using (public.teaches_subject(auth.uid(), subject_id) and public.has_permission(auth.uid(),'attendance.mark'))
  with check (public.teaches_subject(auth.uid(), subject_id) and public.has_permission(auth.uid(),'attendance.mark'));

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  section_id uuid references public.sections(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  attachment_url text,
  max_points int not null default 100,
  due_at timestamptz not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.assignments to authenticated;
grant all on public.assignments to service_role;
alter table public.assignments enable row level security;
create policy "assignments visible" on public.assignments for select to authenticated
  using (published or public.teaches_subject(auth.uid(), subject_id) or public.has_permission(auth.uid(),'academics.view_dept'));
create policy "assignments manage by teacher" on public.assignments for all to authenticated
  using (public.teaches_subject(auth.uid(), subject_id) and public.has_permission(auth.uid(),'assignments.manage'))
  with check (public.teaches_subject(auth.uid(), subject_id) and public.has_permission(auth.uid(),'assignments.manage'));

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_profile_id uuid not null references public.profiles(id) on delete cascade,
  file_name text,
  file_url text,
  body text,
  submitted_at timestamptz not null default now(),
  marks numeric,
  feedback text,
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_profile_id)
);
grant select, insert, update on public.submissions to authenticated;
grant all on public.submissions to service_role;
alter table public.submissions enable row level security;
create policy "submissions own or teacher" on public.submissions for select to authenticated
  using (student_profile_id = public.my_profile_id()
    or exists (select 1 from public.assignments a where a.id = assignment_id and public.teaches_subject(auth.uid(), a.subject_id))
    or public.has_permission(auth.uid(),'academics.view_dept'));
create policy "submissions insert own" on public.submissions for insert to authenticated
  with check (student_profile_id = public.my_profile_id());
create policy "submissions update own or grade" on public.submissions for update to authenticated
  using (student_profile_id = public.my_profile_id()
    or exists (select 1 from public.assignments a where a.id = assignment_id and public.teaches_subject(auth.uid(), a.subject_id)))
  with check (student_profile_id = public.my_profile_id()
    or exists (select 1 from public.assignments a where a.id = assignment_id and public.teaches_subject(auth.uid(), a.subject_id)));

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  section_id uuid references public.sections(id) on delete set null,
  title text not null,
  exam_date date not null,
  start_min int not null default 540,
  duration_min int not null default 120,
  room text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.exams to authenticated;
grant all on public.exams to service_role;
alter table public.exams enable row level security;
create policy "exams readable" on public.exams for select to authenticated using (true);
create policy "exams manage" on public.exams for all to authenticated
  using (public.has_permission(auth.uid(),'exams.manage'))
  with check (public.has_permission(auth.uid(),'exams.manage'));

create table public.course_materials (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  url text,
  kind text not null default 'link',
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.course_materials to authenticated;
grant all on public.course_materials to service_role;
alter table public.course_materials enable row level security;
create policy "materials readable" on public.course_materials for select to authenticated using (true);
create policy "materials manage by teacher" on public.course_materials for all to authenticated
  using (public.teaches_subject(auth.uid(), subject_id) and public.has_permission(auth.uid(),'materials.manage'))
  with check (public.teaches_subject(auth.uid(), subject_id) and public.has_permission(auth.uid(),'materials.manage'));

-- =========================================================
-- 5. Social layer
-- =========================================================
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  cover_url text,
  department_id uuid references public.departments(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  approved boolean not null default true,
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.communities to authenticated;
grant select on public.communities to anon;
grant all on public.communities to service_role;
alter table public.communities enable row level security;
create policy "communities readable" on public.communities for select to authenticated using (not suspended or public.has_permission(auth.uid(),'communities.manage'));
create policy "communities public read" on public.communities for select to anon using (approved and not suspended);
create policy "communities create" on public.communities for insert to authenticated with check (public.has_permission(auth.uid(),'communities.create'));
create policy "communities update" on public.communities for update to authenticated
  using (created_by = public.my_profile_id() or public.has_permission(auth.uid(),'communities.manage'))
  with check (created_by = public.my_profile_id() or public.has_permission(auth.uid(),'communities.manage'));

create table public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (community_id, profile_id)
);
grant select, insert, delete on public.community_members to authenticated;
grant all on public.community_members to service_role;
alter table public.community_members enable row level security;
create policy "members readable" on public.community_members for select to authenticated using (true);
create policy "join community" on public.community_members for insert to authenticated with check (profile_id = public.my_profile_id());
create policy "leave community" on public.community_members for delete to authenticated
  using (profile_id = public.my_profile_id() or public.has_permission(auth.uid(),'communities.manage'));

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  kind public.post_kind not null default 'text',
  scope public.post_scope not null default 'campus',
  department_id uuid references public.departments(id) on delete set null,
  community_id uuid references public.communities(id) on delete cascade,
  image_url text,
  poll jsonb,
  event_meta jsonb,
  like_count int not null default 0,
  comment_count int not null default 0,
  share_count int not null default 0,
  removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "posts readable" on public.posts for select to authenticated
  using (not removed or author_profile_id = public.my_profile_id() or public.has_permission(auth.uid(),'posts.moderate'));
create policy "posts create own" on public.posts for insert to authenticated
  with check (author_profile_id = public.my_profile_id() and public.has_permission(auth.uid(),'posts.create'));
create policy "posts update own or moderate" on public.posts for update to authenticated
  using (author_profile_id = public.my_profile_id() or public.has_permission(auth.uid(),'posts.moderate'))
  with check (author_profile_id = public.my_profile_id() or public.has_permission(auth.uid(),'posts.moderate'));
create policy "posts delete own or moderate" on public.posts for delete to authenticated
  using (author_profile_id = public.my_profile_id() or public.has_permission(auth.uid(),'posts.moderate'));

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.comments to authenticated;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "comments readable" on public.comments for select to authenticated
  using (not removed or author_profile_id = public.my_profile_id() or public.has_permission(auth.uid(),'posts.moderate'));
create policy "comments create own" on public.comments for insert to authenticated with check (author_profile_id = public.my_profile_id());
create policy "comments update own or moderate" on public.comments for update to authenticated
  using (author_profile_id = public.my_profile_id() or public.has_permission(auth.uid(),'posts.moderate'))
  with check (author_profile_id = public.my_profile_id() or public.has_permission(auth.uid(),'posts.moderate'));
create policy "comments delete own or moderate" on public.comments for delete to authenticated
  using (author_profile_id = public.my_profile_id() or public.has_permission(auth.uid(),'posts.moderate'));

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
grant select, insert, delete on public.post_likes to authenticated;
grant all on public.post_likes to service_role;
alter table public.post_likes enable row level security;
create policy "likes readable" on public.post_likes for select to authenticated using (true);
create policy "like own" on public.post_likes for insert to authenticated with check (profile_id = public.my_profile_id());
create policy "unlike own" on public.post_likes for delete to authenticated using (profile_id = public.my_profile_id());

create table public.bookmarks (
  post_id uuid not null references public.posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
grant select, insert, delete on public.bookmarks to authenticated;
grant all on public.bookmarks to service_role;
alter table public.bookmarks enable row level security;
create policy "bookmarks own" on public.bookmarks for select to authenticated using (profile_id = public.my_profile_id());
create policy "bookmark add" on public.bookmarks for insert to authenticated with check (profile_id = public.my_profile_id());
create policy "bookmark remove" on public.bookmarks for delete to authenticated using (profile_id = public.my_profile_id());

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
grant select, insert, delete on public.follows to authenticated;
grant all on public.follows to service_role;
alter table public.follows enable row level security;
create policy "follows readable" on public.follows for select to authenticated using (true);
create policy "follow own" on public.follows for insert to authenticated with check (follower_id = public.my_profile_id());
create policy "unfollow own" on public.follows for delete to authenticated using (follower_id = public.my_profile_id());

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  venue text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  department_id uuid references public.departments(id) on delete set null,
  community_id uuid references public.communities(id) on delete set null,
  cover_url text,
  capacity int,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.events to authenticated;
grant select on public.events to anon;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "events readable" on public.events for select to authenticated using (true);
create policy "events public" on public.events for select to anon using (true);
create policy "events manage" on public.events for all to authenticated
  using (created_by = public.my_profile_id() or public.has_permission(auth.uid(),'events.manage'))
  with check (created_by = public.my_profile_id() or public.has_permission(auth.uid(),'events.manage'));

create table public.event_registrations (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);
grant select, insert, delete on public.event_registrations to authenticated;
grant all on public.event_registrations to service_role;
alter table public.event_registrations enable row level security;
create policy "registrations readable" on public.event_registrations for select to authenticated
  using (profile_id = public.my_profile_id() or public.has_permission(auth.uid(),'events.manage'));
create policy "register self" on public.event_registrations for insert to authenticated with check (profile_id = public.my_profile_id());
create policy "unregister self" on public.event_registrations for delete to authenticated using (profile_id = public.my_profile_id());

-- =========================================================
-- 6. Messaging & notifications
-- =========================================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  is_group boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.conversations to authenticated;
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  primary key (conversation_id, profile_id)
);
grant select, insert, update, delete on public.conversation_members to authenticated;
grant all on public.conversation_members to service_role;
alter table public.conversation_members enable row level security;

create or replace function public.in_conversation(_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members cm
    join public.profiles p on p.id = cm.profile_id
    where cm.conversation_id = _conversation_id and p.user_id = auth.uid()
  );
$$;
grant execute on function public.in_conversation(uuid) to authenticated;

create policy "conversations own" on public.conversations for select to authenticated using (public.in_conversation(id));
create policy "conversations create" on public.conversations for insert to authenticated with check (created_by = public.my_profile_id());
create policy "conversations update" on public.conversations for update to authenticated
  using (public.in_conversation(id)) with check (public.in_conversation(id));
create policy "conv members visible" on public.conversation_members for select to authenticated using (public.in_conversation(conversation_id));
create policy "conv members add" on public.conversation_members for insert to authenticated
  with check (profile_id = public.my_profile_id() or public.in_conversation(conversation_id));
create policy "conv members update self" on public.conversation_members for update to authenticated
  using (profile_id = public.my_profile_id()) with check (profile_id = public.my_profile_id());
create policy "conv members leave" on public.conversation_members for delete to authenticated using (profile_id = public.my_profile_id());

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  attachment_url text,
  attachment_name text,
  created_at timestamptz not null default now()
);
grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "messages in own conversations" on public.messages for select to authenticated using (public.in_conversation(conversation_id));
create policy "messages send" on public.messages for insert to authenticated
  with check (public.in_conversation(conversation_id) and sender_profile_id = public.my_profile_id());

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  kind text not null default 'system',
  link text,
  audience_role public.app_role,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notifications own" on public.notifications for select to authenticated using (profile_id = public.my_profile_id());
create policy "notifications insert" on public.notifications for insert to authenticated with check (true);
create policy "notifications update own" on public.notifications for update to authenticated
  using (profile_id = public.my_profile_id()) with check (profile_id = public.my_profile_id());
create policy "notifications delete own" on public.notifications for delete to authenticated using (profile_id = public.my_profile_id());

-- =========================================================
-- 7. Moderation, approvals, audit
-- =========================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  target public.report_target not null,
  target_id uuid not null,
  reporter_profile_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reports own or moderator" on public.reports for select to authenticated
  using (reporter_profile_id = public.my_profile_id() or public.has_permission(auth.uid(),'reports.view'));
create policy "reports create" on public.reports for insert to authenticated with check (reporter_profile_id = public.my_profile_id());
create policy "reports resolve" on public.reports for update to authenticated
  using (public.has_permission(auth.uid(),'posts.moderate')) with check (public.has_permission(auth.uid(),'posts.moderate'));

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target public.report_target not null,
  target_id uuid not null,
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert on public.moderation_actions to authenticated;
grant all on public.moderation_actions to service_role;
alter table public.moderation_actions enable row level security;
create policy "moderation visible" on public.moderation_actions for select to authenticated using (public.has_permission(auth.uid(),'reports.view'));
create policy "moderation create" on public.moderation_actions for insert to authenticated with check (public.has_permission(auth.uid(),'posts.moderate'));

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  department_id uuid references public.departments(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  subject_line text not null,
  details text,
  status text not null default 'pending',
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.approvals to authenticated;
grant all on public.approvals to service_role;
alter table public.approvals enable row level security;
create policy "approvals visible" on public.approvals for select to authenticated
  using (requested_by = public.my_profile_id()
    or (public.has_permission(auth.uid(),'approvals.decide') and (department_id is null or department_id = public.my_department() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'super_admin'))));
create policy "approvals request" on public.approvals for insert to authenticated with check (requested_by = public.my_profile_id());
create policy "approvals decide" on public.approvals for update to authenticated
  using (public.has_permission(auth.uid(),'approvals.decide')) with check (public.has_permission(auth.uid(),'approvals.decide'));

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_name text,
  action text not null,
  entity text not null,
  entity_id text,
  department_id uuid references public.departments(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "audit visible" on public.audit_logs for select to authenticated
  using (public.has_permission(auth.uid(),'audit.view_all')
    or (public.has_permission(auth.uid(),'audit.view_dept') and department_id = public.my_department()));

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role public.app_role not null,
  department_id uuid references public.departments(id) on delete set null,
  invited_by uuid references public.profiles(id) on delete set null,
  token text not null unique default encode(gen_random_bytes(16),'hex'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.invitations to authenticated;
grant all on public.invitations to service_role;
alter table public.invitations enable row level security;
create policy "invitations visible" on public.invitations for select to authenticated using (public.has_permission(auth.uid(),'users.invite'));
create policy "invitations create" on public.invitations for insert to authenticated with check (public.has_permission(auth.uid(),'users.invite'));
create policy "invitations update" on public.invitations for update to authenticated
  using (public.has_permission(auth.uid(),'users.invite')) with check (public.has_permission(auth.uid(),'users.invite'));

-- updated_at triggers
create trigger t_dep_u before update on public.departments for each row execute function public.touch_updated_at();
create trigger t_prog_u before update on public.programs for each row execute function public.touch_updated_at();
create trigger t_sec_u before update on public.sections for each row execute function public.touch_updated_at();
create trigger t_sub_u before update on public.subjects for each row execute function public.touch_updated_at();
create trigger t_fa_u before update on public.faculty_assignments for each row execute function public.touch_updated_at();
create trigger t_tt_u before update on public.timetable_slots for each row execute function public.touch_updated_at();
create trigger t_att_u before update on public.attendance_records for each row execute function public.touch_updated_at();
create trigger t_asg_u before update on public.assignments for each row execute function public.touch_updated_at();
create trigger t_sbm_u before update on public.submissions for each row execute function public.touch_updated_at();
create trigger t_exm_u before update on public.exams for each row execute function public.touch_updated_at();
create trigger t_mat_u before update on public.course_materials for each row execute function public.touch_updated_at();
create trigger t_com_u before update on public.communities for each row execute function public.touch_updated_at();
create trigger t_pst_u before update on public.posts for each row execute function public.touch_updated_at();
create trigger t_cmt_u before update on public.comments for each row execute function public.touch_updated_at();
create trigger t_evt_u before update on public.events for each row execute function public.touch_updated_at();
create trigger t_cnv_u before update on public.conversations for each row execute function public.touch_updated_at();
create trigger t_rep_u before update on public.reports for each row execute function public.touch_updated_at();
create trigger t_apr_u before update on public.approvals for each row execute function public.touch_updated_at();

-- like/comment counters
create or replace function public.sync_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update public.posts set like_count = like_count + 1 where id = new.post_id;
  else update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id; end if;
  return null;
end; $$;
create trigger t_like_count after insert or delete on public.post_likes for each row execute function public.sync_like_count();

create or replace function public.sync_comment_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  else update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id; end if;
  return null;
end; $$;
create trigger t_comment_count after insert or delete on public.comments for each row execute function public.sync_comment_count();

-- =========================================================
-- 8. Permission catalogue + role mapping
-- =========================================================
insert into public.permissions (key, description, category) values
 ('feed.view','View the campus feed','social'),
 ('posts.create','Create posts','social'),
 ('posts.moderate','Remove posts and comments','moderation'),
 ('communities.create','Create communities','social'),
 ('communities.manage','Approve or suspend communities','moderation'),
 ('events.manage','Create and manage events','social'),
 ('messages.send','Send direct messages','social'),
 ('attendance.view_own','View own attendance','academics'),
 ('attendance.view_all','View attendance of others','academics'),
 ('attendance.mark','Mark and edit attendance','academics'),
 ('assignments.manage','Create and grade assignments','academics'),
 ('assignments.submit','Submit assignments','academics'),
 ('materials.manage','Publish course materials','academics'),
 ('exams.manage','Schedule exams','academics'),
 ('subjects.manage','Manage subjects and enrolments','academics'),
 ('faculty.assign','Assign faculty to subjects','academics'),
 ('timetable.manage','Build and publish timetables','academics'),
 ('academics.view_dept','View department academic data','academics'),
 ('students.view','View student records','directory'),
 ('faculty.view','View faculty records','directory'),
 ('users.view','View platform users','administration'),
 ('users.create','Create users','administration'),
 ('users.invite','Invite users','administration'),
 ('users.update','Update user accounts','administration'),
 ('users.suspend','Suspend or deactivate users','administration'),
 ('departments.view','View departments','administration'),
 ('departments.manage','Manage departments','administration'),
 ('roles.manage','Manage roles and permissions','security'),
 ('reports.view','View reports and analytics','administration'),
 ('approvals.decide','Approve or reject requests','administration'),
 ('audit.view_dept','View department audit trail','security'),
 ('audit.view_all','View platform audit logs','security'),
 ('system.settings','Change system settings','security'),
 ('security.manage','Manage security configuration','security'),
 ('admins.manage','Manage admin accounts','security');

insert into public.role_permissions (role, permission_key)
select 'student', k from (values ('feed.view'),('posts.create'),('communities.create'),('messages.send'),('attendance.view_own'),('assignments.submit')) v(k);

insert into public.role_permissions (role, permission_key)
select 'faculty', k from (values ('feed.view'),('posts.create'),('messages.send'),('events.manage'),
 ('attendance.view_all'),('attendance.mark'),('assignments.manage'),('materials.manage'),('exams.manage'),
 ('students.view'),('academics.view_dept')) v(k);

insert into public.role_permissions (role, permission_key)
select 'hod', k from (values ('feed.view'),('posts.create'),('messages.send'),('events.manage'),
 ('attendance.view_all'),('academics.view_dept'),('subjects.manage'),('faculty.assign'),('timetable.manage'),
 ('students.view'),('faculty.view'),('departments.view'),('reports.view'),('approvals.decide'),('audit.view_dept'),('exams.manage')) v(k);

insert into public.role_permissions (role, permission_key)
select 'admin', k from (values ('feed.view'),('messages.send'),('posts.moderate'),('communities.manage'),('events.manage'),
 ('users.view'),('users.create'),('users.invite'),('users.update'),('users.suspend'),
 ('departments.view'),('departments.manage'),('students.view'),('faculty.view'),
 ('reports.view'),('approvals.decide'),('audit.view_all')) v(k);

insert into public.role_permissions (role, permission_key) select 'super_admin', key from public.permissions;

-- =========================================================
-- 9. Demo campus seed
-- =========================================================
insert into public.departments (id, name, code, description) values
 ('11111111-1111-1111-1111-111111111101','Computer Science & Engineering','CSE','Systems, AI and software engineering'),
 ('11111111-1111-1111-1111-111111111102','Electronics & Communication','ECE','Signals, embedded systems and comms'),
 ('11111111-1111-1111-1111-111111111103','Mechanical Engineering','MECH','Design, thermal and manufacturing'),
 ('11111111-1111-1111-1111-111111111104','Business & Management','MGMT','Analytics, strategy and operations');

insert into public.programs (id, department_id, name, code) values
 ('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','B.Tech Computer Science','BTCSE'),
 ('22222222-2222-2222-2222-222222222202','11111111-1111-1111-1111-111111111102','B.Tech Electronics','BTECE'),
 ('22222222-2222-2222-2222-222222222203','11111111-1111-1111-1111-111111111103','B.Tech Mechanical','BTMECH'),
 ('22222222-2222-2222-2222-222222222204','11111111-1111-1111-1111-111111111104','BBA Analytics','BBAAN');

insert into public.sections (id, program_id, name, year, semester) values
 ('33333333-3333-3333-3333-333333333301','22222222-2222-2222-2222-222222222201','CSE-3A',3,5),
 ('33333333-3333-3333-3333-333333333302','22222222-2222-2222-2222-222222222201','CSE-3B',3,5),
 ('33333333-3333-3333-3333-333333333303','22222222-2222-2222-2222-222222222202','ECE-2A',2,3),
 ('33333333-3333-3333-3333-333333333304','22222222-2222-2222-2222-222222222204','BBA-1A',1,1);

insert into public.subjects (id, department_id, code, title, credits, semester, description) values
 ('44444444-4444-4444-4444-444444444401','11111111-1111-1111-1111-111111111101','CSE501','Machine Learning',4,5,'Supervised, unsupervised and applied ML'),
 ('44444444-4444-4444-4444-444444444402','11111111-1111-1111-1111-111111111101','CSE502','Database Systems',4,5,'Relational modelling, indexing, query optimisation'),
 ('44444444-4444-4444-4444-444444444403','11111111-1111-1111-1111-111111111101','CSE503','Software Engineering',3,5,'Process, architecture and quality'),
 ('44444444-4444-4444-4444-444444444404','11111111-1111-1111-1111-111111111101','CSE504','Computer Networks',3,5,'Layered networking and protocols'),
 ('44444444-4444-4444-4444-444444444405','11111111-1111-1111-1111-111111111102','ECE301','Signals & Systems',4,3,'Transforms and LTI systems'),
 ('44444444-4444-4444-4444-444444444406','11111111-1111-1111-1111-111111111104','MGT101','Business Analytics',3,1,'Descriptive and predictive analytics');

-- demo people (no login accounts; roster + feed authors)
insert into public.profiles (id, full_name, email, photo_url, bio, department_id, program_id, section_id, year, roll_no, designation, skills, interests, privacy, is_demo) values
 ('55555555-5555-5555-5555-555555555501','Dr. Meera Raghavan','meera.raghavan@athena.edu',null,'Head of Department, CSE. Distributed systems researcher.','11111111-1111-1111-1111-111111111101',null,null,null,null,'Head of Department','{Distributed Systems,Databases}','{Research Mentoring}','campus',true),
 ('55555555-5555-5555-5555-555555555502','Prof. Arjun Nair','arjun.nair@athena.edu',null,'Assistant Professor — Machine Learning and Data Systems.','11111111-1111-1111-1111-111111111101',null,null,null,null,'Assistant Professor','{Python,PyTorch}','{Applied ML}','campus',true),
 ('55555555-5555-5555-5555-555555555503','Prof. Kavya Iyer','kavya.iyer@athena.edu',null,'Associate Professor — Databases and Software Engineering.','11111111-1111-1111-1111-111111111101',null,null,null,null,'Associate Professor','{SQL,Architecture}','{Teaching}','campus',true),
 ('55555555-5555-5555-5555-555555555504','Rhea Kapoor','rhea.kapoor@athena.edu',null,'Third-year CSE student. Robotics Club core.','11111111-1111-1111-1111-111111111101','22222222-2222-2222-2222-222222222201','33333333-3333-3333-3333-333333333301',3,'CSE23B101',null,'{TypeScript,ROS}','{Robotics}','campus',true),
 ('55555555-5555-5555-5555-555555555505','Dev Sharma','dev.sharma@athena.edu',null,'CSE 3A. Competitive programmer.','11111111-1111-1111-1111-111111111101','22222222-2222-2222-2222-222222222201','33333333-3333-3333-3333-333333333301',3,'CSE23B102',null,'{C++,Algorithms}','{ICPC}','campus',true),
 ('55555555-5555-5555-5555-555555555506','Aisha Khan','aisha.khan@athena.edu',null,'CSE 3B. Interested in HCI and design systems.','11111111-1111-1111-1111-111111111101','22222222-2222-2222-2222-222222222201','33333333-3333-3333-3333-333333333302',3,'CSE23B180',null,'{Figma,React}','{Design}','campus',true),
 ('55555555-5555-5555-5555-555555555507','Nikhil Verma','nikhil.verma@athena.edu',null,'ECE 2A. Embedded systems tinkerer.','11111111-1111-1111-1111-111111111102','22222222-2222-2222-2222-222222222202','33333333-3333-3333-3333-333333333303',2,'ECE24B044',null,'{C,STM32}','{Embedded}','campus',true),
 ('55555555-5555-5555-5555-555555555508','Ananya Bose','ananya.bose@athena.edu',null,'Campus Administrator — platform operations.',null,null,null,null,null,'Platform Administrator','{Operations}','{Community}','campus',true);

update public.departments set description = description where true;

insert into public.faculty_assignments (faculty_profile_id, subject_id, section_id) values
 ('55555555-5555-5555-5555-555555555502','44444444-4444-4444-4444-444444444401','33333333-3333-3333-3333-333333333301'),
 ('55555555-5555-5555-5555-555555555503','44444444-4444-4444-4444-444444444402','33333333-3333-3333-3333-333333333301'),
 ('55555555-5555-5555-5555-555555555503','44444444-4444-4444-4444-444444444403','33333333-3333-3333-3333-333333333302'),
 ('55555555-5555-5555-5555-555555555501','44444444-4444-4444-4444-444444444404','33333333-3333-3333-3333-333333333301');

insert into public.enrollments (student_profile_id, subject_id, section_id) values
 ('55555555-5555-5555-5555-555555555504','44444444-4444-4444-4444-444444444401','33333333-3333-3333-3333-333333333301'),
 ('55555555-5555-5555-5555-555555555504','44444444-4444-4444-4444-444444444402','33333333-3333-3333-3333-333333333301'),
 ('55555555-5555-5555-5555-555555555505','44444444-4444-4444-4444-444444444401','33333333-3333-3333-3333-333333333301'),
 ('55555555-5555-5555-5555-555555555506','44444444-4444-4444-4444-444444444403','33333333-3333-3333-3333-333333333302');

insert into public.timetable_slots (department_id, section_id, subject_id, faculty_profile_id, weekday, start_min, end_min, room, published) values
 ('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','44444444-4444-4444-4444-444444444401','55555555-5555-5555-5555-555555555502',1,540,600,'Hall B',true),
 ('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','44444444-4444-4444-4444-444444444402','55555555-5555-5555-5555-555555555503',1,660,720,'Lab 3',true),
 ('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333301','44444444-4444-4444-4444-444444444404','55555555-5555-5555-5555-555555555501',2,600,660,'Hall A',true),
 ('11111111-1111-1111-1111-111111111101','33333333-3333-3333-3333-333333333302','44444444-4444-4444-4444-444444444403','55555555-5555-5555-5555-555555555503',3,540,600,'Hall C',true);

insert into public.assignments (id, subject_id, section_id, created_by, title, description, max_points, due_at) values
 ('66666666-6666-6666-6666-666666666601','44444444-4444-4444-4444-444444444402','33333333-3333-3333-3333-333333333301','55555555-5555-5555-5555-555555555503','Query Optimisation Report','Analyse and optimise three slow queries; submit an explain-plan write-up.',40,now() + interval '2 days'),
 ('66666666-6666-6666-6666-666666666602','44444444-4444-4444-4444-444444444401','33333333-3333-3333-3333-333333333301','55555555-5555-5555-5555-555555555502','ML Model Card','Train a classifier and document it as a model card.',60,now() + interval '6 days'),
 ('66666666-6666-6666-6666-666666666603','44444444-4444-4444-4444-444444444403','33333333-3333-3333-3333-333333333302','55555555-5555-5555-5555-555555555503','Architecture Review','Review a provided architecture and list risks.',30,now() + interval '9 days');

insert into public.exams (subject_id, section_id, title, exam_date, start_min, duration_min, room, created_by) values
 ('44444444-4444-4444-4444-444444444401','33333333-3333-3333-3333-333333333301','Mid-Semester — Machine Learning', current_date + 4, 540, 120, 'Hall B','55555555-5555-5555-5555-555555555502'),
 ('44444444-4444-4444-4444-444444444402','33333333-3333-3333-3333-333333333301','Mid-Semester — Database Systems', current_date + 7, 540, 120, 'Hall A','55555555-5555-5555-5555-555555555503');

insert into public.attendance_records (student_profile_id, subject_id, session_date, status, marked_by)
select p.id, s.sub, d::date,
  case when (extract(day from d)::int + position(p.id::text in p.id::text)) % 7 = 0 then 'absent'::public.attendance_status else 'present'::public.attendance_status end,
  '55555555-5555-5555-5555-555555555502'
from (values ('55555555-5555-5555-5555-555555555504'::uuid),('55555555-5555-5555-5555-555555555505'::uuid)) p(id)
cross join (values ('44444444-4444-4444-4444-444444444401'::uuid),('44444444-4444-4444-4444-444444444402'::uuid)) s(sub)
cross join generate_series(current_date - 20, current_date - 1, interval '3 days') d;

insert into public.communities (id, name, slug, description, department_id, created_by) values
 ('77777777-7777-7777-7777-777777777701','Robotics Club','robotics','Build, break and rebuild autonomous machines.','11111111-1111-1111-1111-111111111101','55555555-5555-5555-5555-555555555504'),
 ('77777777-7777-7777-7777-777777777702','AI Society','ai-society','Paper reading, agent hacking and applied ML talks.','11111111-1111-1111-1111-111111111101','55555555-5555-5555-5555-555555555502'),
 ('77777777-7777-7777-7777-777777777703','Design Guild','design-guild','Interface craft, typography and product design critiques.',null,'55555555-5555-5555-5555-555555555506'),
 ('77777777-7777-7777-7777-777777777704','Placement Prep','placement-prep','DSA drills, mock interviews and referrals.',null,'55555555-5555-5555-5555-555555555505');

insert into public.community_members (community_id, profile_id, role) values
 ('77777777-7777-7777-7777-777777777701','55555555-5555-5555-5555-555555555504','lead'),
 ('77777777-7777-7777-7777-777777777701','55555555-5555-5555-5555-555555555505','member'),
 ('77777777-7777-7777-7777-777777777702','55555555-5555-5555-5555-555555555502','lead'),
 ('77777777-7777-7777-7777-777777777703','55555555-5555-5555-5555-555555555506','lead');

insert into public.events (id, title, description, venue, starts_at, department_id, community_id, capacity, created_by) values
 ('88888888-8888-8888-8888-888888888801','RoboSprint 4.0','24-hour autonomous robotics sprint with live scoring.','Innovation Lab', now() + interval '4 days','11111111-1111-1111-1111-111111111101','77777777-7777-7777-7777-777777777701',120,'55555555-5555-5555-5555-555555555504'),
 ('88888888-8888-8888-8888-888888888802','Agentic AI Workshop','Hands-on session building tool-using agents.','Seminar Hall 2','2026-09-05 10:00+05:30'::timestamptz,'11111111-1111-1111-1111-111111111101','77777777-7777-7777-7777-777777777702',60,'55555555-5555-5555-5555-555555555502'),
 ('88888888-8888-8888-8888-888888888803','Design Critique Night','Bring your interfaces for an open critique.','Studio 1', now() + interval '9 days',null,'77777777-7777-7777-7777-777777777703',40,'55555555-5555-5555-5555-555555555506');

insert into public.posts (author_profile_id, body, kind, scope, department_id, community_id, like_count, comment_count) values
 ('55555555-5555-5555-5555-555555555501','Mid-semester timetable for CSE is published. Check your section schedule and report clashes to the department office by Friday.','announcement','department','11111111-1111-1111-1111-111111111101',null,42,6),
 ('55555555-5555-5555-5555-555555555502','Reminder: ML model cards are due next week. Focus on evaluation honesty over accuracy theatre.','academic','department','11111111-1111-1111-1111-111111111101',null,18,3),
 ('55555555-5555-5555-5555-555555555504','RoboSprint 4.0 registrations are open. We have two spare chassis for teams without hardware.','event','campus',null,'77777777-7777-7777-7777-777777777701',65,11),
 ('55555555-5555-5555-5555-555555555505','Anyone else finding the query optimiser assignment weirdly fun? Sharing my explain-plan notes tonight.','text','campus',null,null,23,5),
 ('55555555-5555-5555-5555-555555555506','What should the Design Guild cover next month?','poll','campus',null,'77777777-7777-7777-7777-777777777703',31,4),
 ('55555555-5555-5555-5555-555555555508','ATHENA now supports role-based dashboards. Report anything that looks off through the report button.','announcement','campus',null,null,58,9);

update public.posts set poll = '{"options":[{"id":"o1","label":"Typography systems","votes":14},{"id":"o2","label":"Motion design","votes":9},{"id":"o3","label":"Design tokens","votes":21}]}'::jsonb
where kind = 'poll';

insert into public.approvals (kind, department_id, requested_by, subject_line, details, status) values
 ('timetable','11111111-1111-1111-1111-111111111101','55555555-5555-5555-5555-555555555503','Swap CSE502 lab slot to Wednesday','Lab 3 is double-booked on Monday at 11:00.','pending'),
 ('community',null,'55555555-5555-5555-5555-555555555505','New community: Quant Club','Weekly quantitative finance problem sets.','pending');

insert into public.reports (target, target_id, reporter_profile_id, reason, details) values
 ('post', (select id from public.posts where kind='text' limit 1),'55555555-5555-5555-5555-555555555506','spam','Looks like repeated promotional posting.');
