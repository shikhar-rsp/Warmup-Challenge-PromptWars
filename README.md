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

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173/
