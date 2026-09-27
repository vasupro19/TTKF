import { useState } from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Button,
    Chip,
    Collapse,
    Grid,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from '@mui/material'
import { Add, AutoAwesome, Close, ExpandLess, ExpandMore } from '@mui/icons-material'
import CustomButton from '@core/components/extended/CustomButton'
import { requirementsShape, voiceShape } from './shapes'
import { TRANSPORT_OPTIONS } from '../tripEngine/requirements'

const TRAVELLER_TYPES = ['couple', 'family', 'friends', 'solo', 'group']
const STYLES = [
    'nature',
    'scenic',
    'adventure',
    'culture',
    'food',
    'photography',
    'shopping',
    'luxury',
    'budget',
    'honeymoon'
]
const capital = value => (value ? value[0].toUpperCase() + value.slice(1) : value)

/**
 * TripBriefCard — the trip's hard constraints, captured two ways: typed in plain words (AI extracts them) or
 * filled in directly. Filled-in fields always win. After a build, the fields show what the AI understood, so
 * the agent can correct any of it and update the plan.
 */
function TripBriefCard({ notes, onNotesChange, value, onChange, onBuild, onUpdate, building, hasTrip, voice }) {
    const [showDetails, setShowDetails] = useState(false)
    const [placeInput, setPlaceInput] = useState('')

    const set = (field, next) => onChange({ ...value, [field]: next })
    const setNested = (field, key, next) => onChange({ ...value, [field]: { ...value[field], [key]: next } })

    const updateDestination = (index, field, next) =>
        set(
            'destinations',
            value.destinations.map((item, position) => (position === index ? { ...item, [field]: next } : item))
        )

    const addPlace = () => {
        const name = placeInput.trim()
        if (!name) return
        set('requiredAttractions', [...value.requiredAttractions, { name, destination: '' }])
        setPlaceInput('')
    }

    return (
        <Stack spacing={2}>
            <Box>
                <Typography variant='h5'>Plan the trip</Typography>
                <Typography variant='body2' color='text.secondary'>
                    Describe it the way the guest said it — where from, nights in each place, who is travelling and the
                    places they must see. The AI plans the journey around those, and you can adjust every detail.
                </Typography>
            </Box>

            <TextField
                multiline
                minRows={3}
                value={notes}
                onChange={event => onNotesChange(event.target.value)}
                placeholder="2 nights Shimla and 3 nights Manali from Delhi, we're a couple, private cab. We definitely want Rohtang, Atal Tunnel and Sissu. Not too hectic."
                inputProps={{ 'aria-label': 'Trip notes' }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <CustomButton startIcon={<AutoAwesome />} onClick={onBuild} loading={building}>
                    {hasTrip ? 'Rebuild from notes' : 'Build itinerary'}
                </CustomButton>
                {hasTrip && (
                    <CustomButton variant='outlined' onClick={onUpdate} loading={building}>
                        Update itinerary
                    </CustomButton>
                )}
                {voice?.supported && (
                    <Button variant='text' onClick={voice.onToggle} color={voice.listening ? 'error' : 'primary'}>
                        {voice.listening ? 'Stop listening' : 'Speak instead'}
                    </Button>
                )}
                <Button
                    variant='text'
                    onClick={() => setShowDetails(open => !open)}
                    endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
                    sx={{ ml: { sm: 'auto' } }}
                >
                    Trip details
                </Button>
            </Stack>
            {voice?.status ? (
                <Typography variant='body2' color='text.secondary'>
                    {voice.status}
                </Typography>
            ) : null}

            <Collapse in={showDetails} unmountOnExit>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            fullWidth
                            label='From'
                            value={value.origin}
                            onChange={event => set('origin', event.target.value)}
                            placeholder='Delhi'
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            fullWidth
                            type='date'
                            label='Start date'
                            value={value.startDate}
                            onChange={event => set('startDate', event.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            fullWidth
                            select
                            label='Transport'
                            value={value.transport.mode}
                            onChange={event => setNested('transport', 'mode', event.target.value)}
                        >
                            <MenuItem value=''>Not specified</MenuItem>
                            {TRANSPORT_OPTIONS.map(option => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant='subtitle2' sx={{ mb: 1 }}>
                            Destinations, in travel order
                        </Typography>
                        <Stack spacing={1}>
                            {value.destinations.map((item, index) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <Stack key={index} direction='row' spacing={1} alignItems='center'>
                                    <TextField
                                        size='small'
                                        label='Destination'
                                        value={item.name}
                                        onChange={event => updateDestination(index, 'name', event.target.value)}
                                        sx={{ flex: 1, minWidth: 0 }}
                                    />
                                    <TextField
                                        size='small'
                                        type='number'
                                        label='Nights'
                                        value={item.nights}
                                        onChange={event => updateDestination(index, 'nights', event.target.value)}
                                        inputProps={{ min: 1, max: 30 }}
                                        sx={{ width: 96 }}
                                    />
                                    <IconButton
                                        aria-label={`Remove ${item.name || 'destination'}`}
                                        onClick={() =>
                                            set(
                                                'destinations',
                                                value.destinations.filter((_, position) => position !== index)
                                            )
                                        }
                                    >
                                        <Close fontSize='small' />
                                    </IconButton>
                                </Stack>
                            ))}
                            <Box>
                                <Button
                                    size='small'
                                    startIcon={<Add />}
                                    onClick={() =>
                                        set('destinations', [...value.destinations, { name: '', nights: 1 }])
                                    }
                                >
                                    Add destination
                                </Button>
                            </Box>
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant='subtitle2' sx={{ mb: 1 }}>
                            Must visit
                        </Typography>
                        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 1 }}>
                            {value.requiredAttractions.map(item => (
                                <Chip
                                    key={item.name}
                                    label={item.name}
                                    color='primary'
                                    variant='outlined'
                                    onDelete={() =>
                                        set(
                                            'requiredAttractions',
                                            value.requiredAttractions.filter(place => place.name !== item.name)
                                        )
                                    }
                                />
                            ))}
                        </Stack>
                        <Stack direction='row' spacing={1}>
                            <TextField
                                size='small'
                                fullWidth
                                value={placeInput}
                                onChange={event => setPlaceInput(event.target.value)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault()
                                        addPlace()
                                    }
                                }}
                                placeholder='Add a place, e.g. Rohtang Pass'
                                inputProps={{ 'aria-label': 'Add a must-visit place' }}
                            />
                            <Button onClick={addPlace}>Add</Button>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant='subtitle2' sx={{ mb: 1 }}>
                            Travellers
                        </Typography>
                        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                            <TextField
                                size='small'
                                select
                                label='Type'
                                value={value.travellers.type}
                                onChange={event => setNested('travellers', 'type', event.target.value)}
                                sx={{ minWidth: 120 }}
                            >
                                <MenuItem value=''>Not specified</MenuItem>
                                {TRAVELLER_TYPES.map(type => (
                                    <MenuItem key={type} value={type}>
                                        {capital(type)}
                                    </MenuItem>
                                ))}
                            </TextField>
                            {['adults', 'children', 'seniors'].map(key => (
                                <TextField
                                    key={key}
                                    size='small'
                                    type='number'
                                    label={capital(key)}
                                    value={value.travellers[key] ?? ''}
                                    onChange={event => setNested('travellers', key, event.target.value)}
                                    inputProps={{ min: 0, max: 99 }}
                                    sx={{ width: 96 }}
                                />
                            ))}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant='subtitle2' sx={{ mb: 1 }}>
                            Pace
                        </Typography>
                        <ToggleButtonGroup
                            exclusive
                            size='small'
                            value={value.pace || null}
                            onChange={(_, next) => set('pace', next || '')}
                        >
                            {['relaxed', 'balanced', 'packed'].map(pace => (
                                <ToggleButton key={pace} value={pace}>
                                    {capital(pace)}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant='subtitle2' sx={{ mb: 1 }}>
                            Travel style
                        </Typography>
                        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                            {STYLES.map(style => {
                                const selected = value.styles.includes(style)
                                return (
                                    <Chip
                                        key={style}
                                        label={capital(style)}
                                        color={selected ? 'primary' : 'default'}
                                        variant={selected ? 'filled' : 'outlined'}
                                        onClick={() =>
                                            set(
                                                'styles',
                                                selected
                                                    ? value.styles.filter(item => item !== style)
                                                    : [...value.styles, style]
                                            )
                                        }
                                    />
                                )
                            })}
                        </Stack>
                    </Grid>
                </Grid>
            </Collapse>
        </Stack>
    )
}

TripBriefCard.propTypes = {
    notes: PropTypes.string.isRequired,
    onNotesChange: PropTypes.func.isRequired,
    value: requirementsShape.isRequired,
    onChange: PropTypes.func.isRequired,
    onBuild: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired,
    building: PropTypes.bool,
    hasTrip: PropTypes.bool,
    voice: voiceShape
}

TripBriefCard.defaultProps = { building: false, hasTrip: false, voice: null }

export default TripBriefCard
