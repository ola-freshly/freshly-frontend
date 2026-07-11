import { addDays, iso, plannerStore, startOfWeek, type PlannerDish } from '../store';

describe('meal planner store', () => {
  const date = '2099-01-01';

  const firstDish: PlannerDish = {
    id: 'dish-1',
    title: 'Chicken Rice',
    cookTime: 25,
    calories: 450,
  };

  const secondDish: PlannerDish = {
    id: 'dish-2',
    title: 'Vegetable Soup',
    cookTime: 20,
    calories: 300,
  };

  beforeEach(() => {
    plannerStore.remove(date, 'lunch', firstDish.id);
    plannerStore.remove(date, 'lunch', secondDish.id);
  });

  it('adds a dish to a meal', () => {
    plannerStore.add(date, 'lunch', firstDish);

    expect(plannerStore.get(date, 'lunch')).toContainEqual(firstDish);
  });

  it('supports multiple dishes in one meal', () => {
    plannerStore.add(date, 'lunch', firstDish);
    plannerStore.add(date, 'lunch', secondDish);

    expect(plannerStore.get(date, 'lunch')).toEqual([firstDish, secondDish]);
  });

  it('removes a dish from a meal', () => {
    plannerStore.add(date, 'lunch', firstDish);
    plannerStore.add(date, 'lunch', secondDish);

    plannerStore.remove(date, 'lunch', firstDish.id);

    expect(plannerStore.get(date, 'lunch')).toEqual([secondDish]);
  });

  it('keeps meals separated by meal type', () => {
    plannerStore.add(date, 'breakfast', firstDish);
    plannerStore.add(date, 'dinner', secondDish);

    expect(plannerStore.get(date, 'breakfast')).toContainEqual(firstDish);
    expect(plannerStore.get(date, 'dinner')).toContainEqual(secondDish);
  });

  it('calculates the Monday start of a week', () => {
    const result = startOfWeek(new Date('2026-07-11T12:00:00'));

    expect(result.getDay()).toBe(1);
    expect(result.getHours()).toBe(0);
  });

  it('adds days and formats dates as ISO', () => {
    const dateValue = new Date('2026-07-06T12:00:00');
    const nextDate = addDays(dateValue, 2);

    expect(iso(nextDate)).toBe('2026-07-08');
  });
});
