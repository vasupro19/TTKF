import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import UserProfilePopper from './UserProfilePopper'

const openAt = () => ({ name: 'profile', anchor: document.body })

describe('account menu', () => {
    test('shows who is signed in, their agency and Logout — nothing else', () => {
        render(
            <UserProfilePopper
                openMenu={openAt()}
                handleMenuClose={vi.fn()}
                handleLogout={vi.fn()}
                user={{ name: 'Asha', email: 'asha@acme.test', clientId: 5, clientName: 'Acme Tours' }}
            />
        )
        expect(screen.getByText('Asha')).toBeTruthy()
        expect(screen.getByText('asha@acme.test')).toBeTruthy()
        expect(screen.getByText('Acme Tours')).toBeTruthy()
        expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual(['Logout'])
        expect(screen.queryByText(/No Client|Profile|Settings|Keyboard|Switch Account/)).toBeNull()
    })

    test('the super admin is labelled as such, and Logout logs out', () => {
        const logout = vi.fn()
        render(
            <UserProfilePopper
                openMenu={openAt()}
                handleMenuClose={vi.fn()}
                handleLogout={logout}
                user={{ email: 'ops@vendor.test', clientId: null }}
            />
        )
        expect(screen.getByText('Platform admin')).toBeTruthy()
        fireEvent.click(screen.getByRole('menuitem', { name: /logout/i }))
        expect(logout).toHaveBeenCalled()
    })
})
