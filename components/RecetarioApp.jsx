"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  signIn,
  signOut,
  getSessionUser,
  getProfile,
  fetchAllProfiles,
  updateProfileName,
  updateProfilePreferences,
  fetchRecipes,
  createRecipe,
  updateRecipe as updateRecipeDb,
  saveCosting,
  deleteRecipeDb,
  setFavoriteDb,
  uploadRecipeImage,
  logMovementDb,
  fetchAuditLog,  
} from "../lib/recipesApi";

/* ============================================================
   DESIGN TOKENS
   Warm library / editorial cookbook aesthetic.
   Display: Fraunces (serif, characterful, used for titles only)
   Body:    Inter (clean, quiet)
   Palette: warm cream paper, deep clay terracotta, olive accent
   ============================================================ */
const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap";

// Colors reference CSS variables (defined in app/layout.js and overridden
// per data-theme/data-accent attribute) so appearance settings can change
// them instantly for the whole app without re-rendering every component.
const TOKENS = {
  cream: "var(--color-cream)",
  paper: "var(--color-paper)",
  ink: "var(--color-ink)",
  inkSoft: "var(--color-ink-soft)",
  inkFaint: "var(--color-ink-faint)",
  line: "var(--color-line)",
  clay: "var(--color-clay)",
  clayDark: "var(--color-clay-dark)",
  clayTint: "var(--color-clay-tint)",
  olive: "var(--color-olive)",
  oliveTint: "var(--color-olive-tint)",
  gold: "var(--color-gold)",
};

const ACCENT_THEMES = [
  { id: "terracota", name: "Terracota", swatch: "#C1613C" },
  { id: "oliva", name: "Oliva", swatch: "#7C8450" },
  { id: "azul", name: "Azul", swatch: "#4C7A9E" },
  { id: "rosa", name: "Rosa", swatch: "#B85C7A" },
];

const FONT_SIZES = [
  { id: "normal", name: "Normal" },
  { id: "grande", name: "Grande" },
  { id: "xl", name: "Muy grande" },
];

const FONT_FAMILIES = [
  { id: "editorial", name: "Editorial (Fraunces + Inter)" },
  { id: "moderna", name: "Moderna (Poppins)" },
];

const CATEGORIES = [
  { id: "comidas", name: "Comidas", icon: "🍝", color: "#C1613C" },
  { id: "pasteles", name: "Pasteles", icon: "🍰", color: "#B85C7A" },
  { id: "postres", name: "Postres", icon: "🍪", color: "#C99A3F" },
  { id: "panes", name: "Panes", icon: "🥖", color: "#A9793E" },
  { id: "ensaladas", name: "Ensaladas", icon: "🥗", color: "#7C8450" },
  { id: "sopas", name: "Sopas", icon: "🍲", color: "#C1613C" },
  { id: "bebidas", name: "Bebidas", icon: "🥤", color: "#5B8A82" },
  { id: "desayunos", name: "Desayunos", icon: "🍳", color: "#D7A24A" },
];

const COOKING_METHODS = [
  { id: "horno", name: "Horno", icon: "🔥" },
  { id: "fritura", name: "Fritura", icon: "🍳" },
  { id: "hervido", name: "Hervido", icon: "♨️" },
  { id: "plancha", name: "Plancha / Parrilla", icon: "🔲" },
  { id: "vapor", name: "Vapor", icon: "💨" },
  { id: "salteado", name: "Salteado / Sofrito", icon: "🥘" },
  { id: "crudo", name: "Sin cocción", icon: "🥗" },
  { id: "olla_lenta", name: "Olla lenta", icon: "🍲" },
  { id: "microondas", name: "Microondas", icon: "📻" },
];

const IMG = {
  chocolate:
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80",
  cesar:
    "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&q=80",
  masamadre:
    "https://images.unsplash.com/photo-1585478259715-4d3a5a2f5f3e?w=800&q=80",
  zapallo:
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
  bolonesa:
    "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800&q=80",
  brownies:
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80",
  limonada:
    "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&q=80",
  panqueques:
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
};

const uid = () => Math.random().toString(36).slice(2, 10);

const seedRecipes = [
  {
    id: "r1",
    title: "Pastel de chocolate",
    description: "Un pastel suave y húmedo de chocolate, perfecto para cualquier ocasión.",
    image: IMG.chocolate,
    category: "pasteles",
    subcategory: "Tortas",
    prepTime: 20,
    cookTime: 40,
    difficulty: "Fácil",
    servings: 8,
    favorite: true,
    tags: ["chocolate", "horno", "cumpleaños"],
    ingredients: [
      { id: uid(), quantity: 250, unit: "g", name: "Harina" },
      { id: uid(), quantity: 200, unit: "ml", name: "Leche" },
      { id: uid(), quantity: 2, unit: "", name: "Huevos" },
      { id: uid(), quantity: 100, unit: "g", name: "Azúcar" },
      { id: uid(), quantity: 80, unit: "g", name: "Cacao en polvo" },
      { id: uid(), quantity: 1, unit: "", name: "Cucharadita de polvos de hornear" },
    ],
    steps: [
      "Precalienta el horno a 180 °C.",
      "Mezcla la harina, el azúcar y el cacao en un bowl grande.",
      "Agrega los huevos y bate hasta integrar.",
      "Incorpora la leche poco a poco, sin dejar de mezclar.",
      "Vierte en un molde enmantequillado y hornea 40 minutos.",
    ],
    notes: "Agregar un poco más de chocolate la próxima vez. Queda mejor si reposa una noche antes de servir.",
    createdAt: "2026-06-02",
    updatedAt: "2026-06-02",
  },
  {
    id: "r2",
    title: "Ensalada César",
    description: "Clásica, fresca y lista en minutos.",
    image: IMG.cesar,
    category: "ensaladas",
    subcategory: "Frías",
    prepTime: 15,
    cookTime: 0,
    difficulty: "Fácil",
    servings: 2,
    favorite: false,
    tags: ["pollo", "rápida", "almuerzo"],
    ingredients: [
      { id: uid(), quantity: 1, unit: "", name: "Lechuga romana" },
      { id: uid(), quantity: 1, unit: "", name: "Pechuga de pollo" },
      { id: uid(), quantity: 40, unit: "g", name: "Queso parmesano" },
      { id: uid(), quantity: 1, unit: "cup", name: "Crutones" },
      { id: uid(), quantity: 3, unit: "tbsp", name: "Aderezo césar" },
    ],
    steps: [
      "Lava y corta la lechuga en trozos grandes.",
      "Cocina el pollo a la plancha y córtalo en tiras.",
      "Mezcla la lechuga con el aderezo.",
      "Agrega el pollo, los crutones y el parmesano.",
    ],
    notes: "",
    createdAt: "2026-05-28",
    updatedAt: "2026-05-28",
  },
  {
    id: "r3",
    title: "Pan de masa madre",
    description: "Corteza crujiente y miga aireada, con fermentación lenta.",
    image: IMG.masamadre,
    category: "panes",
    subcategory: "Fermentados",
    prepTime: 30,
    cookTime: 45,
    difficulty: "Difícil",
    servings: 8,
    favorite: true,
    tags: ["masa madre", "fin de semana"],
    ingredients: [
      { id: uid(), quantity: 500, unit: "g", name: "Harina de fuerza" },
      { id: uid(), quantity: 350, unit: "ml", name: "Agua" },
      { id: uid(), quantity: 100, unit: "g", name: "Masa madre activa" },
      { id: uid(), quantity: 10, unit: "g", name: "Sal" },
    ],
    steps: [
      "Mezcla la harina con el agua y deja reposar 30 minutos (autólisis).",
      "Incorpora la masa madre y la sal, amasa suavemente.",
      "Realiza pliegues cada 30 minutos durante 3 horas.",
      "Forma la hogaza y deja fermentar en frío toda la noche.",
      "Hornea a 230 °C con vapor durante 45 minutos.",
    ],
    notes: "La fermentación en frío mejora mucho el sabor. No apurar los pliegues.",
    createdAt: "2026-04-10",
    updatedAt: "2026-04-10",
  },
  {
    id: "r4",
    title: "Sopa de zapallo",
    description: "Cremosa, reconfortante y lista en menos de una hora.",
    image: IMG.zapallo,
    category: "sopas",
    subcategory: "Cremas",
    prepTime: 15,
    cookTime: 30,
    difficulty: "Fácil",
    servings: 4,
    favorite: false,
    tags: ["invierno", "vegetariana"],
    ingredients: [
      { id: uid(), quantity: 1, unit: "kg", name: "Zapallo" },
      { id: uid(), quantity: 1, unit: "", name: "Cebolla" },
      { id: uid(), quantity: 1, unit: "l", name: "Caldo de verduras" },
      { id: uid(), quantity: 100, unit: "ml", name: "Crema" },
    ],
    steps: [
      "Sofríe la cebolla picada hasta que esté transparente.",
      "Agrega el zapallo en cubos y el caldo.",
      "Cocina 25 minutos hasta que el zapallo esté blando.",
      "Licúa hasta obtener una crema suave y agrega la crema.",
    ],
    notes: "",
    createdAt: "2026-06-08",
    updatedAt: "2026-06-08",
  },
  {
    id: "r5",
    title: "Tallarines a la boloñesa",
    description: "Salsa de carne lenta y sabrosa sobre pasta al dente.",
    image: IMG.bolonesa,
    category: "comidas",
    subcategory: "Pastas",
    prepTime: 20,
    cookTime: 45,
    difficulty: "Media",
    servings: 4,
    favorite: true,
    tags: ["carne", "domingo"],
    ingredients: [
      { id: uid(), quantity: 400, unit: "g", name: "Tallarines" },
      { id: uid(), quantity: 300, unit: "g", name: "Carne molida" },
      { id: uid(), quantity: 400, unit: "g", name: "Tomate triturado" },
      { id: uid(), quantity: 1, unit: "", name: "Cebolla" },
      { id: uid(), quantity: 2, unit: "", name: "Dientes de ajo" },
    ],
    steps: [
      "Sofríe la cebolla y el ajo picados finamente.",
      "Agrega la carne molida y dora bien.",
      "Incorpora el tomate triturado y cocina a fuego bajo 30 minutos.",
      "Cocina los tallarines al dente y sirve con la salsa encima.",
    ],
    notes: "Mejor al día siguiente, cuando los sabores se asientan.",
    createdAt: "2026-05-15",
    updatedAt: "2026-05-20",
  },
  {
    id: "r6",
    title: "Brownies",
    description: "Bordes crujientes, centro fudoso.",
    image: IMG.brownies,
    category: "postres",
    subcategory: "Chocolate",
    prepTime: 15,
    cookTime: 25,
    difficulty: "Fácil",
    servings: 12,
    favorite: false,
    tags: ["chocolate", "para compartir"],
    ingredients: [
      { id: uid(), quantity: 200, unit: "g", name: "Chocolate semi amargo" },
      { id: uid(), quantity: 150, unit: "g", name: "Mantequilla" },
      { id: uid(), quantity: 3, unit: "", name: "Huevos" },
      { id: uid(), quantity: 180, unit: "g", name: "Azúcar" },
      { id: uid(), quantity: 100, unit: "g", name: "Harina" },
    ],
    steps: [
      "Derrite el chocolate con la mantequilla a baño maría.",
      "Bate los huevos con el azúcar hasta espumar.",
      "Une ambas mezclas y agrega la harina tamizada.",
      "Hornea a 180 °C durante 25 minutos, sin pasarse de cocción.",
    ],
    notes: "",
    createdAt: "2026-06-12",
    updatedAt: "2026-06-12",
  },
  {
    id: "r7",
    title: "Limonada de jengibre",
    description: "Refrescante, con un toque picante de jengibre.",
    image: IMG.limonada,
    category: "bebidas",
    subcategory: "Frías",
    prepTime: 10,
    cookTime: 0,
    difficulty: "Fácil",
    servings: 4,
    favorite: false,
    tags: ["verano", "sin alcohol"],
    ingredients: [
      { id: uid(), quantity: 6, unit: "", name: "Limones" },
      { id: uid(), quantity: 30, unit: "g", name: "Jengibre fresco" },
      { id: uid(), quantity: 60, unit: "g", name: "Azúcar" },
      { id: uid(), quantity: 1, unit: "l", name: "Agua fría" },
    ],
    steps: [
      "Exprime los limones y ralla el jengibre.",
      "Mezcla el jugo, el jengibre y el azúcar en el agua.",
      "Deja reposar 10 minutos en el refrigerador antes de servir.",
    ],
    notes: "",
    createdAt: "2026-06-14",
    updatedAt: "2026-06-14",
  },
  {
    id: "r8",
    title: "Panqueques",
    description: "El desayuno de fin de semana de siempre.",
    image: IMG.panqueques,
    category: "desayunos",
    subcategory: "Dulces",
    prepTime: 10,
    cookTime: 15,
    difficulty: "Fácil",
    servings: 4,
    favorite: true,
    tags: ["desayuno", "niños"],
    ingredients: [
      { id: uid(), quantity: 200, unit: "g", name: "Harina" },
      { id: uid(), quantity: 300, unit: "ml", name: "Leche" },
      { id: uid(), quantity: 2, unit: "", name: "Huevos" },
      { id: uid(), quantity: 1, unit: "tbsp", name: "Azúcar" },
    ],
    steps: [
      "Mezcla todos los ingredientes hasta obtener una masa sin grumos.",
      "Calienta una sartén antiadherente a fuego medio.",
      "Cocina cada panqueque 2 minutos por lado hasta dorar.",
    ],
    notes: "Quedan mejor con un poco de ralladura de limón en la masa.",
    createdAt: "2026-06-15",
    updatedAt: "2026-06-15",
  },
];

