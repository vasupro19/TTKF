import { describe, expect, test } from 'vitest'
import {
    canEdit,
    canReverse,
    canSendReceipt,
    canVerify,
    decisionNote,
    guestExportRows,
    isCash,
    paymentFormErrors,
    paymentsQuery,
    proofProblem,
    statusColor,
    statusLabel,
    summaryTotal,
    supplierExportRows,
    toCsv,
    toFormData,
    canReadProof,
    settleReading,
    transactionIdHint
} from './paymentFacts'

const file = (name, type, size = 1000) => {
    const blob = new File(['x'], name, { type })
    Object.defineProperty(blob, 'size', { value: size })
    return blob
}

describe('payment status', () => {
    test('each status has its words and colour; an unknown one is grey', () => {
        expect([statusLabel('PENDING'), statusColor('PENDING')]).toEqual(['Awaiting verification', 'warning'])
        expect([statusLabel('VERIFIED'), statusColor('VERIFIED')]).toEqual(['Verified', 'success'])
        expect([statusLabel('REJECTED'), statusColor('REJECTED')]).toEqual(['Rejected', 'error'])
        expect([statusLabel('REVERSED'), statusColor('REVERSED')]).toEqual(['Reversed', 'default'])
        expect([statusLabel('LEGACY'), statusColor('LEGACY')]).toEqual(['Before verification', 'info'])
        expect(statusLabel('verified')).toBe('Verified')
        expect([statusLabel('ODD'), statusColor('ODD')]).toEqual(['ODD', 'default'])
    })

    test('only verified and older payments get a receipt; only waiting or rejected ones are edited', () => {
        expect(
            ['PENDING', 'VERIFIED', 'REJECTED', 'REVERSED', 'LEGACY'].filter(s => canSendReceipt({ status: s }))
        ).toEqual(['VERIFIED', 'LEGACY'])
        expect(['PENDING', 'VERIFIED', 'REJECTED', 'REVERSED', 'LEGACY'].filter(s => canEdit({ status: s }))).toEqual([
            'PENDING',
            'REJECTED'
        ])
    })

    test('verify/reject while waiting and reverse once it counts — for those who decide only', () => {
        expect(canVerify({ status: 'PENDING' }, true)).toBe(true)
        expect(canVerify({ status: 'PENDING' }, false)).toBe(false)
        expect(canVerify({ status: 'REJECTED' }, true)).toBe(false)
        expect(canReverse({ status: 'VERIFIED' }, true)).toBe(true)
        expect(canReverse({ status: 'LEGACY' }, true)).toBe(true)
        expect(canReverse({ status: 'PENDING' }, true)).toBe(false)
        expect(canReverse({ status: 'VERIFIED' }, false)).toBe(false)
    })

    test('who decided and why', () => {
        expect(decisionNote({ status: 'REJECTED', reviewedByName: 'Meera', rejectionReason: 'No UTR' })).toBe(
            'Rejected by Meera: No UTR'
        )
        expect(decisionNote({ status: 'REVERSED', reversalReason: 'Bounced' })).toBe('Reversed: Bounced')
        expect(decisionNote({ status: 'VERIFIED', reviewedByName: 'Meera', reviewedAt: '2026-10-01T10:00:00Z' })).toBe(
            'Verified by Meera on 01 Oct 2026'
        )
    })
})

describe('payment form', () => {
    test('a guest payment needs its proof unless it was cash', () => {
        expect(paymentFormErrors({ amount: '500', paymentMethod: 'UPI' }, null).proof).toMatch(/except cash/)
        expect(paymentFormErrors({ amount: '500', paymentMethod: 'Cash' }, null)).toEqual({})
        expect(paymentFormErrors({ amount: '500', paymentMethod: ' cash ' }, null)).toEqual({})
        expect(paymentFormErrors({ amount: '500', paymentMethod: 'UPI' }, file('a.png', 'image/png'))).toEqual({})
    })

    test('a supplier payment always needs its proof; an attached one is enough when editing', () => {
        expect(paymentFormErrors({ amount: '500', paymentMethod: 'Cash' }, null, { proof: 'always' }).proof).toBe(
            'Attach the payment screenshot or PDF'
        )
        expect(paymentFormErrors({ amount: '500', paymentMethod: 'UPI' }, null, { hasProof: true })).toEqual({})
    })

    test('amount above zero and a method', () => {
        const errors = paymentFormErrors({ amount: '0', paymentMethod: '' }, null)
        expect(errors.amount).toBe('Enter an amount above zero')
        expect(errors.paymentMethod).toBe('Choose how it was paid')
        expect(paymentFormErrors({ amount: 'abc', paymentMethod: 'Cash' }, null).amount).toBeTruthy()
    })

    test('the proof: a photo or PDF, up to 5 MB', () => {
        expect(proofProblem(file('a.pdf', 'application/pdf'))).toBe('')
        expect(proofProblem(file('a.webp', 'image/webp'))).toBe('')
        expect(proofProblem(file('a.gif', 'image/gif'))).toMatch(/photo/)
        expect(proofProblem(file('a.png', 'image/png', 5 * 1024 * 1024 + 1))).toBe('The proof is larger than 5 MB')
        expect(proofProblem(file('scan.jpeg', ''))).toBe('')
        expect(isCash('Cash')).toBe(true)
        expect(isCash('Cashfree')).toBe(false)
    })

    test('multipart body: empty values left out, the file sent as a file', () => {
        const proof = file('a.png', 'image/png')
        const data = toFormData({ amount: 500, paymentMethod: 'UPI', transactionId: '', remarks: null, proof })
        expect(data.get('amount')).toBe('500')
        expect(data.get('paymentMethod')).toBe('UPI')
        expect(data.has('transactionId')).toBe(false)
        expect(data.has('remarks')).toBe(false)
        expect(data.get('proof')).toBeInstanceOf(File)
        expect(data.get('proof').name).toBe('a.png')
        expect(toFormData({ proof: null }).has('proof')).toBe(false)
    })
})

