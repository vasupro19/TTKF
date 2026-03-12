import React, { useState, useEffect } from 'react'
import { Box, Button, Grid, Typography, CircularProgress, Chip } from '@mui/material'
import { Save, CurrencyRupee, CheckCircle } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useDispatch } from 'react-redux'
import { useUpsertGuestTourPriceMutation, useGetGuestTourPriceQuery } from '@/app/store/slices/api/guestTourPrice'
import { openSnackbar } from '@app/store/slices/snackbar'

// ─── Tier config — mirrors ItinerarySection's HOTEL_TIERS style ──────────────
const TIERS = [
    {
        key: 'deluxePrice',
        label: 'Deluxe',
        sublabel: 'Standard comfort',
        color: '#475569',
        activeColor: '#1e293b',
        bg: '#f8fafc',
        activeBg: '#f1f5f9',
        border: '#cbd5e1',
        activeBorder: '#475569',
        icon: '🏨'
    },
    {
        key: 'superDeluxePrice',
        label: 'Super Deluxe',
        sublabel: 'Enhanced experience',
        color: '#1d4ed8',
        activeColor: '#1e40af',
        bg: '#f0f7ff',
        activeBg: '#dbeafe',
        border: '#bfdbfe',
        activeBorder: '#1d4ed8',
        icon: '🏩'
    },
    {
        key: 'luxuryPrice',
        label: 'Luxury',
        sublabel: 'Premium stay',
        color: '#7c3aed',
        activeColor: '#6d28d9',
        bg: '#faf5ff',
        activeBg: '#ede9fe',
        border: '#ddd6fe',
        activeBorder: '#7c3aed',
        icon: '🏰'
    },
    {
        key: 'premiumPrice',
        label: 'Premium',
        sublabel: 'Ultra luxury',
        color: '#b45309',
        activeColor: '#92400e',
        bg: '#fffbeb',
        activeBg: '#fef3c7',
        border: '#fde68a',
        activeBorder: '#b45309',
        icon: '👑'
    }
]

// ─── Single price input card ──────────────────────────────────────────────────
function PriceTierCard({ tier, value, onChange, saved, isFocused, onFocus, onBlur }) {
    const isActive = isFocused || (value && value !== '0')

    return (
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
            <Box
                sx={{
                    borderRadius: '16px',
                    border: `2px solid`,
                    borderColor: isActive ? tier.activeBorder : tier.border,
                    bgcolor: isActive ? tier.activeBg : tier.bg,
                    p: 2.5,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    cursor: 'text',
                    boxShadow: isActive ? `0 4px 16px ${tier.activeBorder}40` : '0 2px 8px rgba(0,0,0,0.04)'
                }}
                onClick={() => document.getElementById(`price-${tier.key}`)?.focus()}
            >
                {/* Saved badge */}
                {saved && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -10,
                            right: 10,
                            bgcolor: '#22c55e',
                            color: 'white',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            px: 1,
                            py: 0.3,
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.4
                        }}
                    >
                        <CheckCircle sx={{ fontSize: 10 }} /> SAVED
                    </Box>
                )}

                {/* Tier label */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box>
                        <Typography
                            sx={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                color: isActive ? tier.activeColor : tier.color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.07em'
                            }}
                        >
                            {tier.icon} {tier.label}
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', mt: 0.2 }}>{tier.sublabel}</Typography>
                    </Box>
                </Box>

                {/* Price input */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: '1.2rem',
                            color: isActive ? tier.activeColor : '#94a3b8',
                            lineHeight: 1
                        }}
                    >
                        ₹
                    </Typography>
                    <Box
                        component='input'
                        id={`price-${tier.key}`}
                        type='text'
                        inputMode='numeric'
                        value={value}
                        onChange={e => onChange(tier.key, e.target.value.replace(/[^0-9]/g, ''))}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        placeholder='0'
                        sx={{
                            border: 'none',
                            outline: 'none',
                            bgcolor: 'transparent',
                            fontWeight: 900,
                            fontSize: '1.6rem',
                            color: isActive ? tier.activeColor : '#475569',
                            width: '100%',
                            fontFamily: 'inherit',
                            letterSpacing: '-0.5px',
                            '&::placeholder': { color: '#cbd5e1' }
                        }}
                    />
                </Box>

                {/* Formatted display */}
                {value && value !== '0' && (
                    <Typography
                        sx={{
                            fontSize: '0.7rem',
                            color: tier.color,
                            fontWeight: 600,
                            mt: 0.5
                        }}
                    >
                        ₹{Number(value).toLocaleString('en-IN')}
                    </Typography>
                )}
            </Box>
        </motion.div>
    )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
