-- ============================================================
-- MIGRACIÓN — correr DESPUÉS de schema.sql si ya lo habías ejecutado antes.
-- Pega esto en Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- 1. Nueva columna: tipo de cocción (horno, fritura, hervido, etc.)
alter table public.recipes
  add column if not exists cooking_method text default '';

-- 1b. Nueva columna: margen de ganancia guardado para Costos de Recetas
alter table public.recipes
  add column if not exists cost_margin numeric default 50;

-- 1c. Nueva columna: preferencias de apariencia (tema, color, tamaño de letra),
--     guardadas en tu cuenta para que se vean igual en el celular y en el PC.
alter table public.profiles
  add column if not exists preferences jsonb default '{}'::jsonb;

-- 2. Permitir que un admin edite el nombre de CUALQUIER usuario
--    (antes solo se podía editar el propio nombre).
drop policy if exists "profiles_update_admin_any" on public.profiles;
create policy "profiles_update_admin_any"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
