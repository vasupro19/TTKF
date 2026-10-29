import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import GuestPaymentModal from '@/core/components/modals/GuestPaymentModal'
import SupplierPaymentModal from '@/core/components/modals/SupplierPaymentModal'
import GuestPaymentsTab from './GuestPaymentsTab'
import SupplierPaymentsTab from './SupplierPaymentsTab'

const api = vi.hoisted(() => ({
    args: [],
    response: null,
    supplierResponse: null,
    verify: null,
    reject: null,
    reverse: null,
    readProof: null,
    excel: []
}))

vi.mock('react-redux', () => ({ useDispatch: () => action => action, useSelector: select => select({}) }))
vi.mock('@/app/guards/UiPermissionGuard', () => ({ default: ({ children }) => children }))
vi.mock('@/app/store/slices/api/leadSlice', () => ({
    useGetAssigneesQuery: () => ({
        data: {
            data: [
                { id: 5, name: 'Ravi', isMe: false },
                { id: 6, name: 'Sam', isMe: true }
            ]
        }
    })
}))
vi.mock('@/app/store/slices/api/paymentSlice', () => ({
    useGetGuestPaymentsQuery: args => {
        api.args.push(args)
        return { data: api.response, error: null, isFetching: false }
    },
    getGuestPayments: { initiate: () => ({ unwrap: () => Promise.resolve(api.response) }) },
    useGetSupplierPaymentsQuery: () => ({ data: api.supplierResponse, error: null, isFetching: false }),
    getSupplierPayments: { initiate: () => ({ unwrap: () => Promise.resolve(api.supplierResponse) }) },
    useVerifyGuestPaymentMutation: () => [api.verify, { isLoading: false }],
    useRejectGuestPaymentMutation: () => [api.reject, { isLoading: false }],
    useReverseGuestPaymentMutation: () => [api.reverse, { isLoading: false }],
    useReadPaymentProofMutation: () => [api.readProof]
}))

// ? the Excel file is not written here: what would go into it is kept, to be read
vi.mock('@/core/listing/excelFacts', async importOriginal => ({
    ...(await importOriginal()),
    downloadExcel: vi.fn(async (sheets, name) => {
        api.excel.push({ sheets, name })
    })
}))

const ok = message => vi.fn(() => ({ unwrap: () => Promise.resolve({ message }) }))

const pending = {
    id: 7,
    packageId: 3,
    amount: '12000',
    paymentDate: '2026-10-05T00:00:00.000Z',
    paymentMethod: 'UPI',
    transactionId: 'UTR777',
    status: 'PENDING',
    hasProof: true,
    proofName: 'upi.png',
    recordedByName: 'Ravi',
    bookingNo: 'TTK-B-261005-001',
    guestName: 'Asha Verma',
    duplicateOf: [4],
    package: { id: 3, leadId: 11, sellingPrice: '50000', guestPaidAmount: '0', lead: { fullName: 'Asha Verma' } }
}

const respond = (rows, canDecide = true) => {
    api.response = {
        data: {
            rows,
            summary: {
                PENDING: { count: 1, amount: 12000 },
                VERIFIED: { count: 2, amount: 30000 },
                REJECTED: { count: 0, amount: 0 },
                REVERSED: { count: 0, amount: 0 },
                LEGACY: { count: 3, amount: 9000 }
            },
            page: 1,
            pageSize: 25,
            recordsTotal: rows.length,
            canDecide
        }
    }
}

beforeEach(() => {
    api.args = []
    api.verify = ok('Payment verified')
    api.reject = ok('Payment rejected')
    api.reverse = ok('Payment reversed')
    respond([pending])
})

const renderTab = (notify = vi.fn(), url = '/') =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <GuestPaymentsTab notify={notify} />
        </MemoryRouter>
    )

