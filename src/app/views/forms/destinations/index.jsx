import React, { useState, useEffect, useRef } from 'react'
import { z } from 'zod'
import { useFormik } from 'formik'

// router
import { useParams, useNavigate, useLocation } from 'react-router-dom'

// theme components
import { Box, MenuItem } from '@mui/material'

// components
import FormPage from '@core/components/FormPage'
import FormSection, { formColumns } from '@core/components/FormSection'
import FormField from '@core/components/FormField'

// redux imports
import { useDispatch, useSelector } from 'react-redux'
import {
    useCreateDestinationClientMutation,
    useUpdateDestinationClientMutation,
    getDestinationClientById
} from '@/app/store/slices/api/destinationSlice'

import { getCampaigns } from '@/app/store/slices/api/campaignSlice'
import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'
import { useAssistAiMutation } from '@/app/store/slices/api/aiSlice'
import { HOTEL_FIELDS, HOTELS_PER_CATEGORY, buildHotelRequest, parseHotelReply } from './hotelSuggestions'
import DestinationSuggestions from './DestinationSuggestions'

// ? what each category means, so an agent files a hotel under the right one
const HOTEL_HINTS = {
    delux_hotel: 'Good-value 3-star stays',
    super_delux_hotel: 'Upscale 4-star stays',
    luxury_hotel: '5-star and well-known luxury hotels',
    premium_hotel: 'The most exclusive stays in the destination'
}

