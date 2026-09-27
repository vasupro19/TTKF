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

const BRIEF =
    'create itenary for 2n shimla 3n manali in which it should include chandrataal and rohtang, pickup from delhi'

const PLAN = {
    packageName: 'Himachal Escape 5D/6N',
    originLocation: 'Delhi',
    transportMode: '',
    destinations: [
        { name: 'Shimla', nights: 2 },
        { name: 'Manali', nights: 3 }
    ],
    mustInclude: ['Chandratal Lake', 'Rohtang Pass', 'Kasol'],
    days: [
        {
            day: 1,
            destination: 'Shimla',
            type: 'TransitStay',
            title: 'Delhi to Shimla & Mall Road',
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
            title: 'Rohtang Pass & Solang Valley',
            highlights: ['Rohtang Pass', 'Solang Valley']
        },
        {
            day: 5,
            destination: 'Manali',
            type: 'Stay',
            title: 'Chandratal Lake Excursion',
            highlights: ['Chandratal Lake', 'Kunzum Pass']
        },
        { day: 6, destination: '', type: 'Transit', title: 'Manali to Delhi Return', highlights: [] }
    ],
    warnings: ['Rohtang Pass needs a permit.']
}

const reply = body => ({ unwrap: () => Promise.resolve({ content: [{ text: JSON.stringify(body) }] }) })
const plannerCalls = () =>
    assistAi.mock.calls
        .filter(([request]) => request.system.includes('holiday package planner'))
        .map(([request]) => JSON.parse(request.messages[0].content))

const renderWizard = () =>
    render(
        <MemoryRouter>
            <PackageCreationWizard />
        </MemoryRouter>
    )

const buildFromBrief = brief => {
    fireEvent.change(screen.getByPlaceholderText(/includes Chandratal and Rohtang/i), { target: { value: brief } })
    fireEvent.click(screen.getByRole('button', { name: /build package with ai/i }))
}

const dayCard = title => screen.getByText(title).closest('.MuiCardContent-root')

