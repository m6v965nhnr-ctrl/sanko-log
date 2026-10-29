-- 参考書ログ: 初期スキーマ
-- profiles(role: student/teacher) / classes(学校名・参加コード) / class_members / books / book_cycles / book_page_marks

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'teacher')),
  display_name text,
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  school_name text,
  join_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  total_pages integer,
  show_to_teacher boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.book_cycles (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  cycle_number integer not null check (cycle_number >= 1),
  comprehension numeric(3, 1) check (comprehension >= 0 and comprehension <= 10),
  created_at timestamptz not null default now(),
  unique (book_id, cycle_number)
);

create table public.book_page_marks (
  book_id uuid not null references public.books(id) on delete cascade,
  cycle_number integer not null check (cycle_number >= 1),
  page_number integer not null check (page_number >= 1),
  marked_at timestamptz not null default now(),
  primary key (book_id, cycle_number, page_number)
);

-- 新規ユーザー登録時に、signUpのoptions.dataからprofilesを作る
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    new.raw_user_meta_data ->> 'display_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 参加コードでクラスに入る(先生が作ったクラスのteacher_id等は見せず、参加だけ行う)
create function public.join_class(p_code text)
returns table (class_id uuid, name text, school_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_class_id uuid;
  v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role is distinct from 'student' then
    raise exception '学生アカウントのみ、クラスに参加できます';
  end if;

  select id into v_class_id from public.classes where join_code = p_code;
  if v_class_id is null then
    raise exception '参加コードが見つかりません';
  end if;

  insert into public.class_members (class_id, student_id)
  values (v_class_id, auth.uid())
  on conflict do nothing;

  return query
    select c.id, c.name, c.school_name from public.classes c where c.id = v_class_id;
end;
$$;

revoke all on function public.join_class(text) from public;
grant execute on function public.join_class(text) to authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.books enable row level security;
alter table public.book_cycles enable row level security;
alter table public.book_page_marks enable row level security;

revoke all on public.profiles, public.classes, public.class_members, public.books, public.book_cycles, public.book_page_marks from public;

-- profiles: 本人、または自分のクラスの生徒なら、先生から見える
create policy "profiles_select" on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.class_members cm
      join public.classes c on c.id = cm.class_id
      where cm.student_id = public.profiles.id and c.teacher_id = auth.uid()
    )
  );
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
grant select, update on public.profiles to authenticated;

-- classes: 先生は自分のクラス、生徒は参加しているクラスだけ見える
create policy "classes_select" on public.classes for select to authenticated
  using (
    teacher_id = auth.uid()
    or exists (select 1 from public.class_members cm where cm.class_id = public.classes.id and cm.student_id = auth.uid())
  );
create policy "classes_insert" on public.classes for insert to authenticated
  with check (teacher_id = auth.uid());
create policy "classes_update_own" on public.classes for update to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "classes_delete_own" on public.classes for delete to authenticated
  using (teacher_id = auth.uid());
grant select, insert, update, delete on public.classes to authenticated;

-- class_members: 先生は自分のクラスの名簿、生徒は自分の参加分を見られる
create policy "class_members_select" on public.class_members for select to authenticated
  using (
    student_id = auth.uid()
    or exists (select 1 from public.classes c where c.id = public.class_members.class_id and c.teacher_id = auth.uid())
  );
create policy "class_members_delete_own" on public.class_members for delete to authenticated
  using (student_id = auth.uid());
grant select, delete on public.class_members to authenticated;
-- insertは join_class() 経由のみ(直接のinsert権限は与えない)

-- books: 本人は全部、先生は「先生に見せる」をオンにした、自分のクラスの生徒の本だけ
create policy "books_select" on public.books for select to authenticated
  using (
    user_id = auth.uid()
    or (
      show_to_teacher
      and exists (
        select 1 from public.class_members cm
        join public.classes c on c.id = cm.class_id
        where cm.student_id = public.books.user_id and c.teacher_id = auth.uid()
      )
    )
  );
create policy "books_insert" on public.books for insert to authenticated
  with check (user_id = auth.uid());
create policy "books_update_own" on public.books for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "books_delete_own" on public.books for delete to authenticated
  using (user_id = auth.uid());
grant select, insert, update, delete on public.books to authenticated;

-- book_cycles / book_page_marks: booksと同じ可視性(本の持ち主経由で判定)
create policy "book_cycles_select" on public.book_cycles for select to authenticated
  using (exists (select 1 from public.books b where b.id = public.book_cycles.book_id and (
    b.user_id = auth.uid()
    or (b.show_to_teacher and exists (
      select 1 from public.class_members cm join public.classes c on c.id = cm.class_id
      where cm.student_id = b.user_id and c.teacher_id = auth.uid()
    ))
  )));
create policy "book_cycles_write_own" on public.book_cycles for all to authenticated
  using (exists (select 1 from public.books b where b.id = public.book_cycles.book_id and b.user_id = auth.uid()))
  with check (exists (select 1 from public.books b where b.id = public.book_cycles.book_id and b.user_id = auth.uid()));
grant select, insert, update, delete on public.book_cycles to authenticated;

create policy "book_page_marks_select" on public.book_page_marks for select to authenticated
  using (exists (select 1 from public.books b where b.id = public.book_page_marks.book_id and (
    b.user_id = auth.uid()
    or (b.show_to_teacher and exists (
      select 1 from public.class_members cm join public.classes c on c.id = cm.class_id
      where cm.student_id = b.user_id and c.teacher_id = auth.uid()
    ))
  )));
create policy "book_page_marks_write_own" on public.book_page_marks for all to authenticated
  using (exists (select 1 from public.books b where b.id = public.book_page_marks.book_id and b.user_id = auth.uid()))
  with check (exists (select 1 from public.books b where b.id = public.book_page_marks.book_id and b.user_id = auth.uid()));
grant select, insert, update, delete on public.book_page_marks to authenticated;
