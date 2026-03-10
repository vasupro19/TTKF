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

function GuestTourPriceForm({ tourId, quotationNo, activeTab }) {
    const [createPrice] = useUpsertGuestTourPriceMutation()
    const dispatch = useDispatch()

    // 🚀 Pass both tourId and quotationNo to the query
    // (Ensure your RTK Query slice is updated to accept an object/params)
    const { data: price = [], isLoading: loadingPrices } = useGetGuestTourPriceQuery(
        {
            leadId: tourId,
            quotationNo
        },
        { skip: activeTab !== 1 || !tourId || !quotationNo }
    )

    const [packagePrices, setPackagePrices] = useState({
        leadId: tourId,
        quotationNo, // 🚀 Store it in local state
        deluxePrice: '0',
        superDeluxePrice: '0',
        luxuryPrice: '0',
        premiumPrice: '0'
    })

    // 🚀 Update local state whenever the fetched data OR the quote number changes
    useEffect(() => {
        setPackagePrices({
            leadId: tourId,
            quotationNo, // 🚀 Ensure state reflects the active quote
            deluxePrice: price.data?.deluxePrice || '0',
            superDeluxePrice: price.data?.superDeluxePrice || '0',
            luxuryPrice: price.data?.luxuryPrice || '0',
            premiumPrice: price.data?.premiumPrice || '0'
        })
    }, [price, quotationNo, tourId])

    const handlePriceChange = e => {
        const { name, value } = e.target
        setPackagePrices(prev => ({
            ...prev,
            [name]: value.replace(/[^0-9]/g, '')
        }))
    }

    const handleSavePrices = async () => {
        try {
            // 🚀 The payload now includes quotationNo
            await createPrice(packagePrices).unwrap()

            dispatch(
                openSnackbar({
                    open: true,
                    message: `Prices for Quotation #${quotationNo} saved successfully!`,
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: false
                })
            )
        } catch (err) {
            console.error('Failed to save prices:', err)
            dispatch(
                openSnackbar({
                    open: true,
                    message: err?.data?.message || 'Failed to save prices.',
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
                Pricing for Quotation #{quotationNo} {/* 🚀 Visual Indicator */}
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

                {/* Save Button */}
                <Grid item xs={12} sx={{ pt: 3 }}>
                    <Button
                        variant='contained'
                        color='warning'
                        fullWidth
                        size='large'
                        onClick={handleSavePrices}
                        startIcon={<Save />}
                    >
                        Save Prices for Quote {quotationNo}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    )
}
export default GuestTourPriceForm
