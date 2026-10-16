import { useEffect, useMemo, useState } from 'react'
import { useGetQuoteTaxesQuery, useGetTaxProfileQuery, useSetQuoteTaxMutation } from '@/app/store/slices/api/gstSlice'
import { errorText, gstinShapeProblem, modeOf, parseRate, tidyGstin } from './gstFacts'

const EMPTY = { mode: 'none', rate: '5', placeOfSupply: '', customerGstin: '', customerName: '' }

// ? what the form holds for one quote, from what the API saved (never set: no GST, at the agency's usual rate)
const draftOf = (quote, defaultRate) => ({
    mode: modeOf(quote?.mode),
    rate: String(quote && Number(quote.rate) > 0 ? quote.rate : (defaultRate ?? 5)),
    placeOfSupply: quote?.placeOfSupply || '',
    customerGstin: quote?.customerGstin || '',
    customerName: quote?.customerName || ''
})

const sameDraft = (a, b) => Object.keys(EMPTY).every(key => a[key] === b[key])

/**
 * How one quote charges GST, as the agent edits it. `tax` is what the quote form works the figures out with: the mode, the
 * rate and whether the supply crosses states (the guest's state, or the one picked, against the agency's own).
 *
 * `save()` saves the GST when it changed and resolves to true, or to false (with a message in `problem`) when it can't.
 */
export default function useQuoteGst(leadId, quoteNo, { skip = false } = {}) {
    const quotes = useGetQuoteTaxesQuery(leadId, { skip: skip || !leadId })
    const profile = useGetTaxProfileQuery(undefined, { skip: skip || !leadId })
    const [setQuoteTax, { isLoading: saving }] = useSetQuoteTaxMutation()
    const info = quotes.data?.data
    const agency = profile.data?.data

    const saved = useMemo(
        () =>
            draftOf(
                info?.quotes?.find(quote => quote.quoteNo === quoteNo),
                info?.defaultRate
            ),
        [info, quoteNo]
    )
    const [draft, setDraft] = useState(saved)
    const [problem, setProblem] = useState('')
    useEffect(() => {
        setDraft(saved)
        setProblem('')
    }, [saved])

    const states = agency?.states || []
    const agencyState = agency?.profile?.stateCode || ''
    const guestState = states.find(
        state =>
            state.name.toLowerCase() ===
            String(info?.guestState || '')
                .trim()
                .toLowerCase()
    )
    const placeCode = draft.placeOfSupply || guestState?.code || agencyState
    const interState = Boolean(placeCode && agencyState && placeCode !== agencyState)

    const rate = parseRate(draft.rate)
    const charging = draft.mode !== 'none' && rate.ok
    const tax = { mode: charging ? draft.mode : 'none', rate: charging ? rate.value : 0, interState }
    const unsaved = !sameDraft(draft, saved)

    const checkProblem = () => {
        if (draft.mode === 'none') return ''
        if (!info?.registered) return 'Add the agency’s GSTIN in GST settings before charging GST on a quote.'
        if (!rate.ok) return rate.message
        if (rate.value <= 0) return 'Enter a GST rate above 0, or choose no GST.'
        return gstinShapeProblem(draft.customerGstin)
    }

    const save = async () => {
        if (!unsaved) return true
        const found = checkProblem()
        setProblem(found)
        if (found) return false
        try {
            await setQuoteTax({
                leadId,
                quoteNo,
                mode: draft.mode,
                rate: draft.rate,
                placeOfSupply: draft.placeOfSupply,
                customerGstin: tidyGstin(draft.customerGstin),
                customerName: draft.customerName
            }).unwrap()
            return true
        } catch (error) {
            setProblem(errorText(error, 'Couldn’t save the GST for this quote.'))
            return false
        }
    }

    return {
        ready: Boolean(info?.ready),
        registered: Boolean(info?.registered),
        loading: quotes.isFetching,
        draft,
        setDraft,
        states,
        agencyState,
        guestStateName: info?.guestState || '',
        tax,
        interState,
        unsaved,
        saving,
        problem,
        save
    }
}
