/* eslint-disable react/button-has-type */
import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// MUI Components
import { Box, Button, Container, Typography, Grid, AppBar, Toolbar, Paper, useTheme, Chip } from '@mui/material'

// Icons
import { BarChart2, Map, Mail, CheckCircle, ChevronRight, Globe, Zap, Users, Star, ArrowRight } from 'lucide-react'
import { motion, useInView } from 'framer-motion'

// Floating animated orb component
function FloatingOrb({ size, color, top, left, right, bottom, delay = 0 }) {
    return (
        <motion.div
            animate={{
                y: [0, -30, 0],
                x: [0, 15, 0],
                scale: [1, 1.05, 1]
            }}
            transition={{
                duration: 8 + delay,
                repeat: Infinity,
                ease: 'easeInOut',
                delay
            }}
            style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: '50%',
                background: color,
                top,
                left,
                right,
                bottom,
                filter: 'blur(60px)',
                pointerEvents: 'none',
                zIndex: 0
            }}
        />
    )
}

// Animated counter
function AnimatedStat({ value, label }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center' }}
        >
            <Typography
                variant='h3'
                sx={{
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: '"Syne", sans-serif',
                    fontSize: { xs: '2rem', md: '2.8rem' }
                }}
            >
                {value}
            </Typography>
            <Typography variant='body2' sx={{ color: '#64748b', fontWeight: 600, mt: 0.5, letterSpacing: '0.05em' }}>
                {label}
            </Typography>
        </motion.div>
    )
}

