import { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Collapse, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { ArrowDownward, ArrowUpward, ExpandLess, ExpandMore } from '@mui/icons-material'
import { HOTEL_TIERS, dayDate, entryTypeLabel, hotelList, isStayType } from './quoteDays'
import { quoteDayShape } from './shapes'

const LONG_TEXT = 320

function Hotels({ day, guestCategory }) {
    const [open, setOpen] = useState(false)
    const tiers = HOTEL_TIERS.map(tier => ({ ...tier, names: hotelList(day.hotels?.[tier.key]) }))
    const withHotels = tiers.filter(tier => tier.names.length)
    const panelId = `day-${day.fullItem?.id}-hotels`

    if (!withHotels.length) {
        return (
            <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mt: 1.5 }}>
                No hotels saved for {day.destination || 'this place'} yet — edit the day to add them.
            </Typography>
        )
    }

    const preferred = tiers.find(tier => tier.category === guestCategory)
    return (
        <Box sx={{ mt: 1 }}>
            <Button
                size='small'
                onClick={() => setOpen(value => !value)}
                endIcon={open ? <ExpandLess /> : <ExpandMore />}
                aria-expanded={open}
                aria-controls={panelId}
                sx={{ ml: -0.75, color: 'text.secondary', textAlign: 'left', justifyContent: 'flex-start' }}
            >
                {preferred?.names.length
                    ? `Hotels · ${preferred.label}: ${preferred.names.slice(0, 2).join(', ')}${preferred.names.length > 2 ? '…' : ''}`
                    : `Hotels in ${withHotels.length} categor${withHotels.length === 1 ? 'y' : 'ies'}`}
            </Button>
            <Collapse in={open} unmountOnExit>
                <Stack id={panelId} spacing={1} sx={{ pt: 1, pb: 0.5 }}>
                    {tiers.map(tier => (
                        <Stack key={tier.key} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0, sm: 2 }}>
                            <Typography
                                sx={{
                                    fontSize: '0.875rem',
                                    fontWeight: tier.category === guestCategory ? 700 : 600,
                                    minWidth: { sm: 132 },
                                    flexShrink: 0
                                }}
                            >
                                {tier.label}
                                {tier.category === guestCategory ? (
                                    <Typography
                                        component='span'
                                        color='primary'
                                        sx={{ fontSize: '0.8125rem', ml: 0.75 }}
                                    >
                                        guest’s choice
                                    </Typography>
                                ) : null}
                            </Typography>
                            <Typography
                                color={tier.names.length ? 'text.primary' : 'text.secondary'}
                                sx={{ fontSize: '0.875rem' }}
                            >
                                {tier.names.length ? tier.names.join(', ') : 'None saved'}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            </Collapse>
        </Box>
    )
}

Hotels.propTypes = { day: quoteDayShape.isRequired, guestCategory: PropTypes.string.isRequired }

/**
 * One day of a quotation: what the guest does, where they sleep, and — for the agent — edit, move and delete.
 */
