import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import EmailLeads from './EmailLeads'
import MailboxDialog from './MailboxDialog'
import FacebookLeads from './FacebookLeads'
import { ago } from './format'

const api = vi.hoisted(() => ({
    mailboxes: null,
    overview: null,
    sessionPages: [],
    calls: {},
    snackbars: []
}))

const mutation = vi.hoisted(() => name => () => [
    payload => ({
        unwrap: () => {
            api.calls[name] = [...(api.calls[name] || []), payload]
            const reply = api.replies?.[name]
            return reply instanceof Error
                ? Promise.reject(reply)
                : Promise.resolve(reply || { message: 'ok', data: {} })
        }
    }),
    { isLoading: false }
])

vi.mock('react-redux', () => ({
    useDispatch: () => action => {
        if (action?.type === 'snackbar') api.snackbars.push(action.payload)
        return action
    }
}))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/leadChannelsSlice', () => ({
    useGetLeadMailboxesQuery: () => ({
        data: { data: api.mailboxes },
        isLoading: false,
        isError: false,
        refetch: vi.fn()
    }),
    useTestLeadMailboxMutation: mutation('test'),
    useCreateLeadMailboxMutation: mutation('create'),
    useUpdateLeadMailboxMutation: mutation('update'),
    useSyncLeadMailboxMutation: mutation('sync'),
    useRemoveLeadMailboxMutation: mutation('remove'),
    useGetFacebookOverviewQuery: () => ({
        data: { data: api.overview },
        isLoading: false,
        isError: false,
        refetch: vi.fn()
    }),
    useGetFacebookConnectUrlMutation: mutation('connectUrl'),
    useGetFacebookSessionPagesQuery: () => ({
        data: { data: { pages: api.sessionPages } },
        isLoading: false,
        isError: false
    }),
    useGetFacebookSessionFormsQuery: () => ({ data: { data: { forms: [] } }, isFetching: false }),
    useConnectFacebookPageMutation: mutation('connectPage'),
    useGetFacebookPageFormsQuery: () => ({ data: { data: { forms: [] } }, isFetching: false }),
    useUpdateFacebookPageMutation: mutation('updatePage'),
    useCheckFacebookPageMutation: mutation('check'),
    useDisconnectFacebookPageMutation: mutation('disconnect')
}))

const users = [
    { id: 1, name: 'Priya Sharma', email: 'priya@travelkart.in' },
    { id: 2, name: 'Rohit', email: 'rohit@travelkart.in' }
]

beforeEach(() => {
    api.calls = {}
    api.replies = {}
    api.snackbars = []
    api.mailboxes = { setUp: true, canManage: true, encryptionReady: true, users, mailboxes: [] }
    api.overview = {
        appConfigured: true,
        canManage: true,
        stats: { last30Days: 0, lastLeadAt: null },
        users,
        pages: []
    }
    api.sessionPages = []
})

describe('email leads', () => {
    test('with nothing connected, invites the agency to connect its inbox', () => {
        render(<EmailLeads />)
        expect(screen.getByText('No mailbox connected yet')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Connect mailbox' })).toBeEnabled()
    })

    test('a mailbox that can’t be read says why, and offers the fix', () => {
        api.mailboxes.mailboxes = [
            {
                id: 3,
                email: 'enquiry@travelkart.in',
                provider: 'gmail',
                host: 'imap.gmail.com',
                port: 993,
                secure: true,
                active: true,
                status: 'error',
                lastError: 'The email address or app password was not accepted.',
                leadsCaptured: 12,
                assignedToName: 'Priya Sharma',
                keywords: ''
            }
        ]
        render(<EmailLeads />)
        expect(screen.getByText('Needs attention')).toBeInTheDocument()
        expect(screen.getByText('The email address or app password was not accepted.')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Fix' })).toBeInTheDocument()
        expect(screen.getByText('12')).toBeInTheDocument()
    })

    test('check now reads the mailbox and says what it found', async () => {
        api.mailboxes.mailboxes = [
            {
                id: 3,
                email: 'a@b.in',
                provider: 'zoho',
                host: 'imap.zoho.in',
                port: 993,
                active: true,
                status: 'active',
                leadsCaptured: 0
            }
        ]
        api.replies.sync = { message: '2 new leads', data: { result: { ok: true, created: 2 } } }
        render(<EmailLeads />)
        fireEvent.click(screen.getByRole('button', { name: 'Check now' }))
        await waitFor(() => expect(api.snackbars.at(-1)?.message).toBe('2 new leads'))
        expect(api.calls.sync).toEqual([3])
    })

    test('the server not ready to store passwords blocks connecting', () => {
        api.mailboxes.encryptionReady = false
        render(<EmailLeads />)
        expect(screen.getByText(/can’t store mailbox passwords/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Connect mailbox' })).toBeDisabled()
    })
})

describe('connecting a mailbox', () => {
    test('provider, a tested sign-in, then lead rules — and only then is it saved', async () => {
        const onSaved = vi.fn()
        api.replies.test = { data: { ok: true, message: 'Signed in. The inbox has 40 emails.' } }
        api.replies.create = { message: 'Mailbox connected' }
        render(<MailboxDialog open users={users} onClose={vi.fn()} onSaved={onSaved} />)

        fireEvent.click(screen.getByText('Gmail'))
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

        expect(screen.getByText('Get your Gmail app password')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Create an app password/ })).toHaveAttribute(
            'href',
            'https://myaccount.google.com/apppasswords'
        )

        fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'enquiry@gmail.com' } })
        fireEvent.change(screen.getByLabelText('App password'), { target: { value: 'abcd efgh ijkl mnop' } })
        fireEvent.click(screen.getByRole('button', { name: 'Test & continue' }))

        await waitFor(() => expect(screen.getByText('What becomes a lead')).toBeInTheDocument())
        expect(api.calls.test[0]).toMatchObject({
            email: 'enquiry@gmail.com',
            host: 'imap.gmail.com',
            port: '993',
            secure: true
        })
        expect(api.calls.create).toBeUndefined()

        fireEvent.mouseDown(screen.getByLabelText('Give new leads to'))
        fireEvent.click(within(screen.getByRole('listbox')).getByText('Rohit'))
        fireEvent.click(screen.getByRole('button', { name: 'Connect mailbox' }))

        await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Mailbox connected'))
        expect(api.calls.create[0]).toMatchObject({
            email: 'enquiry@gmail.com',
            password: 'abcd efgh ijkl mnop',
            provider: 'gmail',
            defaultAssignedTo: 2,
            backfillDays: 0
        })
    })

    test('a sign-in the server refuses stays on the sign-in step with its reason', async () => {
        api.replies.test = { data: { ok: false, message: 'The email address or app password was not accepted.' } }
        render(<MailboxDialog open users={users} onClose={vi.fn()} />)
        fireEvent.click(screen.getByText('Zoho Mail (India)'))
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
        fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'sales@agency.in' } })
        fireEvent.change(screen.getByLabelText('App-specific password'), { target: { value: 'secret' } })
        fireEvent.click(screen.getByRole('button', { name: 'Test & continue' }))

        await waitFor(() =>
            expect(screen.getByText('The email address or app password was not accepted.')).toBeInTheDocument()
        )
        expect(screen.queryByText('What becomes a lead')).not.toBeInTheDocument()
    })

    test('editing keeps the saved password when none is typed', async () => {
        api.replies.test = { data: { ok: true, message: 'Signed in.' } }
        const mailbox = {
            id: 7,
            email: 'enquiry@gmail.com',
            provider: 'gmail',
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            defaultAssignedTo: 1
        }
        render(<MailboxDialog open mailbox={mailbox} users={users} onClose={vi.fn()} onSaved={vi.fn()} />)
        fireEvent.click(screen.getByRole('button', { name: 'Test & continue' }))
        await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument())
        expect(api.calls.test[0]).toMatchObject({ id: 7 })
        expect(api.calls.test[0].password).toBeUndefined()
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
        await waitFor(() => expect(api.calls.update).toHaveLength(1))
        expect(api.calls.update[0].password).toBeUndefined()
        expect(api.calls.update[0].id).toBe(7)
    })
})

