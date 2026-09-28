import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Grid, TextField, Autocomplete, Typography, CircularProgress } from '@mui/material'
import { useConvertPackageMutation } from '@/app/store/slices/api/packageConvert'

import GlobalModal from '../../../../core/components/modals/GlobalModal'

function PackageConversion({ isOpen, setIsOpen, leadId, quotationNo, priceData = null }) {
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

    const handlePackageSelect = value => {
        // Auto-fill price from priceData based on selection (e.g., deluxePrice)
        const price = priceData && value ? priceData[value] : ''
        setFormData(prev => ({
            ...prev,
            selectedPackage: value ?? null,
            sellingPrice: price || ''
        }))
    }

    const handleSaveAction = async () => {
        try {
            // This triggers the loader event and custom handler automatically
            const response = await convertPackage(formData).unwrap()

            if (response) {
                // customResponseHandler usually handles the Toast/Alert
                // but you can close the modal here
                setIsOpen(false)
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
                            options={['deluxePrice', 'superDeluxePrice', 'luxuryPrice', 'premiumPrice']}
                            value={formData.selectedPackage}
                            onChange={(e, value) => handlePackageSelect(value)}
                            isOptionEqualToValue={(option, val) => option === val}
                            getOptionLabel={option => {
                                const labels = {
                                    deluxePrice: 'Deluxe',
                                    superDeluxePrice: 'Super Deluxe',
                                    luxuryPrice: 'Luxury',
                                    premiumPrice: 'Premium'
                                }
                                return labels[option] || option
                            }}
                            // eslint-disable-next-line react/jsx-props-no-spreading
                            renderInput={params => <TextField {...params} label='Select Package Category' fullWidth />}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label='Final Selling Price'
                            type='number'
                            value={formData.sellingPrice}
                            onChange={e => handleChange('sellingPrice', e.target.value)}
                            helperText='This is the price the client will pay.'
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Button
                            variant='contained'
                            fullWidth
                            color='success'
                            size='large'
                            disabled={isLoading || !formData.selectedPackage}
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
    priceData: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
}

export default PackageConversion
