import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Autocomplete,
    Box,
    Button,
    ButtonBase,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Stack,
    TextField,
    Typography,
    useMediaQuery
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Close, ExpandLess, ExpandMore } from '@mui/icons-material'
import { ChoicePills } from '../../packages/tripUi/Choice'
import { ENTRY_TYPES, isStayType } from './quoteDays'
import { dayFormShape } from './shapes'

const HOTEL_FIELDS = [
    { name: 'delux_hotel', label: 'Deluxe' },
    { name: 'super_delux_hotel', label: 'Super Deluxe' },
    { name: 'luxury_hotel', label: 'Luxury' },
    { name: 'premium_hotel', label: 'Premium' }
]

const optionShape = PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) })

/**
 * Add or edit one day of a quote. Picking a saved day or destination fills in its text and hotels; typing a
 * new one creates it for the lead's campaign when the day is saved.
 */
function DayEditor({
    open,
    onClose,
    isEditing,
    saving = false,
    day,
    onChange,
    titleOptions,
    titleValue = null,
    titleInput,
    loadingTitles = false,
    onTitleInput,
    onTitlePick,
    destinationOptions,
    destinationValue = null,
    destinationInput,
    loadingDestinations = false,
    onDestinationInput,
    onDestinationPick,
    aiBusy = false,
    images = [],
    loadingImages = false,
    onSave
}) {
    const theme = useTheme()
    const phone = useMediaQuery(theme.breakpoints.down('sm'))
    const [showHotels, setShowHotels] = useState(false)
    const [showLink, setShowLink] = useState(false)
    const stays = isStayType(day.entryType)
    const place = (day.destinationName || '').trim()
    const hotelsFilled = HOTEL_FIELDS.filter(field => (day[field.name] || '').trim()).length

    useEffect(() => {
        if (!open) return
        setShowHotels(false)
        setShowLink(false)
    }, [open])

    let descriptionHelp = 'Saved as a new reusable day when you save.'
    if (day.itenaryId) descriptionHelp = `Also updates the saved day “${day.title || ''}” that your packages use.`
    if (!day.title?.trim()) descriptionHelp = ''

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={phone}
            maxWidth='sm'
            fullWidth
            sx={{ '& .MuiButton-root': { textTransform: 'none' }, '& .MuiInputBase-input': { fontSize: '1rem' } }}
        >
            <DialogTitle sx={{ pr: 7 }}>
                {isEditing ? 'Edit day' : 'Add a day'}
                <IconButton aria-label='Close' onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3}>
                    <Box>
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 1 }}>
                            Kind of day
                        </Typography>
                        <ChoicePills
                            name='Kind of day'
                            options={ENTRY_TYPES}
                            value={day.entryType || 'Stay'}
                            onChange={value => value && onChange('entryType', value)}
                        />
                    </Box>

                    <Autocomplete
                        freeSolo
                        options={titleOptions}
                        loading={loadingTitles}
                        filterOptions={options => options}
                        getOptionLabel={option => (typeof option === 'string' ? option : option?.title || '')}
                        value={titleValue}
                        inputValue={titleInput}
                        onInputChange={(event, value, reason) => {
                            if (reason === 'input') onTitleInput(value)
                        }}
                        onChange={(event, selected) => onTitlePick(selected)}
                        isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
                        renderInput={params => (
                            <TextField
                                // eslint-disable-next-line react/jsx-props-no-spreading
                                {...params}
                                label='Day title'
                                helperText='Pick a saved day, or type a new title.'
                            />
                        )}
                    />

                    {stays ? (
                        <Autocomplete
                            freeSolo
                            options={destinationOptions}
                            loading={loadingDestinations}
                            filterOptions={options => options}
                            getOptionLabel={option => (typeof option === 'string' ? option : option?.name || '')}
                            value={destinationValue}
                            inputValue={destinationInput}
                            onInputChange={(event, value, reason) => {
                                if (reason === 'input') onDestinationInput(value)
                            }}
                            onChange={(event, selected) => onDestinationPick(selected)}
                            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
                            renderInput={params => (
                                <TextField
                                    // eslint-disable-next-line react/jsx-props-no-spreading
                                    {...params}
                                    label='Staying in'
                                    helperText='Pick a destination, or type a new one.'
                                />
                            )}
                        />
                    ) : null}

                    <Box>
                        <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            label='What the guest does'
                            value={day.description || ''}
                            onChange={event => onChange('description', event.target.value)}
                            helperText={descriptionHelp || undefined}
                        />
                        {aiBusy ? (
                            <Stack direction='row' spacing={1} alignItems='center' sx={{ mt: 1 }} role='status'>
                                <CircularProgress size={14} />
                                <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                                    Filling in the description{stays ? ' and hotels' : ''}…
                                </Typography>
                            </Stack>
                        ) : null}
                    </Box>

                    {stays && place ? (
                        <Box>
                            <Button
                                onClick={() => setShowHotels(value => !value)}
                                endIcon={showHotels ? <ExpandLess /> : <ExpandMore />}
                                aria-expanded={showHotels}
                                sx={{ px: 0.5 }}
                            >
                                Hotels in {place}
                            </Button>
                            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', px: 0.5 }}>
                                {hotelsFilled} of 4 categories filled · saved to {place} for every quote
                            </Typography>
                            <Collapse in={showHotels}>
                                <Grid container spacing={1.5} sx={{ pt: 2 }}>
                                    {HOTEL_FIELDS.map(field => (
                                        <Grid item xs={12} sm={6} key={field.name}>
                                            <TextField
                                                fullWidth
                                                multiline
                                                minRows={2}
                                                label={field.label}
                                                value={day[field.name] || ''}
                                                placeholder='Hotel A | Hotel B'
                                                onChange={event => onChange(field.name, event.target.value)}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Collapse>
                        </Box>
                    ) : null}

                    <Box>
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 1 }}>
                            Photo
                        </Typography>
                        {loadingImages ? (
                            <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                                Finding photos…
                            </Typography>
                        ) : null}
                        {images.length ? (
                            <Stack direction='row' spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                                {images.map(img => (
                                    <ButtonBase
                                        key={img.url}
                                        onClick={() => onChange('image', img.url)}
                                        aria-label='Use this photo'
                                        aria-pressed={day.image === img.url}
                                        sx={{
                                            flexShrink: 0,
                                            borderRadius: 1.5,
                                            overflow: 'hidden',
                                            outline: day.image === img.url ? '2px solid' : 'none',
                                            outlineColor: 'primary.main',
                                            outlineOffset: 2
                                        }}
                                    >
                                        <Box
                                            component='img'
                                            src={img.thumb || img.url}
                                            alt=''
                                            sx={{ width: 104, height: 72, objectFit: 'cover', display: 'block' }}
                                        />
                                    </ButtonBase>
                                ))}
                            </Stack>
                        ) : null}
                        {day.image && !images.some(img => img.url === day.image) ? (
                            <Box
                                component='img'
                                src={day.image}
                                alt=''
                                sx={{
                                    width: 160,
                                    aspectRatio: '4 / 3',
                                    objectFit: 'cover',
                                    borderRadius: 1.5,
                                    display: 'block'
                                }}
                            />
                        ) : null}
                        <Button size='small' onClick={() => setShowLink(value => !value)} sx={{ mt: 1, ml: -0.75 }}>
                            {showLink ? 'Hide the link' : 'Use a link instead'}
                        </Button>
                        <Collapse in={showLink}>
                            <TextField
                                fullWidth
                                label='Photo link'
                                value={day.image || ''}
                                onChange={event => onChange('image', event.target.value)}
                                sx={{ mt: 1 }}
                            />
                        </Collapse>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant='contained'
                    onClick={onSave}
                    disabled={saving || !day.title?.trim()}
                    startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                >
                    {isEditing ? 'Save day' : 'Add day'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

DayEditor.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    isEditing: PropTypes.bool.isRequired,
    saving: PropTypes.bool,
    day: dayFormShape.isRequired,
    onChange: PropTypes.func.isRequired,
    titleOptions: PropTypes.arrayOf(optionShape).isRequired,
    titleValue: PropTypes.oneOfType([PropTypes.string, optionShape]),
    titleInput: PropTypes.string.isRequired,
    loadingTitles: PropTypes.bool,
    onTitleInput: PropTypes.func.isRequired,
    onTitlePick: PropTypes.func.isRequired,
    destinationOptions: PropTypes.arrayOf(optionShape).isRequired,
    destinationValue: PropTypes.oneOfType([PropTypes.string, optionShape]),
    destinationInput: PropTypes.string.isRequired,
    loadingDestinations: PropTypes.bool,
    onDestinationInput: PropTypes.func.isRequired,
    onDestinationPick: PropTypes.func.isRequired,
    aiBusy: PropTypes.bool,
    images: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string, thumb: PropTypes.string })),
    loadingImages: PropTypes.bool,
    onSave: PropTypes.func.isRequired
}

export default DayEditor
