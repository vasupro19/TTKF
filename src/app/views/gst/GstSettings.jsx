import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, CircularProgress, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useDispatch } from 'react-redux'
import MainCard from '@core/components/extended/MainCard'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useGetTaxProfileQuery, useUpdateTaxProfileMutation } from '@/app/store/slices/api/gstSlice'
import { COMMON_RATES, errorText, gstinShapeProblem, parseRate, tidyGstin } from './gstFacts'

const EMPTY = {
    legalName: '',
    gstin: '',
    stateCode: '',
    address: '',
    sacCode: '998555',
    defaultRate: '5',
    invoicePrefix: '',
    bankDetails: '',
    terms: ''
}

// ? what the form holds, from what the API saved (nothing saved yet: its suggestions)
const draftOf = (profile, suggestions) => ({
    legalName: profile?.legalName || suggestions?.legalName || '',
    gstin: profile?.gstin || '',
    stateCode: profile?.stateCode || '',
    address: profile?.address || suggestions?.address || '',
    sacCode: profile?.sacCode || '998555',
    defaultRate: String(profile?.defaultRate ?? 5),
    invoicePrefix: profile?.invoicePrefix || suggestions?.invoicePrefix || '',
    bankDetails: profile?.bankDetails || '',
    terms: profile?.terms || ''
})

/** @description what is wrong with the form, field by field; empty when it can be saved */
const problemsOf = draft => {
    const problems = {}
    const gstin = gstinShapeProblem(draft.gstin)
    if (gstin) problems.gstin = gstin
    if (tidyGstin(draft.gstin) && !draft.stateCode) problems.stateCode = 'Pick the state this GSTIN is registered in'
    if (!/^\d{4,8}$/.test(draft.sacCode.trim())) problems.sacCode = 'The SAC code is 4 to 8 digits, like 998555'
    const rate = parseRate(draft.defaultRate)
    if (!rate.ok) problems.defaultRate = rate.message
    if (draft.invoicePrefix && !/^[A-Za-z0-9]{1,4}$/.test(draft.invoicePrefix.trim()))
        problems.invoicePrefix = 'Up to 4 letters or digits, like TTK'
    return problems
}

/**
 * The agency's GST registration: the GSTIN and state that decide whether it can charge GST (and CGST + SGST or IGST),
 * the SAC code and invoice prefix, what a new quote starts with, and the bank details and terms printed on invoices.
 * Anyone can read it; only the agency's owner and admins can save.
 */
