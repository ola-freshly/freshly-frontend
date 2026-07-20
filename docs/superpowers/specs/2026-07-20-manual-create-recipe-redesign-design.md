# Manual Create-Recipe Screen Redesign

Date: 2026-07-20
Branch: FRES-66-integrate-recipe-crud-ap-is

## Goal

Rebuild the manual "Add recipe" screen (`CreateRecipeScreen`) to match the
provided reference layout (sectioned cards, add-buttons, boxes, dropdowns) while
recoloring from the reference's dark+orange look to the app's **green + white**
theme (from `src/screens/mealplan/theme.ts`: `ACCENT #16A34A`, tint `#F0FDF4` /
`#DCFCE7`, white bg, text `#111827`).

Constraint: **frontend only. Do not modify the backend.** The form must fit the
existing backend data structure.

## Backend contract (source of truth — unchanged)

`CreateRecipeDto`:
- `title` (required)
- `description?`
- `cuisine?`
- `servings?` (number)
- `cookTime?` (number, minutes)
- `instructions` (required, single text string)
- `ingredients?: { ingredientName: string; quantity?: number; unit?: string }[]`

## Frontend contract fix

Current `CreateRecipeRequest` in `src/api/types.ts` is mismatched with the
backend (`ingredients: string[]`, `estimatedTime`). Align it to the DTO:
`{ title; description?; cuisine?; servings?; cookTime?; instructions; ingredients: Ingredient[] }`
where `Ingredient = { ingredientName; quantity?; unit? }`. Update
`recipesApi.createRecipe` accordingly. (This corrects a real existing bug.)

## Screen layout (top → bottom)

- **Header** (via `<Stack.Screen>` inside the screen): back chevron, title
  "Add recipe", green **Save** pill in `headerRight` wired to save handler +
  loading state.
- **Title** — prominent text input (required).
- **Description** — multiline box → `description`.
- **Ingredients** section
  - `+ Ingredient` (solid green pill) adds a dynamic row: name + quantity + unit
    + remove (✕).
  - Paste box ("…or paste multiple ingredients here") bulk-adds rows split by
    newline/comma.
  - Maps to `ingredients[]`.
- **Instructions** section
  - `+ Step` (solid green pill) adds a dynamic step row + remove (✕).
  - Paste box ("…or paste all instructions here") fills steps split by newline.
  - Serialized to a single numbered `instructions` string on Save.
- **Servings** — dropdown (`Set servings`, options 1–12) → `servings`.
- **Cook time** — dropdown (`Set time`, minute presets) → `cookTime`.

## Dropped from the reference (no backend field — not built)

- **Prep time** (backend only has `cookTime`).
- **Collection** (no such field).
- **`+ Header`** grouping buttons for ingredients/steps (no field to persist).

## Theme / component styling

- Primary pills (`+ Ingredient`, `+ Step`, Save): solid `#16A34A`, white text.
- Boxes / dropdowns: white / `#F9FAFB` fill, light border, radius 12,
  `chevron-down` icon on dropdowns.
- Section titles: `#111827`, bold.
- Reuse existing `FeedbackModal` (already green) for success/error.
- New small `DropdownField` component (modal list picker) since no native picker
  dependency is installed.

## Save serialization

Validate title + at least one ingredient + at least one step, then:
```
createRecipe({
  title, description, servings, cookTime,
  instructions: steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
  ingredients: rows.map(r => ({ ingredientName, quantity, unit })),
})
```

## Testing

- Update `src/api/__tests__/recipes.test.ts` for the new `createRecipe` payload
  shape.
- Component tests (React Native Testing Library) for: adding/removing ingredient
  and step rows, paste-box bulk add, dropdown selection, and validation gating.
