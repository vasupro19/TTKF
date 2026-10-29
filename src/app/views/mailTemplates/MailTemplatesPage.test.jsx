import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import MailTemplatesPage from './MailTemplatesPage'
import { PREVIEW_DELAY_MS } from './mailTemplateFacts'

const api = vi.hoisted(() => ({
    list: null,
    error: null,
    loading: false,
    save: null,
    reset: null,
    preview: null,
    saveTheme: null,
    snackbars: []
}))

vi.mock('react-redux', () => ({
    useDispatch: () => action => {
        if (action?.type === 'snackbar') api.snackbars.push(action.payload.message)
        return action
    },
    useSelector: select => select({ loading: {} })
}))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/mailTemplateSlice', () => ({
    useGetMailTemplatesQuery: () => ({ data: api.list, isLoading: api.loading, error: api.error }),
    useSaveMailTemplateMutation: () => [api.save, { isLoading: false }],
    useResetMailTemplateMutation: () => [api.reset, { isLoading: false }],
    usePreviewMailTemplateMutation: () => [api.preview, { isLoading: false }],
    useSaveMailThemeMutation: () => [api.saveTheme, { isLoading: false }]
}))

const slot = (key, label, extra = {}) => ({
    key,
    label,
    help: `Help for ${label}`,
    multiline: false,
    optional: false,
    maxLength: 200,
    default: `Default ${label}`,
    value: `Default ${label}`,
    customised: false,
    ...extra
})

const receipt = () => ({
    key: 'guest_receipt',
    label: 'Payment receipt to the guest',
    audience: 'guest',
    description: 'Sent to the guest when a payment from them is recorded.',
    customised: true,
    updatedAt: '2026-10-27T10:00:00.000Z',
    updatedByName: 'Asha Verma',
    slots: [
        slot('subject', 'Subject', {
            default: 'Payment received – {amount}',
            value: 'Payment received – {amount}'
        }),
        slot('greeting', 'Greeting', {
            default: 'Dear {guest_name},',
            value: 'Hello {guest_name},',
            customised: true
        }),
        slot('footer', 'Extra footer note', {
            multiline: true,
            optional: true,
            maxLength: 1000,
            default: '',
            value: ''
        })
    ],
    placeholders: [
        { name: 'guest_name', description: 'The guest’s name', sample: 'Asha Verma' },
        { name: 'amount', description: 'The amount just received', sample: '₹20,000' }
    ]
})

const kinds = () => [
    receipt(),
    {
        key: 'guest_quote',
        label: 'Quote to the guest',
        audience: 'guest',
        description: 'Sent with a quote.',
        customised: false,
        updatedAt: null,
        updatedByName: null,
        slots: [slot('subject', 'Subject'), slot('intro', 'Introduction', { multiline: true })],
        placeholders: [{ name: 'guest_name', description: 'The guest’s name', sample: 'Asha Verma' }]
    },
    {
        key: 'supplier_request',
        label: 'Booking request to a hotel',
        audience: 'supplier',
        description: 'Sent to a hotel to ask for rooms.',
        customised: false,
        updatedAt: null,
        updatedByName: null,
        slots: [slot('subject', 'Subject')],
        placeholders: []
    },
    {
        key: 'staff_alert',
        label: 'Payment alert to the team',
        audience: 'staff',
        description: 'Sent to the team.',
        customised: false,
        updatedAt: null,
        updatedByName: null,
        slots: [slot('subject', 'Subject')],
        placeholders: []
    }
]

const listOf = rows => ({ success: true, message: 'ok', data: { kinds: rows } })
const failure = (status, data) => Object.assign(new Error('refused'), { status, data })
const rejecting = error => () => ({ unwrap: () => Promise.reject(error) })
const resolving = value => () => ({ unwrap: () => Promise.resolve(value) })

beforeEach(() => {
    vi.clearAllMocks()
    api.list = listOf(kinds())
    api.error = null
    api.loading = false
    api.snackbars = []
    api.save = vi.fn(resolving({ success: true, data: {} }))
    api.saveTheme = vi.fn(resolving({ success: true, data: {} }))
    api.reset = vi.fn(resolving({ success: true, data: {} }))
    api.preview = vi.fn(
        resolving({
            success: true,
            data: { subject: 'Payment received – ₹20,000', html: '<!DOCTYPE html><p>Hello</p>' }
        })
    )
})

afterEach(() => {
    vi.useRealTimers()
})

