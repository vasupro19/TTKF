import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Alert, Box, Button, CircularProgress, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useSaveMarginsMutation, useSaveRateSettingsMutation } from '@/app/store/slices/api/ratesSlice'
import CabRateTable from './CabRateTable'
import { marginExample, marginKit, settingsProblem } from './rateFacts'

const rupees = amount => `₹${Number(amount).toLocaleString('en-IN')}`

const SEASON_COLUMNS = [
    { field: 'season', label: 'Season', kind: 'text', minWidth: 112, placeholder: 'All year' },
    { field: 'validFrom', label: 'From', kind: 'date', minWidth: 118 },
    { field: 'validTo', label: 'To', kind: 'date', minWidth: 118 },
    { field: 'repeatsYearly', label: 'Every year', kind: 'check', minWidth: 64 }
]

/**
 * The margin added to the cost, and what prices are rounded to. A quote starts with the margin of its campaign and season
 * (the table below), else this one; a manager can change it for one quote.
 */
export default function MarginTab({ settings, rules, campaigns }) {
    const dispatch = useDispatch()
    const [save, { isLoading: saving }] = useSaveRateSettingsMutation()
    const [margin, setMargin] = useState(String(settings.defaultMarginPct))
    const [step, setStep] = useState(String(settings.roundTo))
    const [serverProblem, setServerProblem] = useState('')

    useEffect(() => {
        setMargin(String(settings.defaultMarginPct))
        setStep(String(settings.roundTo))
    }, [settings])

    const problem = settingsProblem({ defaultMarginPct: margin, roundTo: step })
    const unsaved = margin !== String(settings.defaultMarginPct) || step !== String(settings.roundTo)
    const example = marginExample(margin, step)

    const handleSave = async () => {
        setServerProblem('')
        try {
            await save({ defaultMarginPct: Number(margin), roundTo: Number(step) }).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Margin and rounding saved',
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: false
                })
            )
        } catch (error) {
            setServerProblem(error?.data?.message || 'Couldn’t save. Please try again.')
        }
    }

    const columns = [
        {
            field: 'campaignId',
            label: 'Campaign',
            kind: 'pick',
            minWidth: 190,
            options: [
                { value: '', label: 'All campaigns' },
                ...campaigns.map(item => ({ value: String(item.id), label: item.title }))
            ]
        },
        { field: 'marginPct', label: 'Margin %', kind: 'amount', minWidth: 96, placeholder: '%' },
        ...SEASON_COLUMNS
    ]

    return (
        <Box>
            <Box sx={{ maxWidth: 620 }}>
                <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 2.5 }}>
                    A quote’s price is what it costs you, plus your margin, divided by the guests and rounded. Change
                    the margin for a single quote from the quote itself.
                </Typography>

                {serverProblem ? (
                    <Alert severity='error' sx={{ mb: 2 }}>
                        {serverProblem}
                    </Alert>
                ) : null}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1 }}>
                    <TextField
                        label='Margin on cost'
                        value={margin}
                        onChange={event => setMargin(event.target.value.replace(/[^0-9.]/g, ''))}
                        size='small'
                        InputProps={{
                            endAdornment: <InputAdornment position='end'>%</InputAdornment>,
                            inputProps: { inputMode: 'decimal', 'aria-label': 'Margin on cost' }
                        }}
                        helperText='Added on top of the hotel and cab cost'
                        sx={{ width: 220 }}
                    />
                    <TextField
                        label='Round prices to the nearest'
                        value={step}
                        onChange={event => setStep(event.target.value.replace(/[^0-9]/g, ''))}
                        size='small'
                        InputProps={{
                            startAdornment: <InputAdornment position='start'>₹</InputAdornment>,
                            inputProps: { inputMode: 'numeric', 'aria-label': 'Round prices to the nearest' }
                        }}
                        helperText='For example 100, so ₹13,225 becomes ₹13,200'
                        sx={{ width: 260 }}
                    />
                </Stack>
                {problem ? (
                    <Typography color='error' role='alert' sx={{ fontSize: '0.8125rem', mb: 1 }}>
                        {problem}
                    </Typography>
                ) : null}

                <Box sx={{ my: 2.5, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Typography
                        sx={{
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            color: 'text.secondary'
                        }}
                    >
                        EXAMPLE
                    </Typography>
                    <Typography sx={{ fontSize: '0.9375rem', mt: 0.5 }}>
                        A trip that costs you {rupees(example.cost)}, with a {Number(margin) || 0}% margin, is{' '}
                        {rupees(example.total)}. For 2 guests that is <strong>{rupees(example.perPerson)} each</strong>.
                    </Typography>
                </Box>

                <Button
                    variant='contained'
                    onClick={handleSave}
                    disabled={saving || Boolean(problem) || !unsaved}
                    startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                >
                    {saving ? 'Saving…' : 'Save'}
                </Button>
            </Box>
            <Box sx={{ mt: 5 }}>
                <CabRateTable
                    title='Margin by campaign and season'
                    help={
                        <>
                            Each campaign can have its own margin: Himachal, Uttarakhand, Spiti, Leh, Rajasthan. A quote
                            takes the margin of the campaign it is for. Add a row with <strong>From</strong> and{' '}
                            <strong>To</strong> dates for a season, such as a higher margin over New Year; tick{' '}
                            <strong>Every year</strong> and it comes back every year. The season is read from the
                            quote’s start date. A campaign with no row here uses the row for{' '}
                            <strong>All campaigns</strong>, and where there is none, the margin above.
                        </>
                    }
                    kit={marginKit}
                    columns={columns}
                    data={rules}
                    prefix='margin'
                    useSave={useSaveMarginsMutation}
                    savedMessage='Margins saved'
                    cabNames={[]}
                    places={[]}
                    addLabel='Add a margin'
                    emptyText='No campaign margins yet. Every quote uses the margin above.'
                    noun='margin'
                />
            </Box>
        </Box>
    )
}

MarginTab.propTypes = {
    settings: PropTypes.shape({ defaultMarginPct: PropTypes.number, roundTo: PropTypes.number }).isRequired,
    rules: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })).isRequired,
    campaigns: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, title: PropTypes.string })).isRequired
}
