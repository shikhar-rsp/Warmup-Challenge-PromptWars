import { describe, it, expect } from 'vitest'
import { generatePlan } from './generatePlan'

describe('generatePlan', () => {
  it('returns the full structured plan shape', () => {
    const plan = generatePlan({ servings: 2, diet: 'vegetarian', budget: 800, cuisine: '' })

    expect(plan).toHaveProperty('meals.breakfast')
    expect(plan).toHaveProperty('meals.lunch')
    expect(plan).toHaveProperty('meals.dinner')
    expect(Array.isArray(plan.groceryList)).toBe(true)
    expect(Array.isArray(plan.substitutions)).toBe(true)
    expect(plan.budget).toEqual(
      expect.objectContaining({
        estimatedTotal: expect.any(Number),
        userBudget: 800,
        feasible: expect.any(Boolean),
        note: expect.any(String),
      })
    )
  })

  it('produces a meal name and ingredients for every slot', () => {
    const { meals } = generatePlan({ servings: 2, diet: 'omnivore', budget: 1000 })
    for (const slot of ['breakfast', 'lunch', 'dinner']) {
      expect(meals[slot].name).toBeTruthy()
      expect(meals[slot].ingredients.length).toBeGreaterThan(0)
    }
  })

  it('marks the budget feasible when the estimate fits', () => {
    const { budget } = generatePlan({ servings: 2, diet: 'vegetarian', budget: 100000 })
    expect(budget.feasible).toBe(true)
    expect(budget.estimatedTotal).toBeLessThanOrEqual(budget.userBudget)
    expect(budget.note).toMatch(/spare/i)
  })

  it('flags the budget as over when the estimate exceeds it', () => {
    const { budget } = generatePlan({ servings: 6, diet: 'omnivore', budget: 100 })
    expect(budget.feasible).toBe(false)
    expect(budget.estimatedTotal).toBeGreaterThan(budget.userBudget)
    expect(budget.note).toMatch(/over budget/i)
  })

  it('scales estimated cost up with more servings', () => {
    const two = generatePlan({ servings: 2, diet: 'vegan', budget: 1000 })
    const six = generatePlan({ servings: 6, diet: 'vegan', budget: 1000 })
    expect(six.budget.estimatedTotal).toBeGreaterThan(two.budget.estimatedTotal)
  })

  it('only suggests substitutions relevant to the chosen diet', () => {
    const vegan = generatePlan({ servings: 2, diet: 'vegan', budget: 1000 })
    // every swap must apply to an ingredient that is actually on the grocery list
    const onList = new Set(vegan.groceryList.map((g) => g.item))
    for (const sub of vegan.substitutions) {
      expect(onList.has(sub.original)).toBe(true)
      expect(sub.swap).toBeTruthy()
      expect(sub.reason).toBeTruthy()
    }
  })

  it('reflects the cuisine in meal names when provided', () => {
    const { meals } = generatePlan({ servings: 2, diet: 'vegetarian', budget: 800, cuisine: 'Italian' })
    expect(meals.breakfast.name).toMatch(/Italian/)
  })

  it('falls back to a valid diet when given an unknown one', () => {
    const plan = generatePlan({ servings: 2, diet: 'carnivore-only', budget: 800 })
    expect(plan.meals.breakfast.name).toBeTruthy()
    expect(plan.groceryList.length).toBeGreaterThan(0)
  })

  it('estimated total equals the sum of grocery item costs', () => {
    const { groceryList, budget } = generatePlan({ servings: 3, diet: 'omnivore', budget: 1000 })
    const sum = groceryList.reduce((acc, g) => acc + g.estCost, 0)
    expect(budget.estimatedTotal).toBe(sum)
  })
})