describe('lists', () => {
    test('query string: only the filters that are set; All sends no status', () => {
        expect(paymentsQuery({ status: 'PENDING', from: '2026-10-01', q: ' utr ', page: 2, pageSize: 25 })).toBe(
            'status=PENDING&from=2026-10-01&q=utr&page=2&pageSize=25'
        )
        expect(paymentsQuery({ status: 'ALL', method: 'UPI', type: 'Hotel' })).toBe(
            'method=UPI&type=Hotel&page=1&pageSize=25'
        )
    })

    test('the summary adds up for All', () => {
        expect(
            summaryTotal({ PENDING: { count: 2, amount: 1500 }, VERIFIED: { count: 1, amount: 1000 }, REJECTED: {} })
        ).toEqual({ count: 3, amount: 2500 })
        expect(summaryTotal(undefined)).toEqual({ count: 0, amount: 0 })
    })

    test('guest export rows', () => {
        const [row] = guestExportRows([
            {
                paymentDate: '2026-10-05T00:00:00.000Z',
                bookingNo: 'TTK-B-1',
                package: { lead: { fullName: 'Asha' } },
                amount: '1500.50',
                paymentMethod: 'UPI',
                transactionId: 'UTR1',
                recordedByName: 'Ravi',
                status: 'REJECTED',
                reviewedByName: 'Meera',
                rejectionReason: 'Wrong UTR',
                hasProof: true,
                proofName: 'upi.png',
                duplicateOf: [4, 9]
            }
        ])
        expect(row).toMatchObject({
            Date: '05 Oct 2026',
            'Booking no': 'TTK-B-1',
            Guest: 'Asha',
            Amount: 1500.5,
            Status: 'Rejected',
            'Checked by': 'Meera',
            Reason: 'Wrong UTR',
            Proof: 'upi.png',
            'Duplicate transaction ID': 'Also on payment 4, 9'
        })
    })

    test('supplier export rows', () => {
        const [row] = supplierExportRows([
            { amount: 900, supplierName: 'Willow', service: { type: 'Taxi' }, hasProof: false }
        ])
        expect(row).toMatchObject({ Supplier: 'Willow', Service: 'Transport', Amount: 900, Proof: 'None' })
    })

    test('CSV: quotes where needed, no formulas', () => {
        const csv = toCsv([
            { Name: 'Asha, Verma', Note: 'said "hi"', Amount: -5 },
            { Name: '=SUM(A1)', Note: 'line\nbreak', Amount: 10 }
        ])
        expect(csv.split('\r\n')).toEqual([
            'Name,Note,Amount',
            '"Asha, Verma","said ""hi""",-5',
            `'=SUM(A1),"line\nbreak",10`
        ])
        expect(toCsv([])).toBe('')
    })
})

describe('reading the transaction ID off a proof', () => {
    test('only a photo or PDF of the right size is sent to be read', () => {
        expect(canReadProof(new File(['x'], 'a.png', { type: 'image/png' }))).toBe(true)
        expect(canReadProof(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toBe(true)
        expect(canReadProof(new File(['x'], 'a.txt', { type: 'text/plain' }))).toBe(false)
        expect(canReadProof(null)).toBe(false)
        const big = new File(['x'], 'big.png', { type: 'image/png' })
        Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 })
        expect(canReadProof(big)).toBe(false)
    })

    test('an empty field is filled; so is one the form filled itself from an earlier file', () => {
        expect(settleReading('412345678901', '')).toEqual({ state: 'filled', fill: '412345678901' })
        expect(settleReading('412345678901', '  ')).toEqual({ state: 'filled', fill: '412345678901' })
        expect(settleReading('999988887777', '412345678901', '412345678901')).toEqual({
            state: 'filled',
            fill: '999988887777'
        })
    })

    test('what the person typed is never overwritten', () => {
        expect(settleReading('412345678901', 'MYREF123')).toEqual({ state: 'differs', fill: null })
        // ? they changed what the form had filled in: it is theirs now
        expect(settleReading('999988887777', 'EDITED', '412345678901')).toEqual({ state: 'differs', fill: null })
    })

    test('the same as typed (whatever the case) is a match; nothing read is nothing', () => {
        expect(settleReading('AXISP00123456789', 'axisp00123456789')).toEqual({ state: 'matched', fill: null })
        expect(settleReading(null, 'MYREF123')).toEqual({ state: 'none', fill: null })
        expect(settleReading('', '')).toEqual({ state: 'none', fill: null })
    })
})

describe('the nudge under the Transaction ID box', () => {
    const base = { canRead: true, hasFile: false, hasId: false }

    test('before a screenshot and before anything typed: attach the screenshot first', () => {
        expect(transactionIdHint(base)).toMatch(/Attach the screenshot above first/)
    })

    test('once a screenshot is chosen, or an ID is there, nothing is said', () => {
        expect(transactionIdHint({ ...base, hasFile: true })).toBe('')
        expect(transactionIdHint({ ...base, hasId: true })).toBe('')
    })

    test('while the file is being read, that is said', () => {
        expect(transactionIdHint({ ...base, hasFile: true, reading: { state: 'reading' } })).toBe(
            'Reading it from the file…'
        )
    })

    test('a payment that has no proof to read (cash) is not told to attach one', () => {
        expect(transactionIdHint({ ...base, canRead: false })).toBe('')
    })
})
