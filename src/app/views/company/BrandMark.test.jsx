import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BrandMark from './BrandMark'

describe('BrandMark', () => {
    it('shows the logo', () => {
        render(<BrandMark name='Himalayan Trails' logo='http://x.test/l.png' />)
        expect(screen.getByRole('img', { name: 'Himalayan Trails logo' })).toHaveAttribute('src', 'http://x.test/l.png')
    })
    it('shows the initials without a logo', () => {
        render(<BrandMark name='Himalayan Trails' />)
        expect(screen.getByTestId('brand-mark')).toHaveTextContent('HT')
    })
    it('falls back to the initials when the image can’t load, and tries again for a new logo', () => {
        const { rerender } = render(<BrandMark name='Himalayan Trails' logo='http://x.test/gone.png' />)
        fireEvent.error(screen.getByRole('img'))
        expect(screen.queryByRole('img')).toBeNull()
        expect(screen.getByTestId('brand-mark')).toHaveTextContent('HT')
        rerender(<BrandMark name='Himalayan Trails' logo='http://x.test/new.png' />)
        expect(screen.getByRole('img')).toHaveAttribute('src', 'http://x.test/new.png')
    })
})
