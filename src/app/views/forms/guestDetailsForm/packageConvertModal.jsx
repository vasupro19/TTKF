import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Grid, TextField, Autocomplete, Typography, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useConvertPackageMutation } from '@/app/store/slices/api/packageConvert'

import GlobalModal from '../../../../core/components/modals/GlobalModal'
import { formatRupees } from './quote/quoteDays'
import { TOTAL, groupPrice, guestsLabel, priceBasisOf } from './quote/pricing'

const CATEGORIES = ['deluxePrice', 'superDeluxePrice', 'luxuryPrice', 'premiumPrice']
const CATEGORY_LABELS = {
    deluxePrice: 'Deluxe',
    superDeluxePrice: 'Super Deluxe',
    luxuryPrice: 'Luxury',
    premiumPrice: 'Premium'
}

/**
 * Books one quote. A per-person price is multiplied by the guests (adults and children) to give what the client
 * pays; a total price is used as it is. The agent can still change the final amount.
 */
function PackageConversion({ isOpen, setIsOpen, leadId, quotationNo, priceData = null, people = 0 }) {
    const navigate = useNavigate()
    const [convertPackage, { isLoading }] = useConvertPackageMutation()
    const [formData, setFormData] = useState({
        leadId,
        quotationNo,
        selectedPackage: null,
        sellingPrice: ''
    })

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const basis = priceBasisOf(priceData?.priceBasis)
    const priceOf = key => Number(priceData?.[key]) || 0
    // ? only the categories this quote was priced in; all four when none is priced yet
    const priced = CATEGORIES.filter(key => priceOf(key) > 0)
    const options = priced.length ? priced : CATEGORIES
    const optionLabel = key => {
        const shown = formatRupees(priceOf(key) || '')
        if (!priceOf(key)) return CATEGORY_LABELS[key] || key
        return `${CATEGORY_LABELS[key]} · ${shown}${basis === TOTAL ? ' for the group' : ' per person'}`
    }

    const handlePackageSelect = value => {
        const total = value ? groupPrice(priceOf(value), basis, people) : 0
        setFormData(prev => ({
            ...prev,
            selectedPackage: value ?? null,
            sellingPrice: total ? String(total) : ''
        }))
    }

    // ? how the amount was worked out, so the agent can check it before booking
    let working = 'This is the price the client will pay.'
    const chosen = formData.selectedPackage ? priceOf(formData.selectedPackage) : 0
    if (chosen && basis === TOTAL) working = 'The total for the group, as quoted.'
    else if (chosen && people) {
        working = `${formatRupees(chosen)} per person × ${guestsLabel(people)} = ${formatRupees(chosen * people)}`
    } else if (chosen) {
        working = `${formatRupees(chosen)} per person. Add the guests in trip details to multiply by them.`
    }

    const handleSaveAction = async () => {
        try {
            // This triggers the loader event and custom handler automatically
            const response = await convertPackage(formData).unwrap()

            if (response) {
                setIsOpen(false)
                // ? the next steps — hotels, transport, payments, voucher — are on the booking's page
                navigate(`/process/packages/${leadId}`)
            }
        } catch (error) {
            // ? the API's message is shown by customResponseHandler; the dialog stays open to retry
        }
    }
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            quotationNo,
            leadId,
            selectedPackage: null,
            sellingPrice: ''
        }))
    }, [quotationNo, leadId])

    return (
        <GlobalModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: 'calc(100vw - 32px)', sm: 450 },
                    bgcolor: 'background.paper',
                    p: 4,
                    borderRadius: 3,
                    boxShadow: 24
                }}
            >
                <Typography variant='h6' mb={3} fontWeight='bold' color='primary'>
                    Book Quote {quotationNo}
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Autocomplete
                            options={options}
                            value={formData.selectedPackage}
                            onChange={(e, value) => handlePackageSelect(value)}
                            isOptionEqualToValue={(option, val) => option === val}
                            getOptionLabel={optionLabel}
                            // eslint-disable-next-line react/jsx-props-no-spreading
                            renderInput={params => <TextField {...params} label='Hotel category' fullWidth />}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label='Final selling price'
                            type='number'
                            value={formData.sellingPrice}
                            onChange={e => handleChange('sellingPrice', e.target.value)}
                            helperText={working}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Button
                            variant='contained'
                            fullWidth
                            color='success'
                            size='large'
                            disabled={isLoading || !formData.selectedPackage || !(Number(formData.sellingPrice) > 0)}
                            onClick={handleSaveAction}
                            sx={{ py: 1.5, fontWeight: 'bold', borderRadius: '10px' }}
                        >
                            {isLoading ? <CircularProgress size={24} color='inherit' /> : 'Confirm booking'}
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </GlobalModal>
    )
}

PackageConversion.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    leadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    quotationNo: PropTypes.number.isRequired,
    priceData: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    people: PropTypes.number
}

export default PackageConversion
