import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import ThemeSelect from './ThemeSelect'

const THEMES = [{ key: 'classic', label: 'Classic', description: 'The default', swatch: ['#123456'] }]

const labelOf = name => screen.getByText(name, { selector: 'label' })

describe('ThemeSelect', () => {
    test('the label sits above "follow the theme for all emails" instead of over it', () => {
        render(
            <ThemeSelect
                themes={THEMES}
                value=''
                onChange={() => {}}
                label='Theme for this email'
                followLabel='Same as all emails (Classic)'
            />
        )
        expect(labelOf('Theme for this email')).toHaveAttribute('data-shrink', 'true')
        expect(screen.getByText('Same as all emails (Classic)')).toBeInTheDocument()
    })

    test('the label sits above a chosen theme', () => {
        render(<ThemeSelect themes={THEMES} value='classic' onChange={() => {}} label='Theme' />)
        expect(labelOf('Theme')).toHaveAttribute('data-shrink', 'true')
    })
})
