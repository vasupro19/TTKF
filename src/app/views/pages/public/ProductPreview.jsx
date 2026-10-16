import { Box, Stack, Typography } from '@mui/material'
import { STAGES } from '../../tables/leads/leadStages'
import { GREEN, INK, LINE, MUTED } from './publicTheme'

const ROWS = [
    { name: 'Farah Khan', trip: 'Manali · Leh · Nubra · 3 nights', stage: 'booked', amount: '₹1,00,000' },
    { name: 'Meera Iyer', trip: 'Kerala backwaters · 5 nights', stage: 'sent', amount: '₹84,500' },
    { name: 'Rohan Kapoor', trip: 'Shimla · Manali · 4 nights', stage: 'quoting', amount: '₹62,000' }
]

const stageOf = key => STAGES.find(stage => stage.key === key)

/**
 * A picture of the product built from the product's own stage names and colours — a faux window with the lead
 * journey and a few rows. The people and amounts are illustrations, not customer data.
 */
export default function ProductPreview() {
    return (
        <Box
            aria-hidden
            sx={{
                bgcolor: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 40px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)',
                userSelect: 'none'
            }}
        >
            <Stack
                direction='row'
                spacing={0.75}
                sx={{ px: 2, py: 1.25, bgcolor: '#f1f5f9', borderBottom: `1px solid ${LINE}` }}
            >
                {['#fca5a5', '#fcd34d', '#86efac'].map(color => (
                    <Box key={color} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                ))}
            </Stack>
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: INK }}>Leads</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: MUTED, mb: 1.5 }}>
                    Every enquiry, from the first message to a confirmed booking.
                </Typography>
                <Stack direction='row' spacing={0.75} sx={{ mb: 2 }}>
                    {STAGES.map((stage, index) => (
                        <Box
                            key={stage.key}
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                border: `1px solid ${index === 2 ? stage.color : LINE}`,
                                bgcolor: index === 2 ? stage.bg : '#fff',
                                borderRadius: '8px',
                                px: 1,
                                py: 0.75
                            }}
                        >
                            <Typography noWrap sx={{ fontSize: '0.68rem', fontWeight: 700, color: stage.color }}>
                                {stage.step} · {stage.label}
                            </Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: INK }}>
                                {[3, 5, 2, 4, 9][index]}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
                {ROWS.map(row => {
                    const stage = stageOf(row.stage)
                    return (
                        <Stack
                            key={row.name}
                            direction='row'
                            alignItems='center'
                            justifyContent='space-between'
                            spacing={1}
                            sx={{ py: 1.1, borderTop: `1px solid ${LINE}` }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <Typography noWrap sx={{ fontSize: '0.85rem', fontWeight: 700, color: INK }}>
                                    {row.name}
                                </Typography>
                                <Typography noWrap sx={{ fontSize: '0.74rem', color: MUTED }}>
                                    {row.trip}
                                </Typography>
                            </Box>
                            <Stack direction='row' spacing={1.25} alignItems='center' sx={{ flexShrink: 0 }}>
                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: INK }}>
                                    {row.amount}
                                </Typography>
                                <Box
                                    sx={{
                                        px: 1,
                                        py: 0.25,
                                        borderRadius: 5,
                                        fontSize: '0.68rem',
                                        fontWeight: 700,
                                        color: stage.color,
                                        bgcolor: stage.bg,
                                        border: `1px solid ${stage.color}33`
                                    }}
                                >
                                    {stage.label}
                                </Box>
                            </Stack>
                        </Stack>
                    )
                })}
                <Box
                    sx={{
                        mt: 1.5,
                        p: 1.25,
                        borderRadius: '10px',
                        bgcolor: '#f0fdf4',
                        border: `1px solid ${GREEN}33`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Typography sx={{ fontSize: '0.78rem', color: GREEN, fontWeight: 700 }}>
                        Quote 1 · GST invoice ready
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: GREEN, fontWeight: 700 }}>Send to guest →</Typography>
                </Box>
            </Box>
        </Box>
    )
}
