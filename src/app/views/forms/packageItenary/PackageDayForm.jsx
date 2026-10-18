import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useFormik } from 'formik'
import { useDispatch } from 'react-redux'
import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    MenuItem,
    Skeleton,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { CheckCircle } from '@mui/icons-material'
import FormField from '@core/components/FormField'
import { getItenaryClients, useUpdateItenaryClientMutation } from '@/app/store/slices/api/itenarySlice'
import { getDestinationClients } from '@/app/store/slices/api/destinationSlice'
import { getTravelImages } from '@/app/store/slices/api/aiSlice'
import {
    useCreatePackageItenaryClientMutation,
    useUpdatePackageItenaryClientMutation
} from '@/app/store/slices/api/packageItenarySlice'
import { ENTRY_TYPES, isStay, positionChoices } from './packageDayFacts'

const SEARCH_WAIT_MS = 500
const MIN_SEARCH = 2

const blank = (position = '') => ({
    itenaryId: '',
    destinationId: '',
    description: '',
    image: '',
    entryType: 'Stay',
    position
})

// ? what a search box sends to the server: nothing until two letters
const searchTerm = text => (text.trim().length >= MIN_SEARCH ? text.trim() : '')

/** @description one search-as-you-type pick (an itinerary or a destination) */
function PickField({ label, required, options, value, loading, onSearch, onPick, labelOf, helperText, disabled }) {
    return (
        <Autocomplete
            size='small'
            disabled={disabled}
            options={options}
            value={value}
            loading={loading}
            // ? the server did the searching
            filterOptions={list => list}
            getOptionLabel={labelOf}
            isOptionEqualToValue={(option, chosen) => option.id === chosen.id}
            onInputChange={(_, text, reason) => {
                if (reason === 'input') onSearch(text)
            }}
            onChange={(_, picked) => onPick(picked)}
            noOptionsText={`Type at least ${MIN_SEARCH} letters to search`}
            renderInput={params => (
                <TextField
                    // eslint-disable-next-line react/jsx-props-no-spreading -- the picker hands these over as props
                    {...params}
                    label={label}
                    required={required}
                    helperText={helperText || ' '}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color='inherit' size={16} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        )
                    }}
                />
            )}
        />
    )
}

PickField.propTypes = {
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    options: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })).isRequired,
    value: PropTypes.shape({ id: PropTypes.number }),
    loading: PropTypes.bool,
    onSearch: PropTypes.func.isRequired,
    onPick: PropTypes.func.isRequired,
    labelOf: PropTypes.func.isRequired,
    helperText: PropTypes.string,
    disabled: PropTypes.bool
}

/**
 * Add a day to the package (at the end, the start, or after a chosen day), or change one.
 */
