import { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, ButtonBase, Collapse, Stack, TextField, Typography } from '@mui/material'
import { ExpandLess, ExpandMore, WarningAmberRounded } from '@mui/icons-material'
import { DAY_TYPES } from '../tripEngine/route'
import { formatHours, formatKm, formatWindow } from '../tripEngine/render'
import { dayHeadline, daySummary, formatDate } from './dayText'
import { dayShape, rowShape } from './shapes'

const noteLines = day => [
    ...day.warnings.map(text => ({ text, caution: true })),
    ...day.clusters.flatMap(cluster =>
        cluster.access.map(entry => ({
            // ? most notes already say "check … before travel"; only add it when they do not
            text: `${entry.place ? `${entry.place}: ` : ''}${entry.note}${/check|verify/i.test(entry.note) ? '' : ' Check before travel.'}`,
            caution: true
        }))
    ),
    ...(day.leg?.estimate?.notes || []).map(text => ({ text, caution: false }))
]

function Timeline({ day }) {
    const items = day.timeline.filter(item => item.kind !== 'stay')
    return (
        <Stack component='ol' spacing={1.25} sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {items.map((item, index) => {
                const stops =
                    item.kind === 'travel' && item.leg ? item.leg.estimate?.stops?.map(stop => stop.name) : null
                let { label } = item
                if (item.kind === 'travel' && item.leg)
                    label = stops?.length ? `On the road — stops at ${stops.join(', ')}` : 'On the road'
                return (
                    <Stack
                        component='li'
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={{ xs: 0, sm: 2 }}
                    >
                        <Typography
                            color='text.secondary'
                            sx={{ fontSize: '0.875rem', minWidth: { sm: 132 }, flexShrink: 0 }}
                        >
                            {item.kind === 'travel' && item.leg
                                ? ''
                                : formatWindow(item.start, item.end).replace('approx. ', '')}
                        </Typography>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                sx={{ fontSize: '0.9375rem', fontWeight: item.kind === 'activity' ? 600 : 400 }}
                            >
                                {label}
                                {item.activity?.required ? (
                                    <Typography
                                        component='span'
                                        color='primary'
                                        sx={{ fontSize: '0.8125rem', fontWeight: 500, ml: 1 }}
                                    >
                                        you asked
                                    </Typography>
                                ) : null}
                            </Typography>
                            {item.activity?.note ? (
                                <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                                    {item.activity.note}
                                </Typography>
                            ) : null}
                        </Box>
                    </Stack>
                )
            })}
        </Stack>
    )
}

Timeline.propTypes = { day: dayShape.isRequired }

/**
 * The day in full: the drive in one line, the timeline, notes, the photo and the quotation text. Shared by
 * the planner's result and the detailed editor.
 */
