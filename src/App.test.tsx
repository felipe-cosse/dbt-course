import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('DBT Forge learning flow', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows the complete curriculum and opens the current lesson', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /master dbt by/i })).toBeInTheDocument()
    expect(screen.getByText(/42 focused lessons\. 18 hands-on labs/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /continue lesson/i }))

    expect(screen.getByRole('heading', { name: 'ELT, Analytics Engineering, and dbt' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /lab/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('navigates to the searchable field guide', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Resources' }))

    expect(screen.getByRole('heading', { name: 'Field guide' })).toBeInTheDocument()
    expect(screen.getByText('dbt build')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Search glossary' })).toBeInTheDocument()
  })
})
