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
