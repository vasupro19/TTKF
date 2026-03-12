/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-unstable-nested-components */
import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Grid, Paper, Chip, Avatar, LinearProgress, Divider, IconButton, Tooltip } from '@mui/material'
import {
    TrendingUp,
    TrendingDown,
    People,
    ConfirmationNumber,
    CurrencyRupee,
    Send,
    Hotel,
    DirectionsCar,
    ArrowForward,
    MoreVert,
    Circle
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'

// ─── Mock data (replace with real API calls) ────────────────────────────────
const monthlyLeads = [
    { month: 'Oct', leads: 28, confirmed: 12, revenue: 420000 },
    { month: 'Nov', leads: 35, confirmed: 18, revenue: 610000 },
    { month: 'Dec', leads: 52, confirmed: 28, revenue: 890000 },
    { month: 'Jan', leads: 41, confirmed: 22, revenue: 720000 },
    { month: 'Feb', leads: 38, confirmed: 19, revenue: 580000 },
    { month: 'Mar', leads: 63, confirmed: 34, revenue: 1050000 }
]

const packageBreakdown = [
    { name: 'Deluxe', value: 38, color: '#64748b' },
    { name: 'Super Deluxe', value: 29, color: '#1d4ed8' },
    { name: 'Luxury', value: 22, color: '#7c3aed' },
    { name: 'Premium', value: 11, color: '#b45309' }
]

const topDestinations = [
    { name: 'Manali', bookings: 34, revenue: 890000, pct: 85 },
    { name: 'Shimla', bookings: 28, revenue: 620000, pct: 70 },
    { name: 'Spiti Valley', bookings: 19, revenue: 540000, pct: 55 },
    { name: 'Kasol', bookings: 15, revenue: 310000, pct: 40 },
    { name: 'Dharamshala', bookings: 12, revenue: 280000, pct: 32 }
]

const recentLeads = [
    { name: 'Priya Sharma', destination: 'Manali', status: 'Hot', package: 'Luxury', date: 'Today', amount: 85000 },
    { name: 'Rahul Mehta', destination: 'Shimla', status: 'Warm', package: 'Deluxe', date: 'Today', amount: 42000 },
    {
        name: 'Sunita Patel',
        destination: 'Spiti',
        status: 'Confirmed',
        package: 'Premium',
        date: 'Yesterday',
        amount: 120000
    },
    {
        name: 'Arjun Singh',
        destination: 'Kasol',
        status: 'Cold',
        package: 'Super Deluxe',
        date: 'Yesterday',
        amount: 58000
    },
    {
        name: 'Meera Joshi',
        destination: 'Dharamshala',
        status: 'Hot',
        package: 'Luxury',
        date: '2 days ago',
        amount: 92000
    }
]

const STATUS_COLORS = {
    Hot: { bg: '#fef2f2', color: '#dc2626', dot: '#dc2626' },
    Warm: { bg: '#fff7ed', color: '#ea580c', dot: '#ea580c' },
    Cold: { bg: '#eff6ff', color: '#2563eb', dot: '#2563eb' },
    Confirmed: { bg: '#f0fdf4', color: '#16a34a', dot: '#16a34a' }
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ end, prefix = '', suffix = '', duration = 1500 }) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        let start = 0
        const step = end / (duration / 16)
        const timer = setInterval(() => {
            start += step
            if (start >= end) {
                setCount(end)
                clearInterval(timer)
            } else setCount(Math.floor(start))
        }, 16)
        return () => clearInterval(timer)
    }, [end, duration])
    return (
        <>
            {prefix}
            {count.toLocaleString('en-IN')}
            {suffix}
        </>
    )
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, prefix, suffix, trend, trendVal, color, bg, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.45 }}
            style={{ height: '100%' }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: '20px',
                    height: '100%',
                    border: '1px solid #e2e8f0',
                    bgcolor: 'white',
                    transition: 'all 0.25s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '14px',
                            bgcolor: bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
                    </Box>
                    <Chip
                        icon={
                            trend === 'up' ? (
                                <TrendingUp sx={{ fontSize: '14px !important' }} />
                            ) : (
                                <TrendingDown sx={{ fontSize: '14px !important' }} />
                            )
                        }
                        label={trendVal}
                        size='small'
                        sx={{
                            bgcolor: trend === 'up' ? '#f0fdf4' : '#fef2f2',
                            color: trend === 'up' ? '#16a34a' : '#dc2626',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            '& .MuiChip-icon': { color: trend === 'up' ? '#16a34a' : '#dc2626' }
                        }}
                    />
                </Box>
                <Typography
                    sx={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        mb: 0.5
                    }}
                >
                    {label}
                </Typography>
                <Typography
                    sx={{ fontWeight: 900, fontSize: '2rem', color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}
                >
                    <Counter end={value} prefix={prefix} suffix={suffix} />
                </Typography>
            </Paper>
        </motion.div>
    )
}

