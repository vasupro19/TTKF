import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import Home from './Home'

const api = vi.hoisted(() => ({ args: [], reply: {}, people: [] }))

vi.mock('react-redux', () => ({
    useSelector: select => select({ auth: { user: { name: 'Asha', clientId: 3, clientName: 'Acme Tours' } } })
}))
vi.mock('@/app/store/slices/api/dashboardSlice', () => ({
    useGetDashboardSummaryQuery: args => {
        api.args.push(args)
        return { refetch: vi.fn(), isFetching: false, ...api.reply }
    }
}))
vi.mock('@/app/store/slices/api/leadSlice', () => ({
    useGetAssigneesQuery: () => ({ data: { data: api.people } })
}))

const iso = (offsetDays, hour = 15) => {
    const date = new Date()
    date.setDate(date.getDate() + offsetDays)
    date.setHours(hour, 0, 0, 0)
    return date.toISOString()
}

const summary = (overrides = {}) => ({
    period: { from: '2026-10-01', to: '2026-10-31' },
    scope: { seesEveryLead: true, money: true, assignedTo: null },
    kpis: {
        newLeads: 42,
        bookings: 5,
        conversion: 11.9,
        revenue: 1234567,
        collected: 400000,
        toCollect: 250000,
        profit: 180000,
        supplierDue: 60000,
        awaitingVerification: { count: 2, amount: 35000 }
    },
    pipeline: { new: 7, verified: 3, quoting: 2, sent: 4, booked: 9 },
    today: {
        callsDue: 1,
        callsOverdue: 1,
        calls: [
            { id: 1, at: iso(-1), overdue: true, leadId: 11, name: 'Ravi Kumar', phone: '+919811111111' },
            { id: 2, at: iso(0), overdue: false, leadId: 12, name: 'Meena Shah', phone: '+919822222222' }
        ],
        tripsThisWeek: 1,
        trips: [{ bookingId: 5, leadId: 21, name: 'Kapoor family', date: iso(2), guests: 4, paid: 'Partially Paid' }]
    },
    trend: [
        { month: 'May', leads: 10, bookings: 1, revenue: 100000 },
        { month: 'Jun', leads: 12, bookings: 2, revenue: 200000 },
        { month: 'Jul', leads: 8, bookings: 0, revenue: 0 },
        { month: 'Aug', leads: 20, bookings: 3, revenue: 300000 },
        { month: 'Sep', leads: 30, bookings: 4, revenue: 400000 },
        { month: 'Oct', leads: 42, bookings: 5, revenue: 1234567 }
    ],
    sources: [
        { source: 'Facebook', leads: 30 },
        { source: 'Email', leads: 12 }
    ],
    topCampaigns: [{ title: 'Kashmir Spring', bookings: 3, revenue: 900000 }],
    team: [
        { id: 4, name: 'Neha', leads: 20, bookings: 3, revenue: 900000, conversion: 15 },
        { id: 5, name: 'Arjun', leads: 22, bookings: 2, revenue: 334567, conversion: 9.1 }
    ],
    recentLeads: [
        {
            id: 31,
            name: 'Priya Nair',
            source: 'Facebook',
            createdAt: iso(0, 9),
            stage: 'sent',
            quoteSentAt: iso(0, 10),
            nextCallAt: null,
            bookingId: null
        }
    ],
    ...overrides
})

const renderHome = () =>
    render(
        <MemoryRouter>
            <Home />
        </MemoryRouter>
    )

beforeEach(() => {
    api.args = []
    api.people = [
        { id: 1, name: 'Asha', role: 'Admin', isMe: true },
        { id: 4, name: 'Neha', role: 'Sales', isMe: false },
        { id: 5, name: 'Arjun', role: 'Sales', isMe: false }
    ]
    api.reply = { data: { data: summary() }, isLoading: false, isError: false }
})

