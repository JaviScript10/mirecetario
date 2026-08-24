import { supabase } from "./supabaseClient";

/* ---------------- AUTH ---------------- */

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSessionUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data; // { id, name, role }
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase.from("profiles").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function updateProfileName(userId, name) {
  const { data, error } = await supabase.from("profiles").update({ name }).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function updateProfilePreferences(userId, preferences) {
  const { error } = await supabase.from("profiles").update({ preferences }).eq("id", userId);
  if (error) throw error;
}

/* ---------------- RECIPES ---------------- */

function mapRecipeFromDb(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    image: row.image_url || "",
    category: row.category,
    subcategory: row.subcategory || "",
    prepTime: row.prep_time || 0,
    cookTime: row.cook_time || 0,
    difficulty: row.difficulty || "Fácil",
    servings: row.servings || 4,
    cookingMethod: row.cooking_method || "",
    costMargin: row.cost_margin ?? 50,
    favorite: !!row.favorite,
    tags: row.tags || [],
    ingredients: row.ingredients || [],
    steps: row.steps || [],
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRecipeToDb(recipe) {
  return {
    title: recipe.title,
    description: recipe.description,
    image_url: recipe.image,
    category: recipe.category,
    subcategory: recipe.subcategory,
    prep_time: recipe.prepTime,
    cook_time: recipe.cookTime,
    difficulty: recipe.difficulty,
    servings: recipe.servings,
    cooking_method: recipe.cookingMethod || "",
    cost_margin: recipe.costMargin ?? 50,
    favorite: recipe.favorite,
    tags: recipe.tags || [],
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    notes: recipe.notes,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchRecipes() {
  const { data, error } = await supabase.from("recipes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapRecipeFromDb);
}

export async function createRecipe(recipe, userId) {
  const payload = { ...mapRecipeToDb(recipe), created_by: userId };
  const { data, error } = await supabase.from("recipes").insert(payload).select().single();
  if (error) throw error;
  return mapRecipeFromDb(data);
}

export async function updateRecipe(id, recipe) {
  const { data, error } = await supabase.from("recipes").update(mapRecipeToDb(recipe)).eq("id", id).select().single();
  if (error) throw error;
  return mapRecipeFromDb(data);
}

export async function saveCosting(id, ingredients, costMargin) {
  const { data, error } = await supabase
    .from("recipes")
    .update({ ingredients, cost_margin: costMargin, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapRecipeFromDb(data);
}

export async function deleteRecipeDb(id) {
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
}

export async function setFavoriteDb(id, favorite) {
  const { error } = await supabase.from("recipes").update({ favorite }).eq("id", id);
  if (error) throw error;
}

/* ---------------- IMAGES ---------------- */

export async function uploadRecipeImage(file, userId) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("recipe-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("recipe-images").getPublicUrl(path);
  return data.publicUrl;
}

/* ---------------- AUDIT LOG ---------------- */

export async function logMovementDb(userId, userName, action, recipeTitle) {
  const { error } = await supabase
    .from("audit_log")
    .insert({ user_id: userId, user_name: userName, action, recipe_title: recipeTitle });
  if (error) console.error("No se pudo registrar el movimiento:", error.message);
}

export async function fetchAuditLog() {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data;
}

/* ---------------- ADMIN: USER CREATION ---------------- */

export async function createUserByAdmin(email, password, name, role = "user") {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) throw error;

  if (data.user && role === "admin") {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", data.user.id);

    if (profileError) throw profileError;
  }

  return data.user;
}


/* ---------------- ADMIN EXTENDED ---------------- */

// Eliminar un perfil de la BD (si usas RLS o borrado directo)
export async function deleteUserProfile(userId) {
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw error;
}

// Actualizar contraseña de un usuario desde Admin
export async function updateUserPasswordByAdmin(userId, newPassword) {
  // Nota: Al hacerlo desde cliente, actualiza la cuenta actual o envía correo de reset
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// Obtener auditoría filtrada por usuario
export async function fetchAuditLogByUser(userId) {
  let query = supabase.from("audit_log").select("*").order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query.limit(40);
  if (error) throw error;
  return data;
}

// Clonar / Duplicar una receta existente en Supabase
export async function duplicateRecipe(recipe) {
  const duplicatedData = {
    title: `${recipe.title} (Copia)`,
    description: recipe.description || "",
    image_url: recipe.image || recipe.image_url || "",
    category: recipe.category || "comidas",
    subcategory: recipe.subcategory || "",
    prep_time: recipe.prepTime ?? recipe.prep_time ?? 15,
    cook_time: recipe.cookTime ?? recipe.cook_time ?? 15,
    difficulty: recipe.difficulty || "Fácil",
    servings: recipe.servings || 4,
    cooking_method: recipe.cookingMethod || recipe.cooking_method || "",
    favorite: false,
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    notes: recipe.notes || "",
    user_id: recipe.user_id || recipe.userId,
  };

  const { data, error } = await supabase
    .from("recipes")
    .insert([duplicatedData])
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    image: data.image_url || data.image,
    prepTime: data.prep_time,
    cookTime: data.cook_time,
    cookingMethod: data.cooking_method,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}