function DayCard({
    day,
    index,
    total,
    startDate = '',
    guestCategory = '',
    readOnly = false,
    onEdit = () => {},
    onDelete = () => {},
    onMove = () => {}
}) {
    const [expanded, setExpanded] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const dayNumber = index + 1
    const date = dayDate(startDate, index)
    const text = day.description || 'No description yet.'
    const long = text.length > LONG_TEXT
    const where = [day.destination, day.entryType && day.entryType !== 'Stay' ? entryTypeLabel(day.entryType) : '']
        .filter(Boolean)
        .join(' · ')

    return (
        <Box component='li' sx={{ listStyle: 'none', borderTop: '1px solid', borderColor: 'divider', py: 2.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }}>
                <Box sx={{ width: { sm: 88 }, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        Day {dayNumber}
                        {date ? (
                            <Typography
                                component='span'
                                color='text.secondary'
                                sx={{
                                    fontWeight: 400,
                                    ml: { xs: 1, sm: 0 },
                                    display: { sm: 'block' },
                                    fontSize: '0.8125rem'
                                }}
                            >
                                {date}
                            </Typography>
                        ) : null}
                    </Typography>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography component='h4' sx={{ fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.35 }}>
                        {day.title || 'Untitled day'}
                    </Typography>
                    {where ? (
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mt: 0.25 }}>
                            {where}
                        </Typography>
                    ) : null}

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
                        {day.image ? (
                            <Box
                                component='img'
                                src={day.image}
                                alt=''
                                loading='lazy'
                                sx={{
                                    width: { xs: '100%', sm: 168 },
                                    maxWidth: { xs: 420, sm: 168 },
                                    aspectRatio: { xs: '16 / 9', sm: '4 / 3' },
                                    objectFit: 'cover',
                                    borderRadius: 1.5,
                                    flexShrink: 0,
                                    display: 'block'
                                }}
                            />
                        ) : null}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                                color={day.description ? 'text.primary' : 'text.secondary'}
                                sx={{
                                    fontSize: '0.9375rem',
                                    lineHeight: 1.65,
                                    whiteSpace: 'pre-line',
                                    wordBreak: 'break-word',
                                    ...(long && !expanded
                                        ? {
                                              display: '-webkit-box',
                                              WebkitLineClamp: 4,
                                              WebkitBoxOrient: 'vertical',
                                              overflow: 'hidden'
                                          }
                                        : {})
                                }}
                            >
                                {text}
                            </Typography>
                            {long ? (
                                <Button size='small' onClick={() => setExpanded(value => !value)} sx={{ ml: -0.75 }}>
                                    {expanded ? 'Show less' : 'Read more'}
                                </Button>
                            ) : null}
                        </Box>
                    </Stack>

                    {isStayType(day.entryType) ? <Hotels day={day} guestCategory={guestCategory} /> : null}

                    {!readOnly ? (
                        <Stack
                            direction='row'
                            alignItems='center'
                            spacing={0.5}
                            sx={{ mt: 1.5, ml: -0.75 }}
                            flexWrap='wrap'
                            useFlexGap
                        >
                            {confirmDelete ? (
                                <>
                                    <Typography sx={{ fontSize: '0.875rem', px: 0.75 }}>
                                        Delete day {dayNumber}?
                                    </Typography>
                                    <Button size='small' color='error' onClick={() => onDelete(day, index)}>
                                        Delete
                                    </Button>
                                    <Button size='small' onClick={() => setConfirmDelete(false)}>
                                        Keep
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button size='small' onClick={() => onEdit(day, index)}>
                                        Edit
                                    </Button>
                                    <Tooltip title='Move up'>
                                        <span>
                                            <IconButton
                                                size='small'
                                                aria-label={`Move day ${dayNumber} up`}
                                                disabled={index === 0}
                                                onClick={() => onMove(day, 'up')}
                                            >
                                                <ArrowUpward fontSize='small' />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title='Move down'>
                                        <span>
                                            <IconButton
                                                size='small'
                                                aria-label={`Move day ${dayNumber} down`}
                                                disabled={index === total - 1}
                                                onClick={() => onMove(day, 'down')}
                                            >
                                                <ArrowDownward fontSize='small' />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Button
                                        size='small'
                                        color='inherit'
                                        sx={{ color: 'text.secondary' }}
                                        onClick={() => setConfirmDelete(true)}
                                    >
                                        Delete
                                    </Button>
                                </>
                            )}
                        </Stack>
                    ) : null}
                </Box>
            </Stack>
        </Box>
    )
}

DayCard.propTypes = {
    day: quoteDayShape.isRequired,
    index: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    startDate: PropTypes.string,
    guestCategory: PropTypes.string,
    readOnly: PropTypes.bool,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onMove: PropTypes.func
}

export default DayCard
