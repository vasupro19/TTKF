import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { paymentsQuery, toFormData } from '@/app/views/payments/paymentFacts'
import { apiSliceConfig } from './configSlice'

// ? whatever shows a guest payment or what it adds up to: the Transactions lists, the booking's payment history,
// ? its paid amount and the bookings list
const AFTER_GUEST_DECISION = [
    'GuestPaymentList',
    'GuestPayment',
    'PaymentHistory',
    'ConfirmedPackage',
    'confirmedBooking'
]

const decide = (action, KEY) => ({
    query: ({ id, reason }) => {
        dispatchLoaderEvent(KEY)
        return {
            url: `/package/guest-payment/${id}/${action}`,
            method: 'POST',
            body: reason === undefined ? {} : { reason },
            responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
        }
    },
    invalidatesTags: AFTER_GUEST_DECISION
})

/**
 * Payments checked by accounts (backend Controllers/payment.controller.js). Recording a guest payment is
 * `addGuestPayment` and a supplier payment `paySupplier` (packageConvert / confirmedService slices).
 */
export const paymentSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // ? the transaction ID printed on a proof that has just been attached, so the form can fill it in (nothing is
        // ? stored): a File → { data: { transactionId | null, reason, message } }. Never an error for a file it cannot read.
        readPaymentProof: build.mutation({
            query: file => ({
                url: '/package/payment-proof/read',
                method: 'POST',
                body: toFormData({ proof: file })
            })
        }),
        // ? `{ status, from, to, method, q, page, pageSize }` → { rows, summary, page, pageSize, recordsTotal, canDecide }
        getGuestPayments: build.query({
            query: (filters = {}) => ({
                url: `/package/payments?${paymentsQuery(filters)}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['GuestPaymentList']
        }),
        // ? `{ from, to, method, type, q, page, pageSize }` → { rows, total, page, pageSize, recordsTotal }
        getSupplierPayments: build.query({
            query: (filters = {}) => ({
                url: `/package/supplier-payments?${paymentsQuery(filters)}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['SupplierPaymentList']
        }),
        // ? sales corrects a payment still waiting, or one accounts rejected (it goes back to waiting); `proof` optional
        updateGuestPayment: build.mutation({
            query: ({ id, ...payload }) => {
                const KEY = 'updateGuestPaymentKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/package/guest-payment/${id}`,
                    method: 'PUT',
                    body: toFormData(payload),
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: AFTER_GUEST_DECISION
        }),
        verifyGuestPayment: build.mutation(decide('verify', 'verifyGuestPaymentKey')),
        // ? `{ id, reason }`: the reason is required
        rejectGuestPayment: build.mutation(decide('reject', 'rejectGuestPaymentKey')),
        reverseGuestPayment: build.mutation(decide('reverse', 'reverseGuestPaymentKey'))
    })
})

export const {
    useGetGuestPaymentsQuery,
    useGetSupplierPaymentsQuery,
    useUpdateGuestPaymentMutation,
    useVerifyGuestPaymentMutation,
    useRejectGuestPaymentMutation,
    useReverseGuestPaymentMutation,
    useReadPaymentProofMutation,
    endpoints: { getGuestPayments, getSupplierPayments }
} = paymentSlice
