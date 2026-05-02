create table if not exists public.budget_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Budget Hyperfluid',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.budget_workspaces enable row level security;

drop policy if exists "Users can read their own budget workspace" on public.budget_workspaces;
create policy "Users can read their own budget workspace"
on public.budget_workspaces
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own budget workspace" on public.budget_workspaces;
create policy "Users can insert their own budget workspace"
on public.budget_workspaces
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own budget workspace" on public.budget_workspaces;
create policy "Users can update their own budget workspace"
on public.budget_workspaces
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own budget workspace" on public.budget_workspaces;
create policy "Users can delete their own budget workspace"
on public.budget_workspaces
for delete
using (auth.uid() = user_id);