function GuestTourPriceForm({ tourId, quotationNo, activeTab }) {
    const [createPrice, { isLoading: isSaving }] = useUpsertGuestTourPriceMutation()
    const dispatch = useDispatch()
    const [focusedKey, setFocusedKey] = useState(null)
    const [savedKeys, setSavedKeys] = useState([])

    const { data: price = [], isLoading: loadingPrices } = useGetGuestTourPriceQuery(
        { leadId: tourId, quotationNo },
        { skip: activeTab !== 1 || !tourId || !quotationNo }
    )

    const [packagePrices, setPackagePrices] = useState({
        leadId: tourId,
        quotationNo,
        deluxePrice: '0',
        superDeluxePrice: '0',
        luxuryPrice: '0',
        premiumPrice: '0'
    })

    useEffect(() => {
        setPackagePrices({
            leadId: tourId,
            quotationNo,
            deluxePrice: price.data?.deluxePrice || '0',
            superDeluxePrice: price.data?.superDeluxePrice || '0',
            luxuryPrice: price.data?.luxuryPrice || '0',
            premiumPrice: price.data?.premiumPrice || '0'
        })
        // Mark existing prices as saved
        if (price.data) {
            setSavedKeys(TIERS.filter(t => price.data[t.key] && price.data[t.key] !== '0').map(t => t.key))
        }
    }, [price, quotationNo, tourId])

    const handleChange = (key, value) => {
        setPackagePrices(prev => ({ ...prev, [key]: value }))
        setSavedKeys(prev => prev.filter(k => k !== key)) // Remove saved state on edit
    }

    const handleSave = async () => {
        try {
            await createPrice(packagePrices).unwrap()
            setSavedKeys(TIERS.map(t => t.key))
            dispatch(
                openSnackbar({
                    open: true,
                    message: `Prices for Quote #${quotationNo} saved!`,
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: false
                })
            )
        } catch (err) {
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

    const hasAnyPrice = TIERS.some(t => packagePrices[t.key] && packagePrices[t.key] !== '0')

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Box
                sx={{
                    mb: 3,
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid #fde68a',
                    boxShadow: '0 4px 20px rgba(245,158,11,0.1)'
                }}
            >
                {/* ── Header ── */}
                <Box
                    sx={{
                        px: 3,
                        py: 2,
                        background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.2)',
                                borderRadius: '10px',
                                p: 0.8,
                                display: 'flex'
                            }}
                        >
                            <CurrencyRupee sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography
                                sx={{
                                    fontWeight: 900,
                                    color: 'white',
                                    fontSize: '1rem',
                                    letterSpacing: '-0.3px'
                                }}
                            >
                                Package Pricing
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                                Set per-person prices for Quote #{quotationNo}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {loadingPrices && <CircularProgress size={18} sx={{ color: 'white' }} />}
                        <Chip
                            label={`Quote #${quotationNo}`}
                            size='small'
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '0.75rem'
                            }}
                        />
                    </Box>
                </Box>

                {/* ── Price Cards ── */}
                <Box sx={{ p: 3, bgcolor: '#fffbeb' }}>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {TIERS.map((tier, i) => (
                            <Grid item xs={6} sm={3} key={tier.key}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                >
                                    <PriceTierCard
                                        tier={tier}
                                        value={packagePrices[tier.key]}
                                        onChange={handleChange}
                                        saved={savedKeys.includes(tier.key)}
                                        isFocused={focusedKey === tier.key}
                                        onFocus={() => setFocusedKey(tier.key)}
                                        onBlur={() => setFocusedKey(null)}
                                    />
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>

                    {/* ── Summary row ── */}
                    {hasAnyPrice && (
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1.5,
                                flexWrap: 'wrap',
                                mb: 2.5,
                                p: 2,
                                borderRadius: '12px',
                                bgcolor: 'rgba(255,255,255,0.7)',
                                border: '1px solid #fde68a'
                            }}
                        >
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', mr: 1 }}>
                                SUMMARY:
                            </Typography>
                            {TIERS.map(tier => {
                                const val = packagePrices[tier.key]
                                if (!val || val === '0') return null
                                return (
                                    <Box
                                        key={tier.key}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.8,
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: '8px',
                                            bgcolor: tier.activeBg,
                                            border: `1px solid ${tier.activeBorder}`
                                        }}
                                    >
                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: tier.color }}>
                                            {tier.label}
                                        </Typography>
                                        <Typography
                                            sx={{ fontSize: '0.78rem', fontWeight: 900, color: tier.activeColor }}
                                        >
                                            ₹{Number(val).toLocaleString('en-IN')}
                                        </Typography>
                                    </Box>
                                )
                            })}
                        </Box>
                    )}

                    {/* ── Save button ── */}
                    <Button
                        variant='contained'
                        fullWidth
                        size='large'
                        onClick={handleSave}
                        disabled={isSaving || !hasAnyPrice}
                        startIcon={isSaving ? <CircularProgress size={18} color='inherit' /> : <Save />}
                        sx={{
                            borderRadius: '12px',
                            py: 1.6,
                            fontWeight: 800,
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            background:
                                isSaving || !hasAnyPrice ? undefined : 'linear-gradient(135deg, #b45309, #d97706)',
                            boxShadow: '0 4px 14px rgba(180,83,9,0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #92400e, #b45309)',
                                boxShadow: '0 6px 20px rgba(180,83,9,0.4)',
                                transform: 'translateY(-1px)'
                            },
                            '&:active': { transform: 'translateY(0)' },
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {isSaving ? 'Saving...' : `Save Prices for Quote #${quotationNo}`}
                    </Button>
                </Box>
            </Box>
        </motion.div>
    )
}

export default GuestTourPriceForm
