import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import GuestPaymentModal from '@/core/components/modals/GuestPaymentModal'
import SupplierPaymentModal from '@/core/components/modals/SupplierPaymentModal'
import GuestPaymentsTab from './GuestPaymentsTab'

const api = vi.hoisted(() => ({ args: [], response: null, verify: null, reject: null, reverse: null }))

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
    useVerifyGuestPaymentMutation: () => [api.verify, { isLoading: false }],
    useRejectGuestPaymentMutation: () => [api.reject, { isLoading: false }],
    useReverseGuestPaymentMutation: () => [api.reverse, { isLoading: false }]
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
