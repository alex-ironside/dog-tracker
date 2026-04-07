import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '../i18n'
import { LanguageToggle } from './LanguageToggle'

describe('LanguageToggle', () => {
  beforeEach(async () => {
    localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('clicking the PL button switches i18n.resolvedLanguage to pl', async () => {
    const user = userEvent.setup()
    render(<LanguageToggle />)
    expect(i18n.resolvedLanguage).toBe('en')

    await user.click(screen.getByRole('button', { name: 'PL' }))

    expect(i18n.resolvedLanguage).toBe('pl')
  })

  it('persists the selected language to localStorage under i18nextLng', async () => {
    const user = userEvent.setup()
    render(<LanguageToggle />)

    await user.click(screen.getByRole('button', { name: 'PL' }))

    expect(localStorage.getItem('i18nextLng')).toBe('pl')
  })
})