describe('dashboard', () => {
    test('header, KPIs with money, links, and this month asked for', () => {
        renderHome()
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/, Asha$/)
        expect(screen.getByText(/Acme Tours ·/)).toBeInTheDocument()
        const first = api.args[0]
        expect(first.from).toMatch(/^\d{4}-\d{2}-01$/)
        expect(first.assignedTo).toBeUndefined()

        expect(screen.getByTestId('kpi-revenue')).toHaveTextContent('₹12,34,567')
        expect(screen.getByTestId('kpi-conversion')).toHaveTextContent('11.9%')
        expect(screen.getByTestId('kpi-profit')).toHaveTextContent('₹1,80,000')
        expect(screen.getByTestId('kpi-supplierDue')).toHaveTextContent('₹60,000')
        expect(screen.getByTestId('kpi-newLeads')).toHaveAttribute('href', '/process/leads')
        expect(screen.getByTestId('kpi-toCollect')).toHaveAttribute('href', '/process/packages')
        expect(screen.getByTestId('kpi-awaitingVerification')).toHaveAttribute('href', '/process/transactions')
    })

    test('money hidden when the server sends profit as null', () => {
        api.reply = {
            ...api.reply,
            data: {
                data: summary({
                    scope: { seesEveryLead: false, money: false, assignedTo: null },
                    kpis: { ...summary().kpis, profit: null, supplierDue: null },
                    team: null
                })
            }
        }
        renderHome()
        expect(screen.queryByTestId('kpi-profit')).toBeNull()
        expect(screen.queryByTestId('kpi-supplierDue')).toBeNull()
        expect(screen.getByTestId('kpi-collected')).toBeInTheDocument()
        // ? a salesperson: no team, no "Assigned to"
        expect(screen.queryByTestId('team-table')).toBeNull()
        expect(screen.queryByRole('combobox', { name: /Assigned to/ })).toBeNull()
    })

    test('today: calls with overdue badge, trips with payment, and the payments banner', () => {
        renderHome()
        const calls = screen.getByTestId('today-calls')
        expect(calls).toHaveTextContent('1 due today · 1 overdue')
        const ravi = within(calls).getByRole('link', { name: /Ravi Kumar/ })
        expect(ravi).toHaveAttribute('href', '/process/leads/edit/11')
        expect(within(ravi).getByText('Overdue')).toBeInTheDocument()
        expect(within(calls).getByRole('link', { name: /Meena Shah/ })).toHaveTextContent('+919822222222')

        const trip = within(screen.getByTestId('today-trips')).getByRole('link', { name: /Kapoor family/ })
        expect(trip).toHaveAttribute('href', '/process/packages/21')
        expect(trip).toHaveTextContent('4 guests')
        expect(trip).toHaveTextContent('Part paid')

        expect(screen.getByText('2 payments (₹35,000) waiting for accounts')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute('href', '/process/transactions')
    })

    test('pipeline steps link to the leads list at that step', () => {
        renderHome()
        const sent = screen.getByRole('link', { name: 'Step 4: Quote sent, 4 leads' })
        expect(sent).toHaveAttribute('href', '/process/leads?stage=sent')
        expect(
            within(screen.getByTestId('pipeline')).getByText(
                '25 leads across the steps, all time — where each one is now'
            )
        ).toBeInTheDocument()
    })

    test('sources, campaigns, recent leads', () => {
        renderHome()
        expect(within(screen.getByTestId('sources')).getByText('Facebook')).toBeInTheDocument()
        expect(within(screen.getByTestId('campaigns')).getByText('₹9,00,000')).toBeInTheDocument()
        const priya = within(screen.getByTestId('recent-leads')).getByRole('link', { name: /Priya Nair/ })
        expect(priya).toHaveAttribute('href', '/process/leads/edit/31')
        expect(priya).toHaveTextContent('Quote sent')
    })

    test('team row picks the person: the query and the leads links follow', () => {
        renderHome()
        const table = screen.getByTestId('team-table')
        fireEvent.click(within(table).getByRole('button', { name: "Show Arjun's numbers" }))
        expect(api.args.at(-1).assignedTo).toBe('5')
        expect(screen.getByRole('link', { name: 'Step 1: New, 7 leads' })).toHaveAttribute(
            'href',
            '/process/leads?stage=new&assignedTo=5'
        )
    })

    test('Assigned to select for those who see everyone; choosing someone asks for them', () => {
        renderHome()
        fireEvent.mouseDown(screen.getByRole('combobox', { name: /Assigned to/ }))
        fireEvent.click(screen.getByRole('option', { name: 'Neha' }))
        expect(api.args.at(-1).assignedTo).toBe('4')
    })

    test('period picker changes the days asked for', () => {
        renderHome()
        fireEvent.mouseDown(screen.getByRole('combobox', { name: /Period/ }))
        fireEvent.click(screen.getByRole('option', { name: 'This year' }))
        const year = new Date().getFullYear()
        expect(api.args.at(-1)).toMatchObject({ from: `${year}-01-01`, to: `${year}-12-31` })
    })

    test('empty month: friendly notes', () => {
        api.reply = {
            ...api.reply,
            data: {
                data: summary({
                    today: { callsDue: 0, callsOverdue: 0, calls: [], tripsThisWeek: 0, trips: [] },
                    trend: summary().trend.map(row => ({ ...row, leads: 0, bookings: 0, revenue: 0 })),
                    sources: [],
                    topCampaigns: [],
                    team: [],
                    recentLeads: []
                })
            }
        }
        renderHome()
        expect(screen.getByText('No calls due today')).toBeInTheDocument()
        expect(screen.getByText('No trips start this week')).toBeInTheDocument()
        expect(screen.getByText('No leads this month yet')).toBeInTheDocument()
        expect(screen.getByText('No bookings this month yet')).toBeInTheDocument()
        expect(screen.getByText('No leads in the last 6 months yet')).toBeInTheDocument()
    })

    test('loading skeleton, then the server’s message on error', () => {
        api.reply = { data: undefined, isLoading: true, isError: false }
        const { unmount } = renderHome()
        expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument()
        unmount()

        api.reply = {
            data: undefined,
            isLoading: false,
            isError: true,
            error: { data: { message: 'Couldn’t load the dashboard' } }
        }
        renderHome()
        expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t load the dashboard')
        expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    })
})