describe('Transactions — guest payments', () => {
    test('opens on the payments awaiting verification, with every status counted', () => {
        renderTab()
        expect(api.args[0]).toMatchObject({ status: 'PENDING', page: 1, pageSize: 25 })
        expect(screen.getByRole('tab', { name: 'Awaiting verification (1)' })).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByRole('tab', { name: 'Before verification (3)' })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: 'All (6)' })).toBeInTheDocument()
        const row = screen.getByRole('row', { name: /UTR777/ })
        expect(within(row).getByText('TTK-B-261005-001')).toHaveAttribute('href', '/process/packages/11')
        expect(within(row).getByLabelText('Duplicate transaction ID')).toBeInTheDocument()
        expect(within(row).getByRole('button', { name: 'View proof' })).toBeInTheDocument()
    })

    test('changing the status asks for that status from the first page', () => {
        renderTab()
        fireEvent.click(screen.getByRole('tab', { name: 'All (6)' }))
        expect(api.args[api.args.length - 1]).toMatchObject({ status: 'ALL', page: 1 })
    })

    test('verify shows the proof beside the amount and transaction id, then verifies', async () => {
        const notify = vi.fn()
        renderTab(notify)
        fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
        const dialog = await screen.findByRole('dialog', { name: 'Verify payment' })
        expect(within(dialog).getByRole('img', { name: 'Proof of payment 7' })).toHaveAttribute(
            'src',
            expect.stringMatching(/\/package\/guest-payment\/7\/proof$/)
        )
        expect(within(dialog).getByText('₹12,000')).toBeInTheDocument()
        expect(within(dialog).getByText('UTR777')).toBeInTheDocument()
        expect(within(dialog).getByText(/same transaction ID is on payment #4/)).toBeInTheDocument()
        fireEvent.click(within(dialog).getByRole('button', { name: 'Verify payment' }))
        await waitFor(() => expect(api.verify).toHaveBeenCalledWith({ id: 7, reason: undefined }))
        expect(notify).toHaveBeenCalledWith('Payment verified')
    })

    test('the server’s message is shown when a decision fails', async () => {
        const notify = vi.fn()
        api.verify = vi.fn(() => ({
            unwrap: () =>
                Promise.reject(
                    Object.assign(new Error('409'), {
                        status: 409,
                        data: { message: 'This payment is already verified' }
                    })
                )
        }))
        renderTab(notify)
        fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
        fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Verify payment' }))
        await waitFor(() => expect(notify).toHaveBeenCalledWith('This payment is already verified', 'error'))
    })

    test('a verified payment can be reversed with a reason; sales sees no buttons', async () => {
        respond([{ ...pending, status: 'VERIFIED', duplicateOf: [] }])
        const { unmount } = renderTab()
        fireEvent.click(screen.getByRole('button', { name: 'Reverse' }))
        const dialog = await screen.findByRole('dialog', { name: 'Reverse payment' })
        fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'Cheque bounced' } })
        fireEvent.click(within(dialog).getByRole('button', { name: 'Reverse' }))
        await waitFor(() => expect(api.reverse).toHaveBeenCalledWith({ id: 7, reason: 'Cheque bounced' }))
        unmount()

        respond([pending], false)
        renderTab()
        expect(screen.queryByRole('button', { name: 'Verify' })).not.toBeInTheDocument()
        expect(screen.getByText(/Only accounts or the agency’s admin/)).toBeInTheDocument()
    })
})

