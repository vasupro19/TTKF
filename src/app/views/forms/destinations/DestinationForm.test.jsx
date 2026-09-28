import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import DestinationForm from './index'

const assistAi = vi.fn()
const dispatch = vi.fn()

vi.mock('react-redux', () => ({ useDispatch: () => dispatch, useSelector: select => select({ loading: {} }) }))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/aiSlice', () => ({ useAssistAiMutation: () => [assistAi] }))
vi.mock('@/app/store/slices/api/campaignSlice', () => ({ getCampaigns: { initiate: () => ({ type: 'campaigns' }) } }))
vi.mock('@/app/store/slices/api/destinationSlice', () => ({
    useCreateDestinationClientMutation: () => [vi.fn()],
    useUpdateDestinationClientMutation: () => [vi.fn()],
    getDestinationClientById: { initiate: () => ({ type: 'destination' }) }
}))

const hotels = town => ({
    destination: town,
    delux: [
        { name: 'Hotel Holiday Heights', town },
        { name: 'Hotel Mountain Face', town }
    ],
    super_delux: [{ name: 'The Manali Inn', town }],
    luxury: [{ name: 'Span Resort and Spa', town }],
    premium: [{ name: 'The Himalayan', town }]
})

const renderForm = () =>
    render(
        <MemoryRouter>
            <DestinationForm />
        </MemoryRouter>
    )

const field = name => document.querySelector(`[name="${name}"]`)

beforeEach(() => {
    assistAi.mockReset()
    dispatch.mockReset()
    dispatch.mockImplementation(() => Promise.resolve({ data: { data: [{ id: 1, title: 'Summer' }] } }))
    assistAi.mockImplementation(({ messages }) => {
        const { destination } = JSON.parse(messages[0].content)
        return { unwrap: () => Promise.resolve({ content: [{ text: JSON.stringify(hotels(destination)) }] }) }
    })
})

describe('Add destination — hotel suggestions', () => {
    test('typing the destination fills the top hotels of each category', async () => {
        renderForm()
        expect(screen.getByText(/Type the destination name/)).toBeInTheDocument()

        fireEvent.change(field('name'), { target: { name: 'name', value: 'Manali' } })

        await waitFor(() => expect(field('delux_hotel')).toHaveValue('Hotel Holiday Heights | Hotel Mountain Face'), {
            timeout: 5000
        })
        expect(field('super_delux_hotel')).toHaveValue('The Manali Inn')
        expect(field('luxury_hotel')).toHaveValue('Span Resort and Spa')
        expect(field('premium_hotel')).toHaveValue('The Himalayan')
        expect(screen.getByText(/Suggested the top hotels in Manali. Check them before quoting/)).toBeInTheDocument()
        expect(assistAi).toHaveBeenCalledTimes(1)
    })

    test('a hotel field the agent typed is never overwritten', async () => {
        renderForm()
        fireEvent.change(field('luxury_hotel'), { target: { name: 'luxury_hotel', value: 'Our partner hotel' } })
        fireEvent.change(field('name'), { target: { name: 'name', value: 'Manali' } })

        await waitFor(() => expect(field('premium_hotel')).toHaveValue('The Himalayan'), { timeout: 5000 })
        expect(field('luxury_hotel')).toHaveValue('Our partner hotel')
    })

    test('changing the name replaces the earlier suggestions, and a failure is said plainly', async () => {
        renderForm()
        fireEvent.change(field('name'), { target: { name: 'name', value: 'Manali' } })
        await waitFor(() => expect(field('premium_hotel')).toHaveValue('The Himalayan'), { timeout: 5000 })

        assistAi.mockImplementation(() => ({ unwrap: () => Promise.reject(new Error('502')) }))
        fireEvent.change(field('name'), { target: { name: 'name', value: 'Shimla' } })
        expect(
            await screen.findByText("Couldn't get hotel suggestions right now.", undefined, { timeout: 5000 })
        ).toBeInTheDocument()

        assistAi.mockImplementation(({ messages }) => {
            const { destination } = JSON.parse(messages[0].content)
            return {
                unwrap: () =>
                    Promise.resolve({
                        content: [
                            {
                                text: JSON.stringify({
                                    ...hotels(destination),
                                    premium: [{ name: 'Wildflower Hall', town: 'Shimla' }]
                                })
                            }
                        ]
                    })
            }
        })
        fireEvent.click(screen.getByRole('button', { name: 'Suggest again' }))
        await waitFor(() => expect(field('premium_hotel')).toHaveValue('Wildflower Hall'), { timeout: 5000 })
    })
})
