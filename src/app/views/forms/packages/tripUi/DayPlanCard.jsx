import PropTypes from 'prop-types'
import { Alert, Box, Chip, Grid, Stack, Typography } from '@mui/material'
import { DirectionsCar, Hotel, Landscape, WbTwilight } from '@mui/icons-material'
import { dayShape } from './shapes'
import { DAY_TYPE_LABELS, DAY_TYPES } from '../tripEngine/route'
import { formatClock, formatHours, formatKm, formatWindow, renderDayTitle } from '../tripEngine/render'

const TYPE_STYLE = {
    ARRIVAL: { color: 'info', icon: <DirectionsCar fontSize='small' /> },
    TRANSFER: { color: 'warning', icon: <DirectionsCar fontSize='small' /> },
    DEPARTURE: { color: 'default', icon: <DirectionsCar fontSize='small' /> },
    EXCURSION: { color: 'secondary', icon: <Landscape fontSize='small' /> },
    FULL_DAY: { color: 'success', icon: <WbTwilight fontSize='small' /> }
}

const formatDate = isoDate =>
    isoDate
        ? new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              timeZone: 'UTC'
          })
        : ''

/**
 * The transfer panel: what a guest needs to know about a road day at a glance.
 */
function TransferPanel({ day }) {
    const { leg, budget } = day
    const facts = [
        ['From', leg.from],
        ['To', leg.to],
        ['Transport', leg.mode],
        ['Driving', leg.estimate ? `${formatHours(leg.estimate.durationHours)} (estimate)` : 'Estimate unavailable'],
        ['Distance', leg.estimate ? formatKm(leg.estimate.distanceKm) : '—'],
        ['Departure', budget.departAt != null ? `approx. ${formatClock(budget.departAt)}` : '—'],
        ['Arrival', budget.arrive ? formatWindow(budget.arrive.earliest, budget.arrive.latest) : '—'],
        ['Stops', leg.estimate?.stops?.map(stop => stop.name).join(', ') || '—']
    ]

    return (
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={1.25}>
                {facts.map(([label, text]) => (
                    <Grid item xs={6} sm={3} key={label}>
                        <Typography
                            variant='caption'
                            color='text.secondary'
                            sx={{ display: 'block', textTransform: 'uppercase' }}
                        >
                            {label}
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                            {text}
                        </Typography>
                    </Grid>
                ))}
            </Grid>
            {leg.estimate?.via?.length ? (
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                    Route via {leg.estimate.via.join(' → ')}
                </Typography>
            ) : null}
        </Box>
    )
}

TransferPanel.propTypes = { day: dayShape.isRequired }

const TIMELINE_KINDS_SHOWN_IN_PANEL = new Set(['depart', 'travel'])

/**
 * DayPlanCard — one day of the structured plan. Road days lead with the transfer panel; sightseeing days lead
 * with the timeline. Required places and AI picks are marked differently.
 */
function DayPlanCard({ day, showTitle }) {
    const style = TYPE_STYLE[day.type] || TYPE_STYLE.FULL_DAY
    const hasTransfer = Boolean(day.leg)
    const timeline = day.timeline.filter(
        // ? the leg's own departure and drive are in the transfer panel; "Return to Manali" and "Early start" stay
        item => !(hasTransfer && item.leg && TIMELINE_KINDS_SHOWN_IN_PANEL.has(item.kind)) && item.kind !== 'stay'
    )
    const access = day.clusters.flatMap(cluster => cluster.access)

    return (
        <Stack spacing={1.5}>
            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                <Chip size='small' color={style.color} icon={style.icon} label={DAY_TYPE_LABELS[day.type]} />
                {day.date ? (
                    <Typography variant='caption' color='text.secondary'>
                        {formatDate(day.date)}
                    </Typography>
                ) : null}
                {showTitle ? (
                    <Typography variant='subtitle1' sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                        {renderDayTitle(day)}
                    </Typography>
                ) : null}
            </Stack>

            {hasTransfer && <TransferPanel day={day} />}

            <Stack component='ol' spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                {timeline.map((item, index) => (
                    <Stack
                        component='li'
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={{ xs: 0.25, sm: 1.5 }}
                    >
                        <Typography
                            variant='caption'
                            color='text.secondary'
                            sx={{ minWidth: { sm: 150 }, pt: { sm: 0.25 }, whiteSpace: 'nowrap' }}
                        >
                            {formatWindow(item.start, item.end)}
                        </Typography>
                        <Box sx={{ minWidth: 0 }}>
                            <Stack direction='row' spacing={0.75} alignItems='center' flexWrap='wrap' useFlexGap>
                                <Typography variant='body2' sx={{ fontWeight: item.kind === 'activity' ? 600 : 400 }}>
                                    {item.label}
                                    {item.assumed ? ' (assumed)' : ''}
                                </Typography>
                                {item.activity?.required && <Chip size='small' color='primary' label='Requested' />}
                                {item.activity?.recommended && <Chip size='small' variant='outlined' label='AI pick' />}
                            </Stack>
                            {item.activity?.note ? (
                                <Typography variant='caption' color='text.secondary'>
                                    {item.activity.note}
                                </Typography>
                            ) : null}
                        </Box>
                    </Stack>
                ))}
            </Stack>

            {[...day.warnings, ...(day.leg?.estimate?.notes || [])].map(note => (
                <Alert key={note} severity='info' sx={{ py: 0 }}>
                    {note}
                </Alert>
            ))}
            {access.map(entry => (
                <Alert key={entry.note} severity='warning' sx={{ py: 0 }}>
                    {entry.place ? <strong>{entry.place}: </strong> : null}
                    {entry.note} <em>(general guidance — verify before travel)</em>
                </Alert>
            ))}

            {day.type !== DAY_TYPES.DEPARTURE && day.stay ? (
                <Stack direction='row' spacing={1} alignItems='center'>
                    <Hotel fontSize='small' color='action' />
                    <Typography variant='body2' color='text.secondary'>
                        Overnight in {day.stay}
                    </Typography>
                </Stack>
            ) : null}
        </Stack>
    )
}

DayPlanCard.propTypes = { day: dayShape.isRequired, showTitle: PropTypes.bool }

DayPlanCard.defaultProps = { showTitle: true }

export default DayPlanCard