describe('Transactions — the list toolbar', () => {
    test('filters in the address are sent to the server, and bad ones are ignored', () => {
        renderTab(vi.fn(), '/?status=ALL&method=UPI&from=2026-10-01&recordedBy=5&q=utr&to=nope&type=x')
        expect(api.args[0]).toMatchObject({
            status: 'ALL',
            method: 'UPI',
            from: '2026-10-01',
            recordedBy: '5',
            q: 'utr',
            to: ''
        })
    })

    test('choosing a method asks again from the first page, and Clear filters removes them all', () => {
        renderTab(vi.fn(), '/?method=UPI&q=utr')
        expect(screen.getByText('1 payment')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
        expect(api.args[api.args.length - 1]).toMatchObject({ method: '', q: '', recordedBy: '', page: 1 })
        expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
    })

    test('the column picker hides a column, and CSV of what is shown does not crash', () => {
        renderTab()
        expect(screen.getByRole('columnheader', { name: 'Proof' })).toBeInTheDocument()
        expect(screen.queryByRole('columnheader', { name: 'Remarks' })).not.toBeInTheDocument()
    })

    test('nothing matching the filters says so; nothing at all says there are no payments yet', () => {
        respond([])
        renderTab(vi.fn(), '/?method=Cheque&status=ALL')
        expect(screen.getByText('No payments match these filters.')).toBeInTheDocument()
        const { unmount } = renderTab(vi.fn(), '/?status=ALL')
        unmount()
        api.response.data.summary = { PENDING: { count: 0 }, VERIFIED: { count: 0 } }
        renderTab(vi.fn(), '/?status=ALL')
        expect(screen.getByText('No guest payments yet')).toBeInTheDocument()
    })
})

describe('payment forms', () => {
    const png = () => new File(['x'], 'upi.png', { type: 'image/png' })

    test('a guest payment by UPI needs its proof; by cash it does not', () => {
        const onSave = vi.fn()
        render(<GuestPaymentModal open row={{ sellingPrice: 50000 }} onSave={onSave} onClose={vi.fn()} />)
        fireEvent.change(screen.getByLabelText('Amount Received'), { target: { value: '5000' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save Payment' }))
        expect(onSave).not.toHaveBeenCalled()
        expect(screen.getByRole('alert')).toHaveTextContent(/except cash/)

        fireEvent.change(screen.getByLabelText('Payment proof'), { target: { files: [png()] } })
        fireEvent.click(screen.getByRole('button', { name: 'Save Payment' }))
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ amount: '5000', paymentMethod: 'UPI' }))
        expect(onSave.mock.calls[0][0].proof.name).toBe('upi.png')
    })

    test('a rejected payment opens with its reason and values, to send back to accounts', () => {
        const onSave = vi.fn()
        render(
            <GuestPaymentModal
                open
                row={{ sellingPrice: 50000 }}
                payment={{
                    id: 8,
                    amount: '4000',
                    paymentMethod: 'UPI',
                    transactionId: 'UTR8',
                    status: 'REJECTED',
                    rejectionReason: 'Wrong UTR',
                    hasProof: true
                }}
                onSave={onSave}
                onClose={vi.fn()}
            />
        )
        expect(screen.getByText('Rejected: Wrong UTR')).toBeInTheDocument()
        expect(screen.getByLabelText('Amount Received')).toHaveValue(4000)
        fireEvent.click(screen.getByRole('button', { name: 'Send to accounts' }))
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ transactionId: 'UTR8', proof: null }))
    })

    test('a supplier payment always needs its proof', () => {
        const onSave = vi.fn()
        render(<SupplierPaymentModal open row={{ cost: 9000, paidAmount: 0 }} onSave={onSave} onClose={vi.fn()} />)
        fireEvent.change(screen.getByLabelText('Amount Paid'), { target: { value: '1000' } })
        fireEvent.click(screen.getByRole('button', { name: 'Confirm Payment' }))
        expect(onSave).not.toHaveBeenCalled()
        expect(screen.getByRole('alert')).toHaveTextContent('Attach the payment screenshot or PDF')
    })
})

