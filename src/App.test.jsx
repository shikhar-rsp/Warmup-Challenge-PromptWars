// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import App from './App'

afterEach(cleanup)

describe('App — cooking to-do flow', () => {
  it('renders the form before any plan is generated', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /what are we cooking today/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate my plan/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /your meal plan/i })).not.toBeInTheDocument()
  })

  it('generates a full plan with all four output sections', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /generate my plan/i }))

    // findBy waits for the async (setTimeout) plan to appear
    expect(await screen.findByRole('heading', { name: /your meal plan/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /grocery list/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /smart swaps/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /budget check/i })).toBeInTheDocument()
  })

  it('lets the user switch diet via the radiogroup', async () => {
    const user = userEvent.setup()
    render(<App />)
    const vegan = screen.getByRole('radio', { name: /vegan/i })
    await user.click(vegan)
    expect(vegan).toHaveAttribute('aria-checked', 'true')
  })

  it('toggles a grocery item with the keyboard-accessible checkbox', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /generate my plan/i }))
    await screen.findByRole('heading', { name: /grocery list/i })

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
    expect(checkboxes[0]).not.toBeChecked()
    await user.click(checkboxes[0])
    expect(checkboxes[0]).toBeChecked()
  })

  it('shows an over-budget verdict for a tiny budget', async () => {
    const user = userEvent.setup()
    render(<App />)

    const budgetField = screen.getByLabelText(/budget for the day in rupees/i)
    await user.clear(budgetField)
    await user.type(budgetField, '100')
    await user.click(screen.getByRole('button', { name: /generate my plan/i }))

    const budgetCard = (await screen.findByRole('heading', { name: /budget check/i })).closest('section')
    // exact match targets the verdict badge, not the "…over budget." note sentence
    expect(within(budgetCard).getByText('Over budget')).toBeInTheDocument()
  })
})