/* ============================================================
   SMALL PRIMITIVES
   ============================================================ */

function DifficultyBadge({ level }) {
  const map = {
    Fácil: { bg: TOKENS.oliveTint, fg: TOKENS.olive },
    Media: { bg: "#F5E7C6", fg: "#8A6B1F" },
    Difícil: { bg: TOKENS.clayTint, fg: TOKENS.clayDark },
  };
  const s = map[level] || map["Fácil"];
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {level}
    </span>
  );
}

function TimeBadge({ minutes }) {
  return (
    <span style={{ fontSize: 13, color: TOKENS.inkSoft, display: "inline-flex", alignItems: "center", gap: 4 }}>
      ⏱ {minutes} min
    </span>
  );
}

function FavoriteButton({ active, onClick, size = 18, floating = true }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      style={{
        border: "none",
        background: floating ? "rgba(255,252,247,0.92)" : "transparent",
        width: floating ? 34 : "auto",
        height: floating ? 34 : "auto",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: floating ? "0 2px 8px rgba(44,36,29,0.12)" : "none",
        transition: "transform 0.15s ease",
        flexShrink: 0,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.85)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <span
        style={{
          fontSize: size,
          color: active ? TOKENS.clay : TOKENS.inkFaint,
          transition: "color 0.15s ease, transform 0.15s ease",
          transform: active ? "scale(1.08)" : "scale(1)",
          display: "inline-block",
        }}
      >
        {active ? "♥" : "♡"}
      </span>
    </button>
  );
}

