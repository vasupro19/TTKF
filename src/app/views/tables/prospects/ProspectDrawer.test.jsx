import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import ProspectDrawer from './ProspectDrawer'
import OutreachSettingsDialog from './OutreachSettingsDialog'
import { prefetchVideo } from './whatsappVideo'

const api = vi.hoisted(() => ({
    prospect: null,
    settings: null,
    calls: [],
    snackbars: [],
    refetch: vi.fn(),
    // ? every mutation records what it was sent and answers like the server
    mutation: name => () => [
        payload => {
            api.calls.push([name, payload])
            return { unwrap: () => Promise.resolve({ message: `${name} done` }) }
        },
        { isLoading: false }
    ]
}))

vi.mock('react-redux', () => ({
    useDispatch: () => action => {
        if (action?.type === 'snackbar') api.snackbars.push(action.payload)
        return action
    }
}))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))

vi.mock('@/app/store/slices/api/prospectSlice', () => ({
    useGetProspectQuery: () => ({ data: { data: api.prospect }, isFetching: false, refetch: api.refetch }),
    useSetProspectStatusMutation: api.mutation('status'),
    useEmailProspectMutation: api.mutation('email'),
    useProspectWhatsappOpenedMutation: api.mutation('whatsapp'),
    useAddProspectActivityMutation: api.mutation('activity'),
    useSetProspectSequenceMutation: api.mutation('sequence'),
    useUpdateProspectMutation: api.mutation('update'),
    useRemoveProspectMutation: api.mutation('remove'),
    useGetOutreachSettingsQuery: () => ({
        data: { data: api.settings },
        isFetching: false,
        isError: false,
        refetch: api.refetch
    }),
    useSaveOutreachSettingsMutation: api.mutation('save'),
    useTestOutreachSettingsMutation: api.mutation('test'),
    useUploadOutreachMediaMutation: api.mutation('upload'),
    useRemoveOutreachMediaMutation: api.mutation('removeMedia')
}))

const routeBreakers = () => ({
    id: 7,
    name: 'Route Breakers',
    city: 'Shimla',
    region: 'Himachal',
    phone: '+91 98160 12345',
    email: 'info@routebreakers.in',
    priority: 'A',
    status: 'new',
    sequence: 'off',
    emailsSent: 0,
    canEmail: true,
    emailBlocker: '',
    whatsappUrl: 'https://wa.me/919816012345?text=Hi',
    nextEmail: { kind: 'first', subject: 'Quotes in minutes for Route Breakers', body: 'Namaste Route Breakers team' },
    activities: [{ id: 1, kind: 'note', text: 'Owner is Rakesh', by: 'Super', createdAt: '2026-11-02T06:00:00Z' }]
})

beforeEach(() => {
    vi.clearAllMocks()
    api.calls = []
    api.snackbars = []
    api.prospect = routeBreakers()
    api.settings = {
        encryptionReady: true,
        email: '',
        hasPassword: false,
        dailyLimit: 40,
        followUpDays: 3,
        maxFollowUps: 2,
        firstSubject: 'Quotes in minutes for {agency}',
        firstBody: 'Hi',
        followSubject: 'Re',
        followBody: 'Hi again',
        whatsappText: 'Hi {agency}',
        defaults: { firstBody: 'The suggested first email' }
    }
})

