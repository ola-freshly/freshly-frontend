import { mealPlansApi } from '@/api';

// Returns the id of the plan covering `mealDate`, creating a single-day plan if
// none exists yet. Shared by every "add to planner" path.
export async function ensureMealPlan(mealDate: string): Promise<string> {
  const plans = await mealPlansApi.list();

  const existingPlan = plans.find((plan) => {
    const startDate = String(plan.startDate).slice(0, 10);
    const endDate = String(plan.endDate).slice(0, 10);

    return startDate <= mealDate && mealDate <= endDate;
  });

  if (existingPlan) {
    return existingPlan.id;
  }

  const newPlan = await mealPlansApi.create({
    name: `Meal Plan ${mealDate}`,
    startDate: mealDate,
    endDate: mealDate,
  });

  return newPlan.id;
}
