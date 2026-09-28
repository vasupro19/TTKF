import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import PackageCreationWizard from './PackageCreationWizard'

// ? everything the planner talks to is mocked; the itinerary engine, the wizard state and the screens are real
const assistAi = vi.fn()
const dispatch = vi.fn()
const saved = { packages: [], itineraries: [], days: [] }
const mutation = (bucket, id) => [
    vi.fn(body => {
        saved[bucket].push(body)
        return { unwrap: () => Promise.resolve({ data: { id: id ?? saved[bucket].length, ...body } }) }
    })
]

vi.mock('react-redux', () => ({ useDispatch: () => dispatch }))
vi.mock('react-router-dom', async importOriginal => ({ ...(await importOriginal()), useNavigate: () => vi.fn() }))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/campaignSlice', () => ({ getCampaigns: { initiate: () => ({ type: 'campaigns' }) } }))
vi.mock('@/app/store/slices/api/aiSlice', () => ({
    getTravelImages: { initiate: keyword => ({ type: 'images', keyword }) },
    useAssistAiMutation: () => [assistAi]
}))
vi.mock('@/app/store/slices/api/packageSlice', () => ({
    useCreatePackageClientMutation: () => mutation('packages', 7)
}))
vi.mock('@/app/store/slices/api/packageItenarySlice', () => ({
    useCreatePackageItenaryClientMutation: () => mutation('days')
}))
vi.mock('@/app/store/slices/api/destinationSlice', () => ({
    getDestinationClients: { initiate: () => ({ type: 'destinations' }) },
    useCreateDestinationClientMutation: () => mutation('itineraries'),
    useUpdateDestinationClientMutation: () => mutation('itineraries')
}))
vi.mock('@/app/store/slices/api/itenarySlice', () => ({
    getItenaryClients: { initiate: () => ({ type: 'itenaries' }) },
    useCreateItenaryClientMutation: () => mutation('itineraries'),
    useUpdateItenaryClientMutation: () => mutation('itineraries')
}))

const LEGS = {
    'Delhi>Shimla': {
        durationHours: [7, 8],
        distanceKm: [340, 360],
        terrain: 'mixed',
        via: ['Chandigarh'],
        stops: [{ name: 'Murthal', kind: 'meal' }]
    },
    'Shimla>Manali': { durationHours: [7, 8], distanceKm: [240, 260], terrain: 'mountain', via: ['Mandi'] },
    'Manali>Delhi': { durationHours: [11, 13], distanceKm: [520, 550], terrain: 'mixed', suggestedDeparture: '06:00' },
    'Chandigarh>Manali': { durationHours: [8, 9], distanceKm: [300, 310], terrain: 'mixed' },
    'Manali>Chandigarh': { durationHours: [8, 9], distanceKm: [300, 310], terrain: 'mixed' }
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
    access: [{ place: 'Rohtang Pass', kind: 'permit', note: 'Usually needs an online permit.' }]
}

let understood
let unplaceable
let calls

const reply = body => ({ unwrap: () => Promise.resolve({ content: [{ text: JSON.stringify(body) }] }) })