// ─── Custom tooltip for recharts ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
        <Box
            sx={{
                bgcolor: '#1c2d45',
                color: 'white',
                px: 2,
                py: 1.5,
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                fontSize: '0.82rem'
            }}
        >
            <Typography sx={{ fontWeight: 800, color: 'white', mb: 0.5, fontSize: '0.82rem' }}>{label}</Typography>
            {payload.map((p, i) => (
                <Box key={Math.random()} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>
                        {p.name}:{' '}
                        <strong style={{ color: 'white' }}>
                            {p.name === 'revenue' ? `₹${(p.value / 100000).toFixed(1)}L` : p.value}
                        </strong>
                    </Typography>
                </Box>
            ))}
        </Box>
    )
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
function Home() {
    const greeting = () => {
        const h = new Date().getHours()
        if (h < 12) return 'Good morning'
        if (h < 17) return 'Good afternoon'
        return 'Good evening'
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8faff', minHeight: '100vh' }}>
            {/* ── GREETING ─────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Box
                    sx={{
                        mb: 4,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 2
                    }}
                >
                    <Box>
                        <Typography
                            sx={{
                                fontWeight: 900,
                                fontSize: { xs: '1.5rem', md: '1.9rem' },
                                color: '#0f172a',
                                letterSpacing: '-0.5px',
                                lineHeight: 1.1
                            }}
                        >
                            {greeting()}, Team 👋
                        </Typography>
                        <Typography sx={{ color: '#64748b', mt: 0.5, fontSize: '0.9rem' }}>
                            Here is what happening with your travel business today.
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            px: 2.5,
                            py: 1.2,
                            borderRadius: '12px',
                            bgcolor: '#1c2d45',
                            color: 'white',
                            fontSize: '0.82rem',
                            fontWeight: 700
                        }}
                    >
                        📅{' '}
                        {new Date().toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </Box>
                </Box>
            </motion.div>

            {/* ── STAT CARDS ───────────────────────────────────────── */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                {[
                    {
                        icon: <People />,
                        label: 'Total Leads',
                        value: 247,
                        trend: 'up',
                        trendVal: '+12% this month',
                        color: '#1d4ed8',
                        bg: '#eff6ff',
                        delay: 0
                    },
                    {
                        icon: <ConfirmationNumber />,
                        label: 'Confirmed Bookings',
                        value: 133,
                        trend: 'up',
                        trendVal: '+8% this month',
                        color: '#16a34a',
                        bg: '#f0fdf4',
                        delay: 0.08
                    },
                    {
                        icon: <CurrencyRupee />,
                        label: 'Total Revenue',
                        value: 4270000,
                        prefix: '₹',
                        trend: 'up',
                        trendVal: '+18% this month',
                        color: '#b45309',
                        bg: '#fffbeb',
                        delay: 0.16
                    },
                    {
                        icon: <Send />,
                        label: 'Quotes Sent',
                        value: 189,
                        trend: 'down',
                        trendVal: '-3% this month',
                        color: '#7c3aed',
                        bg: '#f5f3ff',
                        delay: 0.24
                    }
                ].map((card, i) => (
                    <Grid item xs={6} md={3} key={Math.random()}>
                        <StatCard {...card} />
                    </Grid>
                ))}
            </Grid>

            {/* ── CHARTS ROW ───────────────────────────────────────── */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                {/* Area chart — leads over time */}
                <Grid item xs={12} md={8}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.45 }}
                    >
                        <Paper
                            elevation={0}
                            sx={{ p: 3, borderRadius: '20px', border: '1px solid #e2e8f0', height: '100%' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                <Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                                        Leads & Conversions
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', mt: 0.3 }}>
                                        Last 6 months performance
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    {[
                                        { label: 'Leads', color: '#1d4ed8' },
                                        { label: 'Confirmed', color: '#39B54A' }
                                    ].map(l => (
                                        <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                            <Box
                                                sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: l.color }}
                                            />
                                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                                {l.label}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                            <ResponsiveContainer width='100%' height={240}>
                                <AreaChart data={monthlyLeads} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id='leadsGrad' x1='0' y1='0' x2='0' y2='1'>
                                            <stop offset='5%' stopColor='#1d4ed8' stopOpacity={0.15} />
                                            <stop offset='95%' stopColor='#1d4ed8' stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id='confirmedGrad' x1='0' y1='0' x2='0' y2='1'>
                                            <stop offset='5%' stopColor='#39B54A' stopOpacity={0.15} />
                                            <stop offset='95%' stopColor='#39B54A' stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
                                    <XAxis
                                        dataKey='month'
                                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <ReTooltip content={<CustomTooltip />} />
                                    <Area
                                        type='monotone'
                                        dataKey='leads'
                                        name='leads'
                                        stroke='#1d4ed8'
                                        strokeWidth={2.5}
                                        fill='url(#leadsGrad)'
                                        dot={{ r: 4, fill: '#1d4ed8', strokeWidth: 0 }}
                                    />
                                    <Area
                                        type='monotone'
                                        dataKey='confirmed'
                                        name='confirmed'
                                        stroke='#39B54A'
                                        strokeWidth={2.5}
                                        fill='url(#confirmedGrad)'
                                        dot={{ r: 4, fill: '#39B54A', strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Pie chart — package breakdown */}
                <Grid item xs={12} md={4}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.38, duration: 0.45 }}
                    >
                        <Paper
                            elevation={0}
                            sx={{ p: 3, borderRadius: '20px', border: '1px solid #e2e8f0', height: '100%' }}
                        >
                            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', mb: 0.5 }}>
                                Package Split
                            </Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', mb: 2 }}>
                                Bookings by category
                            </Typography>
                            <ResponsiveContainer width='100%' height={180}>
                                <PieChart>
                                    <Pie
                                        data={packageBreakdown}
                                        cx='50%'
                                        cy='50%'
                                        innerRadius={52}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey='value'
                                    >
                                        {packageBreakdown.map((entry, i) => (
                                            <Cell key={Math.random()} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <ReTooltip
                                        content={({ active, payload }) =>
                                            active && payload?.length ? (
                                                <Box
                                                    sx={{
                                                        bgcolor: '#1c2d45',
                                                        color: 'white',
                                                        px: 2,
                                                        py: 1,
                                                        borderRadius: '10px',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    <strong>{payload[0].name}</strong>: {payload[0].value}%
                                                </Box>
                                            ) : null
                                        }
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                {packageBreakdown.map(p => (
                                    <Box
                                        key={p.name}
                                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: p.color }}
                                            />
                                            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                                                {p.name}
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                                            {p.value}%
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>

            {/* ── BOTTOM ROW ───────────────────────────────────────── */}
            <Grid container spacing={2.5}>
                {/* Revenue bar chart */}
                <Grid item xs={12} md={5}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, duration: 0.45 }}
                    >
                        <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', mb: 0.5 }}>
                                Monthly Revenue
                            </Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', mb: 2.5 }}>
                                In lakhs (₹)
                            </Typography>
                            <ResponsiveContainer width='100%' height={200}>
                                <BarChart data={monthlyLeads} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' vertical={false} />
                                    <XAxis
                                        dataKey='month'
                                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={v => `${(v / 100000).toFixed(0)}L`}
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <ReTooltip content={<CustomTooltip />} />
                                    <Bar dataKey='revenue' name='revenue' fill='#1c2d45' radius={[6, 6, 0, 0]}>
                                        {monthlyLeads.map((_, i) => (
                                            <Cell
                                                key={Math.random()}
                                                fill={i === monthlyLeads.length - 1 ? '#39B54A' : '#1c2d45'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Top destinations */}
                <Grid item xs={12} md={3}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.52, duration: 0.45 }}
                    >
                        <Paper
                            elevation={0}
                            sx={{ p: 3, borderRadius: '20px', border: '1px solid #e2e8f0', height: '100%' }}
                        >
                            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', mb: 0.5 }}>
                                Top Destinations
                            </Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', mb: 2.5 }}>
                                By bookings this month
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {topDestinations.map((dest, i) => (
                                    <Box key={dest.name}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography
                                                    sx={{
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: '6px',
                                                        bgcolor: i === 0 ? '#fef3c7' : '#f1f5f9',
                                                        color: i === 0 ? '#b45309' : '#64748b',
                                                        fontSize: '0.68rem',
                                                        fontWeight: 900,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    {i + 1}
                                                </Typography>
                                                <Typography
                                                    sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}
                                                >
                                                    {dest.name}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
                                                {dest.bookings}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant='determinate'
                                            value={dest.pct}
                                            sx={{
                                                height: 6,
                                                borderRadius: '10px',
                                                bgcolor: '#f1f5f9',
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: '10px',
                                                    bgcolor: i === 0 ? '#39B54A' : i === 1 ? '#1d4ed8' : '#7c3aed'
                                                }
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Recent leads */}
                <Grid item xs={12} md={4}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.58, duration: 0.45 }}
                    >
                        <Paper
                            elevation={0}
                            sx={{ p: 3, borderRadius: '20px', border: '1px solid #e2e8f0', height: '100%' }}
                        >
                            <Box
                                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}
                            >
                                <Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                                        Recent Leads
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', mt: 0.2 }}>
                                        Latest inquiries
                                    </Typography>
                                </Box>
                                <Tooltip title='View all leads'>
                                    <IconButton size='small' sx={{ bgcolor: '#f1f5f9', borderRadius: '8px' }}>
                                        <ArrowForward sx={{ fontSize: 16, color: '#64748b' }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                {recentLeads.map((lead, i) => (
                                    <Box key={Math.random()}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                py: 1.5,
                                                transition: 'all 0.15s',
                                                cursor: 'pointer',
                                                borderRadius: '10px',
                                                px: 1,
                                                '&:hover': { bgcolor: '#f8faff' }
                                            }}
                                        >
                                            <Avatar
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    bgcolor: '#1c2d45',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 800,
                                                    flexShrink: 0
                                                }}
                                            >
                                                {lead.name
                                                    .split(' ')
                                                    .map(n => n[0])
                                                    .join('')}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between'
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: '0.83rem',
                                                            color: '#0f172a',
                                                            noWrap: true
                                                        }}
                                                    >
                                                        {lead.name}
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            fontSize: '0.72rem',
                                                            color: '#94a3b8',
                                                            flexShrink: 0,
                                                            ml: 1
                                                        }}
                                                    >
                                                        {lead.date}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                                                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                                                        📍 {lead.destination}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.4,
                                                            px: 1,
                                                            py: 0.2,
                                                            borderRadius: '6px',
                                                            bgcolor: STATUS_COLORS[lead.status]?.bg
                                                        }}
                                                    >
                                                        <Circle
                                                            sx={{
                                                                fontSize: '7px',
                                                                color: STATUS_COLORS[lead.status]?.dot
                                                            }}
                                                        />
                                                        <Typography
                                                            sx={{
                                                                fontSize: '0.68rem',
                                                                fontWeight: 700,
                                                                color: STATUS_COLORS[lead.status]?.color
                                                            }}
                                                        >
                                                            {lead.status}
                                                        </Typography>
                                                    </Box>
                                                    <Typography
                                                        sx={{
                                                            fontSize: '0.72rem',
                                                            color: '#39B54A',
                                                            fontWeight: 700,
                                                            ml: 'auto'
                                                        }}
                                                    >
                                                        ₹{(lead.amount / 1000).toFixed(0)}K
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                        {i < recentLeads.length - 1 && <Divider sx={{ borderColor: '#f1f5f9' }} />}
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>
        </Box>
    )
}

export default Home
