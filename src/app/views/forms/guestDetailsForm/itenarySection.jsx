/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react'
import {
    Box,
    Button,
    Typography,
    Grid,
    Chip,
    Dialog,
    DialogContent,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tooltip,
    Divider
} from '@mui/material'
import {
    LocationOn,
    Share,
    CheckCircle,
    Edit,
    Delete,
    Close,
    Hotel,
    Fullscreen,
    NightsStay,
    TableChart,
    ViewModule,
    SwapHoriz,
    KeyboardArrowUp,
    KeyboardArrowDown,
    Visibility,
    PictureAsPdf
} from '@mui/icons-material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Hotel tier config ────────────────────────────────────────────────────────
const HOTEL_TIERS = [
    { key: 'deluxe', label: 'Deluxe', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
    { key: 'superDeluxe', label: 'Super Deluxe', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    { key: 'luxury', label: 'Luxury', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    { key: 'premium', label: 'Premium', color: '#b45309', bg: '#fffbeb', border: '#fde68a' }
]

const PRICE_KEYS = {
    deluxePrice: { label: 'Deluxe', color: '#64748b', bg: '#f1f5f9' },
    superDeluxePrice: { label: 'Super Deluxe', color: '#1d4ed8', bg: '#eff6ff' },
    luxuryPrice: { label: 'Luxury', color: '#7c3aed', bg: '#f5f3ff' },
    premiumPrice: { label: 'Premium', color: '#b45309', bg: '#fffbeb' }
}

// ─── Full Screen Dialog ───────────────────────────────────────────────────────
function FullScreenItinerary({
    open,
    onClose,
    itineraries,
    currentQuoteNo,
    staysBreakdown,
    totalNights,
    priceData,
    confirmedPackage,
    lastSharedQuoteNo,
    lastSharedAt
}) {
    return (
        <Dialog fullScreen open={open} onClose={onClose} PaperProps={{ sx: { bgcolor: '#f8faff' } }}>
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    bgcolor: '#1c2d45',
                    color: 'white',
                    px: 4,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <NightsStay sx={{ color: '#93c5fd' }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.3px' }}>
                        Quote {currentQuoteNo} — Full Itinerary View
                    </Typography>
                    <Chip
                        label={`${totalNights} Nights`}
                        size='small'
                        sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700 }}
                    />
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <Close />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: { xs: 2, md: 5 }, maxWidth: 1200, mx: 'auto', width: '100%' }}>
                {/* Stay Breakdown */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 4 }}>
                    {staysBreakdown.map(stay => (
                        <Box
                            key={stay.destination}
                            sx={{
                                px: 2.5,
                                py: 1,
                                borderRadius: '50px',
                                bgcolor: 'white',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}
                        >
                            📍 {stay.destination}: {stay.nights}N
                        </Box>
                    ))}
                </Box>

                {/* Day cards */}
                {itineraries.map((item, i) => (
                    <motion.div
                        key={item.fullItem?.id || i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                    >
                        <Box
                            sx={{
                                width: '100%',
                                mb: 4,
                                borderRadius: '20px',
                                overflow: 'hidden',
                                bgcolor: 'white',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
                            }}
                        >
                            {/* Day header */}
                            <Box
                                sx={{
                                    px: 3,
                                    py: 2,
                                    background: 'linear-gradient(135deg, #1c2d45, #2a4a7f)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(255,255,255,0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 900,
                                        color: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {i + 1}
                                </Box>
                                <Typography sx={{ fontWeight: 800, color: 'white', fontSize: '1.05rem' }}>
                                    Day {i + 1}: {item.title}
                                </Typography>
                                <Chip
                                    label={item.destination}
                                    size='small'
                                    sx={{
                                        ml: 'auto',
                                        bgcolor: 'rgba(255,255,255,0.15)',
                                        color: 'white',
                                        fontWeight: 600
                                    }}
                                />
                            </Box>

                            <Grid container>
                                {item.image && (
                                    <Grid item xs={12} md={4}>
                                        <Box
                                            component='img'
                                            src={item.image}
                                            alt={item.title}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                minHeight: 260,
                                                aspectRatio: '1 / 1',
                                                objectFit: 'cover',
                                                display: 'block'
                                            }}
                                        />
                                    </Grid>
                                )}
                                <Grid item xs={12} md={item.image ? 8 : 12}>
                                    <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
                                        <Typography
                                            sx={{
                                                color: '#475569',
                                                lineHeight: 1.9,
                                                fontSize: '0.98rem',
                                                mb: 3,
                                                maxWidth: '100%'
                                            }}
                                        >
                                            {item.description ||
                                                'Enjoy your day exploring beautiful landscapes and local attractions.'}
                                        </Typography>

                                        {/* Hotel tiers inline */}
                                        <Typography
                                            sx={{
                                                fontSize: '0.72rem',
                                                fontWeight: 800,
                                                color: '#94a3b8',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.08em',
                                                mb: 1.5
                                            }}
                                        >
                                            Accommodation Options
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                            {HOTEL_TIERS.map(tier => (
                                                <Box
                                                    key={tier.key}
                                                    sx={{
                                                        px: 2,
                                                        py: 1,
                                                        borderRadius: '10px',
                                                        bgcolor: tier.bg,
                                                        border: `1px solid ${tier.border}`,
                                                        minWidth: 120
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontSize: '0.7rem',
                                                            fontWeight: 800,
                                                            color: tier.color,
                                                            textTransform: 'uppercase',
                                                            mb: 0.3
                                                        }}
                                                    >
                                                        {tier.label}
                                                    </Typography>
                                                    <Typography
                                                        sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}
                                                    >
                                                        {item.hotels?.[tier.key] || '—'}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </motion.div>
                ))}

                {/* Hotel Summary Table */}
                {/* <HotelSummaryTable itineraries={itineraries} /> */}

                {/* Pricing */}
                {priceData && (
                    <PricingSection
                        priceData={priceData}
                        confirmedPackage={confirmedPackage}
                        currentQuoteNo={currentQuoteNo}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}

// ─── Hotel Summary Table ──────────────────────────────────────────────────────
// function HotelSummaryTable({ itineraries }) {
//     return (
//         <Box sx={{ mb: 4 }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
//                 <Hotel sx={{ color: '#1d4ed8' }} />
//                 <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
//                     Accommodation Summary
//                 </Typography>
//             </Box>
//             <TableContainer
//                 component={Paper}
//                 elevation={0}
//                 sx={{
//                     border: '1px solid #e2e8f0',
//                     borderRadius: '16px',
//                     overflow: 'hidden'
//                 }}
//             >
//                 <Table size='small'>
//                     <TableHead>
//                         <TableRow sx={{ bgcolor: '#1c2d45' }}>
//                             <TableCell sx={{ color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>
//                                 Destination
//                             </TableCell>
//                             {HOTEL_TIERS.map(t => (
//                                 <TableCell
//                                     key={t.key}
//                                     align='center'
//                                     sx={{ color: 'white', fontWeight: 800, fontSize: '0.8rem' }}
//                                 >
//                                     {t.label}
//                                 </TableCell>
//                             ))}
//                         </TableRow>
//                     </TableHead>
//                     <TableBody>
//                         {itineraries.map((item, i) => (
//                             <TableRow
//                                 key={i}
//                                 sx={{
//                                     bgcolor: i % 2 === 0 ? '#fafbff' : 'white',
//                                     '&:hover': { bgcolor: '#eff6ff' },
//                                     transition: '0.15s'
//                                 }}
//                             >
//                                 <TableCell>
//                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                         <Box
//                                             sx={{
//                                                 width: 24,
//                                                 height: 24,
//                                                 borderRadius: '50%',
//                                                 bgcolor: '#1c2d45',
//                                                 color: 'white',
//                                                 display: 'flex',
//                                                 alignItems: 'center',
//                                                 justifyContent: 'center',
//                                                 fontSize: '0.7rem',
//                                                 fontWeight: 800,
//                                                 flexShrink: 0
//                                             }}
//                                         >
//                                             {i + 1}
//                                         </Box>
//                                         <Box>
//                                             <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
//                                                 {item.destination}
//                                             </Typography>
//                                             <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
//                                                 {item.title}
//                                             </Typography>
//                                         </Box>
//                                     </Box>
//                                 </TableCell>
//                                 {HOTEL_TIERS.map(tier => (
//                                     <TableCell key={tier.key} align='center'>
//                                         <Typography
//                                             sx={{
//                                                 fontSize: '0.8rem',
//                                                 fontWeight: 600,
//                                                 color: item.hotels?.[tier.key] ? tier.color : '#cbd5e1'
//                                             }}
//                                         >
//                                             {item.hotels?.[tier.key] || '—'}
//                                         </Typography>
//                                     </TableCell>
//                                 ))}
//                             </TableRow>
//                         ))}
//                     </TableBody>
//                 </Table>
//             </TableContainer>
//         </Box>
//     )
// }

// ─── Pricing Section ──────────────────────────────────────────────────────────
function PricingSection({ priceData, confirmedPackage, currentQuoteNo }) {
    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                    💰 Package Pricing
                </Typography>
                {confirmedPackage?.data?.quotationNo === currentQuoteNo && (
                    <Chip
                        label='Active Conversion'
                        size='small'
                        sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }}
                    />
                )}
            </Box>
            <Grid container spacing={2}>
                {Object.entries(PRICE_KEYS).map(([key, config]) => {
                    const isConverted =
                        confirmedPackage?.data?.selectedPackage === key &&
                        confirmedPackage?.data?.quotationNo === currentQuoteNo
                    return (
                        <Grid item xs={6} md={3} key={key}>
                            <Box
                                sx={{
                                    p: 2.5,
                                    borderRadius: '16px',
                                    bgcolor: config.bg,
                                    border: `2px solid ${isConverted ? config.color : 'transparent'}`,
                                    boxShadow: isConverted ? `0 0 0 3px ${config.bg}` : 'none',
                                    position: 'relative',
                                    transition: '0.2s'
                                }}
                            >
                                {isConverted && (
                                    <Chip
                                        label='Selected'
                                        size='small'
                                        sx={{
                                            position: 'absolute',
                                            top: -10,
                                            right: 8,
                                            bgcolor: config.color,
                                            color: 'white',
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            height: 20
                                        }}
                                    />
                                )}
                                <Typography
                                    sx={{
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        color: config.color,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                        mb: 0.5
                                    }}
                                >
                                    {config.label}
                                </Typography>
                                <Typography sx={{ fontWeight: 900, fontSize: '1.3rem', color: '#0f172a' }}>
                                    ₹{priceData?.[key] || 'N/A'}
                                </Typography>
                            </Box>
                        </Grid>
                    )
                })}
            </Grid>
        </Box>
    )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ItinerarySection({
    currentQuoteItineraries,
    currentQuoteNo,
    staysBreakdown,
    confirmedPackage,
    lastSharedQuoteNo,
    lastSharedAt,
    priceData,
    isLoading,
    handleShare,
    handlePreview,
    handleWhatsAppClick,
    handleDownloadPdf,
    handleConvertPackage,
    onEditItem,
    onDeleteItem,
    GuestTourPriceForm,
    params,
    onReorderDay,
    totalDays
}) {
    const [fullScreen, setFullScreen] = useState(false)
    const [view, setView] = useState('cards') // 'cards' | 'table'

    const totalNights = staysBreakdown.reduce((sum, s) => sum + s.nights, 0)

    const convertedQuoteNo = confirmedPackage?.data?.quotationNo
    const sharedQuoteNo = lastSharedQuoteNo

    return (
        <Box sx={{ mt: 3, width: '100%' }}>
            {/* ── HEADER BAR ───────────────────────────────────────────── */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                    flexWrap: 'wrap',
                    gap: 1.5
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', color: '#0f172a' }}>
                        Quote {currentQuoteNo} — Itinerary
                    </Typography>
                    <Chip
                        label={`${currentQuoteItineraries.length} Days`}
                        size='small'
                        sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}
                    />
                    <Chip
                        label={`${totalNights} Nights`}
                        size='small'
                        sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 700 }}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* View toggle */}
                    <Box
                        sx={{
                            display: 'flex',
                            bgcolor: '#f1f5f9',
                            borderRadius: '10px',
                            p: 0.5,
                            gap: 0.5
                        }}
                    >
                        <Tooltip title='Card View'>
                            <IconButton
                                size='small'
                                onClick={() => setView('cards')}
                                sx={{
                                    borderRadius: '8px',
                                    bgcolor: view === 'cards' ? 'white' : 'transparent',
                                    boxShadow: view === 'cards' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                    color: view === 'cards' ? '#1d4ed8' : '#94a3b8'
                                }}
                            >
                                <ViewModule fontSize='small' />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title='Table View'>
                            <IconButton
                                size='small'
                                onClick={() => setView('table')}
                                sx={{
                                    borderRadius: '8px',
                                    bgcolor: view === 'table' ? 'white' : 'transparent',
                                    boxShadow: view === 'table' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                    color: view === 'table' ? '#1d4ed8' : '#94a3b8'
                                }}
                            >
                                <TableChart fontSize='small' />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Tooltip title='Full Screen View'>
                        <IconButton
                            onClick={() => setFullScreen(true)}
                            sx={{
                                bgcolor: '#1c2d45',
                                color: 'white',
                                borderRadius: '10px',
                                '&:hover': { bgcolor: '#2a4a7f' }
                            }}
                        >
                            <Fullscreen fontSize='small' />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* ── STATS + ACTION BOX ───────────────────────────────────── */}
            <Box
                sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #e8f0fe 0%, #f0f7ff 100%)',
                    border: '1px solid #bfdbfe',
                    boxShadow: '0 4px 16px rgba(37,99,235,0.08)'
                }}
            >
                {/* Nights + breakdown */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <NightsStay sx={{ color: '#1d4ed8', fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 800, color: '#1d4ed8', fontSize: '1rem' }}>
                        {totalNights} Nights Total
                    </Typography>
                    <Divider orientation='vertical' flexItem sx={{ mx: 1 }} />
                    {staysBreakdown.map(stay => (
                        <Chip
                            key={stay.destination}
                            icon={<LocationOn sx={{ fontSize: '14px !important' }} />}
                            label={`${stay.destination}: ${stay.nights}N`}
                            size='small'
                            sx={{ bgcolor: 'white', border: '1px solid #bfdbfe', fontWeight: 700, color: '#1e40af' }}
                        />
                    ))}
                </Box>

                {/* Status banners */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                    {/* Converted quote banner */}
                    {confirmedPackage?.data && confirmedPackage.data.selectedPackage && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 2,
                                py: 1.2,
                                borderRadius: '10px',
                                bgcolor: convertedQuoteNo === currentQuoteNo ? '#f0fdf4' : '#fff7ed',
                                border: '1px solid',
                                borderColor: convertedQuoteNo === currentQuoteNo ? '#bbf7d0' : '#fed7aa'
                            }}
                        >
                            <Box sx={{ fontSize: '1rem' }}>{convertedQuoteNo === currentQuoteNo ? '✅' : '⚠️'}</Box>
                            <Typography
                                sx={{
                                    fontSize: '0.83rem',
                                    fontWeight: 600,
                                    color: convertedQuoteNo === currentQuoteNo ? '#15803d' : '#c2410c'
                                }}
                            >
                                {convertedQuoteNo === currentQuoteNo
                                    ? `Quote ${convertedQuoteNo} is the active confirmed package — ${confirmedPackage.data.selectedPackage} @ ₹${confirmedPackage.data.sellingPrice}`
                                    : `Quote ${convertedQuoteNo} was last converted (${confirmedPackage.data.selectedPackage} — ₹${confirmedPackage.data.sellingPrice}). Converting Quote ${currentQuoteNo} will replace it.`}
                            </Typography>
                        </Box>
                    )}

                    {/* Last shared banner */}
                    {sharedQuoteNo && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 2,
                                py: 1.2,
                                borderRadius: '10px',
                                bgcolor: sharedQuoteNo === currentQuoteNo ? '#eff6ff' : '#fefce8',
                                border: '1px solid',
                                borderColor: sharedQuoteNo === currentQuoteNo ? '#bfdbfe' : '#fde68a'
                            }}
                        >
                            <Box sx={{ fontSize: '1rem' }}>📧</Box>
                            <Typography
                                sx={{
                                    fontSize: '0.83rem',
                                    fontWeight: 600,
                                    color: sharedQuoteNo === currentQuoteNo ? '#1d4ed8' : '#92400e'
                                }}
                            >
                                {sharedQuoteNo === currentQuoteNo
                                    ? `Quote ${sharedQuoteNo} was last emailed to client${lastSharedAt ? ` on ${new Date(lastSharedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`
                                    : `⚠️ Quote ${sharedQuoteNo} was last shared. You're about to share Quote ${currentQuoteNo} — a different version.`}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button
                        variant='contained'
                        startIcon={<Visibility />}
                        onClick={handlePreview}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                    >
                        Preview & Send
                    </Button>
                    <Button
                        variant='outlined'
                        startIcon={<Share />}
                        onClick={handleShare}
                        disabled={isLoading}
                        sx={{
                            borderRadius: '10px',
                            fontWeight: 700,
                            textTransform: 'none',
                            borderColor: '#39B54A',
                            color: '#39B54A',
                            borderWidth: '2px',
                            '&:hover': { borderWidth: '2px', bgcolor: '#f0fdf4', borderColor: '#22c55e' }
                        }}
                    >
                        {sharedQuoteNo && sharedQuoteNo !== currentQuoteNo
                            ? `Share Q${currentQuoteNo} (Last sent: Q${sharedQuoteNo})`
                            : `Share Quote ${currentQuoteNo}`}
                    </Button>

                    <Button
                        variant='outlined'
                        startIcon={<PictureAsPdf />}
                        onClick={handleDownloadPdf}
                        sx={{
                            borderRadius: '10px',
                            fontWeight: 700,
                            textTransform: 'none',
                            borderColor: '#e11d48',
                            color: '#e11d48',
                            borderWidth: '2px',
                            '&:hover': { borderWidth: '2px', bgcolor: '#ffe4e6', borderColor: '#e11d48' }
                        }}
                    >
                        Download PDF
                    </Button>

                    <Button
                        variant='outlined'
                        startIcon={<WhatsAppIcon />}
                        onClick={handleWhatsAppClick}
                        sx={{
                            borderRadius: '10px',
                            fontWeight: 700,
                            textTransform: 'none',
                            borderColor: '#25D366',
                            color: '#25D366',
                            borderWidth: '2px',
                            '&:hover': { borderWidth: '2px', bgcolor: '#f0fdf4', borderColor: '#25D366' }
                        }}
                    >
                        WhatsApp Q{currentQuoteNo}
                    </Button>

                    <Button
                        variant='contained'
                        startIcon={<CheckCircle />}
                        onClick={handleConvertPackage}
                        sx={{
                            borderRadius: '10px',
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 3,
                            background: 'linear-gradient(135deg, #1c2d45, #2a4a7f)',
                            boxShadow: '0 4px 14px rgba(28,45,69,0.35)',
                            '&:hover': { background: 'linear-gradient(135deg, #0f172a, #1e3a8a)' }
                        }}
                    >
                        {confirmedPackage?.data && confirmedPackage.data.selectedPackage
                            ? convertedQuoteNo === currentQuoteNo
                                ? `🔄 Re-convert Quote ${currentQuoteNo}`
                                : `⚠️ Replace Q${convertedQuoteNo} → Q${currentQuoteNo}`
                            : `Convert Quote ${currentQuoteNo}`}
                    </Button>
                </Box>
            </Box>

            {/* ── PRICE FORM ───────────────────────────────────────────── */}
            {GuestTourPriceForm}

            {/* ── HOTEL TABLE (always visible, compact) ───────────────── */}
            {/* <Box sx={{ mb: 3 }}>
                <HotelSummaryTable itineraries={currentQuoteItineraries} />
            </Box> */}

            {/* ── CARDS or TABLE view ──────────────────────────────────── */}
            <AnimatePresence mode='wait'>
                {view === 'cards' ? (
                    <motion.div
                        key='cards'
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Grid container spacing={3}>
                            {[...currentQuoteItineraries]
                                .sort((a, b) => a.fullItem.order - b.fullItem.order)
                                .map((item, index, arr) => (
                                    <Grid item xs={12} key={item.fullItem?.id || index}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.06 }}
                                        >
                                            <Box
                                                sx={{
                                                    borderRadius: '20px',
                                                    overflow: 'hidden',
                                                    border: '1px solid #e2e8f0',
                                                    bgcolor: 'white',
                                                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                                    transition: 'all 0.25s ease',
                                                    '&:hover': {
                                                        boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                                                        transform: 'translateY(-2px)'
                                                    }
                                                }}
                                            >
                                                {/* Day Header */}
                                                {/* Day Header */}
                                                <Box
                                                    sx={{
                                                        px: 3,
                                                        py: 1.8,
                                                        background:
                                                            'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1a56a0 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between'
                                                    }}
                                                >
                                                    {/* Left — Day badge + up/down */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        {/* Day number badge */}
                                                        <Box
                                                            sx={{
                                                                minWidth: 48,
                                                                height: 48,
                                                                borderRadius: '12px',
                                                                background: 'rgba(255,255,255,0.12)',
                                                                border: '1px solid rgba(255,255,255,0.2)',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: '9px',
                                                                    color: '#93c5fd',
                                                                    fontWeight: 700,
                                                                    letterSpacing: '0.1em',
                                                                    textTransform: 'uppercase',
                                                                    lineHeight: 1
                                                                }}
                                                            >
                                                                DAY
                                                            </Typography>
                                                            <Typography
                                                                sx={{
                                                                    fontSize: '20px',
                                                                    color: '#fff',
                                                                    fontWeight: 800,
                                                                    lineHeight: 1.1
                                                                }}
                                                            >
                                                                {index + 1}
                                                            </Typography>
                                                        </Box>

                                                        {/* Title */}
                                                        <Box>
                                                            <Typography
                                                                sx={{
                                                                    fontSize: '0.97rem',
                                                                    fontWeight: 700,
                                                                    color: '#fff',
                                                                    lineHeight: 1.3,
                                                                    letterSpacing: '0.01em'
                                                                }}
                                                            >
                                                                {item.title || 'Untitled Day'}
                                                            </Typography>
                                                            <Chip
                                                                label={item.destination}
                                                                size='small'
                                                                icon={
                                                                    <LocationOn
                                                                        sx={{
                                                                            fontSize: '12px !important',
                                                                            color: '#93c5fd !important'
                                                                        }}
                                                                    />
                                                                }
                                                                sx={{
                                                                    mt: 0.5,
                                                                    height: 20,
                                                                    bgcolor: 'rgba(255,255,255,0.1)',
                                                                    border: '1px solid rgba(255,255,255,0.15)',
                                                                    color: '#cbd5e1',
                                                                    fontWeight: 500,
                                                                    fontSize: '0.7rem',
                                                                    '& .MuiChip-label': { px: 1 }
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>

                                                    {/* Right — reorder + actions */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {/* Up/Down reorder */}
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', mr: 1 }}>
                                                            <IconButton
                                                                size='small'
                                                                disabled={index === 0}
                                                                onClick={() => onReorderDay(item, 'up')}
                                                                sx={{
                                                                    p: 0.3,
                                                                    color:
                                                                        index === 0
                                                                            ? 'rgba(255,255,255,0.2)'
                                                                            : '#60a5fa',
                                                                    '&:hover': { bgcolor: 'rgba(96,165,250,0.15)' }
                                                                }}
                                                            >
                                                                <KeyboardArrowUp sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                            <IconButton
                                                                size='small'
                                                                disabled={index === arr.length - 1}
                                                                onClick={() => onReorderDay(item, 'down')}
                                                                sx={{
                                                                    p: 0.3,
                                                                    color:
                                                                        index === arr.length - 1
                                                                            ? 'rgba(255,255,255,0.2)'
                                                                            : '#60a5fa',
                                                                    '&:hover': { bgcolor: 'rgba(96,165,250,0.15)' }
                                                                }}
                                                            >
                                                                <KeyboardArrowDown sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Box>

                                                        <Box
                                                            sx={{
                                                                width: '1px',
                                                                height: 32,
                                                                bgcolor: 'rgba(255,255,255,0.15)',
                                                                mr: 0.5
                                                            }}
                                                        />

                                                        {/* Edit */}
                                                        <IconButton
                                                            size='small'
                                                            onClick={() => onEditItem(item, index)}
                                                            sx={{
                                                                bgcolor: 'rgba(96,165,250,0.15)',
                                                                color: '#93c5fd',
                                                                border: '1px solid rgba(96,165,250,0.2)',
                                                                '&:hover': { bgcolor: 'rgba(96,165,250,0.3)' }
                                                            }}
                                                        >
                                                            <Edit sx={{ fontSize: 15 }} />
                                                        </IconButton>

                                                        {/* Delete */}
                                                        <IconButton
                                                            size='small'
                                                            onClick={() => onDeleteItem(item, index)}
                                                            sx={{
                                                                bgcolor: 'rgba(239,68,68,0.15)',
                                                                color: '#fca5a5',
                                                                border: '1px solid rgba(239,68,68,0.2)',
                                                                '&:hover': { bgcolor: 'rgba(239,68,68,0.35)' }
                                                            }}
                                                        >
                                                            <Delete sx={{ fontSize: 15 }} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>

                                                <Grid container sx={{ width: '100%' }}>
                                                    {/* Image */}
                                                    {item.image && (
                                                        <Grid item xs={12} md={3.5}>
                                                            <Box
                                                                component='img'
                                                                src={item.image}
                                                                alt={item.title}
                                                                sx={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    minHeight: 260,
                                                                    aspectRatio: '1 / 1',
                                                                    objectFit: 'cover',
                                                                    display: 'block'
                                                                }}
                                                            />
                                                        </Grid>
                                                    )}

                                                    {/* Description */}
                                                    <Grid item xs={12} md={item.image ? 5 : 8}>
                                                        <Box
                                                            sx={{
                                                                p: { xs: 2.5, md: 3.5 },
                                                                minWidth: 0
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    color: '#475569',
                                                                    lineHeight: 1.9,
                                                                    fontSize: '0.96rem',
                                                                    maxWidth: '100%',
                                                                    wordBreak: 'break-word'
                                                                }}
                                                            >
                                                                {item.description ||
                                                                    'Enjoy your day exploring beautiful landscapes.'}
                                                            </Typography>
                                                        </Box>
                                                    </Grid>

                                                    {/* Hotel tiers - right column */}
                                                    <Grid item xs={12} md={3.5}>
                                                        <Box
                                                            sx={{
                                                                p: { xs: 2, md: 2.5 },
                                                                height: '100%',
                                                                bgcolor: '#fafbff',
                                                                borderLeft: '1px solid #e2e8f0',
                                                                minWidth: 0
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: '0.68rem',
                                                                    fontWeight: 800,
                                                                    color: '#94a3b8',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.08em',
                                                                    mb: 1.5
                                                                }}
                                                            >
                                                                🏨 Hotels
                                                            </Typography>
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: 1
                                                                }}
                                                            >
                                                                {HOTEL_TIERS.map(tier => (
                                                                    <Box
                                                                        key={tier.key}
                                                                        sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'space-between',
                                                                            px: 1.5,
                                                                            py: 0.8,
                                                                            borderRadius: '8px',
                                                                            bgcolor: tier.bg,
                                                                            border: `1px solid ${tier.border}`
                                                                        }}
                                                                    >
                                                                        <Typography
                                                                            sx={{
                                                                                fontSize: '0.72rem',
                                                                                fontWeight: 800,
                                                                                color: tier.color
                                                                            }}
                                                                        >
                                                                            {tier.label}
                                                                        </Typography>
                                                                        <Typography
                                                                            sx={{
                                                                                fontSize: '0.78rem',
                                                                                fontWeight: 600,
                                                                                color: '#1e293b',
                                                                                textAlign: 'right',
                                                                                maxWidth: '68%'
                                                                            }}
                                                                        >
                                                                            {item.hotels?.[tier.key] || '—'}
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        </motion.div>
                                    </Grid>
                                ))}
                        </Grid>
                    </motion.div>
                ) : (
                    <motion.div
                        key='table'
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Compact table view with all info */}
                        <TableContainer
                            component={Paper}
                            elevation={0}
                            sx={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '16px',
                                overflow: 'hidden'
                            }}
                        >
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#1c2d45' }}>
                                        <TableCell sx={{ color: 'white', fontWeight: 800 }}>Day</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 800 }}>Image</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 800 }}>Title</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 800 }}>Destination</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 800 }}>Deluxe</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 800 }}>Super Deluxe</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 800 }}>Luxury</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 800 }}>Premium</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 800 }} align='center'>
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {currentQuoteItineraries.map((item, i) => (
                                        <TableRow
                                            key={i}
                                            sx={{
                                                bgcolor: i % 2 === 0 ? '#fafbff' : 'white',
                                                '&:hover': { bgcolor: '#eff6ff' }
                                            }}
                                        >
                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: '50%',
                                                        bgcolor: '#1c2d45',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 900
                                                    }}
                                                >
                                                    {i + 1}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {item.image ? (
                                                    <Box
                                                        component='img'
                                                        src={item.image}
                                                        alt={item.title}
                                                        sx={{
                                                            width: 64,
                                                            height: 48,
                                                            objectFit: 'cover',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e2e8f0',
                                                            display: 'block',
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                                                        }}
                                                    />
                                                ) : (
                                                    <Box
                                                        sx={{
                                                            width: 64,
                                                            height: 48,
                                                            borderRadius: '8px',
                                                            bgcolor: '#f1f5f9',
                                                            border: '1px dashed #cbd5e1',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#cbd5e1',
                                                            fontSize: '0.65rem',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        No img
                                                    </Box>
                                                )}
                                            </TableCell>
                                            {/* Then your existing Title cell */}

                                            <TableCell>
                                                <Typography
                                                    sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}
                                                >
                                                    {item.title}
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.72rem',
                                                        color: '#94a3b8',
                                                        maxWidth: 260,
                                                        whiteSpace: 'normal',
                                                        wordBreak: 'break-word',
                                                        lineHeight: 1.5
                                                    }}
                                                >
                                                    {item.description || 'No description provided.'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={item.destination}
                                                    size='small'
                                                    icon={<LocationOn sx={{ fontSize: '13px !important' }} />}
                                                    sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}
                                                />
                                            </TableCell>
                                            {HOTEL_TIERS.map(tier => (
                                                <TableCell key={tier.key}>
                                                    <Typography
                                                        sx={{
                                                            fontSize: '0.8rem',
                                                            color: item.hotels?.[tier.key] ? tier.color : '#cbd5e1',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        {item.hotels?.[tier.key] || '—'}
                                                    </Typography>
                                                </TableCell>
                                            ))}
                                            <TableCell align='center'>
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                    <IconButton
                                                        size='small'
                                                        onClick={() => onEditItem(item, i)}
                                                        sx={{
                                                            color: '#1d4ed8',
                                                            bgcolor: '#eff6ff',
                                                            borderRadius: '8px'
                                                        }}
                                                    >
                                                        <Edit sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                    <IconButton
                                                        size='small'
                                                        onClick={() => onDeleteItem(item, i)}
                                                        sx={{
                                                            color: '#dc2626',
                                                            bgcolor: '#fef2f2',
                                                            borderRadius: '8px'
                                                        }}
                                                    >
                                                        <Delete sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── FULL SCREEN ──────────────────────────────────────────── */}
            <FullScreenItinerary
                open={fullScreen}
                onClose={() => setFullScreen(false)}
                itineraries={currentQuoteItineraries}
                currentQuoteNo={currentQuoteNo}
                staysBreakdown={staysBreakdown}
                totalNights={totalNights}
                priceData={priceData}
                confirmedPackage={confirmedPackage}
                lastSharedQuoteNo={lastSharedQuoteNo}
                lastSharedAt={lastSharedAt}
            />
        </Box>
    )
}
