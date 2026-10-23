import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Alert, Box, Button, CircularProgress, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useSaveRateSettingsMutation } from '@/app/store/slices/api/ratesSlice'
import { marginExample, settingsProblem } from './rateFacts'

const rupees = amount => `₹${Number(amount).toLocaleString('en-IN')}`

/**
 * The margin added to the cost, and what prices are rounded to. A quote starts with this margin; a manager can change it for
 * one quote.
 */
export default function MarginTab({ settings }) {
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

    return (
        <Box sx={{ maxWidth: 620 }}>
            <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 2.5 }}>
                A quote’s price is what it costs you, plus your margin, divided by the guests and rounded. Change the
                margin for a single quote from the quote itself.
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
                    sx={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.04em', color: 'text.secondary' }}
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
    )
}

MarginTab.propTypes = {
    settings: PropTypes.shape({ defaultMarginPct: PropTypes.number, roundTo: PropTypes.number }).isRequired
}