function EmptyState({ emoji, title, subtitle, actionLabel, onAction }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "64px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 44 }}>{emoji}</div>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 21, fontWeight: 600, color: TOKENS.ink }}>
        {title}
      </div>
      <div style={{ color: TOKENS.inkSoft, fontSize: 14.5, maxWidth: 320 }}>{subtitle}</div>
      {actionLabel && (
        <button
          onClick={onAction}
          style={{
            marginTop: 10,
            background: TOKENS.clay,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "11px 20px",
            fontSize: 14.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function Toast({ message, show }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 90,
        left: "50%",
        transform: `translateX(-50%) translateY(${show ? "0" : "16px"})`,
        opacity: show ? 1 : 0,
        pointerEvents: "none",
        background: TOKENS.ink,
        color: TOKENS.paper,
        padding: "11px 20px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 500,
        boxShadow: "0 8px 24px rgba(44,36,29,0.25)",
        zIndex: 200,
        transition: "opacity 0.25s ease, transform 0.25s ease",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}

/* ============================================================
   RECIPE CARD + GRID
   ============================================================ */

function RecipeCard({ recipe, onOpen, onToggleFavorite }) {
  const cat = CATEGORIES.find((c) => c.id === recipe.category);
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={() => onOpen(recipe.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: TOKENS.paper,
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: hover ? "0 14px 30px rgba(44,36,29,0.13)" : "0 2px 10px rgba(44,36,29,0.06)",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${TOKENS.line}`,
      }}
    >
      <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
        <img
          src={recipe.image}
          alt={recipe.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: hover ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.4s ease",
          }}
        />
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <FavoriteButton active={recipe.favorite} onClick={() => onToggleFavorite(recipe.id)} />
        </div>
        {cat && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              background: "rgba(255,252,247,0.92)",
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: 12.5,
              fontWeight: 600,
              color: "#2C241D",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </div>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: 17.5,
            fontWeight: 600,
            color: TOKENS.ink,
            marginBottom: 8,
            lineHeight: 1.25,
          }}
        >
          {recipe.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <TimeBadge minutes={recipe.prepTime + recipe.cookTime} />
          <DifficultyBadge level={recipe.difficulty} />
          <span style={{ fontSize: 13, color: TOKENS.inkSoft }}>👥 {recipe.servings}</span>
        </div>
      </div>
    </div>
  );
}

function RecipeGrid({ recipes, onOpen, onToggleFavorite, emptyProps }) {
  if (recipes.length === 0) {
    return <EmptyState {...emptyProps} />;
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
        gap: 18,
      }}
    >
      {recipes.map((r) => (
        <RecipeCard key={r.id} recipe={r} onOpen={onOpen} onToggleFavorite={onToggleFavorite} />
      ))}
    </div>
  );
}

/* ============================================================
   SEARCH BAR
   ============================================================ */

function SearchBar({ value, onChange, placeholder, large }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: TOKENS.paper,
        border: `1px solid ${TOKENS.line}`,
        borderRadius: large ? 16 : 12,
        padding: large ? "14px 18px" : "10px 14px",
        boxShadow: "0 1px 4px rgba(44,36,29,0.04)",
      }}
    >
      <span style={{ fontSize: large ? 18 : 15, color: TOKENS.inkFaint }}>🔍</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Buscar recetas, ingredientes..."}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: large ? 15.5 : 14,
          color: TOKENS.ink,
          width: "100%",
          fontFamily: "Inter, sans-serif",
        }}
      />
    </div>
  );
}

/* ============================================================
   CATEGORY CARD / PILL
   ============================================================ */

function CategoryPill({ cat, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        border: `1px solid ${active ? cat.color : TOKENS.line}`,
        background: active ? cat.color : TOKENS.paper,
        color: active ? "#fff" : TOKENS.ink,
        borderRadius: 999,
        padding: "9px 15px",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.15s ease",
        flexShrink: 0,
      }}
    >
      <span>{cat.icon}</span>
      <span>{cat.name}</span>
      {typeof count === "number" && (
        <span style={{ opacity: 0.75, fontWeight: 500 }}>· {count}</span>
      )}
    </button>
  );
}

function CategoryCard({ cat, count, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: TOKENS.paper,
        border: `1px solid ${TOKENS.line}`,
        borderRadius: 18,
        padding: 20,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 10px 24px rgba(44,36,29,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          background: cat.color + "22",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        {cat.icon}
      </div>
      <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 17, color: TOKENS.ink }}>
        {cat.name}
      </div>
      <div style={{ fontSize: 13.5, color: TOKENS.inkSoft }}>
        {count} {count === 1 ? "receta" : "recetas"}
      </div>
    </div>
  );
}

/* ============================================================
   PORTION SELECTOR
   ============================================================ */

function PortionSelector({ value, onChange, min = 1, max = 48 }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        background: TOKENS.cream,
        border: `1px solid ${TOKENS.line}`,
        borderRadius: 999,
        padding: "6px 8px",
      }}
    >
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Menos porciones"
        style={roundBtnStyle}
      >
        −
      </button>
      <span style={{ fontWeight: 700, fontSize: 15, color: TOKENS.ink, minWidth: 20, textAlign: "center" }}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Más porciones"
        style={roundBtnStyle}
      >
        +
      </button>
    </div>
  );
}

const roundBtnStyle = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: "none",
  background: TOKENS.paper,
  color: TOKENS.clay,
  fontSize: 17,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 1px 3px rgba(44,36,29,0.1)",
};

function scaleQuantity(qty, baseServings, newServings) {
  if (!qty || !baseServings) return qty;
  const scaled = (qty / baseServings) * newServings;
  const rounded = Math.round(scaled * 100) / 100;
  return Number.isInteger(rounded) ? rounded : rounded.toFixed(rounded < 10 ? 2 : 1).replace(/\.?0+$/, "");
}

/* ============================================================
   RECIPE DETAIL
   ============================================================ */

function RecipeDetail({ recipe, onBack, onToggleFavorite, onEdit, onDelete }) {
  const [servings, setServings] = useState(recipe.servings);
  const [checked, setChecked] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cat = CATEGORIES.find((c) => c.id === recipe.category);

  useEffect(() => {
    setServings(recipe.servings);
    setChecked({});
  }, [recipe.id]);

  return (
    <div style={{ animation: "fadeIn 0.25s ease" }}>
      <button onClick={onBack} style={backBtnStyle}>
        ← Volver
      </button>

      <div
        style={{
          borderRadius: 22,
          overflow: "hidden",
          position: "relative",
          aspectRatio: "16/8",
          marginTop: 12,
        }}
      >
        <img src={recipe.image} alt={recipe.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 20, gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          {cat && (
            <div style={{ fontSize: 13.5, fontWeight: 600, color: cat.color, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              {recipe.subcategory && <span style={{ color: TOKENS.inkFaint }}> · {recipe.subcategory}</span>}
            </div>
          )}
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 700, color: TOKENS.ink, margin: "0 0 8px" }}>
            {recipe.title}
          </h1>
          <p style={{ color: TOKENS.inkSoft, fontSize: 15, margin: 0, maxWidth: 520, lineHeight: 1.5 }}>
            {recipe.description}
          </p>
        </div>

        <div className="recipe-actions" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => onToggleFavorite(recipe.id)}
            style={{ ...labeledActionBtn, color: recipe.favorite ? TOKENS.clay : TOKENS.ink }}
          >
            <span style={{ fontSize: 16 }}>{recipe.favorite ? "♥" : "♡"}</span>
            Favorito
          </button>
          <button onClick={() => onEdit(recipe.id)} style={labeledActionBtn}>
            <span style={{ fontSize: 15 }}>✏️</span>
            Editar
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ ...labeledActionBtn, color: TOKENS.clayDark, borderColor: TOKENS.clayTint }}
          >
            <span style={{ fontSize: 15 }}>🗑️</span>
            Eliminar
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(44,36,29,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: TOKENS.paper,
              borderRadius: 18,
              padding: 26,
              maxWidth: 340,
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(44,36,29,0.25)",
            }}
          >
            <div style={{ fontSize: 34, marginBottom: 10 }}>🗑️</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: TOKENS.ink, marginBottom: 8 }}>
              ¿Eliminar "{recipe.title}"?
            </div>
            <div style={{ fontSize: 13.5, color: TOKENS.inkSoft, marginBottom: 20 }}>
              Esta acción no se puede deshacer.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setConfirmDelete(false)} style={secondaryBtn}>
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete(recipe.id);
                }}
                style={{ ...primaryBtn, background: TOKENS.clayDark }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 22, marginTop: 18, flexWrap: "wrap" }}>
        <InfoStat icon="⏱" label={`${recipe.prepTime + recipe.cookTime} min`} sub="tiempo total" />
        <InfoStat icon="👥" label={`Para ${recipe.servings} personas`} sub="rinde esta receta" />
        <InfoStat icon="⭐" label={recipe.difficulty} sub="dificultad" />
        {recipe.cookingMethod && (
          <InfoStat
            icon={COOKING_METHODS.find((m) => m.id === recipe.cookingMethod)?.icon || "🔥"}
            label={COOKING_METHODS.find((m) => m.id === recipe.cookingMethod)?.name || recipe.cookingMethod}
            sub="tipo de cocción"
          />
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(240px, 320px) 1fr",
          gap: 40,
          marginTop: 36,
        }}
        className="detail-grid"
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <h2 style={sectionHeading}>Ingredientes</h2>
            <PortionSelector value={servings} onChange={setServings} />
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: TOKENS.inkFaint, marginBottom: 14 }}>
            para {servings} {servings === 1 ? "persona" : "personas"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {recipe.ingredients.map((ing) => (
              <div
                key={ing.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: `1px solid ${TOKENS.line}`,
                  fontSize: 14.5,
                }}
              >
                <span style={{ color: TOKENS.ink }}>{ing.name}</span>
                <span style={{ color: TOKENS.clayDark, fontWeight: 600, whiteSpace: "nowrap", marginLeft: 12 }}>
                  {scaleQuantity(ing.quantity, recipe.servings, servings)} {ing.unit}
                </span>
              </div>
            ))}
          </div>

          {recipe.notes && (
            <div style={{ marginTop: 28 }}>
              <h2 style={sectionHeading}>Notas</h2>
              <div
                style={{
                  background: TOKENS.oliveTint,
                  borderRadius: 14,
                  padding: 16,
                  fontSize: 14,
                  color: TOKENS.olive,
                  lineHeight: 1.6,
                }}
              >
                {recipe.notes}
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 style={sectionHeading}>Preparación</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {recipe.steps.map((step, i) => {
              const done = !!checked[i];
              return (
                <label
                  key={i}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "14px 6px",
                    cursor: "pointer",
                    borderBottom: i < recipe.steps.length - 1 ? `1px solid ${TOKENS.line}` : "none",
                    opacity: done ? 0.5 : 1,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                    style={{ display: "none" }}
                  />
                  <span
                    style={{
                      fontFamily: "Fraunces, serif",
                      fontSize: 15,
                      fontWeight: 700,
                      color: done ? TOKENS.inkFaint : TOKENS.clay,
                      minWidth: 26,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontSize: 15.5,
                      color: TOKENS.ink,
                      lineHeight: 1.55,
                      textDecoration: done ? "line-through" : "none",
                    }}
                  >
                    {step}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoStat({ icon, label, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: TOKENS.clayTint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 17,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: TOKENS.ink }}>{label}</div>
        <div style={{ fontSize: 12, color: TOKENS.inkFaint }}>{sub}</div>
      </div>
    </div>
  );
}

const sectionHeading = {
  fontFamily: "Fraunces, serif",
  fontSize: 19,
  fontWeight: 600,
  color: TOKENS.ink,
  margin: 0,
};

const backBtnStyle = {
  background: TOKENS.paper,
  border: `1px solid ${TOKENS.line}`,
  borderRadius: 999,
  padding: "8px 16px",
  fontSize: 13.5,
  fontWeight: 600,
  color: TOKENS.ink,
  cursor: "pointer",
};

const iconActionBtn = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  border: `1px solid ${TOKENS.line}`,
  background: TOKENS.paper,
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: TOKENS.ink,
};

const labeledActionBtn = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  border: `1px solid ${TOKENS.line}`,
  background: TOKENS.paper,
  borderRadius: 12,
  padding: "9px 15px",
  fontSize: 13.5,
  fontWeight: 600,
  color: TOKENS.ink,
  cursor: "pointer",
};

/* ============================================================
   RECIPE FORM (create / edit)
   ============================================================ */

function emptyRecipeDraft() {
  return {
    id: null,
    title: "",
    description: "",
    image: IMG.chocolate,
    category: "comidas",
    subcategory: "",
    prepTime: 15,
    cookTime: 15,
    difficulty: "Fácil",
    servings: 4,
    cookingMethod: "",
    favorite: false,
    tags: [],
    ingredients: [{ id: uid(), quantity: "", unit: "g", name: "" }],
    steps: [""],
    notes: "",
  };
}

const UNITS = ["g", "kg", "ml", "l", "un", "taza", "cda", "cdta", "ralladura", "pizca"];
const UNIT_LABELS = {
  g: "g (gramos)",
  kg: "kg (kilos)",
  ml: "ml (mililitros)",
  l: "l (litros)",
  un: "un (unidad)",
  taza: "taza",
  cda: "cda (cuchara sopera)",
  cdta: "cdta (cuchara pequeña)",
  ralladura: "ralladura",
  pizca: "pizca",
};

function FieldLabel({ children }) {
  return (
    <label style={{ fontSize: 12.5, fontWeight: 700, color: TOKENS.inkSoft, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 6, display: "block" }}>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  border: `1px solid ${TOKENS.line}`,
  background: TOKENS.paper,
  borderRadius: 12,
  padding: "11px 13px",
  fontSize: 14.5,
  color: TOKENS.ink,
  outline: "none",
  fontFamily: "Inter, sans-serif",
  boxSizing: "border-box",
};

function ImageUploadField({ value, onChange, userId }) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview instantly while the real upload happens in the background
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    setUploadError("");
    try {
      const publicUrl = await uploadRecipeImage(file, userId);
      onChange(publicUrl);
    } catch (err) {
      setUploadError("No se pudo subir la imagen: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          aspectRatio: "16/9",
          background: TOKENS.cream,
          border: `1px solid ${TOKENS.line}`,
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {value ? (
          <img src={value} alt="Vista previa" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ color: TOKENS.inkFaint, fontSize: 13.5 }}>Sin imagen todavía</span>
        )}
        {uploading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(44,36,29,0.4)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Subiendo imagen...
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

        <button type="button" onClick={() => cameraInputRef.current?.click()} style={uploadChipBtn}>
          📷 Tomar foto
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} style={uploadChipBtn}>
          🖼 Galería / PC
        </button>
        <button type="button" onClick={() => setShowUrlInput((v) => !v)} style={uploadChipBtn}>
          🔗 Usar URL
        </button>
      </div>

      {showUrlInput && (
        <input
          style={{ ...inputStyle, marginTop: 8 }}
          placeholder="https://..."
          value={value?.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {uploadError && <div style={{ fontSize: 12, color: TOKENS.clayDark, marginTop: 6 }}>{uploadError}</div>}
    </div>
  );
}

const uploadChipBtn = {
  border: `1px solid ${TOKENS.line}`,
  background: TOKENS.paper,
  color: TOKENS.ink,
  borderRadius: 999,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

function RecipeForm({ initial, onCancel, onSave, userId }) {
  const [draft, setDraft] = useState(initial || emptyRecipeDraft());
  const isEdit = !!initial;

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const updateIngredient = (id, patch) =>
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));

  const addIngredient = () =>
    setDraft((d) => ({ ...d, ingredients: [...d.ingredients, { id: uid(), quantity: "", unit: "g", name: "" }] }));

  const removeIngredient = (id) =>
    setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((i) => i.id !== id) }));

  const updateStep = (idx, value) =>
    setDraft((d) => ({ ...d, steps: d.steps.map((s, i) => (i === idx ? value : s)) }));

  const addStep = () => setDraft((d) => ({ ...d, steps: [...d.steps, ""] }));
  const removeStep = (idx) => setDraft((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== idx) }));
  const moveStep = (idx, dir) =>
    setDraft((d) => {
      const steps = [...d.steps];
      const target = idx + dir;
      if (target < 0 || target >= steps.length) return d;
      [steps[idx], steps[target]] = [steps[target], steps[idx]];
      return { ...d, steps };
    });

  const canSave = draft.title.trim().length > 0;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <button onClick={onCancel} style={backBtnStyle}>
        ← Cancelar
      </button>

      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 27, fontWeight: 700, color: TOKENS.ink, margin: "16px 0 24px" }}>
        {isEdit ? "Editar receta" : "Nueva receta"}
      </h1>

      {/* General info */}
      <FormSection title="Información general">
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <FieldLabel>Nombre de la receta</FieldLabel>
            <input style={inputStyle} value={draft.title} onChange={(e) => update({ title: e.target.value })} placeholder="Ej: Pastel de chocolate" />
          </div>
          <div>
            <FieldLabel>Descripción</FieldLabel>
            <textarea
              style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "Inter, sans-serif" }}
              value={draft.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Una breve descripción de la receta"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <FieldLabel>Categoría</FieldLabel>
              <select style={inputStyle} value={draft.category} onChange={(e) => update({ category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Subcategoría</FieldLabel>
              <input style={inputStyle} value={draft.subcategory} onChange={(e) => update({ subcategory: e.target.value })} placeholder="Ej: Tortas" />
            </div>
          </div>
          <div>
            <FieldLabel>Imagen principal</FieldLabel>
            <ImageUploadField value={draft.image} onChange={(url) => update({ image: url })} userId={userId} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }} className="form-4col">
            <div>
              <FieldLabel>Prep. (min)</FieldLabel>
              <input type="number" style={inputStyle} value={draft.prepTime} onChange={(e) => update({ prepTime: Number(e.target.value) })} />
            </div>
            <div>
              <FieldLabel>Cocción (min)</FieldLabel>
              <input type="number" style={inputStyle} value={draft.cookTime} onChange={(e) => update({ cookTime: Number(e.target.value) })} />
            </div>
            <div>
              <FieldLabel>Dificultad</FieldLabel>
              <select style={inputStyle} value={draft.difficulty} onChange={(e) => update({ difficulty: e.target.value })}>
                <option>Fácil</option>
                <option>Media</option>
                <option>Difícil</option>
              </select>
            </div>
            <div>
              <FieldLabel>Porciones (para cuántas personas)</FieldLabel>
              <input type="number" min={1} style={inputStyle} value={draft.servings} onChange={(e) => update({ servings: Math.max(1, Number(e.target.value)) })} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <FieldLabel>Tipo de cocción</FieldLabel>
              <select style={inputStyle} value={draft.cookingMethod || ""} onChange={(e) => update({ cookingMethod: e.target.value })}>
                <option value="">Sin especificar</option>
                {COOKING_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.icon} {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Ingredients */}
      <FormSection title="Ingredientes">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {draft.ingredients.map((ing) => (
            <div key={ing.id} style={{ display: "grid", gridTemplateColumns: "70px 90px 1fr 34px", gap: 8 }} className="ingredient-row">
              <input
                style={inputStyle}
                placeholder="250"
                value={ing.quantity}
                onChange={(e) => updateIngredient(ing.id, { quantity: e.target.value === "" ? "" : Number(e.target.value) })}
              />
              <select style={inputStyle} value={ing.unit} onChange={(e) => updateIngredient(ing.id, { unit: e.target.value })}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {UNIT_LABELS[u] || u}
                  </option>
                ))}
              </select>
              <input
                style={inputStyle}
                placeholder="Harina"
                value={ing.name}
                onChange={(e) => updateIngredient(ing.id, { name: e.target.value })}
              />
              <button onClick={() => removeIngredient(ing.id)} style={{ ...roundBtnStyle, color: TOKENS.clayDark }} aria-label="Eliminar ingrediente">
                ✕
              </button>
            </div>
          ))}
        </div>
        <button onClick={addIngredient} style={dashedAddBtn}>
          + Agregar ingrediente
        </button>
      </FormSection>

      {/* Steps */}
      <FormSection title="Pasos">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {draft.steps.map((step, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 6 }}>
                <button onClick={() => moveStep(idx, -1)} style={tinyMoveBtn} aria-label="Mover arriba">
                  ▲
                </button>
                <button onClick={() => moveStep(idx, 1)} style={tinyMoveBtn} aria-label="Mover abajo">
                  ▼
                </button>
              </div>
              <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, color: TOKENS.clay, paddingTop: 10, minWidth: 22 }}>
                {idx + 1}.
              </span>
              <textarea
                style={{ ...inputStyle, minHeight: 44, resize: "vertical", flex: 1, fontFamily: "Inter, sans-serif" }}
                value={step}
                onChange={(e) => updateStep(idx, e.target.value)}
                placeholder="Describe este paso"
              />
              <button onClick={() => removeStep(idx)} style={{ ...roundBtnStyle, color: TOKENS.clayDark, marginTop: 6 }} aria-label="Eliminar paso">
                ✕
              </button>
            </div>
          ))}
        </div>
        <button onClick={addStep} style={dashedAddBtn}>
          + Agregar paso
        </button>
      </FormSection>

      {/* Notes */}
      <FormSection title="Notas personales">
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "Inter, sans-serif" }}
          value={draft.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Consejos, modificaciones o secretos de la receta"
        />
      </FormSection>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, paddingBottom: 40 }}>
        <button onClick={onCancel} style={secondaryBtn}>
          Cancelar
        </button>
        <button
          disabled={!canSave}
          onClick={() =>
            onSave({
              ...draft,
              ingredients: draft.ingredients.filter((i) => i.name.trim()),
              steps: draft.steps.filter((s) => s.trim()),
            })
          }
          style={{ ...primaryBtn, opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}
        >
          Guardar receta
        </button>
      </div>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <h3 style={{ ...sectionHeading, fontSize: 16, marginBottom: 12 }}>{title}</h3>
      {children}
    </div>
  );
}

const dashedAddBtn = {
  marginTop: 10,
  border: `1.5px dashed ${TOKENS.clay}`,
  background: "transparent",
  color: TOKENS.clayDark,
  borderRadius: 12,
  padding: "10px 16px",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
  width: "100%",
};

const tinyMoveBtn = {
  border: `1px solid ${TOKENS.line}`,
  background: TOKENS.paper,
  borderRadius: 6,
  width: 20,
  height: 16,
  fontSize: 8,
  cursor: "pointer",
  color: TOKENS.inkSoft,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const primaryBtn = {
  background: TOKENS.clay,
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 22px",
  fontSize: 14.5,
  fontWeight: 700,
};

const secondaryBtn = {
  background: "transparent",
  color: TOKENS.ink,
  border: `1px solid ${TOKENS.line}`,
  borderRadius: 12,
  padding: "12px 22px",
  fontSize: 14.5,
  fontWeight: 600,
  cursor: "pointer",
};

/* ============================================================
   NAVIGATION
   ============================================================ */

const NAV_ITEMS = [
  { id: "home", label: "Inicio", icon: "🏠" },
  { id: "recipes", label: "Mis recetas", icon: "📖" },
  { id: "favorites", label: "Favoritos", icon: "❤️" },
  { id: "categories", label: "Categorías", icon: "🗂" },
  { id: "costos", label: "Costos de Recetas", icon: "🧮" },
  { id: "settings", label: "Ajustes", icon: "🎨" },
];

function Sidebar({ view, setView, onCreate, recipeCount, user, onLogout }) {
  return (
    <div
      style={{
        width: 232,
        flexShrink: 0,
        borderRight: `1px solid ${TOKENS.line}`,
        padding: "28px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
      className="sidebar"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            background: TOKENS.clay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          🍲
        </div>
        <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 19, color: TOKENS.ink }}>
          Mi Recetario
        </span>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {NAV_ITEMS.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                border: "none",
                background: active ? TOKENS.clayTint : "transparent",
                color: active ? TOKENS.clayDark : TOKENS.inkSoft,
                borderRadius: 12,
                padding: "10px 12px",
                fontSize: 14.5,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "recipes" && (
                <span style={{ marginLeft: "auto", fontSize: 12, color: TOKENS.inkFaint }}>{recipeCount}</span>
              )}
            </button>
          );
        })}
        {user?.role === "admin" && (
          <button
            onClick={() => setView("admin")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              border: "none",
              background: view === "admin" ? TOKENS.clayTint : "transparent",
              color: view === "admin" ? TOKENS.clayDark : TOKENS.inkSoft,
              borderRadius: 12,
              padding: "10px 12px",
              fontSize: 14.5,
              fontWeight: view === "admin" ? 700 : 500,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 16 }}>🛡</span>
            <span>Panel Admin</span>
          </button>
        )}
      </nav>

      <div style={{ height: 1, background: TOKENS.line }} />

      <button
        onClick={onCreate}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: TOKENS.clay,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "12px 14px",
          fontSize: 14.5,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        + Nueva receta
      </button>

      {user && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: TOKENS.cream,
            borderRadius: 12,
            padding: "9px 12px",
            marginTop: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: TOKENS.clayTint,
                color: TOKENS.clayDark,
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: TOKENS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name}
              </div>
              <div style={{ fontSize: 10.5, color: TOKENS.inkFaint }}>{user.role === "admin" ? "Administrador" : "Usuario"}</div>
            </div>
          </div>
          <button onClick={onLogout} aria-label="Cerrar sesión" style={{ border: "none", background: "none", cursor: "pointer", fontSize: 15, color: TOKENS.inkFaint }}>
            ⏻
          </button>
        </div>
      )}

      <Footer compact />
    </div>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */

function Footer({ compact }) {
  if (compact) {
    return (
      <div style={{ fontSize: 11, color: TOKENS.inkFaint, padding: "0 6px", display: "flex", flexDirection: "column", gap: 2 }}>
        <a href="https://ciberbyte.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
          ciberbyte.vercel.app
        </a>
        <span>© 2026 CiberByte</span>
      </div>
    );
  }
  return (
    <div
      style={{
        textAlign: "center",
        padding: "28px 0 6px",
        borderTop: `1px solid ${TOKENS.line}`,
        marginTop: 32,
        fontSize: 12.5,
        color: TOKENS.inkFaint,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div>
        © 2026{" "}
        <a
          href="https://ciberbyte.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: TOKENS.clayDark, fontWeight: 700, textDecoration: "none" }}
        >
          CiberByte
        </a>
        . Todos los derechos reservados.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
        <span>Creado con Tecnología y Pasión</span>
        <span>💻</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <a
          href="https://wa.me/56934341783"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#25D366",
            textDecoration: "none",
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.79 14.11c-.24.68-1.4 1.31-1.94 1.35-.5.05-1.05.07-1.7-.11-.39-.11-.9-.28-1.55-.55-2.72-1.18-4.5-3.92-4.63-4.1-.14-.18-1.11-1.48-1.11-2.82 0-1.35.7-2.01.95-2.28.24-.28.53-.35.71-.35.18 0 .35 0 .5.01.16.01.38-.06.59.45.24.57.81 1.98.88 2.13.07.14.11.31.02.5-.1.19-.14.31-.28.47-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.11.61-.07.16-.18.7-.82.89-1.1.19-.28.38-.23.63-.14.26.09 1.63.77 1.91.91.28.14.47.21.53.33.07.12.07.68-.17 1.36z" />
          </svg>
          Contacto por WhatsApp
        </a>
      </div>
    </div>
  );
}

function BottomNav({ view, setView }) {
  return (
    <div
      className="bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: TOKENS.paper,
        borderTop: `1px solid ${TOKENS.line}`,
        display: "none",
        justifyContent: "space-around",
        padding: "8px 6px calc(8px + env(safe-area-inset-bottom))",
        zIndex: 50,
      }}
    >
      {[
        NAV_ITEMS[0],
        NAV_ITEMS[1],
        NAV_ITEMS[2],
        { id: "costos", label: "Costos", icon: "🧮" },
        { id: "more", label: "Más", icon: "⚙" },
      ].map((item) => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id === "more" ? "settings" : item.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              border: "none",
              background: "none",
              color: active ? TOKENS.clay : TOKENS.inkFaint,
              fontSize: 10.5,
              fontWeight: 600,
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function FloatingCreateButton({ onClick }) {
  return (
    <button
      className="fab"
      onClick={onClick}
      aria-label="Nueva receta"
      style={{
        position: "fixed",
        right: 20,
        bottom: 84,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: TOKENS.clay,
        color: "#fff",
        border: "none",
        fontSize: 26,
        boxShadow: "0 10px 24px rgba(193,97,60,0.4)",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 51,
        cursor: "pointer",
      }}
    >
      +
    </button>
  );
}

function MobileTopBar({ view, setView, user, onLogout }) {
  const [open, setOpen] = useState(false);

  const go = (v) => {
    setView(v);
    setOpen(false);
  };

  return (
    <div className="mobile-topbar">
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          background: TOKENS.paper,
          borderBottom: `1px solid ${TOKENS.line}`,
          padding: "12px 16px",
        }}
        className="mobile-topbar-inner"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              background: TOKENS.clay,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            🍲
          </div>
          <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 16, color: TOKENS.ink }}>
            Mi Recetario
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Menú"
          style={{ border: "none", background: "none", fontSize: 20, color: TOKENS.ink, cursor: "pointer", padding: 4 }}
        >
          ☰
        </button>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(44,36,29,0.4)",
            zIndex: 70,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "78%",
              maxWidth: 300,
              background: TOKENS.paper,
              padding: "20px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 16px" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: TOKENS.clayTint,
                  color: TOKENS.clayDark,
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: TOKENS.ink }}>{user.name}</div>
                <div style={{ fontSize: 11, color: TOKENS.inkFaint }}>{user.role === "admin" ? "Administrador" : "Usuario"}</div>
              </div>
            </div>

            <MobileMenuItem icon="🗂" label="Categorías" onClick={() => go("categories")} />
            <MobileMenuItem icon="🎨" label="Ajustes" onClick={() => go("settings")} />
            {user.role === "admin" && <MobileMenuItem icon="🛡" label="Panel Admin" onClick={() => go("admin")} />}
            <div style={{ height: 1, background: TOKENS.line, margin: "10px 0" }} />
            <MobileMenuItem
              icon="⏻"
              label="Cerrar sesión"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              danger
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MobileMenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: "none",
        background: "none",
        textAlign: "left",
        padding: "12px 8px",
        fontSize: 14.5,
        fontWeight: 600,
        color: danger ? TOKENS.clayDark : TOKENS.ink,
        cursor: "pointer",
        borderRadius: 10,
      }}
    >
      <span style={{ fontSize: 17 }}>{icon}</span>
      {label}
    </button>
  );
}

/* ============================================================
   HOME / DASHBOARD
   ============================================================ */

function Home({ recipes, onOpen, onToggleFavorite, onCreate, search, setSearch, activeCat, setActiveCat, setView, userName }) {
  const filtered = useMemo(() => {
    let list = recipes;
    if (activeCat) list = list.filter((r) => r.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q)) ||
          (CATEGORIES.find((c) => c.id === r.category)?.name.toLowerCase() || "").includes(q)
      );
    }
    return list;
  }, [recipes, search, activeCat]);

  const recent = [...recipes].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 8);

  return (
    <div>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 700, color: TOKENS.ink, margin: "4px 0 4px" }}>
        Hola, {userName} 👋
      </h1>
      <p style={{ color: TOKENS.inkSoft, fontSize: 15.5, margin: "0 0 20px" }}>¿Qué quieres cocinar hoy?</p>

      <SearchBar value={search} onChange={setSearch} large />

      <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
        <QuickAction icon="+" label="Nueva receta" onClick={onCreate} highlight />
        <QuickAction icon="❤️" label="Favoritos" onClick={() => setView("favorites")} />
        <QuickAction icon="📖" label="Mis recetas" onClick={() => setView("recipes")} />
      </div>

      <div style={{ marginTop: 34 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={sectionHeading}>Categorías</h2>
          <button onClick={() => setView("categories")} style={linkBtn}>
            Ver todas
          </button>
        </div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }} className="scroll-x">
          {CATEGORIES.map((c) => (
            <CategoryPill
              key={c.id}
              cat={c}
              active={activeCat === c.id}
              onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
              count={recipes.filter((r) => r.category === c.id).length}
            />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 34, paddingBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={sectionHeading}>{search || activeCat ? "Resultados" : "Recetas recientes"}</h2>
          {!search && !activeCat && (
            <button onClick={() => setView("recipes")} style={linkBtn}>
              Ver todas
            </button>
          )}
        </div>
        <RecipeGrid
          recipes={search || activeCat ? filtered : recent}
          onOpen={onOpen}
          onToggleFavorite={onToggleFavorite}
          emptyProps={{
            emoji: "🔍",
            title: "No encontramos esa receta",
            subtitle: "Prueba con otro nombre, ingrediente o categoría.",
          }}
        />
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        border: `1px solid ${highlight ? TOKENS.clay : TOKENS.line}`,
        background: highlight ? TOKENS.clay : TOKENS.paper,
        color: highlight ? "#fff" : TOKENS.ink,
        borderRadius: 14,
        padding: "12px 18px",
        fontSize: 14.5,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  );
}

const linkBtn = {
  border: "none",
  background: "none",
  color: TOKENS.clayDark,
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

/* ============================================================
   RECIPES LIST (with filters)
   ============================================================ */

function RecipesList({ recipes, onOpen, onToggleFavorite, onCreate }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [maxTime, setMaxTime] = useState(null);
  const [sort, setSort] = useState("recent");

  const filtered = useMemo(() => {
    let list = [...recipes];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.ingredients.some((i) => i.name.toLowerCase().includes(q))
      );
    }
    if (cat) list = list.filter((r) => r.category === cat);
    if (difficulty) list = list.filter((r) => r.difficulty === difficulty);
    if (maxTime) list = list.filter((r) => r.prepTime + r.cookTime <= maxTime);

    switch (sort) {
      case "recent":
        list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        break;
      case "oldest":
        list.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
        break;
      case "az":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "favorites":
        list.sort((a, b) => Number(b.favorite) - Number(a.favorite));
        break;
    }
    return list;
  }, [recipes, search, cat, difficulty, maxTime, sort]);

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700, color: TOKENS.ink, margin: 0 }}>
          Mis recetas
        </h1>
        <button onClick={onCreate} style={primaryBtn}>
          + Nueva receta
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre o ingrediente..." />

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
        <select style={filterSelect} value={cat || ""} onChange={(e) => setCat(e.target.value || null)}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <select style={filterSelect} value={difficulty || ""} onChange={(e) => setDifficulty(e.target.value || null)}>
          <option value="">Cualquier dificultad</option>
          <option>Fácil</option>
          <option>Media</option>
          <option>Difícil</option>
        </select>
        <select style={filterSelect} value={maxTime || ""} onChange={(e) => setMaxTime(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Cualquier tiempo</option>
          <option value="20">Hasta 20 min</option>
          <option value="40">Hasta 40 min</option>
          <option value="60">Hasta 1 hora</option>
        </select>
        <select style={{ ...filterSelect, marginLeft: "auto" }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recent">Más recientes</option>
          <option value="oldest">Más antiguas</option>
          <option value="az">A-Z</option>
          <option value="favorites">Favoritas</option>
        </select>
      </div>

      <div style={{ marginTop: 24 }}>
        <RecipeGrid
          recipes={filtered}
          onOpen={onOpen}
          onToggleFavorite={onToggleFavorite}
          emptyProps={{
            emoji: "🍳",
            title: "Tu colección está vacía",
            subtitle: "Empieza guardando tu primera receta.",
            actionLabel: "+ Crear mi primera receta",
            onAction: onCreate,
          }}
        />
      </div>
    </div>
  );
}

const filterSelect = {
  border: `1px solid ${TOKENS.line}`,
  background: TOKENS.paper,
  borderRadius: 10,
  padding: "8px 10px",
  fontSize: 13.5,
  color: TOKENS.ink,
  cursor: "pointer",
};

/* ============================================================
   FAVORITES
   ============================================================ */

function Favorites({ recipes, onOpen, onToggleFavorite, onGoRecipes }) {
  const favs = recipes.filter((r) => r.favorite);
  return (
    <div style={{ paddingBottom: 40 }}>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700, color: TOKENS.ink, margin: "0 0 18px" }}>
        Mis favoritos ❤️
      </h1>
      <RecipeGrid
        recipes={favs}
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
        emptyProps={{
          emoji: "❤️",
          title: "Aún no tienes favoritos",
          subtitle: "Guarda tus recetas favoritas para encontrarlas rápidamente.",
          actionLabel: "Explorar mis recetas",
          onAction: onGoRecipes,
        }}
      />
    </div>
  );
}

/* ============================================================
   COSTOS DE RECETAS (ingredient cost calculator)
   ============================================================ */

function money(v) {
  if (!isFinite(v)) return "$0";
  return "$" + Math.round(v).toLocaleString("es-CL");
}

function roundPrice(v) {
  if (v <= 0) return 0;
  const step = v < 1000 ? 50 : 100;
  return Math.ceil(v / step) * step;
}

// Weight and volume can be converted between their two common units;
// everything else (tbsp, cup, ralladura, unidades...) has no safe
// conversion, so purchase unit must match the recipe's unit exactly.
function unitFamily(unit) {
  if (unit === "g" || unit === "kg") return "weight";
  if (unit === "ml" || unit === "l") return "volume";
  return "other";
}

function purchaseUnitOptions(recipeUnit) {
  const family = unitFamily(recipeUnit);
  if (family === "weight") return ["g", "kg"];
  if (family === "volume") return ["ml", "l"];
  return [recipeUnit || "unidad"];
}

function toBaseAmount(qty, unit) {
  if (unit === "kg" || unit === "l") return qty * 1000;
  return qty; // g, ml, or any non-convertible unit stay as-is
}

function CostosView({ recipes, onSaveCosting }) {
  const [selectedId, setSelectedId] = useState(null);
  const recipe = recipes.find((r) => r.id === selectedId);

  if (!recipe) {
    return (
      <div style={{ paddingBottom: 40 }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700, color: TOKENS.ink, margin: "0 0 6px" }}>
          Costos de Recetas
        </h1>
        <p style={{ color: TOKENS.inkSoft, fontSize: 14.5, margin: "0 0 22px", maxWidth: 520 }}>
          Calcula cuánto te cuesta hacer cada receta y a cuánto conviene venderla.
        </p>
        {recipes.length === 0 ? (
          <EmptyState emoji="🧮" title="No hay recetas todavía" subtitle="Crea una receta primero para poder calcular su costo." />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
              gap: 18,
            }}
          >
            {recipes.map((r) => {
              const cat = CATEGORIES.find((c) => c.id === r.category);
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  style={{
                    background: TOKENS.paper,
                    border: `1px solid ${TOKENS.line}`,
                    borderRadius: 18,
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ aspectRatio: "4/3", overflow: "hidden" }}>
                    <img src={r.image} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "13px 15px" }}>
                    <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: TOKENS.ink, marginBottom: 4 }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: 12.5, color: TOKENS.inkSoft }}>
                      {cat?.icon} {cat?.name} · 🧮 Calcular costo
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <CostoCalculator
      recipe={recipe}
      onSave={(ingredients, margin) => onSaveCosting(recipe.id, ingredients, margin)}
      onBack={() => setSelectedId(null)}
    />
  );
}

// Ingredient cost fields (costQty/costUnit/costPrice) and the recipe's
// costMargin live directly on the recipe in the database, so they persist
// across reloads, devices and logins — not just in this browser session.
function CostoCalculator({ recipe, onSave, onBack }) {
  const [ingredients, setIngredients] = useState(recipe.ingredients);
  const [margin, setMarginState] = useState(recipe.costMargin ?? 50);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setIngredients(recipe.ingredients);
    setMarginState(recipe.costMargin ?? 50);
  }, [recipe.id]);

  const flashSaved = () => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1200);
  };

  const persist = async (nextIngredients, nextMargin) => {
    setSaving(true);
    setSaveError("");
    try {
      await onSave(nextIngredients, nextMargin);
      flashSaved();
    } catch (err) {
      setSaveError("No se pudo guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const setField = (ingId, patch) => {
    setIngredients((rows) => rows.map((ing) => (ing.id === ingId ? { ...ing, ...patch } : ing)));
  };

  const setMargin = (m) => {
    setMarginState(m);
    persist(ingredients, m);
  };

  let totalCost = 0;
  const rows = ingredients.map((ing) => {
    const packageQty = ing.costQty ?? "";
    const packageUnit = ing.costUnit ?? ing.unit ?? "unidad";
    const packagePrice = ing.costPrice ?? "";
    const pkgQty = Number(packageQty) || 0;
    const pkgPrice = Number(packagePrice) || 0;
    const pkgBase = toBaseAmount(pkgQty, packageUnit);
    const recipeBase = toBaseAmount(Number(ing.quantity) || 0, ing.unit);
    const costPerBaseUnit = pkgBase > 0 ? pkgPrice / pkgBase : 0;
    const ingCost = costPerBaseUnit * recipeBase;
    totalCost += ingCost;
    return { ing, packageQty, packageUnit, packagePrice, ingCost };
  });

  const costPerServing = recipe.servings ? totalCost / recipe.servings : totalCost;
  const suggestedTotal = roundPrice(totalCost * (1 + margin / 100));
  const suggestedPerServing = recipe.servings ? roundPrice((totalCost * (1 + margin / 100)) / recipe.servings) : suggestedTotal;

  return (
    <div style={{ paddingBottom: 40 }}>
      <button onClick={onBack} style={backBtnStyle}>
        ← Volver
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={recipe.image} alt={recipe.title} style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover" }} />
          <div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: TOKENS.ink, margin: 0 }}>
              {recipe.title}
            </h1>
            <div style={{ fontSize: 13, color: TOKENS.inkSoft }}>Costeo para {recipe.servings} porciones</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: saving ? TOKENS.inkFaint : savedFlash ? TOKENS.olive : "transparent", fontWeight: 600 }}>
            {saving ? "Guardando..." : savedFlash ? "Guardado ✓" : "—"}
          </span>
          <button
            onClick={() => persist(ingredients, margin)}
            disabled={saving}
            style={{ ...primaryBtn, padding: "9px 16px", fontSize: 13.5, cursor: saving ? "wait" : "pointer" }}
          >
            Guardar
          </button>
        </div>
      </div>

      {saveError && (
        <div
          style={{
            background: TOKENS.clayTint,
            color: TOKENS.clayDark,
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {saveError}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 620 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 1fr 0.8fr 0.7fr 1fr 1fr",
              gap: 10,
              fontSize: 11.5,
              fontWeight: 700,
              color: TOKENS.inkFaint,
              textTransform: "uppercase",
              letterSpacing: 0.3,
              padding: "0 4px 8px",
              borderBottom: `1px solid ${TOKENS.line}`,
            }}
          >
            <span>Ingrediente</span>
            <span>Usa en receta</span>
            <span>Compraste</span>
            <span>Unidad</span>
            <span>Pagaste</span>
            <span>Costo en receta</span>
          </div>
          {rows.map(({ ing, packageQty, packageUnit, packagePrice, ingCost }) => {
            const options = purchaseUnitOptions(ing.unit);
            const fixedUnit = options.length === 1;
            return (
              <div
                key={ing.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 1fr 0.8fr 0.7fr 1fr 1fr",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 4px",
                  borderBottom: `1px solid ${TOKENS.line}`,
                  fontSize: 13.5,
                }}
              >
                <span style={{ color: TOKENS.ink, fontWeight: 600 }}>{ing.name}</span>
                <span style={{ color: TOKENS.inkSoft }}>
                  {ing.quantity} {ing.unit}
                </span>
                <input
                  style={{ ...inputStyle, padding: "7px 9px", fontSize: 13 }}
                  placeholder="ej: 1"
                  value={packageQty}
                  onChange={(e) => setField(ing.id, { costQty: e.target.value })}
                  onBlur={() => persist(ingredients, margin)}
                />
                {fixedUnit ? (
                  <span style={{ color: TOKENS.inkFaint, fontSize: 12.5 }}>{packageUnit}</span>
                ) : (
                  <select
                    style={{ ...inputStyle, padding: "7px 6px", fontSize: 12.5 }}
                    value={packageUnit}
                    onChange={(e) => {
                      setField(ing.id, { costUnit: e.target.value });
                      persist(
                        ingredients.map((row) => (row.id === ing.id ? { ...row, costUnit: e.target.value } : row)),
                        margin
                      );
                    }}
                  >
                    {options.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  style={{ ...inputStyle, padding: "7px 9px", fontSize: 13 }}
                  placeholder="ej: 1500"
                  value={packagePrice}
                  onChange={(e) => setField(ing.id, { costPrice: e.target.value })}
                  onBlur={() => persist(ingredients, margin)}
                />
                <span style={{ fontWeight: 700, color: TOKENS.clayDark }}>{money(ingCost)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: TOKENS.inkFaint, marginTop: 8, maxWidth: 640 }}>
        Ejemplo: si la receta usa <strong>70 g</strong> de mantequilla y tú compraste un paquete de{" "}
        <strong>250 g por $3.500</strong>, ingresa <strong>250</strong> en "Compraste", deja la unidad en{" "}
        <strong>g</strong> (o cámbiala a <strong>kg</strong> y pon <strong>0.25</strong>) y <strong>3500</strong> en "Pagaste" — la app calcula sola cuánto de eso corresponde a los 70 g que usa la receta. Se guarda solo al salir del campo.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 28,
        }}
        className="detail-grid"
      >
        <div style={{ background: TOKENS.paper, border: `1px solid ${TOKENS.line}`, borderRadius: 16, padding: 20 }}>
          <h2 style={{ ...sectionHeading, fontSize: 16, marginBottom: 14 }}>Costo total</h2>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
            <span style={{ color: TOKENS.inkSoft }}>Costo de la receta completa</span>
            <span style={{ fontWeight: 700, color: TOKENS.ink }}>{money(totalCost)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: TOKENS.inkSoft }}>Costo por porción ({recipe.servings} porciones)</span>
            <span style={{ fontWeight: 700, color: TOKENS.ink }}>{money(costPerServing)}</span>
          </div>
        </div>

        <div style={{ background: TOKENS.oliveTint, borderRadius: 16, padding: 20 }}>
          <h2 style={{ ...sectionHeading, fontSize: 16, marginBottom: 14, color: TOKENS.olive }}>Precio de venta sugerido</h2>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[30, 50, 100].map((m) => (
              <button
                key={m}
                onClick={() => setMargin(m)}
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: margin === m ? "#4E5533" : "#ffffffaa",
                  color: margin === m ? "#fff" : "#4E5533",
                }}
              >
                +{m}%
              </button>
            ))}
            <input
              type="number"
              value={margin}
              onChange={(e) => setMarginState(Number(e.target.value))}
              onBlur={() => persist(ingredients, margin)}
              style={{ ...inputStyle, width: 64, padding: "6px 8px", fontSize: 12.5, background: "#fffffff0", color: "#2C241D" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
            <span style={{ color: TOKENS.olive }}>Venta receta completa</span>
            <span style={{ fontWeight: 700, color: TOKENS.ink }}>{money(suggestedTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: TOKENS.olive }}>Venta por porción</span>
            <span style={{ fontWeight: 700, color: TOKENS.ink }}>{money(suggestedPerServing)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CATEGORIES VIEW
   ============================================================ */

function CategoriesView({ recipes, onSelectCategory }) {
  return (
    <div style={{ paddingBottom: 40 }}>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700, color: TOKENS.ink, margin: "0 0 18px" }}>
        Categorías
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
        {CATEGORIES.map((c) => (
          <CategoryCard
            key={c.id}
            cat={c}
            count={recipes.filter((r) => r.category === c.id).length}
            onClick={() => onSelectCategory(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   AJUSTES / APARIENCIA
   Guarda la preferencia en localStorage (por navegador) y la
   aplica al instante vía atributos en <html>, que las variables
   CSS de app/layout.js leen para repintar toda la app.
   ============================================================ */

const APPEARANCE_KEY = "mi-recetario-appearance";

function loadAppearance() {
  if (typeof window === "undefined") return { theme: "light", accent: "terracota", fontSize: "normal", font: "editorial" };
  try {
    const saved = JSON.parse(localStorage.getItem(APPEARANCE_KEY));
    return { theme: "light", accent: "terracota", fontSize: "normal", font: "editorial", ...saved };
  } catch {
    return { theme: "light", accent: "terracota", fontSize: "normal", font: "editorial" };
  }
}

function applyAppearance(appearance) {
  const html = document.documentElement;
  html.setAttribute("data-theme", appearance.theme);
  html.setAttribute("data-accent", appearance.accent);
  html.setAttribute("data-fontsize", appearance.fontSize);
  html.setAttribute("data-font", appearance.font);
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance));
}

// Called once we know who's logged in: the account's saved preferences
// (from Supabase) are the source of truth and override whatever this
// browser had cached, so switching devices shows the same look.
function applySyncedAppearance(preferences) {
  if (!preferences || Object.keys(preferences).length === 0) return;
  applyAppearance({ ...loadAppearance(), ...preferences });
}

function PillChoice({ options, value, onChange, renderExtra }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              border: `1.5px solid ${active ? TOKENS.clay : TOKENS.line}`,
              background: active ? TOKENS.clayTint : TOKENS.paper,
              color: TOKENS.ink,
              borderRadius: 999,
              padding: "9px 15px",
              fontSize: 13.5,
              fontWeight: active ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {renderExtra?.(opt)}
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}

function SettingsView({ user, onUpdateName }) {
  const [appearance, setAppearance] = useState(loadAppearance);
  const [nameDraft, setNameDraft] = useState(user.name);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    applyAppearance(appearance);
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    updateProfilePreferences(user.id, appearance).catch(() => {
      // best-effort: the change is already applied locally either way
    });
  }, [appearance]);

  const update = (patch) => setAppearance((a) => ({ ...a, ...patch }));

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === user.name) return;
    setNameSaving(true);
    try {
      await onUpdateName(trimmed);
      setNameSaved(true);
      window.setTimeout(() => setNameSaved(false), 1800);
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <div style={{ paddingBottom: 40, maxWidth: 560 }}>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700, color: TOKENS.ink, margin: "0 0 6px" }}>
        Ajustes
      </h1>
      <p style={{ color: TOKENS.inkSoft, fontSize: 14.5, margin: "0 0 28px" }}>
        Personaliza cómo se ve la app para ti. Se guarda en este navegador.
      </p>

      <FormSection title="Tu nombre">
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...inputStyle, maxWidth: 260 }}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
          />
          <button onClick={saveName} disabled={nameSaving} style={{ ...primaryBtn, cursor: nameSaving ? "wait" : "pointer" }}>
            {nameSaving ? "Guardando..." : nameSaved ? "Guardado ✓" : "Guardar"}
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: TOKENS.inkFaint, marginTop: 6 }}>
          Así apareces en el saludo de inicio y en el registro de movimientos.
        </div>
      </FormSection>

      <FormSection title="Modo">
        <PillChoice
          options={[
            { id: "light", name: "☀️ Claro" },
            { id: "dark", name: "🌙 Oscuro" },
          ]}
          value={appearance.theme}
          onChange={(theme) => update({ theme })}
        />
      </FormSection>

      <FormSection title="Color de acento">
        <PillChoice
          options={ACCENT_THEMES}
          value={appearance.accent}
          onChange={(accent) => update({ accent })}
          renderExtra={(opt) => (
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: opt.swatch, display: "inline-block" }} />
          )}
        />
      </FormSection>

      <FormSection title="Tamaño de letra">
        <PillChoice options={FONT_SIZES} value={appearance.fontSize} onChange={(fontSize) => update({ fontSize })} />
      </FormSection>

      <FormSection title="Tipografía">
        <PillChoice options={FONT_FAMILIES} value={appearance.font} onChange={(font) => update({ font })} />
      </FormSection>
    </div>
  );
}

/* ============================================================
   LOGIN + ADMIN (conectado a Supabase Auth)
   ============================================================ */

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const authUser = await signIn(email, password);
      const profile = await getProfile(authUser.id);
      onLogin({ id: authUser.id, email: authUser.email, name: profile.name, role: profile.role, preferences: profile.preferences });
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: TOKENS.cream,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>
      <form
        onSubmit={handleSubmit}
        style={{
          background: TOKENS.paper,
          border: `1px solid ${TOKENS.line}`,
          borderRadius: 22,
          padding: "36px 32px",
          width: "100%",
          maxWidth: 360,
          boxShadow: "0 20px 50px rgba(44,36,29,0.1)",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background: TOKENS.clay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            marginBottom: 16,
          }}
        >
          🍲
        </div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 700, color: TOKENS.ink, margin: "0 0 4px" }}>
          Mi Recetario
        </h1>
        <p style={{ color: TOKENS.inkSoft, fontSize: 13.5, margin: "0 0 24px" }}>Inicia sesión para continuar</p>

        <FieldLabel>Correo</FieldLabel>
        <input
          type="email"
          style={{ ...inputStyle, marginBottom: 14 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
        />

        <FieldLabel>Contraseña</FieldLabel>
        <input
          type="password"
          style={{ ...inputStyle, marginBottom: 8 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        {error && <div style={{ color: TOKENS.clayDark, fontSize: 12.5, marginTop: 6 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ ...primaryBtn, width: "100%", marginTop: 18, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <div style={{ marginTop: 18, fontSize: 11.5, color: TOKENS.inkFaint, lineHeight: 1.6 }}>
          Los usuarios se crean desde el dashboard de Supabase (Authentication → Users). El primer usuario que crees
          debe pasarse a administrador con el UPDATE de ejemplo en <code>supabase/schema.sql</code>.
        </div>
      </form>
    </div>
  );
}

function AdminUserRow({ userRow, editing, onStartEdit, onCancelEdit, onSave, onDelete, onChangePassword }) {
  const [draftName, setDraftName] = useState(userRow.name);

  useEffect(() => {
    setDraftName(userRow.name);
  }, [userRow.name, editing]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: TOKENS.paper,
        border: `1px solid ${TOKENS.line}`,
        borderRadius: 12,
        padding: "10px 16px",
        fontSize: 13.5,
        gap: 10,
      }}
    >
      {editing ? (
        <div style={{ display: "flex", gap: 6, flex: 1, alignItems: "center" }}>
          <input
            autoFocus
            style={{ ...inputStyle, padding: "6px 9px", fontSize: 13 }}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave(draftName);
              if (e.key === "Escape") onCancelEdit();
            }}
          />
          <button onClick={() => onSave(draftName)} style={{ ...roundBtnStyle, width: "auto", padding: "0 10px", fontSize: 12, color: TOKENS.clay }}>
            Guardar
          </button>
          <button onClick={onCancelEdit} style={{ ...roundBtnStyle, width: "auto", padding: "0 10px", fontSize: 12 }}>
            Cancelar
          </button>
        </div>
      ) : (
        <span style={{ fontWeight: 600, color: TOKENS.ink }}>{userRow.name}</span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 999,
            background: userRow.role === "admin" ? TOKENS.clayTint : TOKENS.oliveTint,
            color: userRow.role === "admin" ? TOKENS.clayDark : TOKENS.olive,
          }}
        >
          {userRow.role === "admin" ? "Administrador" : "Usuario"}
        </span>
        {!editing && (
          <>
            <button onClick={onStartEdit} title="Editar nombre" style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13.5 }}>
              ✏️
            </button>
            <button onClick={onChangePassword} title="Cambiar contraseña" style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13.5 }}>
              🔑
            </button>
          </>
        )}
        <button onClick={onDelete} title="Eliminar usuario" style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13.5, color: TOKENS.clayDark }}>
          🗑️
        </button>
      </div>
    </div>
  );
}

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);

  // Modal para cambiar contraseña
  const [passUser, setPassUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passMsg, setPassMsg] = useState("");

  // Crear usuario
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState({ text: "", isError: false });

  const loadData = async () => {
    try {
      const [u, log] = await Promise.all([fetchAllProfiles(), fetchAuditLog()]);
      setUsers(u);
      setAuditLog(log);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    async function filterLogs() {
      try {
        let query = supabase.from("audit_log").select("*").order("created_at", { ascending: false });
        if (selectedUserFilter !== "all") {
          query = query.eq("user_id", selectedUserFilter);
        }
        const { data, error: err } = await query.limit(40);
        if (err) throw err;
        if (!cancelled) setAuditLog(data || []);
      } catch (err) {
        if (!cancelled) setError("Error al filtrar movimientos: " + err.message);
      }
    }

    filterLogs();
    return () => {
      cancelled = true;
    };
  }, [selectedUserFilter]);

  const saveUserName = async (userId, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const previous = users;
    setUsers((us) => us.map((u) => (u.id === userId ? { ...u, name: trimmed } : u)));
    setEditingUserId(null);
    try {
      await updateProfileName(userId, trimmed);
    } catch (err) {
      setUsers(previous);
      setError("No se pudo renombrar: " + err.message);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`¿Eliminar al usuario "${userName}"?`)) return;
    try {
      const { error: delErr } = await supabase.from("profiles").delete().eq("id", userId);
      if (delErr) throw delErr;
      setUsers((us) => us.filter((u) => u.id !== userId));
    } catch (err) {
      setError("No se pudo eliminar el usuario: " + err.message);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPassMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    try {
      // Enviar solicitud de reseteo o actualizar sesión
      const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
      if (passErr) throw passErr;
      setPassMsg("✅ Contraseña actualizada con éxito");
      setTimeout(() => {
        setPassUser(null);
        setNewPassword("");
        setPassMsg("");
      }, 1500);
    } catch (err) {
      setPassMsg("❌ Error: " + err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword || !newUserName) return;
    setCreating(true);
    setCreateMsg({ text: "", isError: false });

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: { name: newUserName },
          emailRedirectTo: "https://misrecetasdecocina.vercel.app/",
        },
      });

      if (signUpError) throw signUpError;

      if (data.user && newUserRole === "admin") {
        await supabase.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
      }

      setCreateMsg({ text: "✅ Usuario registrado correctamente", isError: false });
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserRole("user");
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      setCreateMsg({ text: "❌ Error: " + err.message, isError: true });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700, color: TOKENS.ink, margin: 0 }}>
            Panel Admin
          </h1>
          <p style={{ color: TOKENS.inkSoft, fontSize: 14.5, margin: "4px 0 0", maxWidth: 520 }}>
            Gestión de usuarios y auditoría de movimientos.
          </p>
        </div>
        <button onClick={() => setShowCreateForm(!showCreateForm)} style={primaryBtn}>
          {showCreateForm ? "Cancelar" : "+ Crear usuario"}
        </button>
      </div>

      {createMsg.text && (
        <div style={{ background: createMsg.isError ? TOKENS.clayTint : TOKENS.oliveTint, color: createMsg.isError ? TOKENS.clayDark : TOKENS.olive, borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, marginBottom: 20 }}>
          {createMsg.text}
        </div>
      )}

      {/* MODAL / FORMULARIO PARA CAMBIAR CONTRASEÑA */}
      {passUser && (
        <form onSubmit={handleUpdatePassword} style={{ background: TOKENS.paper, border: `1px solid ${TOKENS.line}`, borderRadius: 18, padding: 22, marginBottom: 24, display: "grid", gap: 12 }}>
          <h3 style={{ ...sectionHeading, fontSize: 16, margin: 0 }}>Cambiar contraseña para: {passUser.name}</h3>
          <div>
            <FieldLabel>Nueva Contraseña</FieldLabel>
            <input type="password" style={inputStyle} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {passMsg && <div style={{ fontSize: 13, fontWeight: 600 }}>{passMsg}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setPassUser(null)} style={secondaryBtn}>
              Cancelar
            </button>
            <button type="submit" style={primaryBtn}>
              Actualizar Clave
            </button>
          </div>
        </form>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateUser} style={{ background: TOKENS.paper, border: `1px solid ${TOKENS.line}`, borderRadius: 18, padding: 22, marginBottom: 28, display: "grid", gap: 14 }}>
          <h3 style={{ ...sectionHeading, fontSize: 16 }}>Nuevo usuario</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div>
              <FieldLabel>Nombre</FieldLabel>
              <input style={inputStyle} value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Ej: Camilo" required />
            </div>
            <div>
              <FieldLabel>Correo electrónico</FieldLabel>
              <input type="email" style={inputStyle} value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="usuario@ejemplo.com" required />
            </div>
            <div>
              <FieldLabel>Contraseña</FieldLabel>
              <input type="password" style={inputStyle} value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div>
              <FieldLabel>Rol</FieldLabel>
              <select style={inputStyle} value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button type="submit" disabled={creating} style={{ ...primaryBtn, cursor: creating ? "wait" : "pointer", opacity: creating ? 0.7 : 1 }}>
              {creating ? "Guardando..." : "Guardar usuario"}
            </button>
          </div>
        </form>
      )}

      {loading && <div style={{ color: TOKENS.inkFaint, fontSize: 13.5 }}>Cargando...</div>}
      {error && <div style={{ color: TOKENS.clayDark, fontSize: 13.5, marginBottom: 16 }}>{error}</div>}

      {!loading && (
        <>
          <h2 style={{ ...sectionHeading, fontSize: 16, marginBottom: 12 }}>Usuarios</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 34 }}>
            {users.map((u) => (
              <AdminUserRow
                key={u.id}
                userRow={u}
                editing={editingUserId === u.id}
                onStartEdit={() => setEditingUserId(u.id)}
                onCancelEdit={() => setEditingUserId(null)}
                onSave={(name) => saveUserName(u.id, name)}
                onDelete={() => handleDeleteUser(u.id, u.name)}
                onChangePassword={() => setPassUser(u)}
              />
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ ...sectionHeading, fontSize: 16, margin: 0 }}>Movimientos recientes</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12.5, color: TOKENS.inkSoft }}>Filtrar por:</span>
              <select
                style={{ border: `1px solid ${TOKENS.line}`, background: TOKENS.paper, borderRadius: 10, padding: "8px 10px", fontSize: 13.5, color: TOKENS.ink, cursor: "pointer" }}
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
              >
                <option value="all">Todos los usuarios</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {auditLog.length === 0 ? (
            <div style={{ color: TOKENS.inkFaint, fontSize: 13.5 }}>No hay movimientos registrados para este filtro.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {auditLog.map((entry) => (
                <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 4px", borderBottom: `1px solid ${TOKENS.line}`, fontSize: 13.5 }}>
                  <span style={{ color: TOKENS.ink }}>
                    <strong>{entry.user_name}</strong> {entry.action} <strong>{entry.recipe_title}</strong>
                  </span>
                  <span style={{ color: TOKENS.inkFaint, fontSize: 12 }}>
                    {new Date(entry.created_at).toLocaleString("es-CL")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [recipesError, setRecipesError] = useState("");
  const [view, setView] = useState("home");
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "" });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, selectedId]);

  const showToast = (message) => {
    setToast({ show: true, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000);
  };

  useEffect(() => {
    applyAppearance(loadAppearance());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const authUser = await getSessionUser();
      if (authUser) {
        try {
          const profile = await getProfile(authUser.id);
          if (!cancelled) {
            setUser({ id: authUser.id, email: authUser.email, name: profile.name, role: profile.role });
            applySyncedAppearance(profile.preferences);
          }
        } catch {
          if (!cancelled) setUser(null);
        }
      }
      if (!cancelled) setAuthChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setRecipesLoading(true);
    fetchRecipes()
      .then((data) => {
        if (!cancelled) setRecipes(data);
      })
      .catch((err) => {
        if (!cancelled) setRecipesError(err.message);
      })
      .finally(() => {
        if (!cancelled) setRecipesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const resync = () => {
      if (document.visibilityState === "visible") {
        fetchRecipes().then(setRecipes).catch(() => {});
      }
    };
    window.addEventListener("focus", resync);
    document.addEventListener("visibilitychange", resync);
    return () => {
      window.removeEventListener("focus", resync);
      document.removeEventListener("visibilitychange", resync);
    };
  }, [user]);

  const logMovement = (action, recipeTitle) => {
    if (!user) return;
    logMovementDb(user.id, user.name, action, recipeTitle);
  };

  const handleLogin = (u) => {
    setUser(u);
    applySyncedAppearance(u.preferences);
    setView("home");
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setRecipes([]);
    setView("home");
  };

  const toggleFavorite = async (id) => {
    const target = recipes.find((r) => r.id === id);
    if (!target) return;
    const nextFavorite = !target.favorite;
    setRecipes((rs) => rs.map((r) => (r.id === id ? { ...r, favorite: nextFavorite } : r)));
    try {
      await setFavoriteDb(id, nextFavorite);
    } catch (err) {
      setRecipes((rs) => rs.map((r) => (r.id === id ? { ...r, favorite: !nextFavorite } : r)));
      showToast("No se pudo actualizar favorito");
    }
  };

  const openRecipe = (id) => {
    setSelectedId(id);
    setView("detail");
  };

  const goCreate = () => {
    setEditingId(null);
    setView("create");
  };

  const goEdit = (id) => {
    setEditingId(id);
    setView("create");
  };

  const handleSaveCosting = async (recipeId, ingredients, costMargin) => {
    const updated = await saveCosting(recipeId, ingredients, costMargin);
    setRecipes((rs) => rs.map((r) => (r.id === recipeId ? updated : r)));
  };

  const saveRecipe = async (draft) => {
    try {
      if (draft.id) {
        const updated = await updateRecipeDb(draft.id, draft);
        setRecipes((rs) => rs.map((r) => (r.id === draft.id ? updated : r)));
        showToast("Receta actualizada ✓");
        logMovement("editó la receta", draft.title);
        setSelectedId(draft.id);
        setView("detail");
      } else {
        const created = await createRecipe(draft, user.id);
        setRecipes((rs) => [created, ...rs]);
        showToast("Receta guardada ✓");
        logMovement("creó la receta", created.title);
        setSelectedId(created.id);
        setView("detail");
      }
    } catch (err) {
      showToast("Error al guardar: " + err.message);
    }
  };

  const deleteRecipe = async (id) => {
    const r = recipes.find((x) => x.id === id);
    try {
      await deleteRecipeDb(id);
      setRecipes((rs) => rs.filter((r) => r.id !== id));
      showToast("Receta eliminada");
      if (r) logMovement("eliminó la receta", r.title);
      setView("recipes");
    } catch (err) {
      showToast("No se pudo eliminar: " + err.message);
    }
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: TOKENS.cream, color: TOKENS.inkFaint, fontFamily: "Inter, sans-serif" }}>
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const selected = recipes.find((r) => r.id === selectedId);
  const editingRecipe = recipes.find((r) => r.id === editingId);

  let content = null;
  if (recipesLoading && view !== "admin" && view !== "settings") {
    content = <div style={{ color: TOKENS.inkFaint, fontSize: 14.5, padding: "40px 0" }}>Cargando tus recetas...</div>;
  } else if (recipesError && view !== "admin" && view !== "settings") {
    content = <div style={{ color: TOKENS.clayDark, fontSize: 14.5, padding: "40px 0" }}>Error al cargar recetas: {recipesError}</div>;
  } else if (view === "home") {
    content = (
      <Home
        recipes={recipes}
        onOpen={openRecipe}
        onToggleFavorite={toggleFavorite}
        onCreate={goCreate}
        search={search}
        setSearch={setSearch}
        activeCat={activeCat}
        setActiveCat={setActiveCat}
        setView={setView}
        userName={user.name}
      />
    );
  } else if (view === "recipes") {
    content = <RecipesList recipes={recipes} onOpen={openRecipe} onToggleFavorite={toggleFavorite} onCreate={goCreate} />;
  } else if (view === "favorites") {
    content = <Favorites recipes={recipes} onOpen={openRecipe} onToggleFavorite={toggleFavorite} onGoRecipes={() => setView("recipes")} />;
  } else if (view === "categories") {
    content = (
      <CategoriesView
        recipes={recipes}
        onSelectCategory={(id) => {
          setActiveCat(id);
          setView("recipes");
        }}
      />
    );
  } else if (view === "costos") {
    content = <CostosView recipes={recipes} onSaveCosting={handleSaveCosting} />;
  } else if (view === "settings") {
    content = (
      <SettingsView
        user={user}
        onUpdateName={async (name) => {
          await updateProfileName(user.id, name);
          setUser((u) => ({ ...u, name }));
        }}
      />
    );
  } else if (view === "admin" && user.role === "admin") {
    content = <AdminPanel />;
  } else if (view === "detail" && selected) {
    content = (
      <RecipeDetail
        recipe={selected}
        onBack={() => setView("recipes")}
        onToggleFavorite={toggleFavorite}
        onEdit={goEdit}
        onDelete={deleteRecipe}
      />
    );
  } else if (view === "create") {
    content = <RecipeForm initial={editingRecipe} onCancel={() => setView(editingId ? "detail" : "recipes")} onSave={saveRecipe} userId={user.id} />;
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: TOKENS.cream, minHeight: "100vh", color: TOKENS.ink }}>
      <style>{`
        @import url('${FONT_IMPORT_URL}');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::selection { background: ${TOKENS.clayTint}; }
        input:focus, select:focus, textarea:focus { border-color: ${TOKENS.clay} !important; box-shadow: 0 0 0 3px ${TOKENS.clayTint}; }
        button:focus-visible, input:focus-visible, select:focus-visible, a:focus-visible { outline: 2px solid ${TOKENS.clay}; outline-offset: 2px; }
        .scroll-x::-webkit-scrollbar { height: 5px; }
        .scroll-x::-webkit-scrollbar-thumb { background: ${TOKENS.line}; border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: translateY(0);} }

        @media (max-width: 860px) {
          .sidebar { display: none !important; }
          .bottom-nav { display: flex !important; }
          .fab { display: flex !important; }
          .mobile-topbar-inner { display: flex !important; }
          .app-main { padding: 18px 16px 90px !important; }
          .detail-grid { grid-template-columns: 1fr !important; gap: 26px !important; }
          .form-4col { grid-template-columns: 1fr 1fr !important; }
          .recipe-actions { justify-content: flex-end !important; width: 100%; gap: 6px !important; }
          .recipe-actions button { padding: 5px 9px !important; font-size: 10.5px !important; gap: 4px !important; }
          .recipe-actions button span { font-size: 12px !important; }
        }
        @media (max-width: 520px) {
          .ingredient-row { grid-template-columns: 60px 76px 1fr 30px !important; }
        }
      `}</style>

      <MobileTopBar view={view} setView={setView} user={user} onLogout={handleLogout} />

      <div style={{ display: "flex" }}>
        <Sidebar view={view} setView={setView} onCreate={goCreate} recipeCount={recipes.length} user={user} onLogout={handleLogout} />
        <main className="app-main" style={{ flex: 1, padding: "32px 40px", maxWidth: 1180, margin: "0 auto", width: "100%" }}>
          {content}
          <Footer />
        </main>
      </div>

      <BottomNav view={view} setView={setView} />
      <FloatingCreateButton onClick={goCreate} />
      <Toast show={toast.show} message={toast.message} />
    </div>
  );
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}