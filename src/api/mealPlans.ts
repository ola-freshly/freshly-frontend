import client from './client';

const AI_TIMEOUT = 120_000;

export type GeneratedIngredient = {
  name: string;
  quantity: number;
  unit: string;
};

export type MealRecommendationRecipe = {
  title: string;
  description?: string;
  cuisine?: string;
  servings?: number;
  estimatedMinutes?: number;
  instructions: string[];
  ingredients?: GeneratedIngredient[];
  missingIngredients?: GeneratedIngredient[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

export type MealPlan = {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
};

export type DailyRecommendation = {
  type: 'daily';
  mealDate: string;
  meals: {
    mealType: string;
    recipes: MealRecommendationRecipe[];
  }[];
};

export type RefreshRecommendation = {
  type: 'refresh';
  mealDate: string;
  mealType: string;
  recipes: MealRecommendationRecipe[];
};

export type AcceptRecommendation = {
  acceptedCount: number;
  skippedDuplicateCount: number;
  skippedDuplicates: string[];
  items: {
    id: string;
    mealPlanId: string;
    recipeId: string;
    mealDate: string;
    mealType: string;
  }[];
};

export type MealPlanItemRecord = {
  id: string;
  mealPlanId: string;
  recipeId: string;
  mealDate: string;
  mealType: string;
  recipe?: {
    title: string;
    cookTime?: number | null;
    calories?: number | string | null;
  };
};

function normalisePlans(value: unknown): MealPlan[] {
  if (Array.isArray(value)) {
    return value as MealPlan[];
  }

  if (value && typeof value === 'object') {
    const response = value as {
      items?: MealPlan[];
      data?: MealPlan[];
      mealPlans?: MealPlan[];
    };

    return response.items ?? response.data ?? response.mealPlans ?? [];
  }

  return [];
}

export const mealPlansApi = {
  async list(): Promise<MealPlan[]> {
    const response = await client.get('/meal-plans');
    return normalisePlans(response.data);
  },

  async remove(id:string):Promise<void>{
    await client.delete(`/meal-plan-items/${id}`);
  },

  // All items across the user's plans within [from, to] — one request per week.
  async itemsByRange(from: string, to: string): Promise<MealPlanItemRecord[]> {
    const response = await client.get<MealPlanItemRecord[]>('/meal-plan-items', {
      params: { from, to },
    });
    return response.data;
  },

  async create(payload: { name: string; startDate: string; endDate: string }): Promise<MealPlan> {
    const response = await client.post<MealPlan>('/meal-plans', payload);
    return response.data;
  },

  async daily(payload: {
    mealDate: string;
    mealTypes: string[];
    dishesPerMeal?: number;
  }): Promise<DailyRecommendation> {
    const response = await client.post<DailyRecommendation>(
      '/meal-recommendations/daily',
      payload,
      { timeout: AI_TIMEOUT },
    );

    return response.data;
  },

  async weekly(payload: {
    startDate: string;
    mealTypes: string[];
    dishesPerMeal?: number;
    days?: number;
  }) {
    const response = await client.post('/meal-recommendations/weekly', payload, {
      timeout: AI_TIMEOUT,
    });

    return response.data;
  },

  async refresh(payload: {
    mealDate: string;
    mealType: string;
    dishesPerMeal?: number;
    excludeTitles?: string[];
  }): Promise<RefreshRecommendation> {
    const response = await client.post<RefreshRecommendation>(
      '/meal-recommendations/refresh',
      payload,
      { timeout: AI_TIMEOUT },
    );

    return response.data;
  },

  async accept(payload: {
    mealPlanId: string;
    suggestions: {
      mealDate: string;
      mealType: string;
      recipe: MealRecommendationRecipe;
    }[];
  }): Promise<AcceptRecommendation> {
    const response = await client.post<AcceptRecommendation>(
      '/meal-recommendations/accept',
      payload,
      { timeout: AI_TIMEOUT },
    );

    return response.data;
  },
};