beforeEach(() => {
    assistAi.mockReset()
    dispatch.mockReset()

    assistAi.mockImplementation(({ system, messages }) => {
        if (system.includes('holiday package planner')) return reply(PLAN)
        if (system.includes('day-by-day plan')) {
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
    test('a plain-language request becomes a day plan built around the places asked for', async () => {
        renderWizard()
        buildFromBrief(BRIEF)

        // lands straight on the day plan, with the requested places on their days
        expect(await screen.findByText('Day 4 – Rohtang Pass & Solang Valley')).toBeInTheDocument()
        expect(screen.getByText('Day 5 – Chandratal Lake Excursion')).toBeInTheDocument()
        expect(screen.getByText('Day 1 – Delhi to Shimla & Mall Road')).toBeInTheDocument()
        expect(screen.getByText('Day 6 – Manali to Delhi Return')).toBeInTheDocument()
        expect(screen.queryByText(/^Day 7/)).not.toBeInTheDocument()
        expect(within(dayCard('Day 5 – Chandratal Lake Excursion')).getByText('Kunzum Pass')).toBeInTheDocument()

        // requested places are reported against the day they landed on
        expect(screen.getByText('Chandratal Lake · Day 5')).toBeInTheDocument()
        expect(screen.getByText('Rohtang Pass · Day 4')).toBeInTheDocument()
        expect(screen.getByText('Kasol · not placed')).toBeInTheDocument()
        expect(screen.getByText('Rohtang Pass needs a permit.')).toBeInTheDocument()
        expect(plannerCalls()[0].brief).toBe(BRIEF)

        // the writer's copy replaces the placeholder descriptions, day for day
        await waitFor(
            () =>
                expect(
                    within(dayCard('Day 5 – Chandratal Lake Excursion')).getByDisplayValue('Written copy for day 5')
                ).toBeInTheDocument(),
            { timeout: 10000 }
        )

        // destinations came from the plan; the name gets a computed duration, not the model's miscount
        fireEvent.click(screen.getByRole('button', { name: 'Back' }))
        expect(screen.getByDisplayValue('Shimla')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Manali')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Back' }))
        expect(screen.getByDisplayValue('Himachal Escape 6D/5N')).toBeInTheDocument()
    }, 20000)

    test('"Auto Build Day Plan" keeps the requested places instead of rebuilding generic days', async () => {
        renderWizard()
        buildFromBrief(BRIEF)
        await screen.findByText('Day 4 – Rohtang Pass & Solang Valley')

        fireEvent.click(screen.getByRole('button', { name: 'Back' }))
        fireEvent.click(screen.getByRole('button', { name: /auto build day plan/i }))

        // re-planned around the same request, for the destinations and nights set on the Destinations step
        // ? the wizard spaces AI calls 1.4s apart, so the re-plan queues behind the first build's descriptions and hotels
        await waitFor(() => expect(plannerCalls()).toHaveLength(2), { timeout: 15000 })
        expect(plannerCalls()[1]).toMatchObject({
            brief: BRIEF,
            fixedDestinations: [
                { name: 'Shimla', nights: 2 },
                { name: 'Manali', nights: 3 }
            ]
        })
        expect(await screen.findByText('Day 4 – Rohtang Pass & Solang Valley')).toBeInTheDocument()
        expect(screen.getByText('Day 5 – Chandratal Lake Excursion')).toBeInTheDocument()
    }, 30000)

    test('without a pickup city, 5 nights is still 6 days: a departure day is added', async () => {
        const days = PLAN.days.slice(0, 5).map((day, index) => (index === 0 ? { ...day, type: 'Stay' } : day))
        assistAi.mockImplementation(({ system }) =>
            system.includes('holiday package planner')
                ? reply({
                      ...PLAN,
                      originLocation: '',
                      days: [...days, { day: 6, destination: '', type: 'Transit', title: 'Departure from Manali' }]
                  })
                : reply({})
        )

        renderWizard()
        buildFromBrief('give me 2n shimla 3 n manali itenary i also want to go rohtang atal tunnel and sissu')

        expect(await screen.findByText('Day 6 – Departure from Manali')).toBeInTheDocument()
        expect(screen.getByText('Day 4 – Rohtang Pass & Solang Valley')).toBeInTheDocument()
        expect(screen.queryByText(/^Day 7/)).not.toBeInTheDocument()
    }, 20000)

    test('a busy model gets one retry before a day keeps its standard description', async () => {
        let writerCalls = 0
        assistAi.mockImplementation(({ system, messages }) => {
            if (system.includes('holiday package planner')) return reply(PLAN)
            if (system.includes('day-by-day plan')) {
                writerCalls += 1
                if (writerCalls === 1) return { unwrap: () => Promise.reject(new Error('502')) }
                const { days } = JSON.parse(messages[0].content)
                return reply({ days: days.map(day => ({ day: day.day, description: `Retried copy ${day.day}` })) })
            }
            return reply({})
        })

        renderWizard()
        buildFromBrief(BRIEF)
        await screen.findByText('Day 1 – Delhi to Shimla & Mall Road')

        await waitFor(
            () =>
                expect(
                    within(dayCard('Day 1 – Delhi to Shimla & Mall Road')).getByDisplayValue('Retried copy 1')
                ).toBeInTheDocument(),
            { timeout: 15000 }
        )
    }, 30000)

    test('falls back to the pattern-based draft when the AI planner fails', async () => {
        assistAi.mockImplementation(() => ({ unwrap: () => Promise.reject(new Error('503')) }))

        renderWizard()
        buildFromBrief('create itenary for 2n shimla 3n manali in which it should include chandrataal and rohtang')

        expect(await screen.findByText(/AI is busy right now/i)).toBeInTheDocument()

        // the rest of the sentence is not mistaken for part of the destination names
        fireEvent.click(screen.getByRole('button', { name: 'Back' }))
        expect(screen.getByDisplayValue('Shimla')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Manali')).toBeInTheDocument()
    }, 20000)
})
