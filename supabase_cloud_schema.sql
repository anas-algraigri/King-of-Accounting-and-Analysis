-- King of Accounting and Analysis - Supabase Cloud Database Schema
-- شغّل هذا الملف مرة واحدة داخل Supabase > SQL Editor
-- لا تستخدم service_role key داخل الموقع. استخدم anon public key فقط في supabase-config.js.

create table if not exists public.king_accounting_state (
  company_id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  updated_by text,
  client_token text,
  updated_at timestamptz not null default now()
);

create table if not exists public.king_accounting_audit_log (
  id bigserial primary key,
  company_id text not null default 'main',
  action text not null default 'save',
  username text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.king_accounting_state enable row level security;
alter table public.king_accounting_audit_log enable row level security;

-- سياسات تشغيل مبسطة للتطبيق الثابت على Vercel باستخدام anon public key.
-- هذه السياسات تجعل البيانات قابلة للقراءة والكتابة لمن لديه رابط المشروع ومفتاح anon.
-- للاستخدام المؤسسي المتقدم، فعّل Supabase Auth وسياسات مخصصة لكل مستخدم.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='king_accounting_state' and policyname='king_accounting_state_select') then
    create policy king_accounting_state_select on public.king_accounting_state for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='king_accounting_state' and policyname='king_accounting_state_insert') then
    create policy king_accounting_state_insert on public.king_accounting_state for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='king_accounting_state' and policyname='king_accounting_state_update') then
    create policy king_accounting_state_update on public.king_accounting_state for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='king_accounting_audit_log' and policyname='king_accounting_audit_select') then
    create policy king_accounting_audit_select on public.king_accounting_audit_log for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='king_accounting_audit_log' and policyname='king_accounting_audit_insert') then
    create policy king_accounting_audit_insert on public.king_accounting_audit_log for insert with check (true);
  end if;
end $$;

-- تفعيل Realtime للجدول حتى تظهر تحديثات المستخدمين مباشرة.
do $$ begin
  begin
    alter publication supabase_realtime add table public.king_accounting_state;
  exception when duplicate_object then
    null;
  end;
end $$;

insert into public.king_accounting_state (company_id, data, updated_by)
values ('main', '{}'::jsonb, 'initial')
on conflict (company_id) do nothing;
