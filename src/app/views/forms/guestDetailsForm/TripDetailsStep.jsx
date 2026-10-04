import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useFormik } from 'formik'
import { Box, Button, Collapse, Grid, Stack, TextField, Typography } from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import CustomButton from '@core/components/extended/CustomButton'
import { ChoicePills } from '../packages/tripUi/Choice'
import {
    CONTACT_STATUS,
    HOTEL_CATEGORIES,
    LEAD_QUALITY,
    MEAL_PLANS,
    TRIP_TYPES,
    VEHICLES,
    hasMoreDetails,
    suggestedRooms,
    validateTripDetails,
    withEnquiry
} from './tripDetails'

// ? the fields an enquiry can fill, as the note names them
const FILLED_LABELS = { adults: 'adults', children: 'children', pickupDate: 'start date' }

const formikShape = PropTypes.shape({
    values: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    errors: PropTypes.objectOf(PropTypes.string),
    touched: PropTypes.objectOf(PropTypes.bool),
    submitCount: PropTypes.number,
    handleChange: PropTypes.func,
    handleBlur: PropTypes.func,
    setFieldValue: PropTypes.func
})

function SectionTitle({ children, optional = false }) {
    return (
        <Typography component='h3' sx={{ fontSize: '1rem', fontWeight: 600, mb: 1.5 }}>
            {children}
            {optional ? (
                <Typography
                    component='span'
                    color='text.secondary'
                    sx={{ fontWeight: 400, ml: 1, fontSize: '0.875rem' }}
                >
                    optional
                </Typography>
            ) : null}
        </Typography>
    )
}

SectionTitle.propTypes = { children: PropTypes.node.isRequired, optional: PropTypes.bool }

function Field({
    formik,
    name,
    label,
    type = 'text',
    required = false,
    helper = '',
    placeholder = '',
    multiline = false,
    onChange = null
}) {
    const message = formik.touched[name] || formik.submitCount > 0 ? formik.errors[name] : ''
    const isCount = type === 'number'
    return (
        <TextField
            fullWidth
            id={`trip-${name}`}
            name={name}
            label={label}
            type={type}
            required={required}
            value={formik.values[name] ?? ''}
            onChange={onChange || formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(message)}
            helperText={message || helper || undefined}
            placeholder={placeholder}
            multiline={multiline}
            minRows={multiline ? 2 : undefined}
            InputLabelProps={type === 'date' ? { shrink: true } : undefined}
            inputProps={isCount ? { min: 0, max: 99, inputMode: 'numeric' } : undefined}
        />
    )
}

Field.propTypes = {
    formik: formikShape.isRequired,
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    type: PropTypes.string,
    required: PropTypes.bool,
    helper: PropTypes.string,
    placeholder: PropTypes.string,
    multiline: PropTypes.bool,
    onChange: PropTypes.func
}

function Choice({ formik, name, label, options }) {
    return (
        <Box>
            <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 1 }}>
                {label}
            </Typography>
            <ChoicePills
                name={label}
                options={options}
                value={String(formik.values[name] ?? '')}
                onChange={value => formik.setFieldValue(name, value)}
            />
        </Box>
    )
}

Choice.propTypes = {
    formik: formikShape.isRequired,
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })).isRequired
}

const filled = value => value !== null && value !== undefined && String(value).trim() !== ''

/**
 * Step 1 after a lead is verified: the trip in a few answers. Adults and the start date are the only
 * required ones — enough to quote — and the rest waits behind "More details" until the guest says it.
 */
