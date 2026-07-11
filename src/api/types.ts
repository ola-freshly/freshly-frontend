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

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  instructions: string;
  servings?: number;
  estimatedTime?: number;
  ingredients: string[];
}

export interface CreateRecipeRequest {
  title: string;
  description?: string;
  instructions: string;
  servings?: number;
  estimatedTime?: number;
  ingredients: string[];
}

export interface GenerateRecipeRequest {
  pantryItems: string[];
  preferences?: string;
}

export interface GeneratedRecipe {
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string;
  estimatedTime: number;
  servings: number;
  missingIngredients?: string[];
}
