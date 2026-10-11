import { useState } from 'react'
import {
    useRejectGuestPaymentMutation,
    useReverseGuestPaymentMutation,
    useVerifyGuestPaymentMutation
} from '@/app/store/slices/api/paymentSlice'
import { PaymentDecisionDialog } from './paymentParts'
import { errorText } from './paymentFacts'

const DONE = { verify: 'Payment verified', reject: 'Payment rejected', reverse: 'Payment reversed' }
const FAILED = {
    verify: 'Couldn’t verify the payment.',
    reject: 'Couldn’t reject the payment.',
    reverse: 'Couldn’t reverse the payment.'
}

/**
 * Verify / reject / reverse a guest payment, wherever payments are listed.
 * @param {object} options
 * @param {(message: string, color?: string) => void} options.notify   the page's snackbar
 * @param {(mode: string, response: object) => void} [options.onDone]  after a decision is saved
 * @returns {{ decide: (mode: 'verify'|'reject'|'reverse', payment: object) => void, dialog: JSX.Element }}
 */
export default function usePaymentDecision({ notify, onDone = () => {} }) {
    const [state, setState] = useState({ mode: null, payment: null })
    const [verify, { isLoading: verifying }] = useVerifyGuestPaymentMutation()
    const [reject, { isLoading: rejecting }] = useRejectGuestPaymentMutation()
    const [reverse, { isLoading: reversing }] = useReverseGuestPaymentMutation()
    const busy = verifying || rejecting || reversing

    const close = () => setState({ mode: null, payment: null })

    const confirm = async reason => {
        const { mode, payment } = state
        const run = { verify, reject, reverse }[mode]
        try {
            const response = await run({ id: payment.id, reason }).unwrap()
            notify(response?.message || DONE[mode])
            close()
            onDone(mode, response)
        } catch (error) {
            notify(errorText(error, FAILED[mode]), 'error')
        }
    }

    return {
        decide: (mode, payment) => setState({ mode, payment }),
        dialog: (
            <PaymentDecisionDialog
                mode={state.mode}
                payment={state.payment}
                busy={busy}
                onConfirm={confirm}
                onClose={close}
            />
        )
    }
}
