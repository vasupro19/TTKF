import { useState } from 'react'
import PropTypes from 'prop-types'
import { Alert, Box, Button, CircularProgress, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import {
    useSaveCabDaysMutation,
    useSaveCabRoutesMutation,
    useSaveHotelRatesMutation
} from '@/app/store/slices/api/ratesSlice'
import { gapHint, gapLabel, gapRows } from './ratesPrice'

/**
 * The rates a quote needs and the card lacks, with a box for each price. Typing it here saves it on the card (the plain,
 * all-year price) and prices the quote again — so the card fills up with the routes and places the agency really sells,
 * instead of every pair being entered up front. Only an admin sees it; they are the ones who may change the card.
 */
export default function GapRates({ gaps, onSaved }) {
    const [amounts, setAmounts] = useState({})
    const [problem, setProblem] = useState('')
    const [saveRoutes, { isLoading: savingRoutes }] = useSaveCabRoutesMutation()
    const [saveDays, { isLoading: savingDays }] = useSaveCabDaysMutation()
    const [saveHotels, { isLoading: savingHotels }] = useSaveHotelRatesMutation()
    const saving = savingRoutes || savingDays || savingHotels
    const rows = gapRows(gaps, amounts)
    const typed = rows.routes.length + rows.days.length + rows.hotels.length

    const handleSave = async () => {
        setProblem('')
        try {
            if (rows.routes.length) await saveRoutes({ rows: rows.routes }).unwrap()
            if (rows.days.length) await saveDays({ rows: rows.days }).unwrap()
            if (rows.hotels.length) await saveHotels({ rows: rows.hotels }).unwrap()
            setAmounts({})
            onSaved()
        } catch (error) {
            setProblem(error?.data?.message || 'Couldn’t save the rates. Please try again.')
        }
    }

    return (
        <Box sx={{ mt: 1.5, p: 2, border: '1px solid', borderColor: 'warning.main', borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 600 }}>Add the missing prices here</Typography>
            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mb: 1.5 }}>
                They are saved on your rate card for every quote. Add the seasons later on the Rates page.
            </Typography>
            <Stack spacing={1.25}>
                {gaps.map(gap => (
                    <Stack
                        key={gap.id}
                        direction='row'
                        spacing={1.5}
                        alignItems='center'
                        justifyContent='space-between'
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.875rem' }}>{gapLabel(gap)}</Typography>
                            <Typography color='text.secondary' sx={{ fontSize: '0.75rem' }}>
                                {gapHint(gap)}
                            </Typography>
                        </Box>
                        <TextField
                            size='small'
                            value={amounts[gap.id] || ''}
                            onChange={event =>
                                setAmounts(current => ({
                                    ...current,
                                    [gap.id]: event.target.value.replace(/[^0-9.,]/g, '')
                                }))
                            }
                            InputProps={{
                                startAdornment: <InputAdornment position='start'>₹</InputAdornment>,
                                inputProps: { inputMode: 'decimal', 'aria-label': gapLabel(gap) }
                            }}
                            sx={{ width: 140, flexShrink: 0 }}
                        />
                    </Stack>
                ))}
            </Stack>
            {problem ? (
                <Alert severity='error' sx={{ mt: 1.5 }}>
                    {problem}
                </Alert>
            ) : null}
            <Button
                variant='contained'
                size='small'
                disabled={!typed || saving}
                onClick={handleSave}
                startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                sx={{ mt: 1.5, textTransform: 'none' }}
            >
                {saving ? 'Saving…' : 'Save prices and recalculate'}
            </Button>
        </Box>
    )
}

GapRates.propTypes = {
    gaps: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string })).isRequired,
    onSaved: PropTypes.func.isRequired
}
