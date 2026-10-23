import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Button,
    CircularProgress,
    Grid,
    InputAdornment,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from '@mui/material'
import { Calculate } from '@mui/icons-material'
import { useDispatch } from 'react-redux'
import { useUpsertGuestTourPriceMutation, useGetGuestTourPriceQuery } from '@/app/store/slices/api/guestTourPrice'
import { openSnackbar } from '@app/store/slices/snackbar'
import useQuoteGst from '@views/gst/useQuoteGst'
import QuoteGstControl from '@views/gst/QuoteGstControl'
import { computeTax, money } from '@views/gst/gstFacts'
import { PER_PERSON, TOTAL, groupPrice, guestsLabel, priceBasisOf } from './quote/pricing'
import RatesPriceDialog from './quote/RatesPriceDialog'
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
 * The price of each hotel category for one quote — per person, or a total for the whole group. A category left
 * empty is not offered, and is left out of the quotation.
 */
function GuestTourPriceForm({ tourId, quotationNo, activeTab, guestCategory = '', people = 0 }) {
    const dispatch = useDispatch()
    const [savePrices, { isLoading: savingPrices }] = useUpsertGuestTourPriceMutation()
    // ? how this quote charges GST: saved with the prices, shown in each box
    const gst = useQuoteGst(tourId, quotationNo, { skip: activeTab !== 1 })
    const saving = savingPrices || gst.saving
    const { data: price, isFetching } = useGetGuestTourPriceQuery(
        { leadId: tourId, quotationNo },
        { skip: activeTab !== 1 || !tourId || !quotationNo }
    )

    const [prices, setPrices] = useState(() => fromPriceData(null))
    const [savedPrices, setSavedPrices] = useState(() => fromPriceData(null))
    const [basis, setBasis] = useState(PER_PERSON)
    const [savedBasis, setSavedBasis] = useState(PER_PERSON)
    const [ratesOpen, setRatesOpen] = useState(false)

    useEffect(() => {
        const loaded = fromPriceData(price?.data)
        setPrices(loaded)
        setSavedPrices(loaded)
        setBasis(priceBasisOf(price?.data?.priceBasis))
        setSavedBasis(priceBasisOf(price?.data?.priceBasis))
    }, [price, quotationNo, tourId])

    const hasAny = HOTEL_TIERS.some(tier => prices[tier.priceKey])
    const unsaved =
        gst.unsaved ||
        basis !== savedBasis ||
        HOTEL_TIERS.some(tier => prices[tier.priceKey] !== savedPrices[tier.priceKey])

    // ? under each box: what the guest pays — with the GST when the quote charges it — and what that comes to for the group
    const helperFor = amount => {
        const shown = formatRupees(amount)
        const { rate } = gst.tax
        if (rate > 0 && Number(amount) > 0) {
            // ? the group's GST is worked out on the group's price, as the quotation does
            const unit = computeTax({ amount, ...gst.tax })
            const group = computeTax({ amount: basis === TOTAL ? amount : Number(amount) * people, ...gst.tax })
            const note =
                gst.tax.mode === 'exclusive'
                    ? `${money(unit.total)} with ${rate}% GST`
                    : `GST ${money(unit.gst)} included`
            if (basis === TOTAL) return `${note} · for the group`
            return people > 1 ? `${note} per person · ${money(group.total)} for ${people}` : `${note} per person`
        }
        if (basis === TOTAL) return shown ? `${shown} for the group` : 'for the whole group'
        if (!shown) return 'per person'
        return people > 1
            ? `${shown} per person · ${formatRupees(groupPrice(amount, basis, people))} for ${people}`
            : `${shown} per person`
    }

    // ? prices worked out from the rate card go into the boxes, not into the quote: the agent still saves them (or changes them first)
    const applyRatePrices = picked => {
        setPrices(current => ({ ...current, ...picked }))
        setRatesOpen(false)
        dispatch(
            openSnackbar({
                open: true,
                message: 'Prices filled in from your rates. Check them, then save.',
                variant: 'alert',
                alert: { color: 'info' },
                close: false
            })
        )
    }

    const handleSave = async () => {
        // ? the GST first: the prices the quote is then saved with are the ones it will be shown with
        if (!(await gst.save())) return
        try {
            const saved = await savePrices({ leadId: tourId, quotationNo, priceBasis: basis, ...prices }).unwrap()
            setSavedPrices(prices)
            setSavedBasis(priceBasisOf(saved?.data?.priceBasis ?? basis))
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
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1, sm: 1.5 }}
                alignItems={{ sm: 'center' }}
                sx={{ mb: 2.5 }}
            >
                <Typography id={`price-basis-${quotationNo}`} sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
                    Prices are
                </Typography>
                <ToggleButtonGroup
                    size='small'
                    exclusive
                    value={basis}
                    onChange={(event, next) => next && setBasis(next)}
                    aria-labelledby={`price-basis-${quotationNo}`}
                    sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.75 } }}
                >
                    <ToggleButton value={PER_PERSON}>Per person</ToggleButton>
                    <ToggleButton value={TOTAL}>Total for the group</ToggleButton>
                </ToggleButtonGroup>
                <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                    {people
                        ? `${guestsLabel(people)} on this trip`
                        : 'Add the guests in trip details to see group totals'}
                </Typography>
                <Button
                    variant='outlined'
                    size='small'
                    startIcon={<Calculate />}
                    onClick={() => setRatesOpen(true)}
                    sx={{ textTransform: 'none', ml: { sm: 'auto' } }}
                >
                    Calculate from rates
                </Button>
            </Stack>
            {ratesOpen ? (
                <RatesPriceDialog
                    leadId={tourId}
                    quoteNo={quotationNo}
                    basis={basis}
                    people={people}
                    onApply={applyRatePrices}
                    onClose={() => setRatesOpen(false)}
                />
            ) : null}
            <QuoteGstControl gst={gst} quotationNo={quotationNo} />
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
                            helperText={`${tier.category === guestCategory ? 'Guest’s choice · ' : ''}${helperFor(
                                prices[tier.priceKey]
                            )}`}
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
    guestCategory: PropTypes.string,
    people: PropTypes.number
}

export default GuestTourPriceForm