function GstSettings() {
    const dispatch = useDispatch()
    const { data, isFetching, error } = useGetTaxProfileQuery(undefined, { refetchOnMountOrArgChange: true })
    const [save, { isLoading: saving }] = useUpdateTaxProfileMutation()
    const info = data?.data
    const [draft, setDraft] = useState(EMPTY)
    const [saved, setSaved] = useState(EMPTY)
    const [touched, setTouched] = useState(false)

    useEffect(() => {
        if (!info) return
        const loaded = draftOf(info.profile, info.suggestions)
        setDraft(loaded)
        setSaved(loaded)
    }, [info])

    const problems = useMemo(() => problemsOf(draft), [draft])
    const unsaved = Object.keys(EMPTY).some(key => draft[key] !== saved[key])
    const registered = Boolean(info?.profile?.registered)
    const set = key => event => setDraft(current => ({ ...current, [key]: event.target.value }))

    const notify = (message, color = 'success') =>
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: { color },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )

    const handleSave = async () => {
        setTouched(true)
        if (Object.keys(problems).length) return
        try {
            const body = { ...draft, gstin: tidyGstin(draft.gstin), defaultRate: draft.defaultRate }
            const response = await save(body).unwrap()
            notify(response?.message || 'GST settings saved')
            setTouched(false)
        } catch (failure) {
            notify(errorText(failure, 'Couldn’t save the GST settings.'), 'error')
        }
    }

    const shown = key => (touched && problems[key]) || ''

    return (
        <MainCard title='GST settings'>
            <Stack spacing={2.5} sx={{ maxWidth: 880 }}>
                <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                    These details go on every quote that charges GST and on every invoice. With a valid GSTIN your
                    quotes can charge GST and your invoices are tax invoices; without one they are bills of supply.
                </Typography>

                {error && <Alert severity='error'>{errorText(error, 'Couldn’t load the GST settings.')}</Alert>}
                {info && !info.ready && (
                    <Alert severity='warning'>
                        This workspace needs a one-time update before GST can be used: run{' '}
                        <code>node Scripts/upgradeQuotes.js --fix</code> on the server.
                    </Alert>
                )}

                <Stack direction='row' spacing={1} alignItems='center'>
                    <Chip
                        size='small'
                        color={registered ? 'success' : 'default'}
                        label={registered ? 'Registered for GST' : 'No GSTIN — quotes charge no GST'}
                    />
                    {isFetching && <CircularProgress size={16} />}
                </Stack>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label='Legal name'
                            value={draft.legalName}
                            onChange={set('legalName')}
                            helperText='As registered; printed on invoices'
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label='GSTIN'
                            value={draft.gstin}
                            onChange={set('gstin')}
                            onBlur={() => setDraft(current => ({ ...current, gstin: tidyGstin(current.gstin) }))}
                            error={Boolean(shown('gstin'))}
                            helperText={shown('gstin') || 'Leave empty if the agency is not registered'}
                            inputProps={{ maxLength: 15 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            select
                            fullWidth
                            label='State of registration'
                            value={draft.stateCode}
                            onChange={set('stateCode')}
                            error={Boolean(shown('stateCode'))}
                            helperText={
                                shown('stateCode') || 'Guests in this state pay CGST + SGST; other states pay IGST'
                            }
                        >
                            <MenuItem value=''>
                                <em>Not set</em>
                            </MenuItem>
                            {(info?.states || []).map(state => (
                                <MenuItem key={state.code} value={state.code}>
                                    {state.name} ({state.code})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label='Address'
                            value={draft.address}
                            onChange={set('address')}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <TextField
                            fullWidth
                            label='SAC code'
                            value={draft.sacCode}
                            onChange={set('sacCode')}
                            error={Boolean(shown('sacCode'))}
                            helperText={shown('sacCode') || '998555 is tour operator services'}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <TextField
                            select
                            fullWidth
                            label='Usual GST rate'
                            value={COMMON_RATES.includes(Number(draft.defaultRate)) ? draft.defaultRate : 'other'}
                            onChange={event =>
                                setDraft(current => ({
                                    ...current,
                                    defaultRate: event.target.value === 'other' ? '' : event.target.value
                                }))
                            }
                            helperText='What a new quote starts with'
                        >
                            {COMMON_RATES.map(rate => (
                                <MenuItem key={rate} value={String(rate)}>
                                    {rate}%
                                </MenuItem>
                            ))}
                            <MenuItem value='other'>Other…</MenuItem>
                        </TextField>
                    </Grid>
                    {!COMMON_RATES.includes(Number(draft.defaultRate)) && (
                        <Grid item xs={6} md={3}>
                            <TextField
                                fullWidth
                                label='Rate %'
                                value={draft.defaultRate}
                                onChange={set('defaultRate')}
                                error={Boolean(shown('defaultRate'))}
                                helperText={shown('defaultRate')}
                            />
                        </Grid>
                    )}
                    <Grid item xs={6} md={3}>
                        <TextField
                            fullWidth
                            label='Invoice prefix'
                            value={draft.invoicePrefix}
                            onChange={set('invoicePrefix')}
                            error={Boolean(shown('invoicePrefix'))}
                            helperText={shown('invoicePrefix') || 'Invoices read TTK/2627/00001'}
                            inputProps={{ maxLength: 4 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label='Bank details'
                            value={draft.bankDetails}
                            onChange={set('bankDetails')}
                            helperText='Printed on invoices'
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label='Terms'
                            value={draft.terms}
                            onChange={set('terms')}
                            helperText='Printed at the foot of invoices'
                        />
                    </Grid>
                </Grid>

                <Box>
                    <Button
                        variant='contained'
                        onClick={handleSave}
                        disabled={saving || !unsaved || !info?.ready}
                        startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                    >
                        {saving ? 'Saving…' : 'Save GST settings'}
                    </Button>
                    {touched && Object.keys(problems).length > 0 && (
                        <Typography color='error' sx={{ mt: 1, fontSize: '0.875rem' }}>
                            Fix the highlighted fields first.
                        </Typography>
                    )}
                </Box>
            </Stack>
        </MainCard>
    )
}

export default GstSettings
