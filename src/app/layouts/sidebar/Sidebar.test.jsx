import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { SidebarContent } from './Sidebar'
import { readRememberedCampaign, rememberCampaign } from './navModel'

const state = vi.hoisted(() => ({
    auth: { user: { id: 1, clientId: 5, clientName: 'Acme Tours' }, menuItems: [] },
    campaigns: { data: { data: [] }, isSuccess: true, isFetching: false }
}))
vi.mock('react-redux', () => ({ useSelector: select => select({ auth: state.auth }) }))
vi.mock('@/app/store/slices/api/campaignSlice', () => ({
    useGetCampaignsQuery: (arg, options) =>
        options?.skip ? { data: undefined, isSuccess: false, isFetching: false } : state.campaigns
}))

const item = (url, label) => ({ id: url, url, label, type: 'item', icon: 'BlurOn' })
const AGENCY_MENU = [
    {
        id: 'master',
        label: 'Master',
        children: [
            item('/dashboard', 'DashBoard'),
            item('/master/campaigns', 'Campaigns'),
            item('/master/user', 'User')
        ]
    },
    {
        id: 'process',
        label: 'Process',
        children: [item('/process/leads', 'Leads'), item('/process/packages', 'Packages')]
    }
]

function Where() {
    const { pathname } = useLocation()
    return <div data-testid='where'>{pathname}</div>
}

const renderAt = (path, { collapsed, onToggleCollapsed, onNavigate } = {}) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <SidebarContent collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} onNavigate={onNavigate} />
            <Routes>
                <Route path='*' element={<Where />} />
            </Routes>
        </MemoryRouter>
    )

const sectionNames = () => screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)

beforeEach(() => {
    state.auth = { user: { id: 1, clientId: 5, clientName: 'Acme Tours' }, menuItems: AGENCY_MENU }
    state.campaigns = {
        data: {
            data: [
                { id: 7, title: 'Bali Escape' },
                { id: 9, title: 'Kerala Backwaters' }
            ]
        },
        isSuccess: true,
        isFetching: false
    }
})
afterEach(() => window.localStorage.clear())

