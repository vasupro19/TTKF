import { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, ButtonBase, Collapse, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Check, Close, ExpandLess, ExpandMore, WarningAmberRounded } from '@mui/icons-material'
import CustomButton from '@core/components/extended/CustomButton'
import DayRow from './DayRow'
import { dateRangeLabel, totalNights } from './plannerInput'
import { plannerInputShape, rowShape, tripShape } from './shapes'
import { describeTravellers } from '../tripEngine/requirements'
import { formatHours } from '../tripEngine/render'
import { isCovered } from '../tripEngine/validate'

const HOTEL_TIERS = [
    ['delux_hotel', 'Deluxe'],
    ['super_delux_hotel', 'Super deluxe'],
    ['luxury_hotel', 'Luxury'],
    ['premium_hotel', 'Premium']
]

function SectionTitle({ children }) {
    return <Typography sx={{ fontSize: '1rem', fontWeight: 600, mb: 1.25 }}>{children}</Typography>
}

SectionTitle.propTypes = { children: PropTypes.node.isRequired }

/**
 * The journey, before any activity: where it starts, each stay and its nights, and the drive between.
 */
function Journey({ trip, hotelsFor, onEditHotel }) {
    const [openHotels, setOpenHotels] = useState('')
    const { stops } = trip.route
    return (
        <Box component='ol' aria-label='Journey' sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {stops.map((stop, index) => {
                const leg = trip.legs[index]
                const hotels = stop.kind === 'stay' ? hotelsFor(stop.name) : null
                const key = `${stop.name}-${index}`
                return (
                    <Box
                        component='li'
                        key={key}
                        sx={{ position: 'relative', pl: 3.5, pb: index < stops.length - 1 ? 2.5 : 0 }}
                    >
                        {index < stops.length - 1 ? (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    left: 7,
                                    top: 22,
                                    bottom: 2,
                                    borderLeft: '1px dashed',
                                    borderColor: 'divider'
                                }}
                            />
                        ) : null}
                        <Box
                            sx={theme => ({
                                position: 'absolute',
                                left: 2,
                                top: 7,
                                width: 11,
                                height: 11,
                                borderRadius: '50%',
                                bgcolor: stop.kind === 'stay' ? 'primary.main' : 'background.paper',
                                border: `2px solid ${theme.palette.primary.main}`
                            })}
                        />
                        <Stack direction='row' spacing={1} alignItems='baseline' flexWrap='wrap' useFlexGap>
                            <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>{stop.name}</Typography>
                            <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                                {stop.nights ? `${stop.nights} ${stop.nights === 1 ? 'night' : 'nights'}` : ''}
                            </Typography>
                            {hotels ? (
                                <Button
                                    size='small'
                                    onClick={() => setOpenHotels(open => (open === key ? '' : key))}
                                    endIcon={openHotels === key ? <ExpandLess /> : <ExpandMore />}
                                    sx={{ ml: 'auto', color: 'text.secondary', py: 0 }}
                                >
                                    Hotels
                                </Button>
                            ) : null}
                        </Stack>
                        {hotels ? (
                            <Collapse in={openHotels === key} unmountOnExit>
                                <Stack spacing={1.5} sx={{ pt: 1.5, pb: 1 }}>
                                    {HOTEL_TIERS.map(([field, label]) => (
                                        <TextField
                                            key={field}
                                            size='small'
                                            label={label}
                                            value={hotels[field] || ''}
                                            onChange={event => onEditHotel(hotels.id, field, event.target.value)}
                                            placeholder='Suggestions appear here'
                                            fullWidth
                                        />
                                    ))}
                                </Stack>
                            </Collapse>
                        ) : null}
                        {leg?.estimate && index < stops.length - 1 ? (
                            <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mt: 0.75 }}>
                                {formatHours(leg.estimate.durationHours)} by {leg.mode.toLowerCase()}
                            </Typography>
                        ) : null}
                    </Box>
                )
            })}
        </Box>
    )
}

Journey.propTypes = {
    trip: tripShape.isRequired,
    hotelsFor: PropTypes.func.isRequired,
    onEditHotel: PropTypes.func.isRequired
}