describe('one agency', () => {
    test('WhatsApp opens with the message and is noted as contacted', async () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null)
        render(<ProspectDrawer prospectId={7} onClose={vi.fn()} onChanged={vi.fn()} />)
        fireEvent.click(screen.getByRole('button', { name: 'WhatsApp' }))
        expect(open).toHaveBeenCalledWith('https://wa.me/919816012345?text=Hi', '_blank', 'noopener')
        await waitFor(() => expect(api.calls).toContainEqual(['whatsapp', { id: 7, withVideo: false }]))
        open.mockRestore()
    })

    test('with a video and a browser that can share files, the video goes with the message', async () => {
        const video = { url: 'https://api.test/v1/outreach/video?v=1', name: 'Travelytics demo.mp4' }
        const share = vi.fn(() => Promise.resolve())
        Object.assign(navigator, { share, canShare: () => true })
        global.fetch = vi.fn(() =>
            Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob(['mp4'], { type: 'video/mp4' })) })
        )
        await prefetchVideo(video.url, video.name)
        const open = vi.spyOn(window, 'open').mockImplementation(() => null)

        render(<ProspectDrawer prospectId={7} onClose={vi.fn()} video={video} />)
        fireEvent.click(screen.getByRole('button', { name: 'WhatsApp with video' }))
        await waitFor(() => expect(api.calls).toContainEqual(['whatsapp', { id: 7, withVideo: true }]))
        const [{ files, text }] = share.mock.calls[0]
        expect(files[0].name).toBe('Travelytics demo.mp4')
        expect(text).toBe('Hi')
        expect(open).not.toHaveBeenCalled()

        // ? "Message only" still opens wa.me
        fireEvent.click(screen.getByRole('button', { name: 'Message only' }))
        expect(open).toHaveBeenCalledWith('https://wa.me/919816012345?text=Hi', '_blank', 'noopener')
        open.mockRestore()
        delete navigator.share
        delete navigator.canShare
    })

    test('with a video but no file sharing, it says the message carries the link', () => {
        render(
            <ProspectDrawer prospectId={7} onClose={vi.fn()} video={{ url: 'https://api.test/v', name: 'demo.mp4' }} />
        )
        expect(screen.getByRole('button', { name: 'WhatsApp' })).toBeInTheDocument()
        expect(screen.getByText(/the message carries the video’s link/)).toBeInTheDocument()
    })

    test('the next email can be changed before it goes', async () => {
        render(<ProspectDrawer prospectId={7} onClose={vi.fn()} />)
        expect(screen.getByLabelText('Subject')).toHaveValue('Quotes in minutes for Route Breakers')
        fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Quick question, Route Breakers' } })
        fireEvent.click(screen.getByRole('button', { name: 'Send now' }))
        await waitFor(() =>
            expect(api.calls).toContainEqual([
                'email',
                { id: 7, subject: 'Quick question, Route Breakers', body: 'Namaste Route Breakers team' }
            ])
        )
    })

    test('an agency that opted out shows why, and no composer', () => {
        api.prospect = { ...routeBreakers(), canEmail: false, emailBlocker: 'This agency asked not to be emailed' }
        render(<ProspectDrawer prospectId={7} onClose={vi.fn()} />)
        expect(screen.getByText('This agency asked not to be emailed')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Send now' })).not.toBeInTheDocument()
    })

    test('a note is added to the timeline, which lists what happened', async () => {
        render(<ProspectDrawer prospectId={7} onClose={vi.fn()} />)
        expect(screen.getByText('Owner is Rakesh')).toBeInTheDocument()
        fireEvent.change(screen.getByPlaceholderText(/Add a note/), { target: { value: 'Demo on Friday' } })
        fireEvent.click(screen.getByRole('button', { name: 'Add' }))
        await waitFor(() =>
            expect(api.calls).toContainEqual(['activity', { id: 7, kind: 'note', text: 'Demo on Friday' }])
        )
    })

    test('removing asks once more on the panel itself', async () => {
        const onClose = vi.fn()
        render(<ProspectDrawer prospectId={7} onClose={onClose} />)
        fireEvent.click(screen.getByRole('button', { name: 'Remove from the list' }))
        fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
        await waitFor(() => expect(onClose).toHaveBeenCalled())
        expect(api.calls).toContainEqual(['remove', 7])
    })
})

describe('outreach settings', () => {
    test('a provider fills both servers; an empty password box keeps the saved one', async () => {
        render(<OutreachSettingsDialog open onClose={vi.fn()} />)
        fireEvent.change(screen.getByLabelText('Mailbox address'), { target: { value: 'sales@travelytics.cloud' } })
        fireEvent.mouseDown(screen.getByLabelText('Provider (fills the servers)'))
        fireEvent.click(within(screen.getByRole('listbox')).getByText('Zoho Mail (India)'))
        expect(screen.getByLabelText('SMTP server (sending)')).toHaveValue('smtp.zoho.in')
        expect(screen.getByLabelText('IMAP server (reading replies)')).toHaveValue('imap.zoho.in')

        fireEvent.click(screen.getByRole('button', { name: 'Save' }))
        await waitFor(() => expect(api.calls.find(([name]) => name === 'save')).toBeTruthy())
        const [, body] = api.calls.find(([name]) => name === 'save')
        expect(body).toMatchObject({
            email: 'sales@travelytics.cloud',
            smtpHost: 'smtp.zoho.in',
            smtpPort: '465',
            imapPort: '993'
        })
        expect(body).not.toHaveProperty('password')
    })

    test('a video is uploaded at once, and when it is attached is saved with the rest', async () => {
        render(<OutreachSettingsDialog open onClose={vi.fn()} />)
        const file = new File(['mp4'], 'demo.mp4', { type: 'video/mp4' })
        fireEvent.change(document.querySelector('input[type=file][accept^="video"]'), { target: { files: [file] } })
        await waitFor(() => expect(api.calls).toContainEqual(['upload', { kind: 'video', file }]))

        fireEvent.mouseDown(screen.getByLabelText('Emails with the video attached'))
        fireEvent.click(within(screen.getByRole('listbox')).getByText('Attach it to every email'))
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))
        await waitFor(() =>
            expect(api.calls.find(([name]) => name === 'save')?.[1]).toMatchObject({ attachVideo: 'all' })
        )
    })

    test('the suggested wording can be brought back', () => {
        render(<OutreachSettingsDialog open onClose={vi.fn()} />)
        fireEvent.click(screen.getAllByRole('button', { name: 'Use the suggested wording' })[1])
        expect(screen.getByLabelText('First email')).toHaveValue('The suggested first email')
    })
})
