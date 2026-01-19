import React, { useState } from 'react'
import { Box, Button, Grid, TextField, Autocomplete, Typography, CircularProgress } from '@mui/material'
import { useConvertPackageMutation } from '@/app/store/slices/api/packageConvert'

import GlobalModal from '../../../../core/components/modals/GlobalModal'

function PackageConversion({ isOpen, setIsOpen, leadId, priceData }) {
    const [convertPackage, { isLoading }] = useConvertPackageMutation()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        leadId,
        selectedPackage: '',
        sellingPrice: ''
    })

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handlePackageSelect = value => {
        // Auto-fill price from priceData based on selection (e.g., deluxePrice)
        const price = priceData ? priceData[value] : ''
        setFormData(prev => ({
            ...prev,
            selectedPackage: value,
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
            // Error is caught by your customResponseHandler usually
            console.error('Conversion failed', error)
        }
    }

    return (
        <GlobalModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 450,
                    bgcolor: 'background.paper',
                    p: 4,
                    borderRadius: 3,
                    boxShadow: 24
                }}
            >
                <Typography variant='h6' mb={3} fontWeight='bold' color='primary'>
                    Convert to Confirmed Package
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Autocomplete
                            options={['deluxePrice', 'superDeluxePrice', 'luxuryPrice', 'premiumPrice']}
                            value={formData.selectedPackage}
                            onChange={(e, value) => handlePackageSelect(value)}
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
                            disabled={loading}
                            onClick={handleSaveAction}
                            sx={{ py: 1.5, fontWeight: 'bold', borderRadius: '10px' }}
                        >
                            {loading ? <CircularProgress size={24} color='inherit' /> : 'Confirm Conversion'}
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </GlobalModal>
    )
}

export default PackageConversion