const model = ({ system, messages }) => {
    const payload = JSON.parse(messages[0].content)
    if (system.includes("travel agent's notes")) {
        calls.push('understand')
        return reply(understood(payload.notes))
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
        calls.push('fill')
        return reply({
            days: payload.days.map(day => ({
                day: day.day,
                title: `${day.location} day ${day.day}`,
                activities: [1, 2].map(n => ({
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
    if (system.includes('day-by-day descriptions')) {
        calls.push(`write:${payload.days.length}`)
        return reply({
            days: payload.days.map(day => ({
                day: day.day,
                description: `${day.journey ? `Travel on to ${day.journey.to} through the hills. ` : ''}${day.places
                    .map(place => `Enjoy ${place.name}, one of the loveliest spots around.`)
                    .join(' ')} The rest of the day is yours to relax, with a comfortable night at the hotel.`
            }))
        })
    }
    return reply({}) // hotel suggestions — not under test
}

// ? the wizard spaces AI requests 1.4s apart, so a build takes a few seconds even when mocked
const WAIT = { timeout: 20000 }

const renderPlanner = () =>
    render(
        <MemoryRouter>
            <PackageCreationWizard />
        </MemoryRouter>
    )

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const click = name => fireEvent.click(screen.getByRole('button', { name }))

// ? the primary test traveller: Delhi, Shimla 2N + Manali 3N, couple, private cab, relaxed, Rohtang/Atal/Sissu
const planTheTrip = async ({ mustSee = 'Rohtang, Atal Tunnel, Sissu' } = {}) => {
    type('Starting from', 'Delhi')
    type('Going to', '2 nights Shimla, 3 nights Manali')
    fireEvent.keyDown(screen.getByLabelText('Going to'), { key: 'Enter' })
    click('Continue')
    await screen.findByText('Make it yours')
    click('Couple')
    click('Relaxed')
    click('Private cab')
    type('Anything you don’t want to miss', mustSee)
    click('Create itinerary')
    await screen.findByText('Your trip', undefined, WAIT)
}

const dayRow = number => screen.getByText(`Day ${number}`, { selector: 'p' }).closest('button')

beforeEach(() => {
    assistAi.mockReset()
    dispatch.mockReset()
    Object.values(saved).forEach(list => list.splice(0))
    understood = () => ({
        requiredAttractions: [
            { name: 'Rohtang Pass', destination: 'Manali' },
            { name: 'Atal Tunnel', destination: 'Manali' },
            { name: 'Sissu', destination: 'Manali' }
        ]
    })
    unplaceable = []
    calls = []
    assistAi.mockImplementation(model)
    dispatch.mockImplementation(action => {
        if (action?.type === 'campaigns') return Promise.resolve({ data: { data: [{ id: 1, title: 'Summer' }] } })
        if (action?.type === 'images') return Promise.resolve({ data: { urls: [{ url: `img:${action.keyword}` }] } })
        return Promise.resolve({ data: { data: [] } })
    })
})

describe('Package planner — the simple flow', () => {
    test('opens on one clear question with only the basics', () => {
        renderPlanner()
        expect(screen.getByRole('heading', { name: 'Where’s the trip?' })).toBeInTheDocument()
        expect(screen.getByLabelText('Starting from')).toBeInTheDocument()
        expect(screen.getByLabelText('Going to')).toBeInTheDocument()
        expect(screen.getByLabelText('Start date')).toBeInTheDocument()
        // nothing about pace, hotels, campaigns or day types yet
        expect(screen.queryByText(/campaign/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/hotel/i)).not.toBeInTheDocument()
        expect(screen.queryByText('Pace')).not.toBeInTheDocument()
    })

    test('the destination box understands “2 nights Shimla, 3 nights Manali”; nights are a simple stepper', () => {
        renderPlanner()
        type('Going to', '2 nights Shimla, 3 nights Manali')
        fireEvent.keyDown(screen.getByLabelText('Going to'), { key: 'Enter' })

        expect(screen.getByText('Shimla')).toBeInTheDocument()
        expect(screen.getByText('Manali')).toBeInTheDocument()
        expect(screen.getByText('5 nights · 6 days')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'One more night in Manali' }))
        expect(screen.getByText('6 nights · 7 days')).toBeInTheDocument()
    })

    test('a route typed as “Delhi → Shimla → Manali → Delhi” fills the starting city too', () => {
        renderPlanner()
        type('Going to', 'Delhi → Shimla → Manali → Delhi')
        fireEvent.keyDown(screen.getByLabelText('Going to'), { key: 'Enter' })
        expect(screen.getByLabelText('Starting from')).toHaveValue('Delhi')
        expect(screen.getByText('4 nights · 5 days')).toBeInTheDocument()
    })

    test('continuing without the basics explains what is missing, in plain words', () => {
        renderPlanner()
        click('Continue')
        expect(screen.getByRole('alert')).toHaveTextContent('Add where the trip starts')
    })

    test('the whole Delhi → Shimla → Manali → Delhi trip: journey first, requests vs additions, collapsed days', async () => {
        renderPlanner()
        await planTheTrip()

        // the journey, origin to origin, with nights
        const journey = screen.getByRole('list', { name: 'Journey' })
        expect(
            within(journey)
                .getAllByText(/^(Delhi|Shimla|Manali)$/)
                .map(node => node.textContent)
        ).toEqual(['Delhi', 'Shimla', 'Manali', 'Delhi'])
        expect(within(journey).getByText('2 nights')).toBeInTheDocument()
        expect(within(journey).getByText('3 nights')).toBeInTheDocument()

        // what was asked for, and what the AI added — separately
        const asked = screen.getByText('Included because you asked').parentElement
        ;['Rohtang Pass', 'Atal Tunnel', 'Sissu'].forEach(name =>
            expect(within(asked).getByText(name)).toBeInTheDocument()
        )
        expect(screen.getByText('We added')).toBeInTheDocument()
        expect(screen.getByText(/Could also fit: Kasol — needs one more night/)).toBeInTheDocument()

        // one question, because dates matter in the mountains
        expect(screen.getByText(/What date does the trip start/)).toBeInTheDocument()

        // six days, each one line until opened
        expect(within(dayRow(1)).getByText('Delhi → Shimla')).toBeInTheDocument()
        expect(within(dayRow(3)).getByText('Shimla → Manali')).toBeInTheDocument()
        expect(within(dayRow(4)).getByText('Atal Tunnel → Sissu → Rohtang Pass')).toBeInTheDocument()
        expect(within(dayRow(4)).getByText(/^Day trip from Manali/)).toBeInTheDocument()
        expect(within(dayRow(6)).getByText('Manali → Delhi')).toBeInTheDocument()
        expect(screen.queryByText('you asked')).not.toBeInTheDocument()

        // an opened day reads as one paragraph; the timings are there on request
        fireEvent.click(dayRow(4))
        expect(
            screen.getByText(/^Enjoy Atal Tunnel, one of the loveliest spots around\. Enjoy Sissu/)
        ).toBeInTheDocument()
        expect(screen.getByText(/needs an online permit/)).toBeInTheDocument()
        expect(screen.queryByText('you asked')).not.toBeInTheDocument()
        click('Timings and drive')
        expect(screen.getAllByText('you asked')).toHaveLength(3)

        expect(calls).toEqual(['understand', 'logistics:3', 'fill', 'write:6'])
    }, 40000)

    test('removing something the AI added takes one click, and only that day is written again', async () => {
        renderPlanner()
        await planTheTrip()
        const [first] = within(screen.getByText('We added').parentElement).getAllByRole('button', { name: /^Remove / })
        const name = first.getAttribute('aria-label').replace('Remove ', '')
        calls = []

        fireEvent.click(first)

        await waitFor(
            () => expect(screen.queryByRole('button', { name: `Remove ${name}` })).not.toBeInTheDocument(),
            WAIT
        )
        expect(calls).toEqual(['write:1'])
    }, 40000)

    test('answering the date question updates the plan in place', async () => {
        renderPlanner()
        await planTheTrip()
        calls = []

        fireEvent.change(screen.getByLabelText(/What date does the trip start/), { target: { value: '2026-10-12' } })
        click('Use this date')

        await waitFor(() => expect(screen.queryByText(/What date does the trip start/)).not.toBeInTheDocument(), WAIT)
        expect(within(dayRow(1)).getByText(/12 Oct/)).toBeInTheDocument()
        expect(calls[0]).toBe('logistics:0')
    }, 40000)

    test('something that cannot fit is explained with choices, and no days are shown until it is resolved', async () => {
        unplaceable = [{ name: 'Spiti Valley', reason: 'too far from these stays' }]
        understood = () => ({
            requiredAttractions: [
                { name: 'Rohtang Pass', destination: 'Manali' },
                { name: 'Spiti Valley', destination: '' }
            ]
        })
        renderPlanner()
        await planTheTrip({ mustSee: 'Rohtang, Spiti Valley' })

        expect(screen.getByText('This doesn’t quite fit')).toBeInTheDocument()
        expect(screen.queryByText('Day 1', { selector: 'p' })).not.toBeInTheDocument()

        unplaceable = []
        click('Leave out Spiti Valley')

        expect(await screen.findByText('Day 1', { selector: 'p' }, WAIT)).toBeInTheDocument()
        expect(screen.queryByText('This doesn’t quite fit')).not.toBeInTheDocument()
    }, 40000)

    test('saving asks only for the campaign — the name is suggested — and saves every day in order', async () => {
        renderPlanner()
        await planTheTrip()

        expect(screen.getByLabelText('Package name')).toHaveValue('Shimla - Manali 6D/5N')
        click('Save package')
        expect(screen.getByRole('alert')).toHaveTextContent('Choose the campaign')

        fireEvent.mouseDown(screen.getByLabelText('Campaign'))
        fireEvent.click(await screen.findByRole('option', { name: 'Summer' }))
        click('Save package')

        await waitFor(() => expect(saved.days).toHaveLength(6), WAIT)
        expect(saved.packages[0]).toEqual({ name: 'Shimla - Manali 6D/5N', campaignId: 1 })
        expect(saved.days.map(day => day.entryType)).toEqual([
            'TransitStay',
            'Stay',
            'TransitStay',
            'Stay',
            'Stay',
            'Transit'
        ])
    }, 40000)

    test('a pasted customer message fills the planner in', async () => {
        understood = () => ({
            origin: 'Chandigarh',
            destinations: [{ name: 'Manali', nights: 4 }],
            travellers: { type: 'family', notes: ['travelling with parents'] },
            requiredAttractions: [{ name: 'Sissu' }]
        })
        renderPlanner()
        click('Have the request as a message? Paste it')
        type('Trip request message', 'we are a family with parents, 4 nights manali from chandigarh, want sissu')
        click('Fill it in for me')

        expect(
            await screen.findByText('We filled this in from the message. Check it and continue.', undefined, WAIT)
        ).toBeInTheDocument()
        expect(screen.getByLabelText('Starting from')).toHaveValue('Chandigarh')
        expect(screen.getByText('4 nights · 5 days')).toBeInTheDocument()

        click('Continue')
        await screen.findByText('Make it yours')
        expect(screen.getByRole('button', { name: 'Family' })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByLabelText('Anything you don’t want to miss')).toHaveValue('Sissu')
    }, 40000)

    test('when the planner is unreachable the agent is told simply, and nothing is lost', async () => {
        renderPlanner()
        type('Starting from', 'Delhi')
        type('Going to', 'Shimla + Manali')
        fireEvent.keyDown(screen.getByLabelText('Going to'), { key: 'Enter' })
        click('Continue')
        await screen.findByText('Make it yours')
        type('Anything you don’t want to miss', 'Rohtang')
        assistAi.mockImplementation(() => ({ unwrap: () => Promise.reject(new Error('502')) }))
        click('Create itinerary')

        expect(await screen.findByText(/couldn’t reach the planner/, undefined, WAIT)).toBeInTheDocument()
        expect(screen.getByLabelText('Anything you don’t want to miss')).toHaveValue('Rohtang')
    }, 40000)

    test('the detailed editor is one link away, and comes back', async () => {
        renderPlanner()
        await planTheTrip()

        click('Fine-tune in the detailed editor')
        expect(screen.getByText('Detailed editor')).toBeInTheDocument()

        click('Back to the simple planner')
        expect(screen.getByText('Your trip')).toBeInTheDocument()
    }, 40000)
})
