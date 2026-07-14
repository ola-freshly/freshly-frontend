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
