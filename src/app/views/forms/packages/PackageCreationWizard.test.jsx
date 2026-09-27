import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import PackageCreationWizard from './PackageCreationWizard'

// ? everything the wizard talks to is mocked; the planner, row building and state wiring are real
const assistAi = vi.fn()
const dispatch = vi.fn()

vi.mock('react-redux', () => ({ useDispatch: () => dispatch }))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/campaignSlice', () => ({ getCampaigns: { initiate: () => ({ type: 'campaigns' }) } }))
vi.mock('@/app/store/slices/api/aiSlice', () => ({
    getTravelImages: { initiate: keyword => ({ type: 'images', keyword }) },
    useAssistAiMutation: () => [assistAi]
}))
vi.mock('@/app/store/slices/api/packageSlice', () => ({ useCreatePackageClientMutation: () => [vi.fn()] }))
vi.mock('@/app/store/slices/api/packageItenarySlice', () => ({
    useCreatePackageItenaryClientMutation: () => [vi.fn()]
}))
vi.mock('@/app/store/slices/api/destinationSlice', () => ({
    getDestinationClients: { initiate: () => ({ type: 'destinations' }) },
    useCreateDestinationClientMutation: () => [vi.fn()],
    useUpdateDestinationClientMutation: () => [vi.fn()]
}))
vi.mock('@/app/store/slices/api/itenarySlice', () => ({
    getItenaryClients: { initiate: () => ({ type: 'itenaries' }) },
    useCreateItenaryClientMutation: () => [vi.fn()],
    useUpdateItenaryClientMutation: () => [vi.fn()]
}))

const PLAN = {
    packageName: 'Himachal Escape 5D/6N',
    originLocation: 'Chandigarh',
    transportMode: 'Cab',
    destinations: [
        { name: 'Shimla', nights: 2 },
        { name: 'Manali', nights: 3 }
    ],
    mustInclude: ['Sissu', 'Rohtang Pass', 'Kasol'],
    days: [
        {
            day: 1,
            destination: 'Shimla',
            type: 'TransitStay',
            title: 'Chandigarh to Shimla & Mall Road',
            highlights: ['Mall Road']
        },
        { day: 2, destination: 'Shimla', type: 'Stay', title: 'Kufri & Jakhoo Temple', highlights: ['Kufri'] },
        {
            day: 3,
            destination: 'Manali',
            type: 'TransitStay',
            title: 'Shimla to Manali via Kullu',
            highlights: ['Kullu']
        },
        {
            day: 4,
            destination: 'Manali',
            type: 'Stay',
            title: 'Rohtang Pass, Atal Tunnel & Sissu',
            highlights: ['Rohtang Pass', 'Atal Tunnel', 'Sissu']
        },
        {
            day: 5,
            destination: 'Manali',
            type: 'Stay',
            title: 'Solang Valley & Hadimba Temple',
            highlights: ['Solang Valley']
        },
        { day: 6, destination: '', type: 'Transit', title: 'Manali to Chandigarh Return', highlights: [] }
    ],
    warnings: ['Rohtang Pass needs a permit.']
}

const reply = body => ({ unwrap: () => Promise.resolve({ content: [{ text: JSON.stringify(body) }] }) })

beforeEach(() => {
    assistAi.mockReset()
    dispatch.mockReset()

    assistAi.mockImplementation(({ system, messages }) => {
        if (system.includes('holiday package planner')) return reply(PLAN)
        if (system.includes('senior travel writer')) {
            const { days } = JSON.parse(messages[0].content)
            return reply({ days: days.map(day => ({ day: day.day, description: `Written copy for day ${day.day}` })) })
        }
        return reply({}) // hotel suggestions — not under test
    })

    dispatch.mockImplementation(action => {
        if (action?.type === 'campaigns') return Promise.resolve({ data: { data: [{ id: 1, title: 'Summer' }] } })
        if (action?.type === 'images') return Promise.resolve({ data: { urls: [{ url: `img:${action.keyword}` }] } })
        return Promise.resolve({ data: { data: [] } })
    })
})

describe('PackageCreationWizard — Build with AI', () => {
    test('a free-text brief becomes a planned package with the requested stops', async () => {
        render(
            <MemoryRouter>
                <PackageCreationWizard />
            </MemoryRouter>
        )

        fireEvent.change(screen.getByPlaceholderText(/includes Chandratal and Rohtang/i), {
            target: { value: '2N Shimla 3N Manali from Chandigarh by cab, include sisu rotang and kasol' }
        })
        fireEvent.click(screen.getByRole('button', { name: /build package with ai/i }))

        // requested stops are reported against the day they landed on
        expect(await screen.findByText('Sissu · Day 4')).toBeInTheDocument()
        expect(screen.getByText('Rohtang Pass · Day 4')).toBeInTheDocument()
        expect(screen.getByText('Kasol · not placed')).toBeInTheDocument()
        expect(screen.getByText('Rohtang Pass needs a permit.')).toBeInTheDocument()

        const plannerCall = assistAi.mock.calls.find(([request]) => request.system.includes('holiday package planner'))
        expect(JSON.parse(plannerCall[0].messages[0].content).brief).toMatch(/include sisu rotang/)

        // destinations step, straight from the plan
        expect(screen.getByDisplayValue('Shimla')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Manali')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Next' }))

        // activities step: planned titles and highlights on the right days
        expect(await screen.findByText('Day 4 – Rohtang Pass, Atal Tunnel & Sissu')).toBeInTheDocument()
        expect(screen.getByText('Day 1 – Chandigarh to Shimla & Mall Road')).toBeInTheDocument()
        expect(screen.getByText('Day 6 – Manali to Chandigarh Return')).toBeInTheDocument()
        expect(screen.queryByText(/^Day 7/)).not.toBeInTheDocument()

        const dayFour = screen.getByText('Day 4 – Rohtang Pass, Atal Tunnel & Sissu').closest('.MuiCardContent-root')
        expect(within(dayFour).getByText('Atal Tunnel')).toBeInTheDocument()

        // the writer's copy replaces the placeholder descriptions, day for day
        await waitFor(() => expect(within(dayFour).getByDisplayValue('Written copy for day 4')).toBeInTheDocument(), {
            timeout: 10000
        })

        // package name gets a computed duration, not the model's miscounted one
        fireEvent.click(screen.getByRole('button', { name: 'Back' }))
        fireEvent.click(screen.getByRole('button', { name: 'Back' }))
        expect(screen.getByDisplayValue('Himachal Escape 6D/5N')).toBeInTheDocument()
    }, 20000)

    test('falls back to the pattern-based draft when the AI planner fails', async () => {
        assistAi.mockImplementation(() => ({ unwrap: () => Promise.reject(new Error('503')) }))

        render(
            <MemoryRouter>
                <PackageCreationWizard />
            </MemoryRouter>
        )

        fireEvent.change(screen.getByPlaceholderText(/includes Chandratal and Rohtang/i), {
            target: {
                value: 'create itenary for 2n shimla 3n manali in which it should include chandrataal and rohtang'
            }
        })
        fireEvent.click(screen.getByRole('button', { name: /build package with ai/i }))

        expect(await screen.findByText(/AI planning is unavailable right now/i)).toBeInTheDocument()
        expect(screen.getByDisplayValue('Shimla')).toBeInTheDocument()
        // the rest of the sentence is not mistaken for part of the destination name
        expect(screen.getByDisplayValue('Manali')).toBeInTheDocument()
    }, 20000)
})
