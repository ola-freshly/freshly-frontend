export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// ----- Recipes (from main) -----

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  cuisine?: string;
  instructions: string;
  servings?: number;
  cookTime?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  // Only populated by GET /recipes/:id (findOne), not the list endpoint.
  ingredients?: RecipeIngredientInput[];
}

export interface RecipeIngredientInput {
  ingredientName: string;
  quantity?: number;
  unit?: string;
}

export interface CreateRecipeRequest {
  title: string;
  description?: string;
  cuisine?: string;
  instructions: string;
  servings?: number;
  cookTime?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  ingredients: RecipeIngredientInput[];
}

export interface GenerateRecipeRequest {
  mealType?: string;
  cuisine?: string;
  servings?: number;
  notes?: string;
}

export interface GeneratedIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface GeneratedRecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface GeneratedRecipe {
  title: string;
  description: string;
  cuisine?: string | null;
  servings: number;
  estimatedMinutes: number;
  ingredients: GeneratedIngredient[];
  instructions: string[];
  nutrition: GeneratedRecipeNutrition;
  missingIngredients: GeneratedIngredient[];
}

// ----- Pantry (from develop) -----

export enum FoodCategory {
  DAIRY = 'dairy',
  VEGETABLE = 'vegetable',
  FRUIT = 'fruit',
  MEAT = 'meat',
  SEAFOOD = 'seafood',
  GRAIN = 'grain',
  SPICE = 'spice',
  BEVERAGE = 'beverage',
  SNACK = 'snack',
  CONDIMENT = 'condiment',
  OTHER = 'other',
}

export enum PantryItemSource {
  MANUAL = 'manual',
  AI = 'ai',
  BARCODE = 'barcode',
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: FoodCategory;
  barcode?: string;
  imageUrl?: string;
  purchaseDate?: string;
  expiryDate?: string;
  source: PantryItemSource;
  usageInstruction?: string;
  aiConfidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePantryItemDto {
  name: string;
  quantity: number;
  unit: string;
  category?: FoodCategory;
  expiryDate?: string;
  usageInstruction?: string;
  source?: PantryItemSource;
  imageUrl?: string;
}

export interface UpdatePantryItemDto extends Partial<CreatePantryItemDto> {
  expiryDate?: string;
}

export interface ScanResult {
  name: string;
  category: string;
  expirationDate: string | null;
  usageInstruction: string | null;
  confidence: number;
}
