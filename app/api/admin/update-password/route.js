import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { action, userId, newPassword } = await request.json();

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json(
        { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // 1. Acción: Cambiar Contraseña
    if (action === "update-password") {
      if (!userId || !newPassword) {
        return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, user: data.user });
    }

    // 2. Acción: Eliminar Usuario Completo (Auth + Profile)
    if (action === "delete-user") {
      if (!userId) {
        return NextResponse.json({ error: "ID de usuario requerido." }, { status: 400 });
      }

      // Borra el usuario de auth.users (lo que libera el correo inmediatamente)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      // También borra el perfil público por si acaso
      await supabaseAdmin.from("profiles").delete().eq("id", userId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}