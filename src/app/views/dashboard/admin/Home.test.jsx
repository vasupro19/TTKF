import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, test, vi } from 'vitest'
import Home from './Home'

// ? the dashboard reads the server's figures (GET /dashboard), counted over every lead and booking — not the first
// ? 1,000 of each counted in the browser
const payload = vi.hoisted(() => ({
    stats: { totalLeads: 1240, confirmedBookings: 310, totalRevenue: 9300000, totalCampaigns: 6 },
    monthlyLeads: [
        { month: 'Sep 26', leads: 200, confirmed: 40, revenue: 1200000 },
        { month: 'Oct 26', leads: 250, confirmed: 50, revenue: 1500000 }
    ],
    topCampaigns: [
        { name: 'Himachal', leads: 600 },
        { name: 'Kashmir', leads: 300 }
    ],
    packageBreakdown: [
        { category: 'Deluxe', count: 200 },
        { category: 'Luxury', count: 110 }
    ],
    recentLeads: [
        {
            id: 1,
            fullName: 'Asha Rao',
            campaignName: 'Himachal',
            status: 'Pending',
            createdAt: new Date().toISOString(),
            bookingValue: 45000
        }
    ]
}))
const calls = vi.hoisted(() => ({ dashboard: 0, leads: 0 }))

vi.mock('react-redux', () => ({ useSelector: select => select({ auth: { user: { name: 'Nishant' } } }) }))
vi.mock('@/app/store/slices/api/dashboardSlice', () => ({
    useGetDashboardQuery: () => {
        calls.dashboard += 1
        return { data: { data: payload }, isFetching: false, isError: false }
    }
}))
vi.mock('@/app/store/slices/api/leadSlice', () => ({
    useGetLeadsQuery: () => {
        calls.leads += 1
        return {}
    }
}))

describe('dashboard', () => {
    test('shows the server totals and its breakdowns, without downloading the leads', () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        )
        expect(calls.dashboard).toBeGreaterThan(0)
        expect(calls.leads).toBe(0)
        expect(screen.getAllByText('Himachal').length).toBeGreaterThan(0)
        expect(screen.getByText('Asha Rao')).toBeTruthy()
        expect(screen.getAllByText(/Deluxe/).length).toBeGreaterThan(0)
    })
})
