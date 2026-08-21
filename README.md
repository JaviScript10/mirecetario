# Mi Recetario

App real de recetas — Next.js + Supabase (auth, base de datos y storage de imágenes).

## 1. Abrir en VS Code

Descomprime el proyecto y ábrelo en VS Code (`code mi-recetario` o desde el menú Archivo → Abrir Carpeta).

## 2. Crear tu proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta / inicia sesión.
2. **New Project** → dale un nombre (ej. `mi-recetario`) y una contraseña de base de datos (guárdala en un gestor de contraseñas, no la necesitarás seguido).
3. Espera 1-2 minutos a que se aprovisione.

## 3. Correr el esquema de base de datos

1. En el dashboard de tu proyecto, ve a **SQL Editor** → **New query**.
2. Abre el archivo `supabase/schema.sql` de este proyecto, copia todo su contenido y pégalo ahí.
3. Dale **Run**. Esto crea las tablas (`profiles`, `recipes`, `audit_log`), las políticas de seguridad (RLS) y el bucket de imágenes.

> **¿Ya habías corrido `schema.sql` antes?** Corre también `supabase/migration_001.sql` (mismo procedimiento: SQL Editor → pegar → Run). Agrega la columna de tipo de cocción y el permiso para que un admin pueda renombrar a otros usuarios — cosas que se sumaron en esta actualización.

## 4. Conseguir tus llaves de API

1. En el dashboard: **Project Settings** (ícono de engranaje) → **API**.
2. Copia **Project URL** y **anon public key**.

## 5. Configurar variables de entorno

En VS Code, dentro de la carpeta del proyecto:

```bash
cp .env.local.example .env.local
```

Abre `.env.local` y pega tus valores:

```
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 6. Instalar dependencias y correr

En la terminal de VS Code:

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 7. Crear tu primer usuario (tú, como admin)

1. En el dashboard de Supabase: **Authentication** → **Users** → **Add user** → **Create new user**.
2. Ponle tu correo y una contraseña.
3. Vuelve al **SQL Editor** y corre (reemplazando tu correo):

```sql
update public.profiles set role = 'admin' where id = (
  select id from auth.users where email = 'tu-correo@ejemplo.com'
);
```

4. Ahora entra a `localhost:3000` con ese correo y contraseña — deberías ver el **Panel Admin** en el menú.

Para agregar usuarios normales del equipo, repite el paso 1 (Authentication → Users → Add user) con su correo; por defecto quedan con rol `user`.

## 8. Deploy a Vercel

```bash
npm install -g vercel
vercel
```

O conecta el repo de GitHub directo desde el dashboard de Vercel. En **Project Settings → Environment Variables** de Vercel, agrega las mismas dos variables (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

## Qué quedó conectado de verdad

- **Login real** con Supabase Auth (correo + contraseña).
- **Recetas** se leen y escriben en la tabla `recipes` (crear, editar, eliminar, marcar favorito).
- **Imágenes** se suben al bucket `recipe-images` de Supabase Storage (cámara, galería/PC o URL).
- **Auditoría**: cada creación/edición/eliminación queda registrada en `audit_log`, visible en el Panel Admin (solo para rol `admin`).
- **Roles**: `admin` puede eliminar recetas y ver el Panel Admin; `user` puede crear, editar y ver recetas, pero no eliminar ni ver el panel — reforzado con Row Level Security en la base de datos, no solo en la interfaz.

## Qué queda pendiente / próximos pasos sugeridos

- **Costeo de recetas** (`Costos de Recetas`): por ahora los precios que ingresas ahí viven solo en el navegador de esa sesión — no se guardan en la base de datos todavía. Si quieres que persista, es un cambio chico (agregar `packageQty`/`packagePrice` a cada ingrediente y guardarlo con `updateRecipe`).
- **Gestión de usuarios desde la app**: hoy los usuarios se crean desde el dashboard de Supabase. Se puede construir una pantalla dentro del Panel Admin para invitarlos sin salir de la app.
- **PWA instalable**: agregar `manifest.json` + service worker para que se pueda "instalar" desde el navegador móvil.
- **App nativa**: una vez estable, envolver con Capacitor para publicar en Google Play / App Store.