function TripDetailsStep({ initialValues, isNew, onSave, saving = false, error = '', enquiry = '' }) {
    // ? a new trip starts from what the guest's enquiry already says (adults, children, start date)
    const prefilled = useMemo(
        () => (isNew ? withEnquiry(initialValues, enquiry) : { values: initialValues, used: [] }),
        [initialValues, isNew, enquiry]
    )
    const [showMore, setShowMore] = useState(() => hasMoreDetails(prefilled.values))
    // ? rooms follow the party size (two adults to a room) until the agent sets them
    const [roomsSetByAgent, setRoomsSetByAgent] = useState(() => filled(prefilled.values.rooms))

    const formik = useFormik({
        initialValues: prefilled.values,
        enableReinitialize: true,
        validate: validateTripDetails,
        validateOnChange: false,
        onSubmit: values => onSave(values)
    })

    useEffect(() => {
        setShowMore(open => open || hasMoreDetails(initialValues))
        setRoomsSetByAgent(filled(initialValues.rooms))
    }, [initialValues])

    const onAdultsChange = event => {
        formik.handleChange(event)
        if (!roomsSetByAgent) formik.setFieldValue('rooms', suggestedRooms(event.target.value))
    }

    const onRoomsChange = event => {
        setRoomsSetByAgent(true)
        formik.handleChange(event)
    }

    const roomsSuggested = !roomsSetByAgent && filled(formik.values.rooms)

    return (
        <Box component='form' noValidate onSubmit={formik.handleSubmit} sx={{ maxWidth: 760 }}>
            <Typography component='h2' sx={{ fontSize: { xs: '1.375rem', md: '1.625rem' }, fontWeight: 600 }}>
                Trip details
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: '1rem', mt: 0.75, mb: 4 }}>
                Only the number of adults and the start date are needed to build a quote. Add the rest whenever the
                guest tells you.
            </Typography>

            {String(enquiry || '').trim() ? (
                // ? what the guest wrote (Facebook form answers, the email) — so it is read here, not typed again
                <Box
                    component='section'
                    aria-label='The guest’s enquiry'
                    sx={{
                        mb: 4,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                        The guest’s enquiry
                    </Typography>
                    <Typography
                        sx={{ fontSize: '0.9375rem', whiteSpace: 'pre-line', maxHeight: 180, overflowY: 'auto' }}
                    >
                        {String(enquiry).trim()}
                    </Typography>
                    {prefilled.used.length ? (
                        <Typography role='status' sx={{ fontSize: '0.8125rem', color: 'primary.main', mt: 1 }}>
                            Filled in from the enquiry: {prefilled.used.map(field => FILLED_LABELS[field]).join(', ')}.
                            Check them before saving.
                        </Typography>
                    ) : null}
                </Box>
            ) : null}

            <Stack spacing={4}>
                <Box>
                    <SectionTitle>Who’s travelling</SectionTitle>
                    <Grid container spacing={2}>
                        <Grid item xs={4} sm={3}>
                            <Field
                                formik={formik}
                                name='adults'
                                label='Adults'
                                type='number'
                                required
                                onChange={onAdultsChange}
                            />
                        </Grid>
                        <Grid item xs={4} sm={3}>
                            <Field formik={formik} name='children' label='Children' type='number' />
                        </Grid>
                        <Grid item xs={4} sm={3}>
                            <Field
                                formik={formik}
                                name='rooms'
                                label='Rooms'
                                type='number'
                                onChange={onRoomsChange}
                                helper={roomsSuggested ? 'Suggested' : ''}
                            />
                        </Grid>
                    </Grid>
                </Box>

                <Box>
                    <SectionTitle>When</SectionTitle>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Field formik={formik} name='pickupDate' label='Start date' type='date' required />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Field formik={formik} name='dropDate' label='End date' type='date' />
                        </Grid>
                    </Grid>
                </Box>

                <Box>
                    <SectionTitle optional>Stay</SectionTitle>
                    <Stack spacing={2.5}>
                        <Choice formik={formik} name='packageType' label='Hotel category' options={HOTEL_CATEGORIES} />
                        <Choice formik={formik} name='foodPlan' label='Meals' options={MEAL_PLANS} />
                        <Field
                            formik={formik}
                            name='pickupLocation'
                            label='Pickup from'
                            placeholder='e.g. Chandigarh airport'
                        />
                    </Stack>
                </Box>

                <Box>
                    <Button
                        onClick={() => setShowMore(open => !open)}
                        endIcon={showMore ? <ExpandLess /> : <ExpandMore />}
                        aria-expanded={showMore}
                        aria-controls='trip-more-details'
                        sx={{ px: 0.5, color: 'text.secondary', textTransform: 'none', fontSize: '0.9375rem' }}
                    >
                        More details
                    </Button>
                    <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', px: 0.5 }}>
                        Drop point, vehicle, trip type, extra beds, lead quality, notes
                    </Typography>
                    <Collapse in={showMore}>
                        <Stack id='trip-more-details' spacing={2.5} sx={{ pt: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Field
                                        formik={formik}
                                        name='dropLocation'
                                        label='Drop at'
                                        placeholder='e.g. Delhi railway station'
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Field
                                        formik={formik}
                                        name='originState'
                                        label='Guest is from'
                                        placeholder='State or city'
                                    />
                                </Grid>
                            </Grid>
                            <Choice formik={formik} name='tourType' label='Trip type' options={TRIP_TYPES} />
                            <Choice formik={formik} name='taxiType' label='Vehicle' options={VEHICLES} />
                            <Box sx={{ maxWidth: 180 }}>
                                <Field formik={formik} name='extraBedding' label='Extra beds' type='number' />
                            </Box>
                            <Choice formik={formik} name='contactQuality' label='Lead quality' options={LEAD_QUALITY} />
                            <Choice
                                formik={formik}
                                name='contactStatus'
                                label='Contact status'
                                options={CONTACT_STATUS}
                            />
                            <Field formik={formik} name='leadRemarks' label='Notes' multiline />
                        </Stack>
                    </Collapse>
                </Box>

                <Box>
                    {error ? (
                        <Typography color='error' role='alert' sx={{ fontSize: '0.9375rem', mb: 2 }}>
                            {error}
                        </Typography>
                    ) : null}
                    <CustomButton type='submit' loading={saving} sx={{ px: 4, textTransform: 'none' }}>
                        {isNew ? 'Save and build the itinerary' : 'Save and go to the itinerary'}
                    </CustomButton>
                </Box>
            </Stack>
        </Box>
    )
}

TripDetailsStep.propTypes = {
    initialValues: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
    isNew: PropTypes.bool.isRequired,
    onSave: PropTypes.func.isRequired,
    saving: PropTypes.bool,
    error: PropTypes.string,
    enquiry: PropTypes.string
}

export default TripDetailsStep
