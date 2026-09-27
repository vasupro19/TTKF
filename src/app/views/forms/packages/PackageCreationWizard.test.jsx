import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import PackageCreationWizard from './PackageCreationWizard'

// ? everything the wizard talks to is mocked; the itinerary engine, the wizard state and the UI are real
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

const NOTES =
    "I want 2 nights Shimla and 3 nights Manali from Delhi, we're a couple and want a private cab. We definitely want Rohtang, Sissu and Atal tunnel."

const UNDERSTOOD = {
    origin: 'Delhi',
    destinations: [
        { name: 'Shimla', nights: 2 },
        { name: 'Manali', nights: 3 }
    ],
    travellers: { adults: 2, type: 'couple' },
    transport: { mode: 'Private cab' },
    requiredAttractions: [
        { name: 'Rohtang Pass', destination: 'Manali' },
        { name: 'Sissu', destination: 'Manali' },
        { name: 'Atal Tunnel', destination: 'Manali' }
    ]
}

const LEGS = {
    'Delhi>Shimla': {
        durationHours: [7, 8],
        distanceKm: [340, 360],
        terrain: 'mixed',
        via: ['Chandigarh'],
        stops: [{ name: 'Murthal', kind: 'meal' }]
    },
    'Shimla>Manali': { durationHours: [7, 8], distanceKm: [240, 260], terrain: 'mountain', via: ['Mandi'] },
    'Manali>Delhi': { durationHours: [11, 13], distanceKm: [520, 550], terrain: 'mixed', suggestedDeparture: '06:00' }
}

const LAHAUL = {
    id: 'lahaul',
    name: 'Atal Tunnel, Sissu & Rohtang loop',
    baseStay: 'Manali',
    places: [
        { name: 'Atal Tunnel', minutes: 30, travelFromPreviousMinutes: 60 },
        { name: 'Sissu', minutes: 120, travelFromPreviousMinutes: 30 },
        { name: 'Rohtang Pass', minutes: 90, travelFromPreviousMinutes: 90 }
    ],
    returnMinutes: 90,
    fullDay: true,
    covers: ['Rohtang Pass', 'Sissu', 'Atal Tunnel'],
    access: [{ place: 'Rohtang Pass', kind: 'permit', note: 'Usually needs an online permit; check before travel.' }]
}

let understood
let edited
let unplaceable
let calls

// ? the wizard spaces AI requests 1.4s apart, so a build of three calls takes a few seconds even when mocked
const WAIT = { timeout: 15000 }

const reply = body => ({ unwrap: () => Promise.resolve({ content: [{ text: JSON.stringify(body) }] }) })

const model = ({ system, messages }) => {
    const payload = JSON.parse(messages[0].content)
    if (system.includes("travel agent's notes")) {
        calls.push('understand')
        return reply(understood)
    }
    if (system.includes('route and destination-logistics')) {
        calls.push(`logistics:${payload.legs.length}`)
        return reply({
            legs: payload.legs.map(leg => ({ id: leg.id, ...LEGS[`${leg.from}>${leg.to}`] })),
            clusters: payload.requiredAttractions.length ? [LAHAUL] : [],
            unplaceable
        })
    }
    if (system.includes('senior destination expert')) {
        calls.push(`fill:${payload.days.map(day => day.day).join(',')}`)
        return reply({
            days: payload.days.map(day => ({
                day: day.day,
                title: day.fixed.length ? 'Atal Tunnel, Sissu & Rohtang' : `${day.location} day ${day.day}`,
                activities: [1, 2, 3, 4].map(n => ({
                    name: `${day.location} sight ${day.day}.${n}`,
                    minutes: 60,
                    travelFromPreviousMinutes: 20,
                    note: 'A good stop.'
                }))
            })),
            recommendations: [
                { kind: 'destination', name: 'Kasol', reason: 'Parvati valley', impact: 'needs one more night' }
            ]
        })
    }
    if (system.includes("update a trip's requirements")) {
        calls.push('edit')
        return reply(edited(payload.requirements))
    }
    return reply({}) // hotel suggestions — not under test
}

const renderWizard = () =>
    render(
        <MemoryRouter>
            <PackageCreationWizard />
        </MemoryRouter>
    )

const build = notes => {
    fireEvent.change(screen.getByLabelText('Trip notes'), { target: { value: notes } })
    fireEvent.click(screen.getByRole('button', { name: /build itinerary/i }))
}

const dayHeading = number => screen.getByText(new RegExp(`^Day ${number} – `))
const dayCard = number => dayHeading(number).closest('.MuiCardContent-root')
// ? the day-type chip (the transfer panel also has "Departure" and "Arrival" labels)
const dayType = number =>
    within(dayCard(number))
        .getAllByText(/^(Arrival|Full day|Transfer|Excursion|Departure)$/)
        .find(node => node.classList.contains('MuiChip-label')).textContent

beforeEach(() => {
    assistAi.mockReset()
    dispatch.mockReset()
    understood = UNDERSTOOD
    edited = requirements => requirements
    unplaceable = []
    calls = []
    assistAi.mockImplementation(model)
    dispatch.mockImplementation(action => {
        if (action?.type === 'campaigns') return Promise.resolve({ data: { data: [{ id: 1, title: 'Summer' }] } })
        if (action?.type === 'images') return Promise.resolve({ data: { urls: [{ url: `img:${action.keyword}` }] } })
        return Promise.resolve({ data: { data: [] } })
    })
})