describe('sidebar', () => {
    test('shows the agency, and sections built from the menu with friendly labels; empty ones hidden', () => {
        renderAt('/dashboard')
        expect(screen.getByTestId('sidebar-agency')).toHaveTextContent('Acme Tours')
        expect(sectionNames()).toEqual(['Sales', 'Products', 'Setup'])
        expect(screen.queryByText('Lead channels')).toBeNull()
        expect(screen.getByRole('link', { name: 'Bookings' })).toHaveAttribute('href', '/process/packages')
        expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/master/user')
        expect(screen.queryByText('Clients')).toBeNull()
        expect(screen.queryByText('Packages')).toBeNull() // Campaigns is closed; the API's "Packages" is Bookings
    })

    test('the platform admin sees Clients and their own label', () => {
        state.auth = {
            user: { id: 1, clientId: null },
            menuItems: [{ id: 'master', label: 'Master', children: [item('/master/client', 'Client')] }]
        }
        renderAt('/master/client')
        expect(screen.getByTestId('sidebar-agency')).toHaveTextContent('Platform admin')
        expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute('aria-current', 'page')
    })

    test('highlights the item whose address is the longest prefix of the page', () => {
        renderAt('/process/guest/add/12')
        expect(screen.getByRole('link', { name: 'Leads' })).toHaveAttribute('aria-current', 'page')
        expect(screen.getByRole('link', { name: 'Bookings' })).not.toHaveAttribute('aria-current')
    })

    test('a campaign sub-page opens the Campaigns menu', () => {
        renderAt('/master/destinations/edit/5')
        const campaignMenu = screen.getByRole('list', { name: 'Campaign menu' })
        expect(within(campaignMenu).getByRole('link', { name: 'All campaigns' })).toHaveAttribute(
            'href',
            '/master/campaigns'
        )
        expect(within(campaignMenu).getByText('Choose a trip')).toBeInTheDocument()
    })

    test("opening a campaign's own list chooses that trip and highlights the list", async () => {
        renderAt('/master/itenary/9')
        await waitFor(() =>
            expect(readRememberedCampaign(state.auth.user)).toEqual({ id: '9', title: 'Kerala Backwaters' })
        )
        const campaignMenu = screen.getByRole('list', { name: 'Campaign menu' })
        expect(await within(campaignMenu).findByText('Trip: Kerala Backwaters')).toBeInTheDocument()
        expect(within(campaignMenu).getByRole('link', { name: 'Itineraries' })).toHaveAttribute('aria-current', 'page')
        expect(within(campaignMenu).getByRole('link', { name: 'Packages' })).toHaveAttribute(
            'href',
            '/master/packages/9'
        )
    })

    test('with a remembered campaign, sub-items link to it; the switcher changes it', async () => {
        rememberCampaign(state.auth.user, { id: 7, title: 'Bali Escape' })
        renderAt('/master/destinations/7')
        const campaignMenu = screen.getByRole('list', { name: 'Campaign menu' })
        expect(within(campaignMenu).getByRole('link', { name: 'Destinations' })).toHaveAttribute('aria-current', 'page')
        expect(within(campaignMenu).getByRole('link', { name: 'Itineraries' })).toHaveAttribute(
            'href',
            '/master/itenary/7'
        )

        fireEvent.click(within(campaignMenu).getByRole('button', { name: /Trip: Bali Escape/ }))
        fireEvent.click(await screen.findByRole('menuitem', { name: 'Kerala Backwaters' }))
        // switching on a campaign list goes to the same list for the new trip
        await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/master/destinations/9'))
        expect(readRememberedCampaign(state.auth.user)).toEqual({ id: '9', title: 'Kerala Backwaters' })
    })

    test('with no campaign chosen, a sub-item asks for one first, then goes there', async () => {
        const navigated = vi.fn()
        renderAt('/dashboard', { onNavigate: navigated })
        fireEvent.click(screen.getByRole('button', { name: 'Campaigns' }))
        fireEvent.click(screen.getByRole('button', { name: 'Packages' }))
        fireEvent.click(await screen.findByRole('menuitem', { name: 'Bali Escape' }))
        await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/master/packages/7'))
        expect(navigated).toHaveBeenCalled()
    })

    test('an agency without campaigns is pointed to create one', () => {
        state.campaigns = { data: { data: [] }, isSuccess: true, isFetching: false }
        renderAt('/dashboard')
        fireEvent.click(screen.getByRole('button', { name: 'Campaigns' }))
        expect(screen.getByRole('link', { name: 'Create a campaign first' })).toHaveAttribute(
            'href',
            '/master/campaigns/add'
        )
        expect(screen.getByRole('button', { name: 'Destinations' })).toHaveAttribute('aria-disabled', 'true')
    })

    test('the icon rail keeps every screen, labelled for screen readers and by tooltip', async () => {
        const toggle = vi.fn()
        renderAt('/process/leads', { collapsed: true, onToggleCollapsed: toggle })
        expect(screen.queryByTestId('sidebar-agency')).toBeNull()
        expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)
        const leads = screen.getByRole('link', { name: 'Leads' })
        expect(leads).toHaveAttribute('aria-current', 'page')
        fireEvent.mouseOver(leads)
        expect(await screen.findByRole('tooltip')).toHaveTextContent('Leads')

        // Campaigns in the rail opens the full menu
        fireEvent.click(screen.getByRole('button', { name: 'Campaigns' }))
        expect(toggle).toHaveBeenCalledWith(false)
        fireEvent.click(screen.getByRole('button', { name: 'Expand menu' }))
        expect(toggle).toHaveBeenCalledTimes(2)
    })
    test('shows the agency’s logo in the header, or its initials without one', () => {
        state.auth = {
            user: {
                id: 1,
                clientId: 5,
                clientName: 'Acme Tours',
                clientLogo: 'http://api.test/v1/File/logos/acme.png'
            },
            menuItems: AGENCY_MENU
        }
        const { unmount } = renderAt('/dashboard')
        expect(screen.getByRole('img', { name: 'Acme Tours logo' })).toHaveAttribute(
            'src',
            'http://api.test/v1/File/logos/acme.png'
        )
        unmount()

        state.auth = { user: { id: 1, clientId: 5, clientName: 'Acme Tours' }, menuItems: AGENCY_MENU }
        renderAt('/dashboard')
        expect(screen.queryByRole('img', { name: /logo/ })).toBeNull()
        expect(screen.getByTestId('brand-mark')).toHaveTextContent('AT')
    })
})
