import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Box, Stack, Typography } from '@mui/material'
import { CheckCircle } from '@mui/icons-material'
import { STAGES } from '../../../tables/leads/leadStages'

/**
 * Where this lead is in the same five steps the Leads screen shows — steps already done are ticked, the
 * current one carries its colour and says what to do next.
 */
export default function QuoteJourney({ stage }) {
    const activeRef = useRef(null)
    const current = Math.max(
        0,
        STAGES.findIndex(item => item.key === stage)
    )
    // ? on a phone the strip scrolls sideways — bring the current step into view
    useEffect(() => {
        activeRef.current?.scrollIntoView?.({ inline: 'center', block: 'nearest' })
    }, [stage])
    return (
        <Stack
            component='ol'
            direction='row'
            spacing={1}
            aria-label='Lead progress'
            sx={{ listStyle: 'none', m: 0, p: 0, overflowX: 'auto', pb: 0.5 }}
        >
            {STAGES.map((item, index) => {
                const done = index < current
                const active = index === current
                return (
                    <Box
                        component='li'
                        key={item.key}
                        ref={active ? activeRef : null}
                        aria-current={active ? 'step' : undefined}
                        sx={{
                            flex: active ? '1.4 1 0' : '1 1 0',
                            minWidth: active ? 150 : 110,
                            border: '1px solid',
                            borderColor: active ? item.color : 'divider',
                            bgcolor: active ? item.bg : 'transparent',
                            borderRadius: 2,
                            px: 1.5,
                            py: 1
                        }}
                    >
                        <Stack direction='row' spacing={0.75} alignItems='center'>
                            {done ? (
                                <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                            ) : (
                                <Typography
                                    component='span'
                                    sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: active ? item.color : 'text.disabled'
                                    }}
                                >
                                    {item.step}
                                </Typography>
                            )}
                            <Typography
                                component='span'
                                sx={{
                                    fontSize: '0.875rem',
                                    fontWeight: active ? 700 : 500,
                                    color: active ? item.color : 'text.secondary'
                                }}
                            >
                                {item.label}
                            </Typography>
                        </Stack>
                        {active ? (
                            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mt: 0.25 }}>
                                {item.hint}
                            </Typography>
                        ) : null}
                    </Box>
                )
            })}
        </Stack>
    )
}

QuoteJourney.propTypes = { stage: PropTypes.string.isRequired }
