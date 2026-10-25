import { useCallback, useRef, useState } from 'react'
import { useReadPaymentProofMutation } from '@/app/store/slices/api/paymentSlice'
import { canReadProof, settleReading } from './paymentFacts'

const IDLE = { state: 'idle', id: '', message: '' }

/**
 * Reads the transaction ID off a payment proof as soon as it is attached, and fills the form's field with it — unless
 * the person already typed one (then it says what the file shows and offers it). Whatever goes wrong — a file that
 * cannot be read, the reader busy, nothing found — is only a line of text: the person types the ID as before, and the
 * payment is never held up.
 *
 * `check(file)` is called with every chosen (or removed) file; `reset()` when the form opens; `use()` takes the ID the
 * file shows when it differs from what was typed. `status` is { state, id, message }, state being idle, reading, filled,
 * matched, differs or none.
 *
 * @param {object} options
 * @param {string} options.current  the form's transaction ID now
 * @param {(id: string) => void} options.onFill  puts an ID in the form
 * @param {boolean} [options.enabled]  false for a payment that needs no proof (cash)
 */
export default function useProofReader({ current, onFill, enabled = true }) {
    const [read] = useReadPaymentProofMutation()
    const [status, setStatus] = useState(IDLE)
    // ? only the newest file counts: a slow answer for one already replaced or removed is dropped
    const ticket = useRef(0)
    // ? the ID this form filled in by itself, so a second file may replace it but never what was typed
    const filled = useRef('')
    const now = useRef(current)
    now.current = current

    const reset = useCallback(() => {
        ticket.current += 1
        filled.current = ''
        setStatus(IDLE)
    }, [])

    const check = useCallback(
        async file => {
            ticket.current += 1
            const mine = ticket.current
            if (!enabled || !canReadProof(file)) {
                setStatus(IDLE)
                return
            }
            setStatus({ state: 'reading', id: '', message: '' })
            try {
                const reply = await read(file).unwrap()
                if (mine !== ticket.current) return
                const data = reply?.data || {}
                const settled = settleReading(data.transactionId, now.current, filled.current)
                if (settled.fill) {
                    filled.current = settled.fill
                    onFill(settled.fill)
                }
                setStatus({ state: settled.state, id: data.transactionId || '', message: data.message || '' })
            } catch (error) {
                if (mine !== ticket.current) return
                setStatus({
                    state: 'none',
                    id: '',
                    message: 'Couldn’t read the transaction ID from this file — type it in.'
                })
            }
        },
        [enabled, onFill, read]
    )

    const use = useCallback(() => {
        if (!status.id) return
        filled.current = status.id
        onFill(status.id)
        setStatus(previous => ({ ...previous, state: 'filled' }))
    }, [onFill, status.id])

    return { status, check, reset, use }
}
