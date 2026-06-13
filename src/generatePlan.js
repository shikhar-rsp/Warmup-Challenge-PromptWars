// ─────────────────────────────────────────────────────────────────────────────
// generatePlan(formData) — the single entry point for the meal-planning flow.
//
// Right now it returns realistic MOCK data that genuinely reacts to the user's
// input (servings scale cost, diet drives substitutions, budget is computed).
//
// To make it REAL later: replace the body of generatePlan() with a Claude API
// call that returns the SAME shape. Nothing else in the app needs to change.
//   shape: { meals, groceryList, substitutions, budget }
// ─────────────────────────────────────────────────────────────────────────────

// A tiny recipe "library" keyed loosely by diet so output feels tailored.
const RECIPES = {
  omnivore: {
    breakfast: { name: 'Veggie Omelette & Toast', items: [['Eggs', '4', 60], ['Bread', '4 slices', 20], ['Bell pepper', '1', 25], ['Cheese', '50g', 40]] },
    lunch:     { name: 'Grilled Chicken Rice Bowl', items: [['Chicken breast', '300g', 180], ['Rice', '1.5 cups', 30], ['Mixed veggies', '200g', 50], ['Soy sauce', '2 tbsp', 10]] },
    dinner:    { name: 'Pasta in Tomato Sauce', items: [['Pasta', '250g', 60], ['Tomatoes', '4', 40], ['Garlic', '5 cloves', 10], ['Olive oil', '2 tbsp', 30]] },
  },
  vegetarian: {
    breakfast: { name: 'Masala Oats & Fruit', items: [['Oats', '1 cup', 25], ['Milk', '200ml', 30], ['Banana', '2', 20], ['Mixed nuts', '30g', 45]] },
    lunch:     { name: 'Paneer & Veg Pulao', items: [['Paneer', '200g', 120], ['Rice', '1.5 cups', 30], ['Mixed veggies', '200g', 50], ['Spices', 'mix', 20]] },
    dinner:    { name: 'Dal, Roti & Salad', items: [['Lentils', '1 cup', 40], ['Flour', '2 cups', 30], ['Onion & tomato', '300g', 35], ['Cucumber', '1', 15]] },
  },
  vegan: {
    breakfast: { name: 'Tofu Scramble & Toast', items: [['Tofu', '200g', 90], ['Bread', '4 slices', 20], ['Spinach', '100g', 25], ['Turmeric', 'pinch', 5]] },
    lunch:     { name: 'Chickpea Buddha Bowl', items: [['Chickpeas', '1 cup', 40], ['Quinoa', '1 cup', 70], ['Avocado', '1', 60], ['Lemon', '1', 10]] },
    dinner:    { name: 'Stir-fried Veg Noodles', items: [['Noodles', '250g', 50], ['Mixed veggies', '250g', 60], ['Tofu', '150g', 70], ['Sesame oil', '1 tbsp', 20]] },
  },
}

// Common ingredient swaps, filtered by what's relevant to the chosen diet.
const SUB_LIBRARY = [
  { original: 'Eggs',          swap: 'Tofu / besan batter',        reason: 'vegan & egg-allergy friendly',     diets: ['vegan'] },
  { original: 'Chicken breast',swap: 'Paneer or soy chunks',       reason: 'vegetarian protein swap',          diets: ['vegetarian', 'vegan'] },
  { original: 'Milk',          swap: 'Oat or almond milk',         reason: 'lactose-free / vegan',             diets: ['vegan'] },
  { original: 'Paneer',        swap: 'Tofu',                       reason: 'vegan, lower cost',                diets: ['vegan'] },
  { original: 'Pasta',         swap: 'Whole-wheat or millet pasta',reason: 'higher fibre, gluten-conscious',   diets: ['omnivore', 'vegetarian', 'vegan'] },
  { original: 'Rice',          swap: 'Quinoa or brown rice',       reason: 'lower glycemic index',             diets: ['omnivore', 'vegetarian', 'vegan'] },
  { original: 'Cheese',        swap: 'Nutritional yeast',          reason: 'vegan, cheesy flavour',            diets: ['vegan'] },
]

export function generatePlan(formData) {
  const { servings = 2, diet = 'omnivore', budget = 800, cuisine = '' } = formData
  const book = RECIPES[diet] || RECIPES.omnivore

  // Scale every ingredient cost by servings (base recipes assume 2 servings).
  const scale = Math.max(1, servings) / 2
  const round = (n) => Math.round(n)

  const buildMeal = (slot) => {
    const r = book[slot]
    return {
      name: cuisine ? `${r.name} (${cuisine} style)` : r.name,
      ingredients: r.items.map(([item, qty]) => item),
    }
  }

  const meals = {
    breakfast: buildMeal('breakfast'),
    lunch: buildMeal('lunch'),
    dinner: buildMeal('dinner'),
  }

  // Grocery list = every ingredient across the 3 meals, cost scaled by servings.
  const groceryList = ['breakfast', 'lunch', 'dinner'].flatMap((slot) =>
    book[slot].items.map(([item, qty, cost]) => ({
      item,
      qty: scaleQty(qty, scale),
      estCost: round(cost * scale),
    }))
  )

  const estimatedTotal = groceryList.reduce((sum, g) => sum + g.estCost, 0)

  // Substitutions relevant to the chosen diet, limited to ingredients on the list.
  const onList = new Set(groceryList.map((g) => g.item))
  const substitutions = SUB_LIBRARY
    .filter((s) => s.diets.includes(diet) && onList.has(s.original))
    .map(({ original, swap, reason }) => ({ original, swap, reason }))

  // Budget feasibility logic.
  const feasible = estimatedTotal <= budget
  const diff = Math.abs(estimatedTotal - budget)
  const note = feasible
    ? `Plan fits your ₹${budget} budget with ₹${round(diff)} to spare.`
    : `Plan is ₹${round(diff)} over budget. Try the cheaper substitutions above or reduce servings.`

  return {
    meals,
    groceryList,
    substitutions,
    budget: { estimatedTotal, userBudget: budget, feasible, note },
  }
}

// Roughly scale a quantity string like "300g" or "1.5 cups" or "4".
function scaleQty(qty, scale) {
  if (scale === 1) return qty
  const m = String(qty).match(/^([\d.]+)\s*(.*)$/)
  if (!m) return qty
  const n = parseFloat(m[1]) * scale
  const unit = m[2]
  const pretty = Number.isInteger(n) ? n : n.toFixed(1)
  return unit ? `${pretty} ${unit}` : `${pretty}`
}
