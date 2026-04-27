/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Grid, Paper, Chip, Avatar, LinearProgress, Divider, IconButton, Tooltip, Alert } from '@mui/material'
import {
    TrendingUp,
    TrendingDown,
    People,
    ConfirmationNumber,
    CurrencyRupee,
    FlagCircle,
    ArrowForward,
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
    Cell
} from 'recharts'
import { useSelector } from 'react-redux'

import { useGetLeadsQuery } from '@/app/store/slices/api/leadSlice'
import { useGetCampaignsQuery } from '@/app/store/slices/api/campaignSlice'
import { useGetAllConfirmedPackagesQuery } from '@/app/store/slices/api/packageConvert'

const LEADS_QUERY = '?start=0&length=1000'
const PACKAGES_QUERY = '?start=0&length=1000'
const CAMPAIGNS_QUERY = '?start=0&length=500'
const PACKAGE_COLORS = ['#64748b', '#1d4ed8', '#7c3aed', '#b45309', '#16a34a', '#ea580c']

const STATUS_COLORS = {
    Hot: { bg: '#fef2f2', color: '#dc2626', dot: '#dc2626' },
    Warm: { bg: '#fff7ed', color: '#ea580c', dot: '#ea580c' },
    Cold: { bg: '#eff6ff', color: '#2563eb', dot: '#2563eb' },
    Confirmed: { bg: '#f0fdf4', color: '#16a34a', dot: '#16a34a' },
    verified: { bg: '#f0fdf4', color: '#16a34a', dot: '#16a34a' },
    Verified: { bg: '#f0fdf4', color: '#16a34a', dot: '#16a34a' },
    Pending: { bg: '#f8fafc', color: '#64748b', dot: '#64748b' }
}

const toNumber = value => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

const isValidDate = value => {
    if (!value) return false
    const date = new Date(value)
    return !Number.isNaN(date.getTime())
}

const startOfMonth = date => new Date(date.getFullYear(), date.getMonth(), 1)

const getMonthLabel = date =>
    date.toLocaleDateString('en-IN', {
        month: 'short'
    })