function Question({ question, onAnswer, busy = false }) {
    const [value, setValue] = useState('')
    const isDate = question.field === 'startDate'
    return (
        <Box sx={theme => ({ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) })}>
            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, mb: 1.25 }}>{question.text}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                    size='small'
                    type={isDate ? 'date' : 'text'}
                    value={value}
                    onChange={event => setValue(event.target.value)}
                    inputProps={{ 'aria-label': question.text }}
                    sx={{ flex: { sm: isDate ? '0 0 220px' : 1 } }}
                />
                <Button
                    variant='contained'
                    disableElevation
                    disabled={!value || busy}
                    onClick={() => onAnswer(question, value)}
                >
                    {isDate ? 'Use this date' : 'Use this'}
                </Button>
            </Stack>
        </Box>
    )
}

Question.propTypes = {
    question: PropTypes.shape({ id: PropTypes.string, field: PropTypes.string, text: PropTypes.string }).isRequired,
    onAnswer: PropTypes.func.isRequired,
    busy: PropTypes.bool
}

function RemovableTag({ label, onRemove, disabled = false }) {
    return (
        <Stack
            direction='row'
            alignItems='center'
            spacing={0.25}
            sx={{ pl: 1.5, pr: 0.5, py: 0.25, borderRadius: 999, border: '1px solid', borderColor: 'divider' }}
        >
            <Typography sx={{ fontSize: '0.9375rem' }}>{label}</Typography>
            <ButtonBase
                onClick={onRemove}
                disabled={disabled}
                aria-label={`Remove ${label}`}
                sx={{ borderRadius: '50%', p: 0.5, color: 'text.secondary' }}
            >
                <Close sx={{ fontSize: 16 }} />
            </ButtonBase>
        </Stack>
    )
}

RemovableTag.propTypes = {
    label: PropTypes.string.isRequired,
    onRemove: PropTypes.func.isRequired,
    disabled: PropTypes.bool
}

/**
 * The generated trip, calm and in order: the journey, what was asked for and what was added, the one thing
 * that still matters (if any), then the days — each one line until opened.
 */
