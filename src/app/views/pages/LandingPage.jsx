import React from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Container, Stack, Typography } from '@mui/material'
import {
    ArrowRight,
    ClipboardList,
    FileText,
    Layers,
    MapPinned,
    Palette,
    ReceiptIndianRupee,
    TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'
import PublicBrand from './public/PublicBrand'
import ProductPreview from './public/ProductPreview'
import { STAGES } from '../tables/leads/leadStages'
import { GREEN, GREEN_BRIGHT, GREEN_SOFT, INK, LINE, MUTED, NAVY, NAVY_BACKDROP } from './public/publicTheme'

const FEATURES = [
    {
        icon: ClipboardList,
        title: 'Leads that never go cold',
        text: 'Enquiries from email, Facebook or by hand land in one list, each with its step, its owner and its next follow-up.'
    },
    {
        icon: MapPinned,
        title: 'Quotations in minutes',
        text: 'Start from your own packages, adjust the days and hotels, price every hotel category, and send a clean quote to the guest.'
    },
    {
        icon: Layers,
        title: 'Bookings you can run',
        text: 'Hotels, transport, guest payments, supplier payments and the voucher — with a clear “what to do next” on every booking.'
    },
    {
        icon: ReceiptIndianRupee,
        title: 'GST, done properly',
        text: 'Quote with or without GST, split CGST, SGST or IGST correctly, and issue tax invoices or bills of supply.'
    },
    {
        icon: TrendingUp,
        title: 'Know your team’s numbers',
        text: 'Sales and profit for every salesperson, and incentive plans that work out what each person has earned this month.'
    },
    {
        icon: Palette,
        title: 'Your agency, your brand',
        text: 'Your own workspace with your logo and details, and roles so each person sees only what they should.'
    }
]

const START = { opacity: 0, y: 24 }
const SHOWN = { opacity: 1, y: 0 }

function Eyebrow({ children, light = false }) {
    return (
        <Typography
            sx={{
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: light ? GREEN_BRIGHT : GREEN,
                mb: 1.5
            }}
        >
            {children}
        </Typography>
    )
}

Eyebrow.propTypes = { children: PropTypes.node.isRequired, light: PropTypes.bool }

function LandingPage() {
    const navigate = useNavigate()
    const signIn = () => navigate('/login')
    const toHow = () => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#fff', color: INK, overflowX: 'hidden' }}>
            {/* Hero */}
            <Box sx={{ background: NAVY_BACKDROP, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                        pointerEvents: 'none'
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -200,
                        right: -100,
                        width: 560,
                        height: 560,
                        borderRadius: '50%',
                        background: 'rgba(70,182,83,0.16)',
                        filter: 'blur(110px)',
                        pointerEvents: 'none'
                    }}
                />
                <Container maxWidth='lg' sx={{ position: 'relative' }}>
                    <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ py: 3 }}>
                        <PublicBrand size='lg' />
                        <Button
                            onClick={signIn}
                            variant='outlined'
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                color: '#fff',
                                borderColor: 'rgba(255,255,255,0.35)',
                                borderRadius: '10px',
                                px: 2.5,
                                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' }
                            }}
                        >
                            Sign in
                        </Button>
                    </Stack>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.05fr) minmax(0, 1fr)' },
                            gap: { xs: 6, md: 8 },
                            alignItems: 'center',
                            pt: { xs: 5, md: 9 },
                            pb: { xs: 8, md: 12 }
                        }}
                    >
                        <motion.div initial={START} animate={SHOWN} transition={{ duration: 0.6 }}>
                            <Eyebrow light>Travel CRM for agencies</Eyebrow>
                            <Typography
                                component='h1'
                                sx={{
                                    fontSize: { xs: '2.4rem', md: '3.4rem' },
                                    fontWeight: 800,
                                    lineHeight: 1.08,
                                    letterSpacing: '-0.02em'
                                }}
                            >
                                From enquiry to booking, all in one place.
                            </Typography>
                            <Typography
                                sx={{
                                    mt: 3,
                                    maxWidth: 520,
                                    fontSize: { xs: '1.05rem', md: '1.2rem' },
                                    lineHeight: 1.6,
                                    color: 'rgba(255,255,255,0.74)'
                                }}
                            >
                                Leads, quotations, bookings, GST invoices and your team’s incentives — one calm
                                workspace built for how travel agencies actually work.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 5 }}>
                                <Button
                                    onClick={signIn}
                                    endIcon={<ArrowRight size={18} />}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        py: 1.5,
                                        px: 3.5,
                                        borderRadius: '10px',
                                        color: '#fff',
                                        bgcolor: GREEN,
                                        boxShadow: '0 10px 28px rgba(49,101,35,0.5)',
                                        '&:hover': { bgcolor: '#3d7a2c' }
                                    }}
                                >
                                    Sign in to your workspace
                                </Button>
                                <Button
                                    onClick={toHow}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        py: 1.5,
                                        px: 3,
                                        borderRadius: '10px',
                                        color: '#fff',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                                    }}
                                >
                                    See how it works
                                </Button>
                            </Stack>
                        </motion.div>
                        <motion.div initial={START} animate={SHOWN} transition={{ duration: 0.7, delay: 0.15 }}>
                            <ProductPreview />
                        </motion.div>
                    </Box>
                </Container>
            </Box>

            {/* The journey */}
            <Box id='how' sx={{ py: { xs: 8, md: 11 }, scrollMarginTop: 16 }}>
                <Container maxWidth='lg'>
                    <Box sx={{ maxWidth: 640, mb: 6 }}>
                        <Eyebrow>How it works</Eyebrow>
                        <Typography
                            component='h2'
                            sx={{ fontSize: { xs: '1.9rem', md: '2.5rem' }, fontWeight: 800, lineHeight: 1.15 }}
                        >
                            Every lead moves through five clear steps.
                        </Typography>
                        <Typography sx={{ mt: 2, color: MUTED, fontSize: '1.1rem', lineHeight: 1.6 }}>
                            Everyone on your team sees where each enquiry stands and what to do next — no spreadsheets,
                            no guessing.
                        </Typography>
                    </Box>
                    <Box
                        component='ol'
                        sx={{
                            listStyle: 'none',
                            m: 0,
                            p: 0,
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: 'minmax(0, 1fr)',
                                sm: 'repeat(2, minmax(0, 1fr))',
                                md: 'repeat(5, minmax(0, 1fr))'
                            },
                            gap: 2
                        }}
                    >
                        {STAGES.map(stage => (
                            <Box
                                component='li'
                                key={stage.key}
                                sx={{
                                    p: 2.5,
                                    borderRadius: '14px',
                                    border: `1px solid ${LINE}`,
                                    borderTop: `4px solid ${stage.color}`,
                                    bgcolor: '#fff'
                                }}
                            >
                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: stage.color }}>
                                    STEP {stage.step}
                                </Typography>
                                <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, mt: 0.5 }}>
                                    {stage.label}
                                </Typography>
                                <Typography sx={{ color: MUTED, fontSize: '0.92rem', mt: 1, lineHeight: 1.55 }}>
                                    {stage.explain}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* Features */}
            <Box
                sx={{
                    py: { xs: 8, md: 11 },
                    bgcolor: '#f7f9fb',
                    borderTop: `1px solid ${LINE}`,
                    borderBottom: `1px solid ${LINE}`
                }}
            >
                <Container maxWidth='lg'>
                    <Box sx={{ maxWidth: 640, mb: 6 }}>
                        <Eyebrow>What’s inside</Eyebrow>
                        <Typography
                            component='h2'
                            sx={{ fontSize: { xs: '1.9rem', md: '2.5rem' }, fontWeight: 800, lineHeight: 1.15 }}
                        >
                            Everything an agency needs, nothing it doesn’t.
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: 'minmax(0, 1fr)',
                                sm: 'repeat(2, minmax(0, 1fr))',
                                lg: 'repeat(3, minmax(0, 1fr))'
                            },
                            gap: 2.5
                        }}
                    >
                        {FEATURES.map(feature => {
                            const Icon = feature.icon
                            return (
                                <Box
                                    key={feature.title}
                                    sx={{
                                        p: 3,
                                        borderRadius: '16px',
                                        bgcolor: '#fff',
                                        border: `1px solid ${LINE}`,
                                        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                                        '&:hover': {
                                            boxShadow: '0 16px 36px rgba(18,25,38,0.08)',
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'inline-flex',
                                            p: 1.25,
                                            borderRadius: '12px',
                                            bgcolor: GREEN_SOFT,
                                            color: GREEN,
                                            mb: 2
                                        }}
                                    >
                                        <Icon size={22} />
                                    </Box>
                                    <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, mb: 1 }}>
                                        {feature.title}
                                    </Typography>
                                    <Typography sx={{ color: MUTED, lineHeight: 1.6, fontSize: '0.97rem' }}>
                                        {feature.text}
                                    </Typography>
                                </Box>
                            )
                        })}
                    </Box>
                </Container>
            </Box>

            {/* Closing call */}
            <Box sx={{ background: NAVY_BACKDROP, color: '#fff', py: { xs: 8, md: 10 }, textAlign: 'center' }}>
                <Container maxWidth='sm'>
                    <FileText size={32} color={GREEN_BRIGHT} />
                    <Typography
                        component='h2'
                        sx={{ fontSize: { xs: '1.9rem', md: '2.4rem' }, fontWeight: 800, lineHeight: 1.15, mt: 2 }}
                    >
                        Ready to run your agency from one place?
                    </Typography>
                    <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.72)', fontSize: '1.05rem' }}>
                        Sign in to your workspace and pick up where you left off.
                    </Typography>
                    <Button
                        onClick={signIn}
                        endIcon={<ArrowRight size={18} />}
                        sx={{
                            mt: 4,
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '1rem',
                            py: 1.5,
                            px: 4,
                            borderRadius: '10px',
                            color: '#fff',
                            bgcolor: GREEN,
                            '&:hover': { bgcolor: '#3d7a2c' }
                        }}
                    >
                        Sign in
                    </Button>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{ py: 4, bgcolor: NAVY }}>
                <Container maxWidth='lg'>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent='space-between'
                        alignItems='center'
                    >
                        <PublicBrand />
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                            © {new Date().getFullYear()} Travelytics.cloud. All rights reserved.
                        </Typography>
                    </Stack>
                </Container>
            </Box>
        </Box>
    )
}

export default LandingPage
