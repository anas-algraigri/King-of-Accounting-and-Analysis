-- Cloud schema for مؤسسة عائش حميد حمود القريقري للدواجن
-- PostgreSQL / Supabase

create extension if not exists "uuid-ossp";

create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  vat_number text,
  cr_number text,
  address text,
  created_at timestamptz default now()
);

create table if not exists app_users (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  full_name text not null,
  username text not null,
  password_hash text,
  role text not null default 'accountant',
  is_active boolean default true,
  permissions jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  unique(org_id, username)
);

create table if not exists accounts (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  code text not null,
  name text not null,
  parent_code text,
  level int not null,
  type text not null,
  nature text not null,
  posting boolean default true,
  active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, code)
);

create table if not exists parties (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  type text not null check (type in ('customer','supplier')),
  name text not null,
  vat_number text,
  cr_number text,
  phone text,
  email text,
  address text,
  account_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, type, name)
);

create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  invoice_no text not null,
  invoice_type text not null check (invoice_type in ('sale','purchase')),
  doc_class text not null default 'invoice',
  party_id uuid references parties(id),
  date date not null,
  time time,
  payment_status text,
  vat_mode text,
  taxable_amount numeric(18,2) default 0,
  exempt_amount numeric(18,2) default 0,
  vat_amount numeric(18,2) default 0,
  total_amount numeric(18,2) default 0,
  entry_id uuid,
  qr_payload text,
  notes text,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, invoice_no)
);

create table if not exists invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices(id) on delete cascade,
  item_name text not null,
  unit text,
  qty numeric(18,3) default 1,
  price numeric(18,2) default 0,
  discount numeric(18,2) default 0,
  vat_rate numeric(5,2) default 15,
  vat_treatment text default 'taxable',
  line_total numeric(18,2) default 0
);

create table if not exists journal_entries (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  entry_no bigint not null,
  entry_date date not null,
  title text,
  description text,
  status text default 'active',
  source text,
  source_id uuid,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, entry_no)
);

create table if not exists journal_entry_lines (
  id uuid primary key default uuid_generate_v4(),
  entry_id uuid references journal_entries(id) on delete cascade,
  account_code text not null,
  description text,
  cost_center text,
  doc_no text,
  debit numeric(18,2) default 0,
  credit numeric(18,2) default 0
);

create table if not exists vouchers (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  voucher_no text not null,
  voucher_type text not null,
  voucher_date date not null,
  amount numeric(18,2) default 0,
  account_code text,
  cash_account_code text,
  entry_id uuid,
  description text,
  created_at timestamptz default now()
);

create table if not exists payroll_runs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  payroll_month text not null,
  employee_name text not null,
  basic numeric(18,2) default 0,
  allowances numeric(18,2) default 0,
  deductions numeric(18,2) default 0,
  net numeric(18,2) default 0,
  entry_id uuid,
  created_at timestamptz default now()
);

create table if not exists attachments (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Recommended indexes
create index if not exists idx_accounts_org_code on accounts(org_id, code);
create index if not exists idx_entries_org_date on journal_entries(org_id, entry_date);
create index if not exists idx_lines_account on journal_entry_lines(account_code);
create index if not exists idx_invoices_org_date on invoices(org_id, date);
create index if not exists idx_parties_org_type on parties(org_id, type);

-- NOTE: Enable Row Level Security and policies after creating authenticated users.
-- alter table accounts enable row level security;
-- alter table parties enable row level security;
-- alter table invoices enable row level security;
-- alter table journal_entries enable row level security;
-- alter table journal_entry_lines enable row level security;
