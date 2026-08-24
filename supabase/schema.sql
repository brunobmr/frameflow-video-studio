-- Frameflow initial schema. Run in a dedicated Supabase project after review.
-- New public tables may not be exposed to the Data API automatically, so grants
-- are explicit and every table has ownership-based RLS.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Novo projeto',
  template_key text not null default 'lofi-top-affirmation',
  settings jsonb not null default '{"width":1080,"height":1920,"headlineY":340,"headlineFontSize":58,"captions":true,"silenceThresholdSeconds":0.5,"preserveOriginalAudio":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  duration_seconds numeric,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  unique (user_id, storage_path)
);

create table if not exists public.creative_variants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  headline text not null check (char_length(headline) between 1 and 110),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  variant_id uuid not null references public.creative_variants(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','processing','completed','failed','cancelled')),
  progress integer not null default 0 check (progress between 0 and 100),
  output_storage_path text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists media_assets_project_id_idx on public.media_assets(project_id);
create index if not exists creative_variants_project_id_idx on public.creative_variants(project_id);
create index if not exists render_jobs_status_created_at_idx on public.render_jobs(status, created_at);

alter table public.projects enable row level security;
alter table public.media_assets enable row level security;
alter table public.creative_variants enable row level security;
alter table public.render_jobs enable row level security;

grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.media_assets to authenticated;
grant select, insert, update, delete on public.creative_variants to authenticated;
grant select, insert, update, delete on public.render_jobs to authenticated;

create policy "projects_select_own" on public.projects for select to authenticated using ((select auth.uid()) = user_id);
create policy "projects_insert_own" on public.projects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "projects_update_own" on public.projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "projects_delete_own" on public.projects for delete to authenticated using ((select auth.uid()) = user_id);

create policy "media_select_own" on public.media_assets for select to authenticated using ((select auth.uid()) = user_id);
create policy "media_insert_own" on public.media_assets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "media_update_own" on public.media_assets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "media_delete_own" on public.media_assets for delete to authenticated using ((select auth.uid()) = user_id);

create policy "variants_select_own" on public.creative_variants for select to authenticated using ((select auth.uid()) = user_id);
create policy "variants_insert_own" on public.creative_variants for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "variants_update_own" on public.creative_variants for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "variants_delete_own" on public.creative_variants for delete to authenticated using ((select auth.uid()) = user_id);

create policy "jobs_select_own" on public.render_jobs for select to authenticated using ((select auth.uid()) = user_id);
create policy "jobs_insert_own" on public.render_jobs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "jobs_update_own" on public.render_jobs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "jobs_delete_own" on public.render_jobs for delete to authenticated using ((select auth.uid()) = user_id);

-- Create a private bucket named video-assets through the Storage API/Dashboard.
-- Storage schema metadata is intentionally not modified directly.
create policy "video_assets_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'video-assets' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "video_assets_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'video-assets' and owner_id = (select auth.uid()::text));

create policy "video_assets_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'video-assets' and owner_id = (select auth.uid()::text))
  with check (bucket_id = 'video-assets' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "video_assets_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'video-assets' and owner_id = (select auth.uid()::text));
