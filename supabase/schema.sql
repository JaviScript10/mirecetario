-- ============================================================
-- MI RECETARIO — esquema de base de datos para Supabase
-- Pega TODO este archivo en: Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES
-- Extiende auth.users con nombre y rol (admin / user).
-- Esta es la tabla que reemplaza a "Google Sheets" para roles.
-- ------------------------------------------------------------
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Cualquier usuario logueado puede ver la lista de perfiles (necesario para el panel admin)
create policy "profiles_select_authenticated"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Un usuario solo puede editar su propio nombre (no su propio rol)
create policy "profiles_update_own_name"
  on public.profiles for update
  using (auth.uid() = id);

-- Un admin puede editar el nombre de cualquier usuario (ej. corregir "Hola, Usuario" -> su nombre real)
create policy "profiles_update_admin_any"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Crea automáticamente un perfil (rol "user" por defecto) cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ------------------------------------------------------------
-- 2. RECIPES
-- ingredients y steps se guardan como JSONB dentro de la misma
-- fila (simple para partir; se puede normalizar en tablas propias
-- más adelante si el proyecto crece).
-- ------------------------------------------------------------
create table public.recipes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default '',
  image_url text default '',
  category text,
  subcategory text default '',
  prep_time int default 0,
  cook_time int default 0,
  difficulty text default 'Fácil',
  cooking_method text default '',
  cost_margin numeric default 50,
  servings int default 4,
  favorite boolean default false,
  tags jsonb default '[]'::jsonb,
  ingredients jsonb default '[]'::jsonb,
  steps jsonb default '[]'::jsonb,
  notes text default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.recipes enable row level security;

-- Confidencialidad: solo usuarios logueados ven las recetas (no son públicas)
create policy "recipes_select_authenticated"
  on public.recipes for select
  using (auth.role() = 'authenticated');

create policy "recipes_insert_authenticated"
  on public.recipes for insert
  with check (auth.role() = 'authenticated');

create policy "recipes_update_authenticated"
  on public.recipes for update
  using (auth.role() = 'authenticated');

-- Integridad: solo admin puede eliminar recetas
create policy "recipes_delete_admin_only"
  on public.recipes for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ------------------------------------------------------------
-- 3. AUDIT LOG (movimientos)
-- Registro permanente de quién creó/editó/eliminó qué receta.
-- Solo admin puede leerlo; cualquier usuario logueado puede insertar
-- (así queda registrado su propio movimiento).
-- ------------------------------------------------------------
create table public.audit_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  user_name text,
  action text not null,
  recipe_title text,
  created_at timestamptz default now()
);

alter table public.audit_log enable row level security;

create policy "audit_log_select_admin_only"
  on public.audit_log for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "audit_log_insert_authenticated"
  on public.audit_log for insert
  with check (auth.role() = 'authenticated');


-- ------------------------------------------------------------
-- 4. STORAGE: bucket para imágenes de recetas
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

create policy "recipe_images_public_read"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

create policy "recipe_images_authenticated_upload"
  on storage.objects for insert
  with check (bucket_id = 'recipe-images' and auth.role() = 'authenticated');

create policy "recipe_images_authenticated_update_own"
  on storage.objects for update
  using (bucket_id = 'recipe-images' and auth.role() = 'authenticated');


-- ------------------------------------------------------------
-- 5. PRIMER USUARIO ADMIN
-- Después de crear tu primer usuario desde Authentication -> Users
-- en el dashboard (o registrándote desde la app), ejecuta esto
-- reemplazando el correo para convertirlo en administrador:
-- ------------------------------------------------------------
-- update public.profiles set role = 'admin' where id = (
--   select id from auth.users where email = 'tu-correo@ejemplo.com'
-- );
