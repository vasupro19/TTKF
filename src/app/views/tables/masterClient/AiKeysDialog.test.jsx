import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import AiKeysDialog from './AiKeysDialog'

const api = vi.hoisted(() => ({ settings: null, save: vi.fn(), test: vi.fn(), refetch: vi.fn(), snackbars: [] }))

vi.mock('react-redux', () => ({
    useDispatch: () => action => {
        if (action?.type === 'snackbar') api.snackbars.push(action.payload)
        return action
    }
}))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/clientAiSlice', () => ({
    useGetClientAiQuery: () => ({
        data: { data: api.settings },
        isFetching: false,
        isError: false,
        refetch: api.refetch
    }),
    useSaveClientAiMutation: () => [
        payload => ({ unwrap: () => Promise.resolve(api.save(payload)) }),
        { isLoading: false }
    ],
    useTestClientAiKeyMutation: () => [payload => ({ unwrap: () => Promise.resolve(api.test(payload)) })]
}))

const ready = () => ({
    setUp: true,
    encryptionReady: true,
    unreadable: false,
    keys: {
        gemini: { set: true, hint: '…1234' },
        groq: { set: false },
        cerebras: { set: false },
        openrouter: { set: false }
    },
    dailyLimit: 50,
    defaultDailyLimit: 200,
    sharedProviders: ['gemini', 'groq'],
    usage: { today: { own: 4, shared: 12 }, days: [{ day: '2026-10-01', own: 4, shared: 12 }] }
})

const renderDialog = () => render(<AiKeysDialog open client={{ id: 5, name: 'TravelKart' }} onClose={vi.fn()} />)
const section = label => screen.getByRole('region', { name: label })

beforeEach(() => {
    vi.clearAllMocks()
    api.snackbars = []
    api.settings = ready()
    api.save.mockImplementation(() => ({ success: true, message: 'AI settings saved for TravelKart' }))
    api.test.mockImplementation(() => ({ data: { ok: true, message: 'Works — gemini-3.8-flash answered.' } }))
})

describe('a client’s AI keys', () => {
    test('shows which keys are saved — by their last four characters only — and today’s use', () => {
        renderDialog()
        expect(within(section('Gemini')).getByText('Saved · …1234')).toBeInTheDocument()
        expect(within(section('Groq')).getByText('Not set')).toBeInTheDocument()
        expect(screen.getByLabelText('Shared-key AI calls a day')).toHaveValue(50)
        expect(screen.getByText(/Today: 4 calls on its own keys · 12 calls on shared keys/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    test('saves only what changed: a new key, a removed one, and the allowance', async () => {
        renderDialog()
        fireEvent.change(screen.getByLabelText('Groq key'), { target: { value: ' gsk_new_key ' } })
        fireEvent.click(within(section('Gemini')).getByRole('button', { name: 'Remove' }))
        expect(within(section('Gemini')).getByText('Will be removed when you save')).toBeInTheDocument()
        fireEvent.change(screen.getByLabelText('Shared-key AI calls a day'), { target: { value: '' } })

        fireEvent.click(screen.getByRole('button', { name: 'Save' }))
        await waitFor(() =>
            expect(api.save).toHaveBeenCalledWith({
                id: 5,
                keys: { gemini: null, groq: 'gsk_new_key' },
                dailyLimit: null
            })
        )
        expect(api.snackbars.map(item => item.message)).toContain('AI settings saved for TravelKart')
    })

    test('a key can be tested before saving, and the result is shown', async () => {
        renderDialog()
        fireEvent.change(screen.getByLabelText('Groq key'), { target: { value: 'gsk_typed' } })
        fireEvent.click(within(section('Groq')).getByRole('button', { name: 'Test' }))
        await waitFor(() => expect(api.test).toHaveBeenCalledWith({ id: 5, provider: 'groq', key: 'gsk_typed' }))
        expect(await within(section('Groq')).findByRole('status')).toHaveTextContent(
            'Works — gemini-3.8-flash answered.'
        )

        // ? a saved key is tested without sending it from the browser
        fireEvent.click(within(section('Gemini')).getByRole('button', { name: 'Test' }))
        await waitFor(() => expect(api.test).toHaveBeenLastCalledWith({ id: 5, provider: 'gemini' }))
    })

    test('a server that cannot store keys says what to do, and keys cannot be entered', () => {
        api.settings = { ...ready(), encryptionReady: false }
        renderDialog()
        expect(screen.getByText(/add CREDENTIAL_ENCRYPTION_KEY/)).toBeInTheDocument()
        expect(screen.getByLabelText('Groq key')).toBeDisabled()
    })

    test('a server not set up yet says how to set it up', () => {
        api.settings = { ...ready(), setUp: false }
        renderDialog()
        expect(screen.getByText('node Scripts/setupAiKeys.js --fix')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })
})
