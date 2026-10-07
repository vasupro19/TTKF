import PropTypes from 'prop-types'
import { Avatar, Box, Chip, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

const TONES = {
    success: 'success',
    warning: 'warning',
    error: 'error',
    neutral: 'default',
    info: 'info'
}

/** a small coloured status pill with a dot */
export function StatusPill({ tone = 'neutral', label }) {
    return (
        <Chip
            size='small'
            color={TONES[tone] || 'default'}
            variant={tone === 'neutral' ? 'outlined' : 'filled'}
            label={
                <Stack direction='row' spacing={0.75} alignItems='center'>
                    <Box
                        component='span'
                        sx={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            bgcolor: tone === 'neutral' ? 'text.disabled' : 'common.white'
                        }}
                    />
                    <span>{label}</span>
                </Stack>
            }
            sx={{ fontWeight: 600, height: 24 }}
        />
    )
}

StatusPill.propTypes = { tone: PropTypes.oneOf(Object.keys(TONES)), label: PropTypes.node.isRequired }

/** the top of an integration page: a branded icon, what it does, and its main action */
export function ChannelHeader({ icon, color, title, subtitle, action = null }) {
    return (
        <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent='space-between'
            sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                border: 1,
                borderColor: 'divider',
                background: theme =>
                    `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.02)} 60%, ${theme.palette.background.paper} 100%)`
            }}
        >
            <Stack direction='row' spacing={2} alignItems='center'>
                <Avatar
                    variant='rounded'
                    sx={{
                        width: 52,
                        height: 52,
                        bgcolor: color,
                        borderRadius: 2.5,
                        boxShadow: `0 6px 16px ${alpha(color, 0.35)}`
                    }}
                >
                    {icon}
                </Avatar>
                <Box>
                    <Typography variant='h4' sx={{ fontWeight: 700 }}>
                        {title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, maxWidth: 640 }}>
                        {subtitle}
                    </Typography>
                </Box>
            </Stack>
            {action}
        </Stack>
    )
}

ChannelHeader.propTypes = {
    icon: PropTypes.node.isRequired,
    color: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.node.isRequired,
    action: PropTypes.node
}

/** numbered "how it works" steps in a row */
export function HowItWorks({ steps }) {
    return (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: `repeat(${steps.length}, 1fr)` } }}>
            {steps.map((step, index) => (
                <Stack
                    key={step.title}
                    direction='row'
                    spacing={1.5}
                    sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', border: 1, borderColor: 'divider' }}
                >
                    <Avatar
                        sx={{
                            width: 28,
                            height: 28,
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'common.white',
                            bgcolor: 'primary.main'
                        }}
                    >
                        {index + 1}
                    </Avatar>
                    <Box>
                        <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                            {step.title}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                            {step.text}
                        </Typography>
                    </Box>
                </Stack>
            ))}
        </Box>
    )
}

HowItWorks.propTypes = {
    steps: PropTypes.arrayOf(PropTypes.shape({ title: PropTypes.string, text: PropTypes.node })).isRequired
}

/** a label over a value, for the facts on a connection card */
export function Fact({ label, value }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', lineHeight: 1.4 }}>
                {label}
            </Typography>
            <Typography variant='body2' sx={{ fontWeight: 600 }} noWrap>
                {value}
            </Typography>
        </Box>
    )
}

Fact.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node }

/** the big empty state when nothing is connected yet */
export function EmptyChannel({ icon, title, text, action }) {
    return (
        <Stack
            alignItems='center'
            spacing={1.5}
            sx={{
                py: 6,
                px: 2,
                textAlign: 'center',
                border: 2,
                borderStyle: 'dashed',
                borderColor: 'divider',
                borderRadius: 3
            }}
        >
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'grey.100', color: 'text.secondary' }}>{icon}</Avatar>
            <Typography variant='h5' sx={{ fontWeight: 700 }}>
                {title}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 460 }}>
                {text}
            </Typography>
            {action}
        </Stack>
    )
}

EmptyChannel.propTypes = { icon: PropTypes.node, title: PropTypes.string, text: PropTypes.node, action: PropTypes.node }
