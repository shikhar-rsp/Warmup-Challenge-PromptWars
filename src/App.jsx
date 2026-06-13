import { useState } from 'react'
import { generatePlan } from './generatePlan'

const DEFAULTS = { servings: 2, diet: 'vegetarian', budget: 800, cuisine: '' }
const SLIDER_MAX = 5000

const DIETS = [
  { id: 'omnivore', label: 'Non-veg' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
]
const MEAL_META = {
  breakfast: { label: 'Breakfast', time: 'Morning' },
  lunch: { label: 'Lunch', time: 'Midday' },
  dinner: { label: 'Dinner', time: 'Evening' },
}

// Keep the budget a sane, finite number — guards against empty/NaN/negative
// or absurdly large input from the number field.
function clampBudget(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 0
  return Math.min(100000, Math.max(0, Math.round(n)))
}

export default function App() {
  const [form, setForm] = useState(DEFAULTS)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [genId, setGenId] = useState(0)

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const onGenerate = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setPlan(generatePlan(form))
      setGenId((n) => n + 1)
      setLoading(false)
    }, 600)
  }

  const sliderPct = (Math.min(form.budget, SLIDER_MAX) / SLIDER_MAX) * 100

  return (
    <main className="page">
      <header className="hero">
        <span className="eyebrow">PromptWars · Warmup Challenge</span>
        <h1>What are we cooking today?</h1>
        <p>Tell us about your day and get a complete plan — meals, a grocery list, smart swaps, and a budget that adds up.</p>
      </header>

      <form className="card form" onSubmit={onGenerate}>
        <div className="field">
          <span className="lbl" id="diet-label">Dietary preference</span>
          <div className="segment" role="radiogroup" aria-labelledby="diet-label">
            {DIETS.map((d) => (
              <button
                type="button"
                key={d.id}
                role="radio"
                aria-checked={form.diet === d.id}
                className={`seg ${form.diet === d.id ? 'active' : ''}`}
                onClick={() => set('diet', d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="row-2">
          <div className="field">
            <span className="lbl" id="servings-label">Servings</span>
            <div className="stepper" role="group" aria-labelledby="servings-label">
              <button type="button" aria-label="Decrease servings" onClick={() => set('servings', Math.max(1, form.servings - 1))}>−</button>
              <span className="step-val" aria-live="polite">{form.servings}</span>
              <button type="button" aria-label="Increase servings" onClick={() => set('servings', Math.min(20, form.servings + 1))}>+</button>
            </div>
          </div>

          <div className="field">
            <label className="lbl" htmlFor="cuisine">Cuisine <em className="opt">optional</em></label>
            <input
              id="cuisine"
              type="text"
              placeholder="Indian, Italian…"
              value={form.cuisine}
              onChange={(e) => set('cuisine', e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <div className="lbl budget-lbl">
            <label htmlFor="budget">Budget for the day</label>
            <div className="budget-input">
              <span className="rupee" aria-hidden="true">₹</span>
              <input
                id="budget"
                type="number"
                min="0"
                max="100000"
                step="50"
                aria-label="Budget for the day in rupees"
                value={form.budget}
                onChange={(e) => set('budget', clampBudget(e.target.value))}
              />
            </div>
          </div>
          <input
            className="slider"
            type="range"
            min="200"
            max={SLIDER_MAX}
            step="50"
            aria-label="Adjust budget"
            aria-valuetext={`₹${form.budget}`}
            value={Math.min(form.budget, SLIDER_MAX)}
            onChange={(e) => set('budget', Number(e.target.value))}
            style={{ '--pct': `${sliderPct}%` }}
          />
          <div className="slider-ends">
            <span>₹200</span>
            <span>₹{SLIDER_MAX.toLocaleString('en-IN')}+</span>
          </div>
        </div>

        <button className="primary" type="submit" disabled={loading} aria-busy={loading}>
          {loading ? (<><span className="spinner" /> Building your plan…</>) : (<>Generate my plan</>)}
        </button>
      </form>

      <p className="sr-only" role="status">
        {plan && !loading ? 'Your cooking plan is ready below.' : ''}
      </p>

      {plan && !loading && <Results key={genId} plan={plan} />}
    </main>
  )
}

function Results({ plan }) {
  const { meals, groceryList, substitutions, budget } = plan
  return (
    <div className="results">
      <section className="card span-2 delay-1">
        <h2>Your meal plan</h2>
        <div className="meals">
          {['breakfast', 'lunch', 'dinner'].map((slot) => {
            const meta = MEAL_META[slot]
            const meal = meals[slot]
            return (
              <div className="meal" key={slot}>
                <span className="slot">{meta.label}<em>{meta.time}</em></span>
                <strong>{meal.name}</strong>
                <div className="chips">
                  {meal.ingredients.map((ing, i) => <span className="chip" key={i}>{ing}</span>)}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card delay-2">
        <GroceryList items={groceryList} />
      </section>

      <section className="card delay-3">
        <h2>Smart swaps</h2>
        {substitutions.length === 0 ? (
          <p className="muted empty">No swaps needed — this plan already fits your preference.</p>
        ) : (
          <ul className="subs">
            {substitutions.map((s, i) => (
              <li key={i}>
                <div className="sub-top">
                  <span className="from">{s.original}</span>
                  <span className="to-arrow">→</span>
                  <span className="swap">{s.swap}</span>
                </div>
                <span className="reason">{s.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BudgetCard budget={budget} className="span-2 delay-4" />
    </div>
  )
}

function GroceryList({ items }) {
  const [checked, setChecked] = useState(() => items.map(() => false))
  const toggle = (i) => setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)))
  const done = checked.filter(Boolean).length

  return (
    <>
      <h2>Grocery list <span className="counter" aria-live="polite">{done}/{items.length} packed</span></h2>
      <ul className="grocery">
        {items.map((g, i) => (
          <li key={i} className={checked[i] ? 'done' : ''}>
            <label className="g-item">
              <input
                type="checkbox"
                className="g-checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
              />
              <span className="check" aria-hidden="true">{checked[i] ? '✓' : ''}</span>
              <span className="g-name">{g.item} <em>{g.qty}</em></span>
              <span className="cost">₹{g.estCost}</span>
            </label>
          </li>
        ))}
      </ul>
    </>
  )
}

function BudgetCard({ budget, className = '' }) {
  const pct = Math.min(100, Math.round((budget.estimatedTotal / budget.userBudget) * 100))
  return (
    <section className={`card budget ${budget.feasible ? 'ok' : 'over'} ${className}`}>
      <h2>
        Budget check
        <span className={`verdict ${budget.feasible ? 'ok' : 'over'}`}>
          {budget.feasible ? 'Feasible' : 'Over budget'}
        </span>
      </h2>

      <div className="budget-stats">
        <div className="stat">
          <span className="stat-num">₹{budget.estimatedTotal}</span>
          <span className="stat-lbl">Estimated</span>
        </div>
        <span className="stat-sep">/</span>
        <div className="stat">
          <span className="stat-num muted">₹{budget.userBudget}</span>
          <span className="stat-lbl">Your budget</span>
        </div>
        <div className="stat-pct">{pct}<small>%</small></div>
      </div>

      <div className="bar">
        <div className={`bar-fill ${budget.feasible ? 'ok' : 'over'}`} style={{ width: `${pct}%` }} />
      </div>

      <p className="note">{budget.note}</p>
    </section>
  )
}
