import PropTypes from 'prop-types'
import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts'
import { EmptyNote, Panel } from './dashboardParts'
import { plural, rupees } from './dashboardHelpers'

// ? two series, checked for colour-blind separation (blue / green)
const SERIES = [
    { key: 'leads', label: 'Leads', color: '#2563eb' },
    { key: 'bookings', label: 'Bookings', color: '#16a34a' }
]

function Legend() {
    return (
        <Stack direction='row' spacing={2} sx={{ mb: 1 }} aria-hidden='true'>
            {SERIES.map(series => (
                <Stack key={series.key} direction='row' spacing={0.75} alignItems='center'>
                    <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: series.color }} />
                    <Typography color='text.secondary' sx={{ fontSize: '0.8rem' }}>
                        {series.label}
                    </Typography>
                </Stack>
            ))}
        </Stack>
    )
}

function TrendTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    const row = payload[0].payload
    return (
        <Box
            sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                p: 1.25,
                boxShadow: 2
            }}
        >
            <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 0.5 }}>{label}</Typography>
            {SERIES.map(series => (
                <Typography key={series.key} sx={{ fontSize: '0.8rem' }}>
                    <Box
                        component='span'
                        sx={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '2px',
                            bgcolor: series.color,
                            mr: 0.75
                        }}
                    />
                    {series.label}: <strong>{row[series.key]}</strong>
                </Typography>
            ))}
            <Typography sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                Booked value: <strong>{rupees(row.revenue)}</strong>
            </Typography>
        </Box>
    )
}

TrendTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.arrayOf(PropTypes.shape({ payload: PropTypes.shape({ revenue: PropTypes.number }) })),
    label: PropTypes.string
}

const trendShape = PropTypes.shape({
    month: PropTypes.string,
    leads: PropTypes.number,
    bookings: PropTypes.number,
    revenue: PropTypes.number
})

export function TrendChart({ trend }) {
    const empty = !trend.some(row => row.leads || row.bookings)
    const summary = trend
        .map(row => `${row.month}: ${row.leads} leads, ${row.bookings} bookings, ${rupees(row.revenue)}`)
        .join('; ')
    return (
        <Panel
            title='Last 6 months'
            subtitle='Leads received and bookings made each month — hover for booked value'
            testId='trend'
        >
            {empty ? (
                <EmptyNote>No leads in the last 6 months yet</EmptyNote>
            ) : (
                <>
                    <Legend />
                    <Box sx={{ height: 240 }} role='img' aria-label={`Leads and bookings by month. ${summary}`}>
                        <ResponsiveContainer width='100%' height='100%'>
                            <BarChart data={trend} barGap={2} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                                <CartesianGrid vertical={false} stroke='#eef2f6' />
                                <XAxis
                                    dataKey='month'
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <ChartTooltip content={<TrendTooltip />} cursor={{ fill: 'rgba(100,116,139,0.08)' }} />
                                {SERIES.map(series => (
                                    <Bar
                                        key={series.key}
                                        dataKey={series.key}
                                        name={series.label}
                                        fill={series.color}
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={22}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </>
            )}
        </Panel>
    )
}

TrendChart.propTypes = { trend: PropTypes.arrayOf(trendShape).isRequired }

/** @description a ranked list with a thin bar per row: the value's share of the largest */
function BarList({ rows, color, label }) {
    const top = Math.max(...rows.map(row => row.value), 1)
    return (
        <Box component='ul' sx={{ m: 0, p: 0 }} aria-label={label}>
            {rows.map(row => (
                <Tooltip key={row.key} title={row.tip} placement='top-start' arrow>
                    <Box component='li' sx={{ listStyle: 'none', py: 0.75 }}>
                        <Stack direction='row' justifyContent='space-between' spacing={1}>
                            <Typography sx={{ fontSize: '0.85rem' }} noWrap title={row.name}>
                                {row.name}
                            </Typography>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>
                                {row.text}
                            </Typography>
                        </Stack>
                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#eef2f6', mt: 0.5 }}>
                            <Box
                                sx={{
                                    height: '100%',
                                    borderRadius: 3,
                                    bgcolor: color,
                                    width: `${Math.max((row.value / top) * 100, 2)}%`
                                }}
                            />
                        </Box>
                    </Box>
                </Tooltip>
            ))}
        </Box>
    )
}

BarList.propTypes = {
    rows: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired,
            text: PropTypes.string.isRequired,
            tip: PropTypes.string.isRequired
        })
    ).isRequired,
    color: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
}

export function SourcesChart({ sources, noun }) {
    const total = sources.reduce((sum, row) => sum + (Number(row.leads) || 0), 0)
    const rows = sources.map(row => ({
        key: row.source,
        name: row.source,
        value: Number(row.leads) || 0,
        text: String(row.leads),
        tip: `${plural(Number(row.leads) || 0, 'lead')} · ${total ? Math.round((row.leads / total) * 100) : 0}% of ${total}`
    }))
    return (
        <Panel title='Where leads come from' subtitle={`New leads ${noun}, by source`} testId='sources'>
            {rows.length ? (
                <BarList rows={rows} color='#2563eb' label='Leads by source' />
            ) : (
                <EmptyNote>No leads {noun} yet</EmptyNote>
            )}
        </Panel>
    )
}

SourcesChart.propTypes = {
    sources: PropTypes.arrayOf(PropTypes.shape({ source: PropTypes.string, leads: PropTypes.number })).isRequired,
    noun: PropTypes.string.isRequired
}

export function CampaignsChart({ campaigns, noun }) {
    const rows = campaigns.map(row => ({
        key: row.title,
        name: row.title,
        value: Number(row.revenue) || 0,
        text: rupees(row.revenue),
        tip: `${plural(Number(row.bookings) || 0, 'booking')} · ${rupees(row.revenue)}`
    }))
    return (
        <Panel title='Top campaigns' subtitle={`Booked value ${noun}`} testId='campaigns'>
            {rows.length ? (
                <BarList rows={rows} color='#16a34a' label='Booked value by campaign' />
            ) : (
                <EmptyNote>No bookings {noun} yet</EmptyNote>
            )}
        </Panel>
    )
}

CampaignsChart.propTypes = {
    campaigns: PropTypes.arrayOf(
        PropTypes.shape({ title: PropTypes.string, bookings: PropTypes.number, revenue: PropTypes.number })
    ).isRequired,
    noun: PropTypes.string.isRequired
}