export default function PackageDayForm({
    packageId,
    campaignId,
    days,
    editingDay,
    insertIndex,
    onSaved,
    onCancelEdit,
    say
}) {
    const dispatch = useDispatch()
    const [createDay] = useCreatePackageItenaryClientMutation()
    const [updateDay] = useUpdatePackageItenaryClientMutation()
    const [updateItenary] = useUpdateItenaryClientMutation()

    const [itenaries, setItenaries] = useState([])
    const [destinations, setDestinations] = useState([])
    const [itenaryText, setItenaryText] = useState('')
    const [destinationText, setDestinationText] = useState('')
    const [searchItenary, setSearchItenary] = useState('')
    const [searchDestination, setSearchDestination] = useState('')
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [images, setImages] = useState([])
    const [loadingImages, setLoadingImages] = useState(false)

    const positions = positionChoices(days)
    const endPosition = days.length

    const formik = useFormik({
        initialValues: blank(String(endPosition)),
        validate: values => {
            const problems = {}
            if (!values.itenaryId) problems.itenaryId = 'Choose what happens on this day'
            if (!values.entryType) problems.entryType = 'Choose a type'
            return problems
        },
        onSubmit: async values => {
            const itenaryId = parseInt(values.itenaryId, 10)
            const picked = itenaries.find(item => item.id === itenaryId) || editingDay?.itenary
            const description = values.description.trim()
            try {
                // ? the text belongs to the itinerary itself: changing it here changes it everywhere it is used
                if (picked && picked.id && description !== (picked.description || '').trim()) {
                    await updateItenary({
                        id: picked.id,
                        title: picked.title,
                        description,
                        campaignId: picked.campaignId || campaignId
                    }).unwrap()
                }
                const payload = {
                    packageId,
                    campaignId: parseInt(campaignId, 10),
                    itenaryId,
                    destinationId:
                        isStay(values.entryType) && values.destinationId ? parseInt(values.destinationId, 10) : null,
                    image: values.image,
                    entryType: values.entryType
                }
                const response = editingDay?.id
                    ? await updateDay({ id: editingDay.id, ...payload }).unwrap()
                    : await createDay({ ...payload, position: parseInt(values.position, 10) }).unwrap()
                if (response?.success || response?.status_code === 200) {
                    say(editingDay?.id ? 'Day saved' : 'Day added', false)
                    onSaved()
                }
            } catch (error) {
                say(
                    error?.data?.data?.message || error?.data?.message || 'Couldn’t save the day. Please try again.',
                    true
                )
            }
        }
    })

    // ? the form starts again after a save, a cancel, or a new place chosen with "Add a day here"
    useEffect(() => {
        if (editingDay) {
            formik.setValues({
                itenaryId: editingDay.itenaryId ? String(editingDay.itenaryId) : '',
                destinationId: editingDay.destinationId ? String(editingDay.destinationId) : '',
                description: editingDay.itenary?.description || '',
                image: editingDay.image || '',
                entryType: editingDay.entryType || 'Stay',
                position: ''
            })
        } else {
            formik.resetForm({ values: blank(String(insertIndex ?? endPosition)) })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingDay?.id, insertIndex, days.length])

    // ? the search words wait for a pause in typing
    useEffect(() => {
        const timer = setTimeout(() => setSearchItenary(searchTerm(itenaryText)), SEARCH_WAIT_MS)
        return () => clearTimeout(timer)
    }, [itenaryText])
    useEffect(() => {
        const timer = setTimeout(() => setSearchDestination(searchTerm(destinationText)), SEARCH_WAIT_MS)
        return () => clearTimeout(timer)
    }, [destinationText])

    // ? the itineraries and destinations of this package's trip
    useEffect(() => {
        let cancelled = false
        const query = search => {
            const params = new URLSearchParams()
            if (campaignId) params.set('campaignId', campaignId)
            if (search) params.set('search', search)
            return `?${params.toString()}`
        }
        setLoadingOptions(true)
        Promise.all([
            dispatch(getItenaryClients.initiate(query(searchItenary), false)),
            dispatch(getDestinationClients.initiate(query(searchDestination), false))
        ])
            .then(([itenaryReply, destinationReply]) => {
                if (cancelled) return
                setItenaries(itenaryReply?.data?.data || [])
                setDestinations(destinationReply?.data?.data || [])
            })
            .finally(() => !cancelled && setLoadingOptions(false))
        return () => {
            cancelled = true
        }
    }, [dispatch, campaignId, searchItenary, searchDestination])

    // ? what is chosen stays pickable even when the search no longer lists it (editing a saved day)
    const withChosen = (list, chosen) =>
        chosen && !list.some(item => item.id === chosen.id) ? [chosen, ...list] : list
    const chosenItenary =
        itenaries.find(item => String(item.id) === String(formik.values.itenaryId)) ||
        (editingDay?.itenary && String(editingDay.itenaryId) === String(formik.values.itenaryId)
            ? { id: editingDay.itenaryId, title: editingDay.itenary.title, description: editingDay.itenary.description }
            : null)
    const chosenDestination =
        destinations.find(item => String(item.id) === String(formik.values.destinationId)) ||
        (editingDay?.destination && String(editingDay.destinationId) === String(formik.values.destinationId)
            ? editingDay.destination
            : null)

    // ? suggested photos for the place or the itinerary
    useEffect(() => {
        const keyword = chosenDestination?.name || chosenItenary?.title
        if (!keyword) return undefined
        let cancelled = false
        setLoadingImages(true)
        dispatch(getTravelImages.initiate(keyword))
            .then(reply => !cancelled && setImages(reply.data?.urls || []))
            .catch(() => !cancelled && setImages([]))
            .finally(() => !cancelled && setLoadingImages(false))
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.destinationId, formik.values.itenaryId])

    const pickItenary = picked => {
        formik.setFieldValue('itenaryId', picked ? String(picked.id) : '')
        formik.setFieldValue('description', picked?.description || '')
    }

    const stay = isStay(formik.values.entryType)
    const dayNumber = editingDay ? days.findIndex(day => day.id === editingDay.id) + 1 : 0
    let positionHint = 'Move it later with the arrows, or by dragging'
    if (days.length === 0) positionHint = 'This will be the first day'

    return (
        <Box
            component='section'
            sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: { xs: 2, sm: 2.5 },
                bgcolor: 'background.paper'
            }}
        >
            <Typography component='h2' sx={{ fontSize: '1.0625rem', fontWeight: 600 }}>
                {editingDay ? `Edit Day ${dayNumber}` : 'Add a day'}
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 2 }}>
                {editingDay
                    ? 'Change what happens on this day. To move it, use the arrows in the list.'
                    : 'Choose where it goes and what happens. Days after it move down.'}
            </Typography>

            <Box
                component='form'
                noValidate
                onSubmit={formik.handleSubmit}
                sx={{ display: 'grid', rowGap: 1, '& .MuiButton-root': { textTransform: 'none' } }}
            >
                {editingDay ? null : (
                    <FormField
                        formik={formik}
                        name='position'
                        label='Where in the trip?'
                        select
                        helperText={positionHint}
                    >
                        {positions.map(choice => (
                            <MenuItem key={choice.value} value={String(choice.value)}>
                                {choice.label}
                            </MenuItem>
                        ))}
                    </FormField>
                )}

                <Box sx={{ mb: 0.5 }}>
                    <PickField
                        label='Itinerary'
                        required
                        options={withChosen(itenaries, chosenItenary)}
                        value={chosenItenary}
                        loading={loadingOptions}
                        onSearch={setItenaryText}
                        onPick={pickItenary}
                        labelOf={option => option.title || ''}
                        helperText={
                            formik.touched.itenaryId && formik.errors.itenaryId
                                ? formik.errors.itenaryId
                                : 'What the guest does — search by name'
                        }
                    />
                </Box>

                <FormField formik={formik} name='entryType' label='Type of day' select required>
                    {ENTRY_TYPES.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                            {type.label} — {type.hint}
                        </MenuItem>
                    ))}
                </FormField>

                <Box sx={{ mb: 0.5 }}>
                    <PickField
                        label='Destination'
                        options={withChosen(destinations, chosenDestination)}
                        value={stay ? chosenDestination : null}
                        loading={loadingOptions}
                        disabled={!stay}
                        onSearch={setDestinationText}
                        onPick={picked => formik.setFieldValue('destinationId', picked ? String(picked.id) : '')}
                        labelOf={option => option.name || ''}
                        helperText={
                            stay
                                ? 'Where they stay the night. Its hotels are offered in the quote'
                                : 'Not needed for a day of travel'
                        }
                    />
                </Box>

                <FormField
                    formik={formik}
                    name='description'
                    label='Description'
                    multiline
                    minRows={4}
                    helperText='Saved on the itinerary itself, so it changes everywhere this itinerary is used'
                />

                <FormField
                    formik={formik}
                    name='image'
                    label='Image link (optional)'
                    helperText='Paste a link, or pick one below'
                />

                {loadingImages || images.length > 0 ? (
                    <Box sx={{ mb: 2 }}>
                        <Typography
                            variant='caption'
                            sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.75 }}
                        >
                            SUGGESTED IMAGES — click to use
                        </Typography>
                        {loadingImages ? (
                            <Stack direction='row' spacing={1}>
                                {[1, 2, 3].map(key => (
                                    <Skeleton key={key} variant='rounded' width={110} height={74} />
                                ))}
                            </Stack>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {images.map((image, index) => (
                                    <Box
                                        key={image.name || image.url}
                                        component='button'
                                        type='button'
                                        aria-label={`Use suggested image ${index + 1}`}
                                        onClick={() => formik.setFieldValue('image', image.url)}
                                        sx={{
                                            p: 0,
                                            cursor: 'pointer',
                                            borderRadius: 1.5,
                                            overflow: 'hidden',
                                            border: '3px solid',
                                            borderColor:
                                                formik.values.image === image.url ? 'primary.main' : 'transparent',
                                            position: 'relative',
                                            background: 'none'
                                        }}
                                    >
                                        <Box
                                            component='img'
                                            src={image.thumb}
                                            alt=''
                                            sx={{ width: 110, height: 74, objectFit: 'cover', display: 'block' }}
                                        />
                                        {formik.values.image === image.url ? (
                                            <CheckCircle
                                                sx={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    fontSize: 18,
                                                    color: 'primary.main',
                                                    bgcolor: '#fff',
                                                    borderRadius: '50%'
                                                }}
                                            />
                                        ) : null}
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                ) : null}

                <Stack direction='row' spacing={1.5} justifyContent='flex-end' sx={{ mt: 1 }}>
                    {editingDay ? (
                        <Button onClick={onCancelEdit} disabled={formik.isSubmitting}>
                            Cancel
                        </Button>
                    ) : null}
                    <Button
                        type='submit'
                        variant='contained'
                        disabled={formik.isSubmitting}
                        startIcon={formik.isSubmitting ? <CircularProgress size={16} color='inherit' /> : null}
                    >
                        {editingDay ? 'Save changes' : 'Add day'}
                    </Button>
                </Stack>
            </Box>
        </Box>
    )
}

PackageDayForm.propTypes = {
    packageId: PropTypes.string.isRequired,
    campaignId: PropTypes.string,
    days: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })).isRequired,
    editingDay: PropTypes.shape({
        id: PropTypes.number,
        itenaryId: PropTypes.number,
        destinationId: PropTypes.number,
        image: PropTypes.string,
        entryType: PropTypes.string,
        itenary: PropTypes.shape({ title: PropTypes.string, description: PropTypes.string }),
        destination: PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })
    }),
    insertIndex: PropTypes.number,
    onSaved: PropTypes.func.isRequired,
    onCancelEdit: PropTypes.func.isRequired,
    say: PropTypes.func.isRequired
}
