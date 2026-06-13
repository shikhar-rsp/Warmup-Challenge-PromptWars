# 🍳 Cooking To-Do — PromptWars Warmup

A simple AI micro-app that turns your day into a complete cooking plan.

Built for the **PromptWars** warmup challenge (Google for Developers · Build with AI).

## What it does

Tell the app about your day (servings, dietary preference, budget, cuisine) and it produces a structured meal-planning flow:

- 🍽️ **Meal plan** — Breakfast / Lunch / Dinner
- 🛒 **Grocery list** — checkable, with per-item quantities and costs
- 🔄 **Smart swaps** — diet-aware ingredient substitutions
- 💰 **Budget check** — feasibility logic comparing estimated cost vs. your budget

## Tech

- React + Vite
- The planning flow lives in a single function, [`generatePlan()`](src/generatePlan.js), which returns
  `{ meals, groceryList, substitutions, budget }`. It currently runs on a local rule-based engine
  that reacts to the user's input — swap its body for a Claude API call returning the same shape to make it fully AI-driven.

## Accessibility

- Diet selector is a proper `radiogroup`; grocery items are real keyboard-focusable checkboxes with visible focus rings
- All inputs are label-associated; icon-only buttons and the budget slider have ARIA labels
- Live regions announce servings and grocery progress; honours `prefers-reduced-motion`

## Run locally

```bash
npm install
npm run dev      # start dev server → http://localhost:5173/
npm test         # run the unit tests (Vitest)
npm run build    # production build
```

## Testing

The planning engine is pure and unit-tested with [Vitest](https://vitest.dev)
([`src/generatePlan.test.js`](src/generatePlan.test.js)) — covering output shape,
budget feasibility (both directions), serving-based cost scaling, diet-aware
substitutions, cuisine handling, and the unknown-diet fallback.