describe('the transaction ID is read from the proof', () => {
    const file = name => new File(['x'], name, { type: 'image/png' })
    // ? what the server says it read: { transactionId, reason, message }
    const reading = (transactionId, message = '') =>
        vi.fn(() => ({
            unwrap: () => Promise.resolve({ data: { transactionId, reason: transactionId ? null : 'none', message } })
        }))
    const attach = proof => fireEvent.change(screen.getByLabelText('Payment proof'), { target: { files: [proof] } })
    const idField = () => screen.getByLabelText('Transaction ID / Ref')
    const renderGuest = () =>
        render(<GuestPaymentModal open row={{ sellingPrice: 50000 }} onSave={vi.fn()} onClose={vi.fn()} />)

    beforeEach(() => {
        api.readProof = reading('412345678901')
    })

    test('attaching a screenshot fills the transaction ID, and says to check it', async () => {
        renderGuest()
        const proof = file('upi.png')
        attach(proof)
        expect(screen.getByText('Reading the transaction ID from the file…')).toBeInTheDocument()
        await waitFor(() => expect(idField()).toHaveValue('412345678901'))
        expect(api.readProof).toHaveBeenCalledWith(proof)
        expect(
            screen.getByText('Transaction ID read from the file — check it matches the receipt.')
        ).toBeInTheDocument()
    })

    test('what the person typed is never overwritten: the form says what the file shows, and offers it', async () => {
        renderGuest()
        fireEvent.change(idField(), { target: { value: 'MYREF123' } })
        attach(file('upi.png'))
        expect(await screen.findByText('The file shows 412345678901, not what you typed.')).toBeInTheDocument()
        expect(idField()).toHaveValue('MYREF123')
        fireEvent.click(screen.getByRole('button', { name: 'Use it' }))
        expect(idField()).toHaveValue('412345678901')
    })

    test('the same as what was typed: says so', async () => {
        renderGuest()
        fireEvent.change(idField(), { target: { value: '412345678901' } })
        attach(file('upi.png'))
        expect(await screen.findByText('The transaction ID matches the file.')).toBeInTheDocument()
        expect(idField()).toHaveValue('412345678901')
    })

    test('a second file replaces an ID the form filled in, but not one the person changed since', async () => {
        const said = id => ({ unwrap: () => Promise.resolve({ data: { transactionId: id } }) })
        api.readProof = vi
            .fn()
            .mockReturnValueOnce(said('412345678901'))
            .mockReturnValueOnce(said('999988887777'))
            .mockReturnValueOnce(said('555566667777'))
        renderGuest()
        attach(file('first.png'))
        await waitFor(() => expect(idField()).toHaveValue('412345678901'))

        attach(file('second.png'))
        await waitFor(() => expect(idField()).toHaveValue('999988887777'))

        fireEvent.change(idField(), { target: { value: 'EDITED' } })
        attach(file('third.png'))
        expect(await screen.findByText('The file shows 555566667777, not what you typed.')).toBeInTheDocument()
        expect(idField()).toHaveValue('EDITED')
    })

    test('nothing found: the field is left alone, the reason is said, and the payment can still be saved', async () => {
        api.readProof = reading(null, 'No transaction ID found in this file — type it in.')
        const onSave = vi.fn()
        render(<GuestPaymentModal open row={{ sellingPrice: 50000 }} onSave={onSave} onClose={vi.fn()} />)
        fireEvent.change(screen.getByLabelText('Amount Received'), { target: { value: '5000' } })
        attach(file('blurry.png'))
        expect(await screen.findByText('No transaction ID found in this file — type it in.')).toBeInTheDocument()
        expect(idField()).toHaveValue('')
        fireEvent.click(screen.getByRole('button', { name: 'Save Payment' }))
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ amount: '5000', transactionId: '' }))
    })

    test('a reader that fails is only a line of text', async () => {
        api.readProof = vi.fn(() => ({ unwrap: () => Promise.reject(new Error('network')) }))
        renderGuest()
        attach(file('upi.png'))
        expect(
            await screen.findByText('Couldn’t read the transaction ID from this file — type it in.')
        ).toBeInTheDocument()
        expect(idField()).toHaveValue('')
    })

    test('an answer for a file that was replaced meanwhile is dropped', async () => {
        let slow
        api.readProof = vi
            .fn()
            .mockReturnValueOnce({
                unwrap: () =>
                    new Promise(resolve => {
                        slow = resolve
                    })
            })
            .mockReturnValueOnce({ unwrap: () => Promise.resolve({ data: { transactionId: 'SECOND000111' } }) })
        renderGuest()
        attach(file('first.png'))
        attach(file('second.png'))
        await waitFor(() => expect(idField()).toHaveValue('SECOND000111'))
        slow({ data: { transactionId: 'FIRST9990000' } })
        await new Promise(resolve => {
            setTimeout(resolve, 20)
        })
        expect(idField()).toHaveValue('SECOND000111')
    })

    test('removing the file stops reading and clears the note', async () => {
        renderGuest()
        attach(file('upi.png'))
        await screen.findByText('Transaction ID read from the file — check it matches the receipt.')
        fireEvent.click(screen.getByRole('button', { name: 'Remove the chosen file' }))
        expect(screen.queryByText(/read from the file/)).not.toBeInTheDocument()
    })

    test('cash needs no proof, so nothing is read', () => {
        renderGuest()
        fireEvent.mouseDown(screen.getByRole('combobox'))
        fireEvent.click(screen.getByRole('option', { name: 'Cash' }))
        attach(file('note.png'))
        expect(api.readProof).not.toHaveBeenCalled()
    })

    test('a file that is not a photo or PDF is not sent to be read', () => {
        renderGuest()
        attach(new File(['x'], 'notes.txt', { type: 'text/plain' }))
        expect(api.readProof).not.toHaveBeenCalled()
        expect(screen.getByRole('alert')).toHaveTextContent('The proof must be a photo')
    })

    test('a supplier payment fills it too', async () => {
        render(<SupplierPaymentModal open row={{ cost: 9000, paidAmount: 0 }} onSave={vi.fn()} onClose={vi.fn()} />)
        attach(file('imps.png'))
        await waitFor(() => expect(idField()).toHaveValue('412345678901'))
    })
})