function DestinationClientsForm() {
    // Note: Assuming `id` in useParams is the DestinationClients ID for editing
    const { id: formId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const campaignContextId = location.state?.campaignId

    // Hooks for creating/updating destinations
    const [createDestinationClient] = useCreateDestinationClientMutation()
    const [updateDestinationClient] = useUpdateDestinationClientMutation()

    // Hook to fetch all campaigns for the dropdown list
    // const { data: campaignsData, isLoading: campaignsLoading } = useGetAllCampaignsQuery()

    const [, setEditData] = useState({})
    // ? which hotel lists were empty (null) when the destination was loaded
    const nullHotelsRef = useRef({})
    const [campaignsData, setcampaignsData] = useState([])

    // Assuming you will use appropriate loading keys for destination operations
    const { createDestinationLKey, updateDestinationLKey } = useSelector(state => state.loading || {})

    const dispatch = useDispatch()

    // --- Initial Values and Validation Schema ---

    const initialValues = {
        name: '', // Destination name
        campaignId: campaignContextId?.toString() || '', // Foreign key to CampaignClient
        delux_hotel: '',
        super_delux_hotel: '',
        luxury_hotel: '',
        premium_hotel: ''
    }

    // Validation schema for DestinationClient fields
    const validationSchema = z.object({
        name: z.string().min(3, 'Destination Name must be at least 3 characters'),
        campaignId: z.number({ invalid_type_error: 'Campaign is required' }).int().positive(),
        delux_hotel: z.string().optional().nullable(),
        super_delux_hotel: z.string().optional().nullable(),
        luxury_hotel: z.string().optional().nullable(),
        premium_hotel: z.string().optional().nullable()
    })

    const validate = values => {
        try {
            // Convert campaignId to number for Zod validation
            const parsedValues = {
                ...values,
                campaignId: values.campaignId ? parseInt(values?.campaignId, 10) : ''
            }
            validationSchema.parse(parsedValues)
            return {}
        } catch (error) {
            const formikErrors = {}
            error.errors.forEach(err => {
                formikErrors[err.path[0]] = err.message
            })
            return formikErrors
        }
    }

    // --- Formik Setup ---

    const formik = useFormik({
        initialValues,
        validate,
        onSubmit: async values => {
            try {
                // Ensure campaignId is an integer before sending
                const payload = {
                    ...values,
                    campaignId: parseInt(values.campaignId, 10)
                }
                // ? a hotel list that was empty (null) in the database and is still untouched is sent as it was
                HOTEL_FIELDS.forEach(({ field }) => {
                    if (payload[field] === '' && nullHotelsRef.current[field]) payload[field] = null
                })

                let response
                if (formId) {
                    // Update existing destination
                    response = await updateDestinationClient({ id: formId, ...payload }).unwrap()
                } else {
                    // Create new destination
                    response = await createDestinationClient(payload).unwrap()
                }
                if (response.success || response.status_code === 200) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: response.message || 'Destination saved successfully!',
                            variant: 'alert',
                            alert: { color: 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                    // Navigate to the list view after submission
                    navigate(-1)
                } else {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: response?.message || 'The destination could not be saved',
                            variant: 'alert',
                            alert: { color: 'error' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                }
            } catch (error) {
                // ... (Error handling remains similar to your original code)
                if (error.data?.data?.errors) {
                    const backendErrors = error.data.data.errors
                    const formikErrors = {}

                    Object.entries(backendErrors).forEach(([field, messages]) => {
                        formikErrors[field] = messages.join(', ')
                    })
                    formik.setErrors(formikErrors)
                } else {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: error.data?.data?.message || 'An error occurred, please try again',
                            variant: 'alert',
                            alert: { color: 'error' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                }
            }
        },
        validateOnBlur: true,
        validateOnChange: true
    })

    // --- Hotel suggestions: the top hotels of the destination, filled in as the name is typed ---

    const [assistAi] = useAssistAiMutation()
    const [hotelStatus, setHotelStatus] = useState({ state: 'idle', place: '' })
    // ? what the AI last put in each field — a field still holding it may be replaced, one the agent typed may not
    const aiFilledRef = useRef({})
    const requestRef = useRef(0)
    const valuesRef = useRef(formik.values)
    valuesRef.current = formik.values

    const replaceable = field => {
        const current = (valuesRef.current[field] || '').trim()
        return !current || current === aiFilledRef.current[field]
    }

    const suggestHotels = async ({ replaceAll = false } = {}) => {
        const place = (valuesRef.current.name || '').trim()
        if (place.length < 3) return
        requestRef.current += 1
        const request = requestRef.current
        setHotelStatus({ state: 'loading', place })
        try {
            const response = await assistAi(buildHotelRequest(place)).unwrap()
            // ? a newer name was typed while this one was being looked up
            if (request !== requestRef.current) return
            const { hotels, count } = parseHotelReply(response, place)
            HOTEL_FIELDS.forEach(({ field }) => {
                if (hotels[field] && (replaceAll || replaceable(field))) {
                    formik.setFieldValue(field, hotels[field])
                    aiFilledRef.current[field] = hotels[field]
                }
            })
            setHotelStatus({ state: count ? 'done' : 'empty', place })
        } catch (error) {
            if (request === requestRef.current) setHotelStatus({ state: 'error', place })
        }
    }

    // ? a new destination gets suggestions once its name has been typed; editing one never overwrites silently
    useEffect(() => {
        const place = (formik.values.name || '').trim()
        if (formId || place.length < 3 || place === hotelStatus.place) return undefined
        if (!HOTEL_FIELDS.some(({ field }) => replaceable(field))) return undefined
        const timer = setTimeout(() => suggestHotels(), 900)
        return () => clearTimeout(timer)
        // ? runs on the name only; suggestHotels reads the latest form values through a ref
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.name, formId])

    const allTypedByAgent = !HOTEL_FIELDS.some(({ field }) => replaceable(field))
    let suggestLabel = 'Suggest again'
    if (hotelStatus.state === 'idle') suggestLabel = 'Suggest hotels'
    if (allTypedByAgent) suggestLabel = 'Replace with suggestions'

    // --- Data Fetching and Edit Logic ---

    const getDestinationData = async id => {
        const { data, error } = await dispatch(getDestinationClientById.initiate(id))
        if (error) return

        if (data && data?.data && objectLength(data.data)) {
            setEditData(data.data)

            // Set form values for editing
            const destinationData = data.data
            const hotels = {}
            HOTEL_FIELDS.forEach(({ field }) => {
                nullHotelsRef.current[field] = destinationData[field] === null || destinationData[field] === undefined
                hotels[field] = destinationData[field] ?? ''
            })
            formik.setValues({
                ...destinationData,
                ...hotels,
                campaignId: destinationData.campaignId.toString() // Convert number to string for Select component
            })
        }
    }

    useEffect(() => {
        if (formId) getDestinationData(formId)
    }, [formId])

    useEffect(() => {
        if (formId || !campaignContextId) return
        formik.setFieldValue('campaignId', campaignContextId.toString())
    }, [formId, campaignContextId])

    // --- Campaigns for the dropdown ---

    const campaignOptions = (campaignsData || []).map(camp => ({
        label: camp.title,
        value: camp.id.toString()
    }))

    const getCampaignsFunc = async () => {
        const { data: response } = await dispatch(getCampaigns.initiate())
        setcampaignsData(response?.data || [])
    }
    useEffect(() => {
        getCampaignsFunc()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const canSuggest = (formik.values.name || '').trim().length >= 3

    return (
        <FormPage
            eyebrow={formId ? 'EDIT DESTINATION' : 'NEW DESTINATION'}
            title={formId ? 'Edit destination' : 'Add a destination'}
            subtitle='A place your trips stay in. Its hotels are what the quotation offers in each category.'
            onSubmit={formik.handleSubmit}
            onCancel={() => (campaignContextId ? navigate(-1) : navigate('/master/destinations'))}
            submitLabel={formId ? 'Save changes' : 'Add destination'}
            saving={Boolean(createDestinationLKey || updateDestinationLKey || formik.isSubmitting)}
        >
            <FormSection title='Where is it?' hint='The place, and the campaign (trip) it belongs to.'>
                <Box sx={formColumns}>
                    <FormField
                        formik={formik}
                        name='name'
                        label='Destination name'
                        placeholder='e.g. Manali'
                        helperText='At least 3 characters'
                        required
                    />
                    <FormField
                        formik={formik}
                        name='campaignId'
                        label='Campaign'
                        helperText={
                            campaignContextId && !formId
                                ? 'Chosen from the campaign you came from'
                                : 'The trip it is part of'
                        }
                        select
                        required
                        disabled={Boolean(campaignContextId && !formId)}
                    >
                        {campaignOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </FormField>
                </Box>
            </FormSection>

            <FormSection
                title='Hotels in each category'
                hint={`Up to ${HOTELS_PER_CATEGORY} hotels per category, separated by | (for example: Hotel A | Hotel B). All optional.`}
            >
                <DestinationSuggestions
                    state={hotelStatus.state}
                    place={hotelStatus.place}
                    editing={Boolean(formId)}
                    showButton={canSuggest}
                    buttonLabel={suggestLabel}
                    onSuggest={() => suggestHotels({ replaceAll: allTypedByAgent })}
                />
                <Box sx={{ ...formColumns, rowGap: 1.5 }}>
                    {HOTEL_FIELDS.map(({ field, label }) => (
                        <FormField
                            key={field}
                            formik={formik}
                            name={field}
                            label={`${label} hotels`}
                            placeholder={`Up to ${HOTELS_PER_CATEGORY} hotels, separated by |`}
                            helperText={HOTEL_HINTS[field]}
                            multiline
                            minRows={3}
                        />
                    ))}
                </Box>
            </FormSection>
        </FormPage>
    )
}

export default DestinationClientsForm