function LandingPage() {
    const navigate = useNavigate()
    const theme = useTheme()

    const handleLoginRedirect = () => {
        navigate('/login')
    }

    const features = [
        {
            title: 'Dynamic Itineraries',
            desc: 'Build multi-day trip plans with stunning descriptions, curated hotel selections, and day-by-day activities — all in minutes.',
            icon: <Map size={22} />,
            color: '#2563eb',
            bg: 'linear-gradient(135deg, #dbeafe, #ede9fe)',
            accent: '#2563eb'
        },
        {
            title: 'One-Click Sharing',
            desc: 'Instantly email beautifully formatted quotations to guests. Your brand, your style — delivered instantly.',
            icon: <Mail size={22} />,
            color: '#059669',
            bg: 'linear-gradient(135deg, #d1fae5, #cffafe)',
            accent: '#059669'
        },
        {
            title: 'Smart Conversions',
            desc: 'Finalize pricing and convert hot leads into confirmed bookings with precision tools built for closing deals fast.',
            icon: <CheckCircle size={22} />,
            color: '#d97706',
            bg: 'linear-gradient(135deg, #fef3c7, #fee2e2)',
            accent: '#d97706'
        }
    ]

    const testimonials = [
        {
            name: 'Priya Sharma',
            role: 'Director, WanderLux Travels',
            text: 'Travelytics cut our quotation time from 2 hours to 10 minutes. Our clients love the professional output.',
            rating: 5
        },
        {
            name: 'Rahul Mehta',
            role: 'Founder, Himalayan Routes',
            text: 'The itinerary builder is spectacular. We closed 40% more leads in the first month.',
            rating: 5
        },
        {
            name: 'Sunita Patel',
            role: 'Operations Head, Globe Trotters',
            text: 'Finally a CRM built for travel agencies. Everything just makes sense — it fits our workflow perfectly.',
            rating: 5
        }
    ]

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#fafbff',
                fontFamily: '"DM Sans", sans-serif',
                overflowX: 'hidden'
            }}
        >
            {/* Google Fonts */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
            `}</style>

            {/* ─── NAVBAR ─────────────────────────────── */}
            <AppBar
                position='sticky'
                elevation={0}
                sx={{
                    bgcolor: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(226,232,240,0.8)',
                    zIndex: 100
                }}
            >
                <Container maxWidth='lg'>
                    <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                    p: 1,
                                    borderRadius: 2,
                                    display: 'flex',
                                    boxShadow: '0 4px 12px rgba(37,99,235,0.35)'
                                }}
                            >
                                <BarChart2 color='white' size={22} />
                            </Box>
                            <Typography
                                variant='h5'
                                sx={{
                                    fontWeight: 900,
                                    color: '#0f172a',
                                    letterSpacing: '-0.5px',
                                    fontFamily: '"Syne", sans-serif'
                                }}
                            >
                                Travelytics
                                <Box component='span' sx={{ color: '#2563eb' }}>
                                    .cloud
                                </Box>
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Button
                                onClick={handleLoginRedirect}
                                sx={{
                                    color: '#475569',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    fontFamily: '"DM Sans", sans-serif',
                                    display: { xs: 'none', sm: 'flex' }
                                }}
                            >
                                Sign In
                            </Button>
                            <Button
                                variant='contained'
                                onClick={handleLoginRedirect}
                                endIcon={<ArrowRight size={16} />}
                                sx={{
                                    borderRadius: '50px',
                                    px: 3,
                                    py: 1,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    fontFamily: '"DM Sans", sans-serif',
                                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                    boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                                    '&:hover': {
                                        boxShadow: '0 6px 20px rgba(37,99,235,0.45)',
                                        transform: 'translateY(-1px)'
                                    },
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Get Started
                            </Button>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* ─── HERO ────────────────────────────────── */}
            <Box sx={{ position: 'relative', overflow: 'hidden', pt: { xs: 8, md: 6 }, pb: { xs: 8, md: 4 } }}>
                {/* Background orbs */}
                <FloatingOrb size={500} color='rgba(37,99,235,0.12)' top='-100px' left='-100px' delay={0} />
                <FloatingOrb size={400} color='rgba(124,58,237,0.1)' top='50px' right='-80px' delay={2} />
                <FloatingOrb size={300} color='rgba(5,150,105,0.08)' bottom='-50px' left='30%' delay={4} />

                {/* Dot grid background */}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                        opacity: 0.4,
                        zIndex: 0
                    }}
                />

                <Container maxWidth='lg' sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid container spacing={6} alignItems='center' sx={{ minHeight: { md: '85vh' } }}>
                        <Grid item xs={12} md={6}>
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                            >
                                <Chip
                                    icon={<Zap size={14} />}
                                    label='Built for Travel Agencies'
                                    sx={{
                                        mb: 3,
                                        bgcolor: '#ede9fe',
                                        color: '#7c3aed',
                                        fontWeight: 700,
                                        fontFamily: '"DM Sans", sans-serif',
                                        fontSize: '0.8rem',
                                        '& .MuiChip-icon': { color: '#7c3aed' }
                                    }}
                                />

                                <Typography
                                    variant='h1'
                                    sx={{
                                        fontWeight: 900,
                                        color: '#0f172a',
                                        lineHeight: 1.05,
                                        mb: 3,
                                        fontFamily: '"Syne", sans-serif',
                                        fontSize: { xs: '2.8rem', md: '4.2rem' },
                                        letterSpacing: '-2px'
                                    }}
                                >
                                    The smartest{' '}
                                    <Box
                                        component='span'
                                        sx={{
                                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent'
                                        }}
                                    >
                                        Travel CRM
                                    </Box>{' '}
                                    for modern agencies.
                                </Typography>

                                <Typography
                                    variant='h6'
                                    sx={{
                                        color: '#64748b',
                                        mb: 5,
                                        lineHeight: 1.7,
                                        fontWeight: 400,
                                        fontFamily: '"DM Sans", sans-serif',
                                        fontSize: '1.1rem',
                                        maxWidth: '480px'
                                    }}
                                >
                                    Manage leads, craft stunning itineraries, and convert quotations into confirmed
                                    bookings — all from one elegant platform.
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 6 }}>
                                    <Button
                                        variant='contained'
                                        size='large'
                                        onClick={handleLoginRedirect}
                                        endIcon={<ChevronRight size={20} />}
                                        sx={{
                                            borderRadius: '14px',
                                            px: 5,
                                            py: 1.8,
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            fontFamily: '"DM Sans", sans-serif',
                                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                            boxShadow: '0 12px 28px rgba(37,99,235,0.35)',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 16px 35px rgba(37,99,235,0.45)'
                                            },
                                            transition: 'all 0.25s ease'
                                        }}
                                    >
                                        Start Free Today
                                    </Button>
                                    <Button
                                        variant='outlined'
                                        size='large'
                                        onClick={handleLoginRedirect}
                                        sx={{
                                            borderRadius: '14px',
                                            px: 4,
                                            py: 1.8,
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            fontFamily: '"DM Sans", sans-serif',
                                            borderColor: '#cbd5e1',
                                            color: '#475569',
                                            '&:hover': {
                                                borderColor: '#2563eb',
                                                color: '#2563eb',
                                                bgcolor: '#eff6ff'
                                            }
                                        }}
                                    >
                                        View Demo
                                    </Button>
                                </Box>

                                {/* Trust badges */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {[...Array(5)].map((_, idx) => (
                                            <Star key={Math.random()} size={16} fill='#f59e0b' color='#f59e0b' />
                                        ))}
                                    </Box>
                                    <Typography variant='body2' sx={{ color: '#64748b', fontWeight: 500 }}>
                                        Trusted by <strong style={{ color: '#0f172a' }}>500+</strong> travel agencies
                                    </Typography>
                                </Box>
                            </motion.div>
                        </Grid>

                        <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92, x: 30 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                            >
                                <Box sx={{ position: 'relative' }}>
                                    {/* Main image */}
                                    <Box
                                        component='img'
                                        src='https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1000'
                                        sx={{
                                            width: '100%',
                                            borderRadius: '28px',
                                            boxShadow: '0 30px 60px -12px rgba(0,0,0,0.2)',
                                            border: '6px solid white',
                                            display: 'block'
                                        }}
                                        alt='Travel destination'
                                    />

                                    {/* Floating stat card */}
                                    <motion.div
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                        style={{ position: 'absolute', bottom: -20, left: -30 }}
                                    >
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2.5,
                                                borderRadius: 4,
                                                bgcolor: 'white',
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                                                border: '1px solid #f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                minWidth: 200
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    bgcolor: '#dbeafe',
                                                    p: 1.5,
                                                    borderRadius: 3,
                                                    display: 'flex'
                                                }}
                                            >
                                                <Globe size={20} color='#2563eb' />
                                            </Box>
                                            <Box>
                                                <Typography
                                                    variant='h6'
                                                    sx={{
                                                        fontWeight: 800,
                                                        color: '#0f172a',
                                                        fontFamily: '"Syne", sans-serif',
                                                        lineHeight: 1
                                                    }}
                                                >
                                                    2,400+
                                                </Typography>
                                                <Typography
                                                    variant='caption'
                                                    sx={{ color: '#64748b', fontWeight: 500 }}
                                                >
                                                    Itineraries created
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </motion.div>

                                    {/* Floating badge top right */}
                                    <motion.div
                                        animate={{ y: [0, 8, 0] }}
                                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                                        style={{ position: 'absolute', top: -16, right: -20 }}
                                    >
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 3,
                                                bgcolor: 'white',
                                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                                border: '1px solid #f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5
                                            }}
                                        >
                                            <Box sx={{ bgcolor: '#d1fae5', p: 1, borderRadius: 2, display: 'flex' }}>
                                                <CheckCircle size={18} color='#059669' />
                                            </Box>
                                            <Box>
                                                <Typography
                                                    variant='body2'
                                                    sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1 }}
                                                >
                                                    Booking confirmed
                                                </Typography>
                                                <Typography variant='caption' sx={{ color: '#64748b' }}>
                                                    Just now
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </motion.div>
                                </Box>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* ─── STATS BAR ───────────────────────────── */}
            <Box sx={{ bgcolor: 'white', borderY: '1px solid #e2e8f0', py: 6 }}>
                <Container maxWidth='md'>
                    <Grid container spacing={4} justifyContent='center'>
                        <Grid item xs={6} md={3}>
                            <AnimatedStat value='500+' label='ACTIVE AGENCIES' />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <AnimatedStat value='2,400+' label='ITINERARIES BUILT' />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <AnimatedStat value='98%' label='CLIENT SATISFACTION' />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <AnimatedStat value='10x' label='FASTER QUOTING' />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* ─── FEATURES ────────────────────────────── */}
            <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: '#fafbff' }}>
                <Container maxWidth='lg'>
                    <Box sx={{ textAlign: 'center', mb: 10 }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <Chip
                                icon={<Zap size={14} />}
                                label='Everything you need'
                                sx={{
                                    mb: 2,
                                    bgcolor: '#ede9fe',
                                    color: '#7c3aed',
                                    fontWeight: 700,
                                    fontFamily: '"DM Sans", sans-serif',
                                    '& .MuiChip-icon': { color: '#7c3aed' }
                                }}
                            />
                            <Typography
                                variant='h3'
                                sx={{
                                    fontWeight: 900,
                                    mb: 2,
                                    color: '#0f172a',
                                    fontFamily: '"Syne", sans-serif',
                                    fontSize: { xs: '2rem', md: '3rem' },
                                    letterSpacing: '-1px'
                                }}
                            >
                                Powerful actions, zero friction
                            </Typography>
                            <Typography
                                variant='body1'
                                sx={{
                                    color: '#64748b',
                                    maxWidth: '520px',
                                    mx: 'auto',
                                    lineHeight: 1.8,
                                    fontFamily: '"DM Sans", sans-serif'
                                }}
                            >
                                Streamline your entire workflow from the first inquiry to the final booking
                                confirmation.
                            </Typography>
                        </motion.div>
                    </Box>

                    <Grid container spacing={4}>
                        {features.map((f, i) => (
                            <Grid item xs={12} md={4} key={f.title}>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.12 }}
                                >
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 5,
                                            borderRadius: '24px',
                                            bgcolor: 'white',
                                            border: '1px solid #e2e8f0',
                                            transition: 'all 0.3s ease',
                                            cursor: 'default',
                                            height: '100%',
                                            '&:hover': {
                                                borderColor: f.accent,
                                                transform: 'translateY(-8px)',
                                                boxShadow: `0 20px 40px rgba(0,0,0,0.08), 0 0 0 1px ${f.accent}33`
                                            }
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                background: f.bg,
                                                color: f.color,
                                                width: 52,
                                                height: 52,
                                                borderRadius: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mb: 3
                                            }}
                                        >
                                            {f.icon}
                                        </Box>
                                        <Typography
                                            variant='h5'
                                            sx={{
                                                fontWeight: 800,
                                                mb: 2,
                                                color: '#0f172a',
                                                fontFamily: '"Syne", sans-serif',
                                                fontSize: '1.25rem'
                                            }}
                                        >
                                            {f.title}
                                        </Typography>
                                        <Typography
                                            variant='body1'
                                            sx={{
                                                color: '#64748b',
                                                lineHeight: 1.8,
                                                fontFamily: '"DM Sans", sans-serif'
                                            }}
                                        >
                                            {f.desc}
                                        </Typography>
                                    </Paper>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ─── TESTIMONIALS ────────────────────────── */}
            <Box sx={{ bgcolor: 'white', py: { xs: 10, md: 14 }, borderY: '1px solid #e2e8f0' }}>
                <Container maxWidth='lg'>
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Chip
                            icon={<Users size={14} />}
                            label='Customer stories'
                            sx={{
                                mb: 2,
                                bgcolor: '#d1fae5',
                                color: '#059669',
                                fontWeight: 700,
                                fontFamily: '"DM Sans", sans-serif',
                                '& .MuiChip-icon': { color: '#059669' }
                            }}
                        />
                        <Typography
                            variant='h3'
                            sx={{
                                fontWeight: 900,
                                color: '#0f172a',
                                fontFamily: '"Syne", sans-serif',
                                fontSize: { xs: '2rem', md: '2.8rem' },
                                letterSpacing: '-1px'
                            }}
                        >
                            Agencies love Travelytics
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        {testimonials.map((t, i) => (
                            <Grid item xs={12} md={4} key={t.name}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    style={{ height: '100%' }}
                                >
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 4,
                                            borderRadius: '20px',
                                            border: '1px solid #e2e8f0',
                                            bgcolor: '#fafbff',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 3
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {[...Array(t.rating)].map((_, idx) => (
                                                <Star key={Math.random()} size={16} fill='#f59e0b' color='#f59e0b' />
                                            ))}
                                        </Box>
                                        <Typography
                                            variant='body1'
                                            sx={{
                                                color: '#334155',
                                                lineHeight: 1.8,
                                                fontFamily: '"DM Sans", sans-serif',
                                                flexGrow: 1,
                                                fontSize: '0.98rem'
                                            }}
                                        >
                                            &ldquo;{t.text}&rdquo;
                                        </Typography>
                                        <Box>
                                            <Typography
                                                variant='body2'
                                                sx={{
                                                    fontWeight: 700,
                                                    color: '#0f172a',
                                                    fontFamily: '"Syne", sans-serif'
                                                }}
                                            >
                                                {t.name}
                                            </Typography>
                                            <Typography variant='caption' sx={{ color: '#94a3b8', fontWeight: 500 }}>
                                                {t.role}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ─── CTA ─────────────────────────────────── */}
            <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: '#fafbff' }}>
                <Container maxWidth='md'>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <Box
                            sx={{
                                background: 'linear-gradient(135deg, #1e3a8a 0%, #4c1d95 100%)',
                                borderRadius: '32px',
                                py: { xs: 8, md: 11 },
                                px: { xs: 4, md: 8 },
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 30px 60px rgba(30,58,138,0.35)'
                            }}
                        >
                            {/* Decorative elements */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -80,
                                    right: -80,
                                    width: 280,
                                    height: 280,
                                    bgcolor: 'rgba(255,255,255,0.06)',
                                    borderRadius: '50%'
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: -60,
                                    left: -60,
                                    width: 200,
                                    height: 200,
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    borderRadius: '50%'
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: -40,
                                    transform: 'translateY(-50%)',
                                    width: 120,
                                    height: 120,
                                    bgcolor: 'rgba(124,58,237,0.4)',
                                    borderRadius: '50%',
                                    filter: 'blur(40px)'
                                }}
                            />

                            <Box sx={{ position: 'relative', zIndex: 1 }}>
                                <Typography
                                    variant='h3'
                                    sx={{
                                        color: 'white',
                                        fontWeight: 900,
                                        mb: 2,
                                        fontFamily: '"Syne", sans-serif',
                                        fontSize: { xs: '1.8rem', md: '2.8rem' },
                                        letterSpacing: '-1px',
                                        lineHeight: 1.15
                                    }}
                                >
                                    Ready to transform your travel business?
                                </Typography>
                                <Typography
                                    variant='body1'
                                    sx={{
                                        color: 'rgba(255,255,255,0.7)',
                                        mb: 5,
                                        fontFamily: '"DM Sans", sans-serif',
                                        fontSize: '1.1rem',
                                        maxWidth: '500px',
                                        mx: 'auto',
                                        lineHeight: 1.7
                                    }}
                                >
                                    Join 500+ agencies already using Travelytics to close more deals, faster.
                                </Typography>
                                <Button
                                    variant='contained'
                                    size='large'
                                    onClick={handleLoginRedirect}
                                    endIcon={<ArrowRight size={18} />}
                                    sx={{
                                        bgcolor: 'white',
                                        color: '#1e3a8a',
                                        px: 6,
                                        py: 2,
                                        borderRadius: '14px',
                                        fontSize: '1.05rem',
                                        fontWeight: 800,
                                        fontFamily: '"DM Sans", sans-serif',
                                        textTransform: 'none',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                        '&:hover': {
                                            bgcolor: '#f1f5f9',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 12px 30px rgba(0,0,0,0.25)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Login to Travelytics
                                </Button>
                            </Box>
                        </Box>
                    </motion.div>
                </Container>
            </Box>

            {/* ─── FOOTER ──────────────────────────────── */}
            <Box
                component='footer'
                sx={{
                    py: 5,
                    textAlign: 'center',
                    borderTop: '1px solid #e2e8f0',
                    bgcolor: 'white'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            p: 0.75,
                            borderRadius: 1.5,
                            display: 'flex'
                        }}
                    >
                        <BarChart2 color='white' size={16} />
                    </Box>
                    <Typography
                        variant='body1'
                        sx={{ fontWeight: 800, color: '#0f172a', fontFamily: '"Syne", sans-serif' }}
                    >
                        Travelytics<span style={{ color: '#2563eb' }}>.cloud</span>
                    </Typography>
                </Box>
                <Typography variant='body2' sx={{ color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>
                    © 2026 Travelytics.cloud. All rights reserved.
                </Typography>
            </Box>
        </Box>
    )
}

export default LandingPage