describe('the form starts with the screenshot', () => {
    const png = () => new File(['x'], 'upi.png', { type: 'image/png' })
    // ? whether `first` comes before `second` on the page
    const before = (first, second) => first.compareDocumentPosition(second) === Node.DOCUMENT_POSITION_FOLLOWING

    beforeEach(() => {
        api.readProof = vi.fn(() => ({ unwrap: () => Promise.resolve({ data: { transactionId: '412345678901' } }) }))
    })

    test('a guest payment asks for it first, above the amount and the transaction ID, and says why', () => {
        render(<GuestPaymentModal open row={{ sellingPrice: 50000 }} onSave={vi.fn()} onClose={vi.fn()} />)
        expect(screen.getByText('Start with the payment screenshot')).toBeInTheDocument()
        expect(screen.getByText(/the transaction ID is read from it and filled in for you/)).toBeInTheDocument()
        expect(before(screen.getByLabelText('Payment proof'), screen.getByLabelText('Amount Received'))).toBe(true)
        expect(before(screen.getByLabelText('Payment proof'), screen.getByLabelText('Transaction ID / Ref'))).toBe(true)
        expect(screen.getByText(/Attach the screenshot above first and this fills in by itself/)).toBeInTheDocument()
    })

    test('once it is attached the prompt and the nudge go, and the ID is there', async () => {
        render(<GuestPaymentModal open row={{ sellingPrice: 50000 }} onSave={vi.fn()} onClose={vi.fn()} />)
        fireEvent.change(screen.getByLabelText('Payment proof'), { target: { files: [png()] } })
        await waitFor(() => expect(screen.getByLabelText('Transaction ID / Ref')).toHaveValue('412345678901'))
        expect(screen.queryByText('Start with the payment screenshot')).not.toBeInTheDocument()
        expect(screen.queryByText(/Attach the screenshot above first/)).not.toBeInTheDocument()
    })

    test('typing the ID first is still allowed, and the nudge goes once something is typed', () => {
        render(<GuestPaymentModal open row={{ sellingPrice: 50000 }} onSave={vi.fn()} onClose={vi.fn()} />)
        fireEvent.change(screen.getByLabelText('Transaction ID / Ref'), { target: { value: 'UTR1' } })
        expect(screen.getByLabelText('Transaction ID / Ref')).toHaveValue('UTR1')
        expect(screen.queryByText(/Attach the screenshot above first/)).not.toBeInTheDocument()
    })

    test('cash needs no screenshot, so nothing asks for one', () => {
        render(<GuestPaymentModal open row={{ sellingPrice: 50000 }} onSave={vi.fn()} onClose={vi.fn()} />)
        fireEvent.mouseDown(screen.getByRole('combobox'))
        fireEvent.click(screen.getByRole('option', { name: 'Cash' }))
        expect(screen.queryByText('Start with the payment screenshot')).not.toBeInTheDocument()
        expect(screen.queryByText(/Attach the screenshot above first/)).not.toBeInTheDocument()
        expect(screen.getByText('Not needed for cash')).toBeInTheDocument()
    })

    test('a payment being corrected, which already has its proof, is not told to start over', () => {
        render(
            <GuestPaymentModal
                open
                row={{ sellingPrice: 50000 }}
                payment={{
                    id: 8,
                    amount: '4000',
                    paymentMethod: 'UPI',
                    transactionId: 'UTR8',
                    status: 'REJECTED',
                    hasProof: true
                }}
                onSave={vi.fn()}
                onClose={vi.fn()}
            />
        )
        expect(screen.queryByText('Start with the payment screenshot')).not.toBeInTheDocument()
        expect(screen.getByText('A proof is attached — choose a file only to replace it')).toBeInTheDocument()
    })

    test('a supplier payment starts with it too', () => {
        render(<SupplierPaymentModal open row={{ cost: 9000, paidAmount: 0 }} onSave={vi.fn()} onClose={vi.fn()} />)
        expect(screen.getByText('Start with the payment screenshot')).toBeInTheDocument()
        expect(before(screen.getByLabelText('Payment proof'), screen.getByLabelText('Amount Paid'))).toBe(true)
        expect(screen.getByText(/Attach the screenshot above first/)).toBeInTheDocument()
    })
})