const field = label => screen.getByLabelText(label)
const note = input => document.getElementById(input.getAttribute('aria-describedby'))
const openKind = name => fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
const type = (label, value) => fireEvent.change(field(label), { target: { value } })

describe('the kinds of email', () => {
    test('are listed by who gets them, with a chip on the ones that have the agency’s own words', () => {
        render(<MailTemplatesPage />)
        expect(screen.getByRole('heading', { name: 'Mail templates', level: 1 })).toBeInTheDocument()
        const nav = screen.getByRole('navigation', { name: 'Kinds of email' })
        const text = nav.textContent
        expect(text.indexOf('Guests')).toBeLessThan(text.indexOf('Hotels & transporters'))
        expect(text.indexOf('Hotels & transporters')).toBeLessThan(text.indexOf('Our team'))
        expect(within(nav).getAllByRole('button')).toHaveLength(4)
        const customised = within(nav).getByRole('button', { name: /Payment receipt to the guest/ })
        expect(within(customised).getByText('Customised')).toBeInTheDocument()
        const plain = within(nav).getByRole('button', { name: /Quote to the guest/ })
        expect(within(plain).queryByText('Customised')).not.toBeInTheDocument()
        expect(within(nav).getAllByText('Customised')).toHaveLength(1)
    })

    test('the first one is open, with what it is for and who last changed it', () => {
        render(<MailTemplatesPage />)
        expect(screen.getByRole('heading', { name: 'Payment receipt to the guest', level: 2 })).toBeInTheDocument()
        expect(screen.getByText('Sent to the guest when a payment from them is recorded.')).toBeInTheDocument()
        expect(screen.getByText(/Last changed by Asha Verma on 27 Oct 2026/)).toBeInTheDocument()
    })

    test('choosing one shows its own fields, a line or a box by what the text is', () => {
        render(<MailTemplatesPage />)
        expect(field('Greeting')).toHaveValue('Hello {guest_name},')
        expect(field('Greeting').tagName).toBe('INPUT')
        expect(field('Extra footer note').tagName).toBe('TEXTAREA')
        expect(screen.getByText('Help for Greeting')).toBeInTheDocument()
        expect(screen.getByText('19 / 200')).toBeInTheDocument()

        openKind('Quote to the guest')
        expect(screen.getByRole('heading', { name: 'Quote to the guest', level: 2 })).toBeInTheDocument()
        expect(field('Introduction').tagName).toBe('TEXTAREA')
        expect(screen.queryByLabelText('Greeting')).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Extra footer note')).not.toBeInTheDocument()
    })

    test('an optional text says so', () => {
        render(<MailTemplatesPage />)
        const label = screen.getByText('Extra footer note')
        expect(label.parentElement).toHaveTextContent('optional')
        expect(screen.getByText('Greeting').parentElement).not.toHaveTextContent('optional')
    })
})

