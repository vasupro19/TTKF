import React, { useState, useCallback, useEffect } from 'react'
import { z } from 'zod'
import { useFormik } from 'formik'

// router
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

// theme components
import {
    Box,
    Button,
    Divider,
    Grid,
    TextField,
    Autocomplete,
    Typography,
    CircularProgress,
    InputAdornment
} from '@mui/material'
import {
    LocationOn,
    Description,
    Photo,
    Edit,
    Delete,
    // LocationOn,
    AttachMoney, // For the new section header
    Save
} from '@mui/icons-material'
import { motion } from 'framer-motion'

// redux imports

import { useUpsertGuestTourPriceMutation, useGetGuestTourPriceQuery } from '@/app/store/slices/api/guestTourPrice'

import { openSnackbar } from '@app/store/slices/snackbar'

function GuestTourPriceForm({ tourId }) {
    const [createPrice] = useUpsertGuestTourPriceMutation()
    const dispatch = useDispatch()

    const { data: price = [], isLoading: loadingPrices } = useGetGuestTourPriceQuery(tourId)
    console.log(price, 'price')
    const [packagePrices, setPackagePrices] = useState({
        leadId: tourId,
        deluxePrice: '0',
        superDeluxePrice: '0',
        luxuryPrice: '0',
        premiumPrice: '0'
    })
    useEffect(() => {
        setPackagePrices({
            ...packagePrices,
            deluxePrice: price.data?.deluxePrice || '0',
            superDeluxePrice: price.data?.superDeluxePrice || '0',
            luxuryPrice: price.data?.luxuryPrice || '0',
            premiumPrice: price.data?.premiumPrice || '0'
        })
    }, [price])

    const handlePriceChange = e => {
        const { name, value } = e.target
        // Ensure the value is a number (or convert it)
        setPackagePrices(prev => ({
            ...prev,
            [name]: value.replace(/[^0-9]/g, '') // Removes non-numeric characters
        }))
    }
    const handleSavePrices = async () => {
        try {
            console.log('Saving prices:', packagePrices)

            // 1. Trigger the mutation and wait for result
            await createPrice(packagePrices).unwrap()

            // 2. Dispatch Success Snackbar
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Package prices saved successfully!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: false
                })
            )

            // Optional: Refresh data or redirect
        } catch (err) {
            // 3. Dispatch Error Snackbar
            console.error('Failed to save prices:', err)
            dispatch(
                openSnackbar({
                    open: true,
                    message: err?.data?.message || 'Failed to save prices. Please try again.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    close: false
                })
            )
        }
    }

    return (
        <Box
            sx={{
                mb: 4,
                p: 3,
                borderRadius: '12px',
                background: '#fff3e0', // Light Orange/Yellow background for prominence
                border: '1px solid #ffb74d',
                boxShadow: '0 4px 10px rgba(255,167,38,0.1)'
            }}
        >
            <h3
                style={{
                    margin: '0 0 20px 0',
                    color: '#ff9800',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <AttachMoney sx={{ mr: 1, fontSize: 26 }} />
                Package Pricing Setup
            </h3>

            <Grid container spacing={3} alignItems='flex-end'>
                {/* Deluxe Input */}
                <Grid item xs={6} sm={3}>
                    <TextField
                        fullWidth
                        type='text'
                        label='Deluxe Price'
                        name='deluxePrice'
                        value={packagePrices.deluxePrice} // Assumed state
                        onChange={handlePriceChange} // Assumed handler
                        InputProps={{
                            startAdornment: <InputAdornment position='start'>$</InputAdornment>
                        }}
                    />
                </Grid>

                {/* Super Deluxe Input */}
                <Grid item xs={6} sm={3}>
                    <TextField
                        fullWidth
                        type='text'
                        label='Super Deluxe Price'
                        name='superDeluxePrice'
                        value={packagePrices.superDeluxePrice} // Assumed state
                        onChange={handlePriceChange}
                        InputProps={{
                            startAdornment: <InputAdornment position='start'>$</InputAdornment>
                        }}
                    />
                </Grid>

                {/* Premium Input */}
                <Grid item xs={6} sm={3}>
                    <TextField
                        fullWidth
                        type='text'
                        label='Premium Price'
                        name='premiumPrice'
                        value={packagePrices.premiumPrice} // Assumed state
                        onChange={handlePriceChange}
                        InputProps={{
                            startAdornment: <InputAdornment position='start'>$</InputAdornment>
                        }}
                    />
                </Grid>

                {/* Luxury Input */}
                <Grid item xs={6} sm={3}>
                    <TextField
                        fullWidth
                        type='text'
                        label='Luxury Price'
                        name='luxuryPrice'
                        value={packagePrices.luxuryPrice} // Assumed state
                        onChange={handlePriceChange}
                        InputProps={{
                            startAdornment: <InputAdornment position='start'>$</InputAdornment>
                        }}
                    />
                </Grid>

                {/* Save Button */}
                <Grid item xs={12} sx={{ pt: 3 }}>
                    <Button
                        variant='contained'
                        color='warning'
                        fullWidth
                        size='large'
                        onClick={handleSavePrices} // Assumed handler
                        startIcon={<Save />}
                    >
                        Save/Update Package Prices
                    </Button>
                </Grid>
            </Grid>
        </Box>
    )
}
export default GuestTourPriceForm