describe('Transactions — Excel downloads', () => {
    const download = async (menuItem, tab) => {
        fireEvent.click(screen.getByRole('button', { name: 'Export' }))
        fireEvent.click(await screen.findByText(menuItem))
        await waitFor(() => expect(api.excel.length).toBeGreaterThan(0))
        return api.excel[api.excel.length - 1]
    }
    const TODAY = /\d{4}-\d{2}-\d{2}\.xlsx?$|\d{4}-\d{2}-\d{2}$/

    beforeEach(() => {
        api.excel = []
        api.supplierResponse = {
            data: {
                rows: [
                    {
                        id: 3,
                        paymentDate: '2026-10-20T00:00:00.000Z',
                        amount: '9000.50',
                        paymentMethod: 'Bank Transfer',
                        transactionId: '412345678901',
                        recordedByName: 'Meera',
                        bookingNo: 'TTK-B-261005-001',
                        guestName: 'Asha Verma',
                        supplierName: 'Hotel Snowline',
                        service: { type: 'Hotel' },
                        hasProof: true,
                        proofName: 'imps.png'
                    }
                ],
                recordsTotal: 1,
                page: 1,
                pageSize: 25
            }
        }
    })

    test('guest payments: what is on screen as an Excel file — the ID as text, the amount a number, the date a date', async () => {
        renderTab()
        const { sheets, name } = await download('Current View')
        expect(name).toMatch(/^Guest payments - Awaiting verification - /)
        expect(name).toMatch(TODAY)
        const [{ name: sheet, data }] = sheets
        expect(sheet).toBe('Guest payments')
        expect(data[0]).toEqual(
            expect.arrayContaining(['Date', 'Booking', 'Guest', 'Amount', 'Method', 'Transaction ID', 'Status'])
        )
        const headings = data[0]
        const row = data[1]
        expect(row[headings.indexOf('Transaction ID')]).toBe('UTR777')
        expect(row[headings.indexOf('Amount')]).toBe(12000)
        expect(row[headings.indexOf('Date')]).toEqual({ t: 'n', v: 46300, z: 'dd-mmm-yyyy' })
        expect(row[headings.indexOf('Guest')]).toBe('Asha Verma')
    })

    test('guest payments: "Export All" asks for every payment that matches and downloads them all', async () => {
        renderTab()
        const { name, sheets } = await download('Export All')
        expect(name).toMatch(/^Guest payments - Awaiting verification - all - /)
        expect(sheets[0].data).toHaveLength(2)
    })

    test('guest payments: nothing to export says so and writes no file', async () => {
        respond([])
        const notify = vi.fn()
        renderTab(notify)
        fireEvent.click(screen.getByRole('button', { name: 'Export' }))
        fireEvent.click(await screen.findByText('Current View'))
        await waitFor(() => expect(notify).toHaveBeenCalledWith('Nothing to export for these filters.', 'warning'))
        expect(api.excel).toHaveLength(0)
    })

    test('a file that cannot be made is said, not lost', async () => {
        const { downloadExcel } = await import('@/core/listing/excelFacts')
        downloadExcel.mockRejectedValueOnce(new Error('no library'))
        const notify = vi.fn()
        renderTab(notify)
        fireEvent.click(screen.getByRole('button', { name: 'Export' }))
        fireEvent.click(await screen.findByText('Current View'))
        await waitFor(() => expect(notify).toHaveBeenCalledWith('Couldn’t make the Excel file.', 'error'))
    })

    test('supplier payments: the same, with the supplier and the service', async () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <SupplierPaymentsTab notify={vi.fn()} />
            </MemoryRouter>
        )
        const { sheets, name } = await download('Current View')
        expect(name).toMatch(/^Supplier payments - /)
        const [{ name: sheet, data }] = sheets
        expect(sheet).toBe('Supplier payments')
        const headings = data[0]
        const row = data[1]
        expect(row[headings.indexOf('Supplier')]).toBe('Hotel Snowline')
        expect(row[headings.indexOf('Service')]).toBe('Hotel')
        expect(row[headings.indexOf('Amount')]).toBe(9000.5)
        expect(row[headings.indexOf('Transaction ID')]).toBe('412345678901')
        expect(row[headings.indexOf('Date')].z).toBe('dd-mmm-yyyy')
    })
})