const getRelativeDateLabel = value => {
    if (!isValidDate(value)) return 'Recently'
    const current = new Date()
    const target = new Date(value)
    const currentMidnight = new Date(current.getFullYear(), current.getMonth(), current.getDate())
    const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate())
    const diffDays = Math.round((currentMidnight - targetMidnight) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`

    return target.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
    })
}

const getLeadStatus = lead => lead?.status || lead?.leadStatus || lead?.lead_status || 'Pending'

const getLeadId = lead => lead?.id || lead?.leadId || lead?.lead?.id || null

const getPackageLeadId = booking => booking?.leadId || booking?.lead?.id || booking?.lead_id || null

const getLeadName = lead => lead?.fullName || lead?.name || lead?.lead?.fullName || 'Unknown Lead'

const getCampaignName = (item, campaignMap) =>
    item?.campaignName ||
    item?.campaign?.title ||
    item?.campaign?.name ||
    campaignMap.get(item?.campaignId) ||
    campaignMap.get(item?.campaign_id) ||
    item?.destinationName ||
    item?.destination?.name ||
    'Unassigned'

const getPackageCategory = booking =>
    booking?.selectedPackage || booking?.packageType || booking?.packageName || 'Other'

const getRevenueValue = booking =>
    toNumber(
        booking?.sellingPrice ||
            booking?.totalAmount ||
            booking?.finalAmount ||
            booking?.amount ||
            booking?.grandTotal ||
            0
    )

const getProgressColor = index => {
    if (index === 0) return '#39B54A'
    if (index === 1) return '#1d4ed8'
    return '#7c3aed'
}

function Counter({ end, prefix = '', suffix = '', duration = 1200 }) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        let start = 0
        const safeEnd = toNumber(end)
        const step = safeEnd / Math.max(duration / 16, 1)
        const timer = setInterval(() => {
            start += step
            if (start >= safeEnd) {
                setCount(safeEnd)
                clearInterval(timer)
            } else {
                setCount(Math.floor(start))
            }
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

function StatCard({ icon, label, value, prefix, suffix, trend, trendVal, color, bg, delay, onClick }) {
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
                    cursor: onClick ? 'pointer' : 'default',
                    transition: 'all 0.25s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }
                }}
                onClick={onClick}
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
                            trend === 'down' ? (
                                <TrendingDown sx={{ fontSize: '14px !important' }} />
                            ) : (
                                <TrendingUp sx={{ fontSize: '14px !important' }} />
                            )
                        }
                        label={trendVal}
                        size='small'
                        sx={{
                            bgcolor: trend === 'down' ? '#fef2f2' : '#f0fdf4',
                            color: trend === 'down' ? '#dc2626' : '#16a34a',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            '& .MuiChip-icon': { color: trend === 'down' ? '#dc2626' : '#16a34a' }
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
            {payload.map(item => (
                <Box key={item.dataKey} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>
                        {item.name}:{' '}
                        <strong style={{ color: 'white' }}>
                            {item.dataKey === 'revenue' ? `₹${(item.value / 100000).toFixed(1)}L` : item.value}
                        </strong>
                    </Typography>
                </Box>
            ))}
        </Box>
    )
}

function Home() {
    const navigate = useNavigate()
    const user = useSelector(state => state.auth?.user)
    const {
        data: leadsResponse,
        isFetching: leadsLoading,
        isError: leadsError
    } = useGetLeadsQuery(LEADS_QUERY, { refetchOnMountOrArgChange: true })
    const {
        data: packagesResponse,
        isFetching: packagesLoading,
        isError: packagesError
    } = useGetAllConfirmedPackagesQuery(PACKAGES_QUERY, { refetchOnMountOrArgChange: true })
    const {
        data: campaignsResponse,
        isFetching: campaignsLoading,
        isError: campaignsError
    } = useGetCampaignsQuery(CAMPAIGNS_QUERY, { refetchOnMountOrArgChange: true })

    const isLoading = leadsLoading || packagesLoading || campaignsLoading
    const hasError = leadsError || packagesError || campaignsError

    const dashboardData = useMemo(() => {
        const leads = Array.isArray(leadsResponse?.data) ? leadsResponse.data : []
        const bookings = Array.isArray(packagesResponse?.data) ? packagesResponse.data : []
        const campaigns = Array.isArray(campaignsResponse?.data) ? campaignsResponse.data : []

        const campaignMap = new Map(
            campaigns.map(campaign => [campaign?.id, campaign?.title || campaign?.name || `Campaign ${campaign?.id}`])
        )

        const totalLeads = toNumber(leadsResponse?.count || leads.length)
        const confirmedBookings = toNumber(packagesResponse?.recordsTotal || bookings.length)
        const totalRevenue = bookings.reduce((sum, booking) => sum + getRevenueValue(booking), 0)
        const totalCampaigns = toNumber(campaignsResponse?.count || campaignsResponse?.recordsTotal || campaigns.length)

        const packageCountByLeadId = new Map()
        bookings.forEach(booking => {
            const leadId = getPackageLeadId(booking)
            if (leadId) {
                packageCountByLeadId.set(leadId, booking)
            }
        })

        const now = new Date()
        const monthKeys = Array.from({ length: 6 }, (_, index) => {
            const date = startOfMonth(new Date(now.getFullYear(), now.getMonth() - (5 - index), 1))
            const key = `${date.getFullYear()}-${date.getMonth()}`
            return {
                key,
                month: getMonthLabel(date),
                leads: 0,
                confirmed: 0,
                revenue: 0
            }
        })
        const monthMap = new Map(monthKeys.map(item => [item.key, item]))

        leads.forEach(lead => {
            const value = lead?.createdAt || lead?.created_at
            if (!isValidDate(value)) return
            const date = new Date(value)
            const key = `${date.getFullYear()}-${date.getMonth()}`
            if (monthMap.has(key)) {
                monthMap.get(key).leads += 1
            }
        })

        bookings.forEach(booking => {
            const value = booking?.createdAt || booking?.created_at
            if (!isValidDate(value)) return
            const date = new Date(value)
            const key = `${date.getFullYear()}-${date.getMonth()}`
            if (monthMap.has(key)) {
                monthMap.get(key).confirmed += 1
                monthMap.get(key).revenue += getRevenueValue(booking)
            }
        })

        const recentLeads = [...leads]
            .sort((left, right) => new Date(right?.createdAt || 0) - new Date(left?.createdAt || 0))
            .slice(0, 5)
            .map(lead => {
                const booking = packageCountByLeadId.get(getLeadId(lead))
                return {
                    name: getLeadName(lead),
                    campaign: getCampaignName(lead, campaignMap),
                    status: getLeadStatus(lead),
                    date: getRelativeDateLabel(lead?.createdAt || lead?.created_at),
                    amount: getRevenueValue(booking)
                }
            })

        const campaignCounts = leads.reduce((accumulator, lead) => {
            const name = getCampaignName(lead, campaignMap)
            accumulator[name] = (accumulator[name] || 0) + 1
            return accumulator
        }, {})

        const highestCampaignCount = Math.max(...Object.values(campaignCounts), 0)
        const topCampaigns = Object.entries(campaignCounts)
            .map(([name, bookingsCount]) => ({
                name,
                bookings: bookingsCount,
                pct: highestCampaignCount ? Math.round((bookingsCount / highestCampaignCount) * 100) : 0
            }))
            .sort((left, right) => right.bookings - left.bookings)
            .slice(0, 5)

        const packageBreakdownCounts = bookings.reduce((accumulator, booking) => {
            const category = getPackageCategory(booking)
            accumulator[category] = (accumulator[category] || 0) + 1
            return accumulator
        }, {})

        const packageBreakdown = Object.entries(packageBreakdownCounts)
            .map(([name, count], index) => ({
                name,
                value: confirmedBookings ? Math.round((count / confirmedBookings) * 100) : 0,
                color: PACKAGE_COLORS[index % PACKAGE_COLORS.length]
            }))
            .sort((left, right) => right.value - left.value)

        const previousMonth = monthKeys[4] || { leads: 0, confirmed: 0, revenue: 0 }
        const currentMonth = monthKeys[5] || { leads: 0, confirmed: 0, revenue: 0 }
        const campaignsTrendBase = totalCampaigns > 1 ? totalCampaigns - 1 : totalCampaigns

        const getTrend = (currentValue, previousValue) => {
            if (!previousValue) {
                return {
                    trend: currentValue > 0 ? 'up' : 'down',
                    trendVal: currentValue > 0 ? 'New this month' : 'No change'
                }
            }

            const pct = Math.round(((currentValue - previousValue) / previousValue) * 100)
            return {
                trend: pct >= 0 ? 'up' : 'down',
                trendVal: `${pct >= 0 ? '+' : ''}${pct}% vs last month`
            }
        }

        return {
            stats: [
                {
                    icon: <People />,
                    label: 'Total Leads',
                    value: totalLeads,
                    ...getTrend(currentMonth.leads, previousMonth.leads),
                    color: '#1d4ed8',
                    bg: '#eff6ff',
                    delay: 0,
                    onClick: () => navigate('/process/leads')
                },
                {
                    icon: <ConfirmationNumber />,
                    label: 'Confirmed Bookings',
                    value: confirmedBookings,
                    ...getTrend(currentMonth.confirmed, previousMonth.confirmed),
                    color: '#16a34a',
                    bg: '#f0fdf4',
                    delay: 0.08,
                    onClick: () => navigate('/process/packages')
                },
                {
                    icon: <CurrencyRupee />,
                    label: 'Total Revenue',
                    value: totalRevenue,
                    prefix: '₹',
                    ...getTrend(currentMonth.revenue, previousMonth.revenue),
                    color: '#b45309',
                    bg: '#fffbeb',
                    delay: 0.16,
                    onClick: () => navigate('/process/packages')
                },
                {
                    icon: <FlagCircle />,
                    label: 'Active Campaigns',
                    value: totalCampaigns,
                    ...getTrend(totalCampaigns, campaignsTrendBase),
                    color: '#7c3aed',
                    bg: '#f5f3ff',
                    delay: 0.24,
                    onClick: () => navigate('/master/campaigns')
                }
            ],
            monthlyLeads: monthKeys,
            recentLeads,
            topCampaigns,
            packageBreakdown
        }
    }, [campaignsResponse, leadsResponse, packagesResponse])

    const greeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 17) return 'Good afternoon'
        return 'Good evening'
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8faff', minHeight: '100vh' }}>
            {isLoading && <LinearProgress sx={{ mb: 2, borderRadius: '999px' }} />}

            {hasError && (
                <Alert severity='error' sx={{ mb: 2, borderRadius: '14px' }}>
                    Dashboard data could not be loaded completely. Please refresh and try again.
                </Alert>
            )}

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
                            {greeting()}
                            {user?.name ? `, ${user.name}` : ', Team'}
                        </Typography>
                        <Typography sx={{ color: '#64748b', mt: 0.5, fontSize: '0.9rem' }}>
                            Your dashboard is now showing live lead, booking, campaign, and revenue data.
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
                        {new Date().toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </Box>
                </Box>
            </motion.div>

            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                {dashboardData.stats.map(card => (
                    <Grid item xs={6} md={3} key={card.label}>
                        <StatCard
                            icon={card.icon}
                            label={card.label}
                            value={card.value}
                            prefix={card.prefix}
                            suffix={card.suffix}
                            trend={card.trend}
                            trendVal={card.trendVal}
                            color={card.color}
                            bg={card.bg}
                            delay={card.delay}
                        />
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
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
                                        Based on the last 6 months of real records
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    {[
                                        { label: 'Leads', color: '#1d4ed8' },
                                        { label: 'Confirmed', color: '#39B54A' }
                                    ].map(item => (
                                        <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    bgcolor: item.color
                                                }}
                                            />
                                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                                {item.label}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                            <ResponsiveContainer width='100%' height={240}>
                                <AreaChart
                                    data={dashboardData.monthlyLeads}
                                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                                >
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
                                Confirmed bookings by package type
                            </Typography>
                            <ResponsiveContainer width='100%' height={180}>
                                <PieChart>
                                    <Pie
                                        data={dashboardData.packageBreakdown}
                                        cx='50%'
                                        cy='50%'
                                        innerRadius={52}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey='value'
                                    >
                                        {dashboardData.packageBreakdown.map(entry => (
                                            <Cell key={entry.name} fill={entry.color} />
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
                                {dashboardData.packageBreakdown.length ? (
                                    dashboardData.packageBreakdown.map(item => (
                                        <Box
                                            key={item.name}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box
                                                    sx={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: '3px',
                                                        bgcolor: item.color
                                                    }}
                                                />
                                                <Typography
                                                    sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}
                                                >
                                                    {item.name}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                                                {item.value}%
                                            </Typography>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                                        No confirmed package data yet.
                                    </Typography>
                                )}
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>

            <Grid container spacing={2.5}>
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
                                Based on confirmed package value
                            </Typography>
                            <ResponsiveContainer width='100%' height={200}>
                                <BarChart
                                    data={dashboardData.monthlyLeads}
                                    margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' vertical={false} />
                                    <XAxis
                                        dataKey='month'
                                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={value => `${(value / 100000).toFixed(0)}L`}
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <ReTooltip content={<CustomTooltip />} />
                                    <Bar dataKey='revenue' name='revenue' fill='#1c2d45' radius={[6, 6, 0, 0]}>
                                        {dashboardData.monthlyLeads.map((item, index) => (
                                            <Cell
                                                key={item.month}
                                                fill={
                                                    index === dashboardData.monthlyLeads.length - 1
                                                        ? '#39B54A'
                                                        : '#1c2d45'
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </motion.div>
                </Grid>

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
                                Top Campaigns
                            </Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', mb: 2.5 }}>
                                Most active campaigns from live leads
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {dashboardData.topCampaigns.length ? (
                                    dashboardData.topCampaigns.map((campaign, index) => (
                                        <Box key={campaign.name}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography
                                                        sx={{
                                                            width: 20,
                                                            height: 20,
                                                            borderRadius: '6px',
                                                            bgcolor: index === 0 ? '#fef3c7' : '#f1f5f9',
                                                            color: index === 0 ? '#b45309' : '#64748b',
                                                            fontSize: '0.68rem',
                                                            fontWeight: 900,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </Typography>
                                                    <Typography
                                                        sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}
                                                    >
                                                        {campaign.name}
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}
                                                >
                                                    {campaign.bookings}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant='determinate'
                                                value={campaign.pct}
                                                sx={{
                                                    height: 6,
                                                    borderRadius: '10px',
                                                    bgcolor: '#f1f5f9',
                                                    '& .MuiLinearProgress-bar': {
                                                        borderRadius: '10px',
                                                        bgcolor: getProgressColor(index)
                                                    }
                                                }}
                                            />
                                        </Box>
                                    ))
                                ) : (
                                    <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                                        No campaign activity yet.
                                    </Typography>
                                )}
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>

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
                                        Latest inquiries from your live lead table
                                    </Typography>
                                </Box>
                                <Tooltip title='View all leads'>
                                    <IconButton
                                        size='small'
                                        sx={{ bgcolor: '#f1f5f9', borderRadius: '8px' }}
                                        onClick={() => navigate('/process/leads')}
                                    >
                                        <ArrowForward sx={{ fontSize: 16, color: '#64748b' }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                {dashboardData.recentLeads.length ? (
                                    dashboardData.recentLeads.map((lead, index) => {
                                        const colors = STATUS_COLORS[lead.status] || STATUS_COLORS.Pending

                                        return (
                                            <Box key={`${lead.name}-${lead.date}`}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        py: 1.5,
                                                        transition: 'all 0.15s',
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
                                                            .map(part => part[0])
                                                            .join('')
                                                            .slice(0, 2)}
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
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
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
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                mt: 0.3
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: '0.72rem',
                                                                    color: '#64748b',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}
                                                            >
                                                                {lead.campaign}
                                                            </Typography>
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 0.4,
                                                                    px: 1,
                                                                    py: 0.2,
                                                                    borderRadius: '6px',
                                                                    bgcolor: colors.bg
                                                                }}
                                                            >
                                                                <Circle sx={{ fontSize: '7px', color: colors.dot }} />
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.68rem',
                                                                        fontWeight: 700,
                                                                        color: colors.color
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
                                                                {lead.amount
                                                                    ? `₹${(lead.amount / 1000).toFixed(0)}K`
                                                                    : '—'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                                {index < dashboardData.recentLeads.length - 1 && (
                                                    <Divider sx={{ borderColor: '#f1f5f9' }} />
                                                )}
                                            </Box>
                                        )
                                    })
                                ) : (
                                    <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                                        No leads available yet.
                                    </Typography>
                                )}
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>
        </Box>
    )
}

export default Home