const renderFacebook = (path = '/integration/facebook') =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <FacebookLeads />
        </MemoryRouter>
    )

describe('facebook leads', () => {
    test('nothing connected: one button, no tokens to copy', () => {
        renderFacebook()
        expect(screen.getByText('No Facebook page connected yet')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Connect with Facebook' })).toBeEnabled()
    })

    test('the app not set up on the server says so and disables connecting', () => {
        api.overview.appConfigured = false
        renderFacebook()
        expect(screen.getByText(/isn’t switched on for this CRM yet/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Connect with Facebook' })).toBeDisabled()
    })

    test('a page whose token Facebook ended asks to reconnect', () => {
        api.overview.pages = [
            {
                id: 'p1',
                pageId: '1234',
                name: 'Himalayan Trails',
                isActive: true,
                tokenOk: false,
                subscribed: null,
                problem: 'Facebook ended this connection (password changed or access removed). Reconnect the page.',
                formIds: [],
                assignedToName: 'Priya Sharma'
            }
        ]
        renderFacebook()
        expect(screen.getByText('Reconnect needed')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Reconnect' })).toBeInTheDocument()
        expect(screen.getByText('All forms')).toBeInTheDocument()
    })

    test('a cancelled Facebook login is explained', () => {
        renderFacebook('/integration/facebook?error=denied')
        expect(screen.getByText(/Facebook login was cancelled/)).toBeInTheDocument()
    })

    test('back from Facebook: choose the page, who gets the leads, connect', async () => {
        api.sessionPages = [
            { id: '111', name: 'Himalayan Trails', picture: null, canGetLeads: true, connected: null },
            { id: '222', name: 'Other Agency', picture: null, canGetLeads: true, connected: 'elsewhere' }
        ]
        api.replies.connectPage = { message: 'Himalayan Trails is connected' }
        renderFacebook(`/integration/facebook?connect=${'a'.repeat(32)}`)

        expect(await screen.findByText('Choose your Facebook page')).toBeInTheDocument()
        expect(screen.getByText('Connected to another workspace')).toBeInTheDocument()
        fireEvent.click(screen.getByText('Himalayan Trails'))
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
        fireEvent.click(screen.getByRole('button', { name: 'Connect page' }))

        await waitFor(() => expect(screen.getByText('Page connected')).toBeInTheDocument())
        expect(api.calls.connectPage[0]).toEqual({
            session: 'a'.repeat(32),
            pageId: '111',
            defaultAssignedTo: 1,
            formIds: []
        })
    })
})

describe('ago', () => {
    test('reads like a person would say it', () => {
        const minutes = n => new Date(Date.now() - n * 60 * 1000).toISOString()
        expect(ago(null)).toBe('—')
        expect(ago(new Date().toISOString())).toBe('just now')
        expect(ago(minutes(5))).toBe('5 min ago')
        expect(ago(minutes(120))).toBe('2 hours ago')
        expect(ago(minutes(60 * 24 * 3))).toBe('3 days ago')
    })
})

describe('who may change the channels', () => {
    test('a user who is not the agency’s admin sees the channels but cannot connect or change them', () => {
        api.mailboxes.canManage = false
        api.overview.canManage = false
        render(<EmailLeads />)
        expect(screen.queryByRole('button', { name: 'Connect mailbox' })).not.toBeInTheDocument()
    })
})