export function DayDetail({ day, row = null, onEditRow = () => {}, imageOptions = [], onFindImages = () => {} }) {
    const [editing, setEditing] = useState(false)
    const [choosingPhoto, setChoosingPhoto] = useState(false)
    const notes = noteLines(day)

    return (
        <Stack spacing={2.5}>
            {day.leg?.estimate ? (
                <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                    {[
                        formatKm(day.leg.estimate.distanceKm),
                        `${formatHours(day.leg.estimate.durationHours)} by ${day.leg.mode.toLowerCase()}`,
                        day.leg.estimate.via.length ? `via ${day.leg.estimate.via.join(', ')}` : ''
                    ]
                        .filter(Boolean)
                        .join(' · ')}{' '}
                    (estimated)
                </Typography>
            ) : null}

            <Timeline day={day} />

            {notes.length ? (
                <Stack spacing={0.75}>
                    {notes.map(note => (
                        <Stack key={note.text} direction='row' spacing={1} alignItems='flex-start'>
                            {note.caution ? (
                                <WarningAmberRounded sx={{ fontSize: 18, mt: '2px', color: 'warning.dark' }} />
                            ) : null}
                            <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                                {note.text}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            ) : null}

            {day.type !== DAY_TYPES.DEPARTURE && day.stay ? (
                <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                    Overnight in {day.stay}
                </Typography>
            ) : null}

            {row ? (
                <Box>
                    {row.image ? (
                        <Box
                            component='img'
                            src={row.image}
                            alt=''
                            sx={{
                                display: 'block',
                                width: '100%',
                                maxWidth: 360,
                                aspectRatio: '16 / 9',
                                objectFit: 'cover',
                                borderRadius: 2
                            }}
                        />
                    ) : null}
                    <Stack direction='row' spacing={1} sx={{ mt: 1, ml: -0.75 }} flexWrap='wrap' useFlexGap>
                        <Button
                            size='small'
                            onClick={() => {
                                if (!imageOptions.length) onFindImages()
                                setChoosingPhoto(open => !open)
                            }}
                        >
                            {row.image ? 'Change photo' : 'Add a photo'}
                        </Button>
                        <Button size='small' onClick={() => setEditing(open => !open)}>
                            {editing ? 'Done editing' : 'Edit day text'}
                        </Button>
                    </Stack>
                    <Collapse in={choosingPhoto} unmountOnExit>
                        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mt: 1 }}>
                            {imageOptions.map(option => (
                                <ButtonBase
                                    key={option.url}
                                    onClick={() => {
                                        onEditRow('image', option.url)
                                        setChoosingPhoto(false)
                                    }}
                                    aria-label='Use this photo'
                                    sx={{
                                        borderRadius: 1.5,
                                        overflow: 'hidden',
                                        outline: option.url === row.image ? '2px solid' : 'none',
                                        outlineColor: 'primary.main'
                                    }}
                                >
                                    <Box
                                        component='img'
                                        src={option.thumb || option.url}
                                        alt=''
                                        sx={{ width: 96, height: 64, objectFit: 'cover', display: 'block' }}
                                    />
                                </ButtonBase>
                            ))}
                            {!imageOptions.length ? (
                                <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                                    Finding photos…
                                </Typography>
                            ) : null}
                        </Stack>
                    </Collapse>
                    <Collapse in={editing} unmountOnExit>
                        <Stack spacing={2} sx={{ mt: 1.5 }}>
                            <TextField
                                label='Day title'
                                value={row.title}
                                onChange={event => onEditRow('title', event.target.value)}
                                fullWidth
                            />
                            <TextField
                                label='What the quotation says'
                                value={row.description}
                                onChange={event => onEditRow('description', event.target.value)}
                                multiline
                                minRows={5}
                                fullWidth
                            />
                        </Stack>
                    </Collapse>
                </Box>
            ) : null}
        </Stack>
    )
}

DayDetail.propTypes = {
    day: dayShape.isRequired,
    row: rowShape,
    onEditRow: PropTypes.func,
    imageOptions: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string, thumb: PropTypes.string })),
    onFindImages: PropTypes.func
}

/**
 * One day of the itinerary: a quiet, scannable row that opens for the details.
 */
function DayRow({
    day,
    row = null,
    expanded = false,
    onToggle,
    onEditRow = () => {},
    imageOptions = [],
    onFindImages = () => {}
}) {
    const panelId = `day-${day.dayNumber}-details`
    return (
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <ButtonBase
                onClick={onToggle}
                aria-expanded={expanded}
                aria-controls={panelId}
                sx={{ width: '100%', textAlign: 'left', py: 2.25, display: 'flex', alignItems: 'flex-start', gap: 2 }}
            >
                <Box sx={{ width: { xs: 56, sm: 72 }, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>Day {day.dayNumber}</Typography>
                    {day.date ? (
                        <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                            {formatDate(day.date)}
                        </Typography>
                    ) : null}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.35 }}>
                        {dayHeadline(day)}
                    </Typography>
                    <Typography color='text.secondary' sx={{ fontSize: '0.9375rem', mt: 0.25 }}>
                        {daySummary(day)}
                    </Typography>
                </Box>
                {expanded ? <ExpandLess color='action' /> : <ExpandMore color='action' />}
            </ButtonBase>
            <Collapse in={expanded} unmountOnExit>
                <Box id={panelId} sx={{ pb: 3, pl: { xs: 0, sm: 11 } }}>
                    <DayDetail
                        day={day}
                        row={row}
                        onEditRow={onEditRow}
                        imageOptions={imageOptions}
                        onFindImages={onFindImages}
                    />
                </Box>
            </Collapse>
        </Box>
    )
}

DayRow.propTypes = {
    day: dayShape.isRequired,
    row: rowShape,
    expanded: PropTypes.bool,
    onToggle: PropTypes.func.isRequired,
    onEditRow: PropTypes.func,
    imageOptions: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string, thumb: PropTypes.string })),
    onFindImages: PropTypes.func
}

export default DayRow