describe('editing', () => {
    test('typing marks the changes as not saved, and Save waits for one', () => {
        render(<MailTemplatesPage />)
        expect(screen.getByRole('status')).toHaveTextContent('All changes saved')
        expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
        type('Greeting', 'Hi {guest_name},')
        expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes')
        expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
        expect(screen.getByText('16 / 200')).toBeInTheDocument()
    })

    test('typing back what was saved is no change', () => {
        render(<MailTemplatesPage />)
        type('Greeting', 'x')
        type('Greeting', 'Hello {guest_name},')
        expect(screen.getByRole('status')).toHaveTextContent('All changes saved')
    })

    test('Discard puts back what was saved', () => {
        render(<MailTemplatesPage />)
        type('Greeting', 'Hi')
        fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
        expect(field('Greeting')).toHaveValue('Hello {guest_name},')
        expect(screen.queryByRole('button', { name: 'Discard changes' })).not.toBeInTheDocument()
    })

    test('a text that must be there can’t be saved blank, and one that may be blank can', () => {
        render(<MailTemplatesPage />)
        type('Subject', '')
        expect(screen.getByText('This can’t be blank.')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
        type('Subject', 'Payment received – {amount}')
        type('Extra footer note', 'Thanks')
        type('Extra footer note', '')
        expect(screen.queryByText('This can’t be blank.')).not.toBeInTheDocument()
    })

    test('a text longer than allowed says so and can’t be saved', () => {
        render(<MailTemplatesPage />)
        type('Greeting', 'x'.repeat(201))
        expect(screen.getByText('201 / 200')).toBeInTheDocument()
        expect(screen.getByText(/Too long: 201 characters/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    })
})

describe('saving', () => {
    test('sends only the texts that changed', async () => {
        render(<MailTemplatesPage />)
        type('Greeting', 'Hi {guest_name},')
        type('Extra footer note', 'Safe travels')
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
        await waitFor(() =>
            expect(api.save).toHaveBeenCalledWith({
                kind: 'guest_receipt',
                slots: { greeting: 'Hi {guest_name},', footer: 'Safe travels' }
            })
        )
        await waitFor(() => expect(api.snackbars).toContain('“Payment receipt to the guest” saved'))
    })

    test('a text edited back to the default is sent as null, so it follows the default again', async () => {
        render(<MailTemplatesPage />)
        type('Greeting', 'Dear {guest_name},')
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
        await waitFor(() => expect(api.save).toHaveBeenCalledWith({ kind: 'guest_receipt', slots: { greeting: null } }))
    })

    test('when what is saved comes back, the fields show it and the changes are no longer unsaved', async () => {
        api.save = vi.fn(() => ({
            unwrap: () => {
                const updated = receipt()
                updated.slots[1] = { ...updated.slots[1], value: 'Hi {guest_name},' }
                api.list = listOf([updated, ...kinds().slice(1)])
                return Promise.resolve({ success: true, data: updated })
            }
        }))
        const { rerender } = render(<MailTemplatesPage />)
        type('Greeting', 'Hi {guest_name},')
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
        await waitFor(() => expect(api.save).toHaveBeenCalled())
        rerender(<MailTemplatesPage />)
        expect(field('Greeting')).toHaveValue('Hi {guest_name},')
        expect(screen.getByRole('status')).toHaveTextContent('All changes saved')
    })

    test('a message from the server appears under the text it is about, and what was typed is kept', async () => {
        api.save = vi.fn(
            rejecting(
                failure(400, {
                    success: false,
                    message: 'Some text can’t be used',
                    data: { errors: { greeting: '{guest} is not available here. Available: {guest_name}, {amount}' } }
                })
            )
        )
        render(<MailTemplatesPage />)
        type('Greeting', 'Hi {guest},')
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
        const message = await screen.findByText(/\{guest\} is not available here/)
        expect(note(field('Greeting'))).toContainElement(message)
        expect(note(field('Subject'))).not.toHaveTextContent('not available')
        expect(field('Greeting')).toHaveValue('Hi {guest},')
        expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes')
        // ? typing in that text takes its message away
        type('Greeting', 'Hi {guest_name},')
        expect(screen.queryByText(/is not available here/)).not.toBeInTheDocument()
    })

    test('a person who may not use this is told so', async () => {
        api.save = vi.fn(rejecting(failure(403, { success: false, message: 'Forbidden' })))
        render(<MailTemplatesPage />)
        type('Greeting', 'Hi')
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
        expect(
            await screen.findByText("Only the agency's admins and managers can change mail templates.")
        ).toBeInTheDocument()
    })

    test('a database that is not upgraded says so, and editing stops', async () => {
        api.save = vi.fn(rejecting(failure(409, { success: false, message: 'Run the upgrade for this agency' })))
        render(<MailTemplatesPage />)
        type('Greeting', 'Hi')
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
        expect(await screen.findByText('Run the upgrade for this agency')).toBeInTheDocument()
        expect(field('Greeting')).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Reset all to default' })).toBeDisabled()
    })

    test('a failure with no message says it could not be saved, and the typing stays', async () => {
        api.save = vi.fn(rejecting(failure(500, undefined)))
        render(<MailTemplatesPage />)
        type('Greeting', 'Hi')
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
        expect(await screen.findByText(/Couldn’t reach the server/)).toBeInTheDocument()
        expect(field('Greeting')).toHaveValue('Hi')
    })
})

describe('putting a text back to the default', () => {
    test('one text has a Reset when it is not the default; Save then sends it as null', async () => {
        render(<MailTemplatesPage />)
        expect(screen.queryByRole('button', { name: 'Reset Subject to the default' })).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Reset Greeting to the default' }))
        expect(field('Greeting')).toHaveValue('Dear {guest_name},')
        expect(screen.queryByRole('button', { name: 'Reset Greeting to the default' })).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
        await waitFor(() => expect(api.save).toHaveBeenCalledWith({ kind: 'guest_receipt', slots: { greeting: null } }))
    })

    test('the whole kind is reset after a question in a dialog, and nothing happens if it is declined', async () => {
        render(<MailTemplatesPage />)
        fireEvent.click(screen.getByRole('button', { name: 'Reset all to default' }))
        const dialog = screen.getByRole('dialog', { name: 'Reset to the default text?' })
        expect(dialog).toHaveTextContent(
            'Every text of “Payment receipt to the guest” goes back to the default wording.'
        )
        fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(api.reset).not.toHaveBeenCalled()

        fireEvent.click(screen.getByRole('button', { name: 'Reset all to default' }))
        fireEvent.click(
            within(screen.getByRole('dialog', { name: 'Reset to the default text?' })).getByRole('button', {
                name: 'Reset to default'
            })
        )
        await waitFor(() => expect(api.reset).toHaveBeenCalledWith({ kind: 'guest_receipt' }))
        await waitFor(() =>
            expect(api.snackbars).toContain('“Payment receipt to the guest” is back to the default text')
        )
    })

    test('a kind with nothing of its own has nothing to reset', () => {
        render(<MailTemplatesPage />)
        openKind('Quote to the guest')
        expect(screen.getByRole('button', { name: 'Reset all to default' })).toBeDisabled()
    })

    test('the question says that typing not saved is lost too', () => {
        render(<MailTemplatesPage />)
        type('Greeting', 'Hi')
        fireEvent.click(screen.getByRole('button', { name: 'Reset all to default' }))
        expect(screen.getByRole('dialog')).toHaveTextContent('not saved are lost too')
    })
})

describe('leaving a kind with typing that is not saved', () => {
    test('asks first, and stays where it is if you keep editing', async () => {
        render(<MailTemplatesPage />)
        type('Greeting', 'Hi')
        openKind('Quote to the guest')
        const dialog = screen.getByRole('dialog', { name: 'Leave without saving?' })
        expect(dialog).toHaveTextContent('changes to “Payment receipt to the guest” that aren’t saved')
        expect(dialog).toHaveTextContent('Opening “Quote to the guest”')
        fireEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }))
        expect(
            await screen.findByRole('heading', { name: 'Payment receipt to the guest', level: 2 })
        ).toBeInTheDocument()
        expect(field('Greeting')).toHaveValue('Hi')
    })

    test('opens the other one when the changes are given up', async () => {
        render(<MailTemplatesPage />)
        type('Greeting', 'Hi')
        openKind('Quote to the guest')
        fireEvent.click(
            within(screen.getByRole('dialog', { name: 'Leave without saving?' })).getByRole('button', {
                name: 'Discard and open it'
            })
        )
        expect(await screen.findByRole('heading', { name: 'Quote to the guest', level: 2 })).toBeInTheDocument()
        // ? and the first starts from what is saved when it is opened again
        openKind('Payment receipt to the guest')
        expect(field('Greeting')).toHaveValue('Hello {guest_name},')
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    test('does not ask when nothing was changed', () => {
        render(<MailTemplatesPage />)
        openKind('Quote to the guest')
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Quote to the guest', level: 2 })).toBeInTheDocument()
    })
})

describe('the fill-ins', () => {
    const chip = name => screen.getByRole('button', { name })

    test('one goes into the text you were in, at the cursor', () => {
        render(<MailTemplatesPage />)
        const greeting = field('Greeting')
        fireEvent.focus(greeting)
        greeting.setSelectionRange(6, 6)
        fireEvent.click(chip('{amount}'))
        expect(greeting).toHaveValue('Hello {amount}{guest_name},')
        // ? the cursor is just after what went in, in the same text
        expect(greeting).toHaveFocus()
        expect(greeting.selectionStart).toBe(14)
        expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes')
    })

    test('replaces what is selected', () => {
        render(<MailTemplatesPage />)
        const greeting = field('Greeting')
        fireEvent.focus(greeting)
        greeting.setSelectionRange(6, 18)
        fireEvent.click(chip('{amount}'))
        expect(greeting).toHaveValue('Hello {amount},')
    })

    test('goes to the box you were last in, a text with several lines too', () => {
        render(<MailTemplatesPage />)
        const footer = field('Extra footer note')
        fireEvent.focus(footer)
        type('Extra footer note', 'Line one\nLine two')
        footer.setSelectionRange(8, 8)
        fireEvent.click(chip('{guest_name}'))
        expect(footer).toHaveValue('Line one{guest_name}\nLine two')
        expect(screen.getByText(/where your cursor is in “Extra footer note”/)).toBeInTheDocument()
    })

    test('with no box used yet, goes to the end of the first', () => {
        render(<MailTemplatesPage />)
        fireEvent.click(chip('{guest_name}'))
        expect(field('Subject')).toHaveValue('Payment received – {amount}{guest_name}')
    })

    test('each says what it is and an example, when asked', async () => {
        render(<MailTemplatesPage />)
        fireEvent.mouseOver(chip('{amount}'))
        expect(await screen.findByRole('tooltip')).toHaveTextContent('The amount just received — For example: ₹20,000')
    })

    test('are the ones of the open kind', () => {
        render(<MailTemplatesPage />)
        expect(screen.getByRole('button', { name: '{amount}' })).toBeInTheDocument()
        openKind('Booking request to a hotel')
        expect(screen.queryByRole('button', { name: '{amount}' })).not.toBeInTheDocument()
    })
})

describe('the preview', () => {
    test('shows the email in a frame that is allowed to do nothing, with its subject', async () => {
        render(<MailTemplatesPage />)
        const frame = await screen.findByTitle('Email preview')
        expect(frame.tagName).toBe('IFRAME')
        expect(frame).toHaveAttribute('sandbox', '')
        expect(frame).toHaveAttribute('srcdoc', '<!DOCTYPE html><p>Hello</p>')
        expect(screen.getByTestId('preview-subject')).toHaveTextContent('Payment received – ₹20,000')
        expect(api.preview).toHaveBeenCalledWith({ kind: 'guest_receipt', slots: {} })
    })

    test('asks again once the typing stops, once, with only what differs from what is saved', async () => {
        vi.useFakeTimers()
        render(<MailTemplatesPage />)
        await act(async () => {
            await vi.advanceTimersByTimeAsync(0)
        })
        expect(api.preview).toHaveBeenCalledTimes(1)

        type('Greeting', 'Hi')
        await act(async () => {
            await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS - 100)
        })
        type('Greeting', 'Hi there')
        await act(async () => {
            await vi.advanceTimersByTimeAsync(PREVIEW_DELAY_MS - 1)
        })
        expect(api.preview).toHaveBeenCalledTimes(1)
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2)
        })
        expect(api.preview).toHaveBeenCalledTimes(2)
        expect(api.preview).toHaveBeenLastCalledWith({ kind: 'guest_receipt', slots: { greeting: 'Hi there' } })
    })

    test('a text the server can’t use is marked in its field, and the last good preview stays', async () => {
        render(<MailTemplatesPage />)
        await screen.findByTitle('Email preview')
        api.preview = vi.fn(
            rejecting(
                failure(400, {
                    success: false,
                    message: 'Some text can’t be used',
                    data: { errors: { greeting: '{guest} is not available here' } }
                })
            )
        )
        type('Greeting', 'Hi {guest}')
        const message = await screen.findByText('{guest} is not available here', undefined, { timeout: 3000 })
        expect(note(field('Greeting'))).toContainElement(message)
        expect(screen.getByText(/can’t be updated until the text marked in red is fixed/)).toBeInTheDocument()
        expect(screen.getByTitle('Email preview')).toBeInTheDocument()
    })

    test('a preview that can’t be built for another reason says so', async () => {
        api.preview = vi.fn(rejecting(failure(500, undefined)))
        render(<MailTemplatesPage />)
        expect(await screen.findByText('Couldn’t build the preview.')).toBeInTheDocument()
        expect(screen.queryByTitle('Email preview')).not.toBeInTheDocument()
    })
})

