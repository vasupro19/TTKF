import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, CircularProgress, Grid, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { useDispatch } from 'react-redux'
import { useUpsertGuestTourPriceMutation, useGetGuestTourPriceQuery } from '@/app/store/slices/api/guestTourPrice'
import { openSnackbar } from '@app/store/slices/snackbar'
import { HOTEL_TIERS, formatRupees } from './quote/quoteDays'

// ? the API stores Decimals; "12500.00" reads better as "12500" in a box the agent types into
const asInput = value => {
    if (value === null || value === undefined || value === '') return ''
    const amount = Number(value)
    return Number.isFinite(amount) && amount > 0 ? String(amount) : ''
}

const fromPriceData = data =>
    Object.fromEntries(HOTEL_TIERS.map(tier => [tier.priceKey, asInput(data?.[tier.priceKey])]))

/**
 * The per-person price of each hotel category for one quote. A category left empty is not offered, and is
 * left out of the quotation.
 */
function GuestTourPriceForm({ tourId, quotationNo, activeTab, guestCategory = '' }) {
    const dispatch = useDispatch()
    const [savePrices, { isLoading: saving }] = useUpsertGuestTourPriceMutation()
    const { data: price, isFetching } = useGetGuestTourPriceQuery(
        { leadId: tourId, quotationNo },
        { skip: activeTab !== 1 || !tourId || !quotationNo }
    )

    const [prices, setPrices] = useState(() => fromPriceData(null))
    const [savedPrices, setSavedPrices] = useState(() => fromPriceData(null))

    useEffect(() => {
        const loaded = fromPriceData(price?.data)
        setPrices(loaded)
        setSavedPrices(loaded)
    }, [price, quotationNo, tourId])

    const hasAny = HOTEL_TIERS.some(tier => prices[tier.priceKey])
    const unsaved = HOTEL_TIERS.some(tier => prices[tier.priceKey] !== savedPrices[tier.priceKey])

    const handleSave = async () => {
        try {
            await savePrices({ leadId: tourId, quotationNo, ...prices }).unwrap()
            setSavedPrices(prices)
            dispatch(
                openSnackbar({
                    open: true,
                    message: `Prices saved for Quote ${quotationNo}`,
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: false
                })
            )
        } catch (err) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: err?.data?.message || 'Couldn’t save the prices.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    close: false
                })
            )
        }
    }

    let status = 'Not saved yet'
    if (!unsaved && hasAny) status = 'Saved'
    if (unsaved && HOTEL_TIERS.some(tier => savedPrices[tier.priceKey])) status = 'Changes not saved'

    return (
        <Box>
            <Grid container spacing={2}>
                {HOTEL_TIERS.map(tier => (
                    <Grid item xs={6} md={3} key={tier.priceKey}>
                        <TextField
                            fullWidth
                            id={`price-${tier.priceKey}`}
                            label={tier.label}
                            value={prices[tier.priceKey]}
                            onChange={event =>
                                setPrices(current => ({
                                    ...current,
                                    [tier.priceKey]: event.target.value.replace(/[^0-9]/g, '')
                                }))
                            }
                            placeholder='Not offered'
                            InputProps={{
                                startAdornment: <InputAdornment position='start'>₹</InputAdornment>,
                                inputProps: { inputMode: 'numeric' }
                            }}
                            helperText={`${tier.category === guestCategory ? 'Guest’s choice · ' : ''}${
                                formatRupees(prices[tier.priceKey]) || 'per person'
                            }`}
                            FormHelperTextProps={{
                                sx: { color: tier.category === guestCategory ? 'primary.main' : undefined }
                            }}
                        />
                    </Grid>
                ))}
            </Grid>
            <Stack direction='row' spacing={2} alignItems='center' sx={{ mt: 2 }}>
                <Button
                    variant='contained'
                    onClick={handleSave}
                    disabled={saving || !hasAny || !unsaved}
                    startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                >
                    {saving ? 'Saving…' : 'Save prices'}
                </Button>
                <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }} role='status'>
                    {isFetching ? 'Loading prices…' : status}
                </Typography>
            </Stack>
        </Box>
    )
}

GuestTourPriceForm.propTypes = {
    tourId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    quotationNo: PropTypes.number.isRequired,
    activeTab: PropTypes.number.isRequired,
    guestCategory: PropTypes.string
}

export default GuestTourPriceForm
