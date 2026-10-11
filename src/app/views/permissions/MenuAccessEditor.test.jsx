import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, test, vi } from 'vitest'
import MenuAccessEditor from './MenuAccessEditor'
import MenuAccessPage from './MenuAccessPage'

vi.mock('react-redux', () => ({ useDispatch: () => action => action, useSelector: select => select({}) }))

const menus = [
    {
        id: 1,
        label: 'Leads',
        url: '/process/leads',
        group: 'process',
        access: false,
        fromRole: true,
        roleName: 'SALES'
    },
    { id: 2, label: 'Packages', url: '/process/packages', group: 'process', access: true, fromRole: false },
    { id: 3, label: 'Transactions', url: '/process/transactions', group: 'process', access: false, fromRole: false },
    { id: 4, label: 'Destinations', url: '/master/destinations', group: 'master', access: false, fromRole: false }
]

// eslint-disable-next-line react/prop-types
function Harness({ initial = [2] }) {
    const [value, setValue] = useState(initial)
    return (
        <>
            <MenuAccessEditor menus={menus} value={value} onChange={setValue} />
            <output data-testid='value'>{[...value].sort().join(',')}</output>
        </>
    )
}

const switchFor = name => screen.getByRole('checkbox', { name })

describe('MenuAccessEditor', () => {
    test('groups screens, counts them, and toggles one', () => {
        render(<Harness />)
        expect(screen.getByText('Masters')).toBeInTheDocument()
        expect(screen.getByText('Operations')).toBeInTheDocument()
        expect(screen.getByTestId('menu-access-summary')).toHaveTextContent('2 of 4 screens on')
        expect(screen.getByText('2 of 3 on')).toBeInTheDocument()

        fireEvent.click(switchFor('Transactions'))
        expect(screen.getByTestId('value')).toHaveTextContent('2,3')
        expect(screen.getByText('3 of 3 on')).toBeInTheDocument()
    })

    test('a role’s screen is on, locked and says where it comes from', () => {
        render(<Harness />)
        const leads = switchFor('Leads')
        expect(leads).toBeChecked()
        expect(leads).toBeDisabled()
        expect(screen.getByText('From role SALES')).toBeInTheDocument()
    })

    test('a section’s switch turns all its screens on, then off — the role’s stay', () => {
        render(<Harness />)
        fireEvent.click(switchFor('All Operations on'))
        expect(screen.getByTestId('value')).toHaveTextContent('2,3')
        fireEvent.click(switchFor('All Operations on'))
        expect(screen.getByTestId('value')).toHaveTextContent('')
        expect(switchFor('Leads')).toBeChecked()
    })

    test('the search narrows the list', () => {
        render(<Harness />)
        fireEvent.change(screen.getByLabelText('Search screens'), { target: { value: 'dest' } })
        expect(screen.getByText('Destinations')).toBeInTheDocument()
        expect(screen.queryByText('Packages')).not.toBeInTheDocument()
        fireEvent.change(screen.getByLabelText('Search screens'), { target: { value: 'zzz' } })
        expect(screen.getByText(/No screen matches/)).toBeInTheDocument()
    })
})

describe('MenuAccessPage', () => {
    test('counts unsaved changes, discards them, and saves only the user’s own screens', async () => {
        const onSave = vi.fn(() => Promise.resolve({ message: 'Saved' }))
        render(
            <MemoryRouter>
                <MenuAccessPage title='Screens for this user' backTo='/master/user' menus={menus} onSave={onSave} />
            </MemoryRouter>
        )
        const save = screen.getByRole('button', { name: 'Save' })
        expect(save).toBeDisabled()
        expect(screen.getByText('All changes saved')).toBeInTheDocument()

        fireEvent.click(switchFor('Destinations'))
        fireEvent.click(switchFor('Packages'))
        expect(screen.getByText('2 unsaved changes')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
        expect(screen.getByText('All changes saved')).toBeInTheDocument()
        expect(switchFor('Packages')).toBeChecked()

        fireEvent.click(switchFor('Destinations'))
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))
        await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
        // ? Leads comes from the role: never sent as the user's own
        expect([...onSave.mock.calls[0][0]].sort()).toEqual([2, 4])
        await waitFor(() => expect(screen.getByText('All changes saved')).toBeInTheDocument())
    })

    test('shows the server’s message when the screens can’t load', () => {
        render(
            <MemoryRouter>
                <MenuAccessPage
                    title='Screens'
                    menus={[]}
                    error={{ data: { message: 'This user is not in this agency' } }}
                    onSave={vi.fn()}
                />
            </MemoryRouter>
        )
        expect(screen.getByText('This user is not in this agency')).toBeInTheDocument()
    })
})