describe('when the screen can’t be used', () => {
    test('someone who is not an admin or manager is told so, with nothing to edit', () => {
        api.list = undefined
        api.error = failure(403, { success: false, message: 'Forbidden' })
        render(<MailTemplatesPage />)
        expect(screen.getByText("Only the agency's admins and managers can change mail templates.")).toBeInTheDocument()
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    test('a database that is not upgraded says what the server said', () => {
        api.list = undefined
        api.error = failure(409, { success: false, message: 'Run the upgrade for this agency' })
        render(<MailTemplatesPage />)
        expect(screen.getByText('Run the upgrade for this agency')).toBeInTheDocument()
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    test('a list that can’t load says so', () => {
        api.list = undefined
        api.error = failure(500, undefined)
        render(<MailTemplatesPage />)
        expect(screen.getByText('Couldn’t load the mail templates. Please reload the page.')).toBeInTheDocument()
    })

    test('while loading there is a placeholder, not the fields', () => {
        api.list = undefined
        api.loading = true
        render(<MailTemplatesPage />)
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    test('an empty list says so', () => {
        api.list = listOf([])
        render(<MailTemplatesPage />)
        expect(screen.getByText('There are no emails to change yet.')).toBeInTheDocument()
    })
})

describe('themes: how the emails look', () => {
    const THEMES = [
        { key: 'classic', label: 'Classic', description: 'Navy on white', swatch: ['#0f4c81'] },
        { key: 'coastal', label: 'Coastal', description: 'A teal header band', swatch: ['#0b6e78'] },
        { key: 'minimal', label: 'Minimal', description: 'Black on white', swatch: ['#111111'] }
    ]
    // ? the list as the server sends it with themes: the receipt follows the theme for all (Coastal), the quote has its own
    const withThemes = (extra = {}) => {
        const rows = kinds().map(kind => ({ ...kind, theme: null, themeUsed: 'coastal' }))
        rows[1] = { ...rows[1], theme: 'minimal', themeUsed: 'minimal' }
        return {
            ...listOf(rows),
            data: { kinds: rows, themes: THEMES, themeForAll: 'coastal', canChooseTheme: true, ...extra }
        }
    }
    const pick = async (label, option) => {
        fireEvent.mouseDown(screen.getByRole('combobox', { name: label }))
        fireEvent.click(await screen.findByRole('option', { name: option }))
    }

    test('no themes from the server (an older server): no theme choices, the screen works as before', () => {
        render(<MailTemplatesPage />)
        expect(screen.queryByRole('combobox', { name: 'Theme for all emails' })).toBeNull()
        expect(screen.queryByRole('combobox', { name: 'Theme for this email' })).toBeNull()
    })

    test('the theme for all emails is shown and saved the moment another is picked', async () => {
        api.list = withThemes()
        render(<MailTemplatesPage />)
        expect(screen.getByRole('combobox', { name: 'Theme for all emails' })).toHaveTextContent('Coastal')
        await pick('Theme for all emails', /Minimal/)
        await waitFor(() => expect(api.saveTheme).toHaveBeenCalledWith({ kind: 'all', theme: 'minimal' }))
        await waitFor(() => expect(api.snackbars).toContain('Theme set to Minimal'))
    })

    test('an email follows the theme for all until it is given its own; following again saves null', async () => {
        api.list = withThemes()
        render(<MailTemplatesPage />)
        const own = screen.getByRole('combobox', { name: 'Theme for this email' })
        expect(own).toHaveTextContent('Same as all emails (Coastal)')
        await pick('Theme for this email', /Classic/)
        await waitFor(() => expect(api.saveTheme).toHaveBeenCalledWith({ kind: 'guest_receipt', theme: 'classic' }))

        openKind('Quote to the guest')
        expect(screen.getByRole('combobox', { name: 'Theme for this email' })).toHaveTextContent('Minimal')
        await pick('Theme for this email', 'Same as all emails (Coastal)')
        await waitFor(() => expect(api.saveTheme).toHaveBeenLastCalledWith({ kind: 'guest_quote', theme: null }))
    })

    test('the preview is drawn in the theme the email goes out in', async () => {
        api.list = withThemes()
        render(<MailTemplatesPage />)
        await waitFor(() =>
            expect(api.preview).toHaveBeenCalledWith({ kind: 'guest_receipt', slots: {}, theme: 'coastal' })
        )
        openKind('Quote to the guest')
        await waitFor(() =>
            expect(api.preview).toHaveBeenLastCalledWith({ kind: 'guest_quote', slots: {}, theme: 'minimal' })
        )
    })

    test('a database without the themes table says so, and no theme can be picked', () => {
        api.list = withThemes({ canChooseTheme: false, themeForAll: 'classic' })
        render(<MailTemplatesPage />)
        expect(screen.getByText(/Themes need the server update finished/)).toBeInTheDocument()
        expect(screen.getByRole('combobox', { name: 'Theme for all emails' })).toHaveAttribute('aria-disabled', 'true')
    })

    test('a theme that can’t be saved says so', async () => {
        api.list = withThemes()
        api.saveTheme = vi.fn(rejecting(failure(500, { message: 'Couldn’t save the theme' })))
        render(<MailTemplatesPage />)
        await pick('Theme for all emails', /Classic/)
        await waitFor(() => expect(api.snackbars).toContain('Couldn’t save the theme'))
    })
})