function TripResult({
    trip,
    input,
    rows,
    busy = false,
    onEditTrip,
    onEditPreferences,
    onAnswer,
    onApplyOption,
    onExclude,
    onAddIdea,
    onChangeRequest,
    onEditRow,
    imageOptionsByRow,
    onFindImages,
    hotelsFor,
    onEditHotel,
    save,
    onOpenDetailed,
    onStartOver
}) {
    const [openDay, setOpenDay] = useState(null)
    const [showChecks, setShowChecks] = useState(false)
    const [change, setChange] = useState('')
    const { requirements } = trip
    const nights = totalNights(input)
    const ready = trip.status === 'ready'

    const asked = requirements.requiredAttractions.map(item => item.name)
    const added = ready
        ? [...new Set(trip.days.flatMap(day => day.activities.filter(item => item.recommended).map(item => item.name)))]
        : []
    const facts = [
        dateRangeLabel(input) || 'Dates not set',
        `${nights} ${nights === 1 ? 'night' : 'nights'}`,
        describeTravellers(requirements.travellers),
        [requirements.transport.mode, requirements.transport.vehicle].filter(Boolean).join(' · ')
    ]
    const assumed = trip.assumptions.filter(item => ['transport', 'pace', 'travellers', 'origin'].includes(item.id))

    return (
        <Stack spacing={5}>
            <Box>
                <Stack direction='row' alignItems='baseline' justifyContent='space-between' spacing={2}>
                    <Typography
                        component='h2'
                        sx={{ fontSize: { xs: '1.625rem', md: '2rem' }, fontWeight: 600, lineHeight: 1.2 }}
                    >
                        Your trip
                    </Typography>
                    <Button onClick={onEditTrip} sx={{ flexShrink: 0 }}>
                        Edit trip
                    </Button>
                </Stack>
                <Typography color='text.secondary' sx={{ fontSize: '1rem', mt: 1 }}>
                    {facts.filter(Boolean).join(' · ')}
                </Typography>
            </Box>

            <Journey trip={trip} hotelsFor={hotelsFor} onEditHotel={onEditHotel} />

            {trip.conflicts.map(conflict => (
                <Box
                    key={conflict.id}
                    role='alert'
                    sx={theme => ({ p: 2.5, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.06) })}
                >
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600, mb: 0.5 }}>This doesn’t quite fit</Typography>
                    <Typography color='text.secondary' sx={{ fontSize: '0.9375rem', mb: 1.5 }}>
                        {conflict.text}
                    </Typography>
                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                        {conflict.options.map(option => (
                            <Button
                                key={option.id}
                                variant='outlined'
                                disabled={busy}
                                onClick={() => onApplyOption(option)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Stack>
                </Box>
            ))}

            {trip.questions.map(question => (
                <Question key={question.id} question={question} onAnswer={onAnswer} busy={busy} />
            ))}

            {ready && (asked.length || added.length) ? (
                <Stack spacing={3}>
                    {asked.length ? (
                        <Box>
                            <SectionTitle>Included because you asked</SectionTitle>
                            <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
                                {asked.map(name => (
                                    <Stack key={name} direction='row' spacing={0.5} alignItems='center'>
                                        <Check
                                            sx={{ fontSize: 18 }}
                                            color={isCovered(trip.days, name) ? 'primary' : 'disabled'}
                                        />
                                        <Typography sx={{ fontSize: '0.9375rem' }}>{name}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Box>
                    ) : null}
                    {added.length ? (
                        <Box>
                            <SectionTitle>We added</SectionTitle>
                            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                                {added.map(name => (
                                    <RemovableTag
                                        key={name}
                                        label={name}
                                        disabled={busy}
                                        onRemove={() => onExclude(name)}
                                    />
                                ))}
                            </Stack>
                            {trip.recommendations.slice(0, 1).map(idea => (
                                <Typography
                                    key={idea.name}
                                    color='text.secondary'
                                    sx={{ fontSize: '0.875rem', mt: 1.5 }}
                                >
                                    Could also fit: {idea.name}
                                    {idea.impact ? ` — ${idea.impact.replace(/\.$/, '')}` : ''}.{' '}
                                    <Button
                                        size='small'
                                        onClick={() => onAddIdea(idea)}
                                        disabled={busy}
                                        sx={{ minWidth: 0, p: 0, verticalAlign: 'baseline' }}
                                    >
                                        Add
                                    </Button>
                                </Typography>
                            ))}
                        </Box>
                    ) : null}
                </Stack>
            ) : null}

            {ready ? (
                <Box>
                    {assumed.length ? (
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 2 }}>
                            {assumed.map(item => item.text).join(' ')}{' '}
                            <Button
                                size='small'
                                onClick={onEditPreferences}
                                sx={{ minWidth: 0, p: 0, verticalAlign: 'baseline' }}
                            >
                                Change
                            </Button>
                        </Typography>
                    ) : null}
                    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                        {trip.days.map(day => {
                            const row = rows.find(item => item.planKey === day.planKey) || null
                            return (
                                <DayRow
                                    key={day.dayNumber}
                                    day={day}
                                    row={row}
                                    expanded={openDay === day.dayNumber}
                                    onToggle={() => setOpenDay(open => (open === day.dayNumber ? null : day.dayNumber))}
                                    onEditRow={(field, value) => row && onEditRow(row.id, field, value)}
                                    imageOptions={row ? imageOptionsByRow[row.id] || [] : []}
                                    onFindImages={() => row && onFindImages(row)}
                                />
                            )
                        })}
                    </Box>
                </Box>
            ) : null}

            {ready && trip.notes.length ? (
                <Box>
                    <Button
                        onClick={() => setShowChecks(open => !open)}
                        startIcon={<WarningAmberRounded sx={{ color: 'warning.dark' }} />}
                        endIcon={showChecks ? <ExpandLess /> : <ExpandMore />}
                        sx={{ color: 'text.primary', px: 0.5 }}
                    >
                        {trip.notes.length} {trip.notes.length === 1 ? 'thing' : 'things'} to check before travel
                    </Button>
                    <Collapse in={showChecks} unmountOnExit>
                        <Stack component='ul' spacing={0.75} sx={{ m: 0, mt: 1, pl: 3 }}>
                            {trip.notes.map(note => (
                                <Typography
                                    key={note.note}
                                    component='li'
                                    color='text.secondary'
                                    sx={{ fontSize: '0.9375rem' }}
                                >
                                    {note.place ? `${note.place}: ` : ''}
                                    {note.note}
                                </Typography>
                            ))}
                        </Stack>
                        <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mt: 1, pl: 0.5 }}>
                            General guidance, not live status.
                        </Typography>
                    </Collapse>
                </Box>
            ) : null}

            {trip.status !== 'needs-input' ? (
                <Box>
                    <SectionTitle>Want to change something?</SectionTitle>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                            fullWidth
                            value={change}
                            onChange={event => setChange(event.target.value)}
                            placeholder='e.g. add a night in Manali, or make it more relaxed'
                            inputProps={{ 'aria-label': 'Change request' }}
                        />
                        <CustomButton
                            variant='outlined'
                            disabled={!change.trim()}
                            loading={busy}
                            onClick={() => {
                                onChangeRequest(change.trim())
                                setChange('')
                            }}
                            sx={{ flexShrink: 0 }}
                        >
                            Update
                        </CustomButton>
                    </Stack>
                </Box>
            ) : null}

            {ready ? (
                <Box>
                    <Divider sx={{ mb: 4 }} />
                    <SectionTitle>Save as a package</SectionTitle>
                    <Stack spacing={2}>
                        <TextField
                            label='Package name'
                            value={save.name}
                            onChange={event => save.onNameChange(event.target.value)}
                            fullWidth
                        />
                        {!save.campaignLocked ? (
                            <TextField
                                select
                                label='Campaign'
                                value={save.campaignId}
                                onChange={event => save.onCampaignChange(event.target.value)}
                                fullWidth
                            >
                                {save.campaignOptions.map(option => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        ) : null}
                        {save.error ? (
                            <Typography color='error' sx={{ fontSize: '0.9375rem' }} role='alert'>
                                {save.error}
                            </Typography>
                        ) : null}
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                        >
                            <CustomButton size='large' onClick={save.onSave} loading={save.saving} sx={{ px: 5 }}>
                                Save package
                            </CustomButton>
                            <Button onClick={onOpenDetailed} sx={{ color: 'text.secondary' }}>
                                Fine-tune in the detailed editor
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            ) : null}

            <Box>
                <Button onClick={onStartOver} sx={{ color: 'text.secondary', px: 0.5 }}>
                    Start a new trip
                </Button>
            </Box>
        </Stack>
    )
}

TripResult.propTypes = {
    trip: tripShape.isRequired,
    input: plannerInputShape.isRequired,
    rows: PropTypes.arrayOf(rowShape).isRequired,
    busy: PropTypes.bool,
    onEditTrip: PropTypes.func.isRequired,
    onEditPreferences: PropTypes.func.isRequired,
    onAnswer: PropTypes.func.isRequired,
    onApplyOption: PropTypes.func.isRequired,
    onExclude: PropTypes.func.isRequired,
    onAddIdea: PropTypes.func.isRequired,
    onChangeRequest: PropTypes.func.isRequired,
    onEditRow: PropTypes.func.isRequired,
    imageOptionsByRow: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string }))).isRequired,
    onFindImages: PropTypes.func.isRequired,
    hotelsFor: PropTypes.func.isRequired,
    onEditHotel: PropTypes.func.isRequired,
    save: PropTypes.shape({
        name: PropTypes.string,
        onNameChange: PropTypes.func,
        campaignId: PropTypes.string,
        onCampaignChange: PropTypes.func,
        campaignOptions: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })),
        campaignLocked: PropTypes.bool,
        onSave: PropTypes.func,
        saving: PropTypes.bool,
        error: PropTypes.string
    }).isRequired,
    onOpenDetailed: PropTypes.func.isRequired,
    onStartOver: PropTypes.func.isRequired
}

export default TripResult