describe('PackageCreationWizard — itinerary engine', () => {
    test('plain notes become the whole journey: origin, stays, typed days, required places first', async () => {
        renderWizard()
        build(NOTES)

        // the journey, origin to origin
        const journey = await screen.findByLabelText('Journey overview', undefined, WAIT)
        expect(
            within(journey)
                .getAllByText(/^(DELHI|SHIMLA|MANALI)$/)
                .map(node => node.textContent)
        ).toEqual(['DELHI', 'SHIMLA', 'MANALI', 'DELHI'])
        expect(within(journey).getByText('2 NIGHTS')).toBeInTheDocument()
        expect(within(journey).getByText('3 NIGHTS')).toBeInTheDocument()

        // lands on the day plan; every day typed; road days lead with the transfer panel
        await screen.findByText(/^Day 6 – /, undefined, WAIT)
        expect(screen.queryByText(/^Day 7 – /)).not.toBeInTheDocument()
        expect([1, 2, 3, 4, 5, 6].map(dayType)).toEqual([
            'Arrival',
            'Full day',
            'Transfer',
            'Excursion',
            'Full day',
            'Departure'
        ])
        expect(within(dayCard(1)).getByText('Murthal')).toBeInTheDocument()
        expect(within(dayCard(1)).getByText(/about 340–360 km/)).toBeInTheDocument()

        // the requested places are on the excursion day, marked as requested
        const excursion = dayCard(4)
        expect(within(excursion).getAllByText('Requested')).toHaveLength(3)
        expect(within(excursion).getByText('Rohtang Pass')).toBeInTheDocument()
        expect(within(excursion).getByText(/general guidance — verify before travel/)).toBeInTheDocument()

        // the drive home is a travel day, not a sightseeing day
        expect(within(dayCard(6)).queryByText('AI pick')).not.toBeInTheDocument()

        // AI ideas are offered, not inserted; assumptions and the one question that matters are shown
        expect(screen.getByText('Kasol')).toBeInTheDocument()
        expect(screen.queryByText(/Kasol sight/)).not.toBeInTheDocument()
        expect(screen.getByText('The trip ends back in Delhi.')).toBeInTheDocument()
        expect(screen.getByText(/What date does the trip start/)).toBeInTheDocument()
        expect(calls).toEqual(['understand', 'logistics:3', 'fill:1,2,3,4,5,6'])
    }, 30000)

    test('"make it more relaxed" re-times the plan without asking the AI again', async () => {
        edited = requirements => ({ ...requirements, pace: 'relaxed' })
        renderWizard()
        build(NOTES)
        await screen.findByText(/^Day 6 – /, undefined, WAIT)
        const picksBefore = screen.getAllByText('AI pick').length
        calls = []

        fireEvent.change(screen.getByLabelText('Change request'), { target: { value: 'make it more relaxed' } })
        fireEvent.click(screen.getByRole('button', { name: /apply change/i }))

        await waitFor(() => expect(screen.getAllByText('AI pick').length).toBeLessThan(picksBefore), WAIT)
        expect(calls).toEqual(['edit'])
    }, 30000)

    test('answering the date question updates the plan, re-asking only what depends on the month', async () => {
        renderWizard()
        build(NOTES)
        await screen.findByText(/^Day 6 – /, undefined, WAIT)
        calls = []

        fireEvent.change(screen.getByLabelText(/What date does the trip start/), { target: { value: '2026-10-30' } })
        fireEvent.click(screen.getByRole('button', { name: /update plan/i }))

        await waitFor(() => expect(screen.queryByText(/What date does the trip start/)).not.toBeInTheDocument(), WAIT)
        expect(calls[0]).toBe('logistics:0')
        expect(within(dayCard(1)).getByText(/30 Oct/)).toBeInTheDocument()
    }, 30000)

    test('a required place that cannot fit is a conflict with options — no days are shown until it is resolved', async () => {
        unplaceable = [{ name: 'Spiti Valley', reason: 'too far from these stays' }]
        understood = {
            ...UNDERSTOOD,
            requiredAttractions: [...UNDERSTOOD.requiredAttractions, { name: 'Spiti Valley' }]
        }
        renderWizard()
        build(`${NOTES} Also Spiti Valley.`)

        expect(await screen.findByText('This cannot fit as asked', undefined, WAIT)).toBeInTheDocument()
        expect(screen.queryByText(/^Day 1 – /)).not.toBeInTheDocument()

        unplaceable = []
        fireEvent.click(screen.getByRole('button', { name: 'Leave out Spiti Valley' }))

        expect(await screen.findByText(/^Day 6 – /, undefined, WAIT)).toBeInTheDocument()
        expect(screen.queryByText('This cannot fit as asked')).not.toBeInTheDocument()
    }, 30000)

    test('"Auto Build Day Plan" re-plans around the nights set on the Destinations step', async () => {
        renderWizard()
        build(NOTES)
        await screen.findByText(/^Day 6 – /, undefined, WAIT)

        fireEvent.click(screen.getByRole('button', { name: 'Back' }))
        const manaliNights = screen.getAllByDisplayValue('3').find(input => input.type === 'number')
        fireEvent.change(manaliNights, { target: { value: '4' } })
        fireEvent.click(screen.getByRole('button', { name: /auto build day plan/i }))

        expect(await screen.findByText(/^Day 7 – /, undefined, WAIT)).toBeInTheDocument()
        expect(dayType(7)).toBe('Departure')
    }, 30000)

    test('when the AI is unavailable nothing is replaced and the agent is told to retry', async () => {
        assistAi.mockImplementation(() => ({ unwrap: () => Promise.reject(new Error('502')) }))
        renderWizard()
        build(NOTES)

        expect(await screen.findByText(/AI is busy right now/, undefined, WAIT)).toBeInTheDocument()
        expect(screen.queryByLabelText('Journey overview')).not.toBeInTheDocument()
    }, 30000)
})
