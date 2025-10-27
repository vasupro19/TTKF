import React, { useState, useCallback, useEffect } from 'react'
import { z } from 'zod'
import { useFormik } from 'formik'

// router
import { useParams, useNavigate } from 'react-router-dom'

// theme components
import { Box, Divider, Grid } from '@mui/material'

// components
import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'

// redux imports
import { useDispatch, useSelector } from 'react-redux'
import {
    // Assuming you will create these new hooks for DestinationClients
    useCreateItenaryClientMutation,
    useUpdateItenaryClientMutation,
    getItenaryClientById
    // useGetAllCampaignsQuery // New hook to fetch campaigns for dropdown
} from '@/app/store/slices/api/itenarySlice' // Adjust the slice name if needed

import {
    // Assuming you will create these new hooks for DestinationClients

    getCampaigns // New hook to fetch campaigns for dropdown
} from '@/app/store/slices/api/campaignSlice' // Adjust the slice name if needed
import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'
import IdentityCard from '@/core/components/IdentityCard'

// CONSTANTS - assuming you have a way to import Select component data

function ItenaryClientsForm() {
    // Note: Assuming `id` in useParams is the Itinerary ID for editing
    const { id: formId } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()

    // Hooks for creating/updating itineraries (MOCKED)
    const [createItenaryClient, { isLoading: isCreating }] = useCreateItenaryClientMutation()
    const [updateItenaryClient, { isLoading: isUpdating }] = useUpdateItenaryClientMutation()

    const [editData, setEditData] = useState({})
    const [campaignsData, setcampaignsData] = useState([])
    const campaignsLoading = false // Mock loading state

    // Use mocked loading keys for Itinerary operations
    const createItenaryLKey = isCreating
    const updateItenaryLKey = isUpdating

    // --- Initial Values and Validation Schema ---

    // UPDATED initial values for Itinerary fields (title, description, campaignId)
    const initialValues = {
        title: '', // Itinerary title (matching headers)
        description: '', // Itinerary description (matching headers)
        campaignId: '' // Foreign key to CampaignClient
    }

    // UPDATED Validation schema for Itinerary fields
    const validationSchema = z.object({
        title: z.string().min(5, 'Title must be at least 5 characters'),
        description: z.string().min(10, 'Description must be at least 10 characters').optional().or(z.literal('')),
        campaignId: z.number({ invalid_type_error: 'Campaign is required' }).int().positive()
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

                let response
                if (formId) {
                    // Update existing Itinerary (MOCKED)
                    response = await updateItenaryClient({ id: formId, ...payload }).unwrap()
                } else {
                    // Create new Itinerary (MOCKED)
                    response = await createItenaryClient(payload).unwrap()
                }

                if (response.success || response.status_code === 200) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: response.message || 'Itinerary saved successfully!',
                            variant: 'alert',
                            alert: { color: 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                    // Navigate to the list view after submission
                    navigate('/master/itenary') // Assuming the list route is '/master/itineraries'
                }
            } catch (error) {
                // Error handling (keeping original structure)
                const errorMessage = error.data?.data?.message || 'An error occurred, please try again'
                dispatch(
                    openSnackbar({
                        open: true,
                        message: errorMessage,
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
            }
        },
        validateOnBlur: true,
        validateOnChange: true
    })

    // --- Data Fetching and Edit Logic ---
    const handleCustomChange = e => {
        const { name, value } = e.target

        formik.handleChange(e)
    }
    const getItenaryData = async id => {
        // Fetch Itinerary data (MOCKED)
        const { data: response, error } = await dispatch(getItenaryClientById.initiate(id))

        if (error) return

        if (response && response?.data && objectLength(response.data)) {
            setEditData(response.data)

            // Set form values for editing
            const itineraryData = response.data
            formik.setValues({
                ...initialValues, // Start with clean initial values
                ...itineraryData,
                campaignId: itineraryData.campaignId.toString() // Convert number to string for Select component
            })
        }
    }

    const getCampaignsFunc = async () => {
        // Fetch Campaign data (MOCKED)
        const { data: response } = await dispatch(getCampaigns.initiate())
        setcampaignsData(response.data || [])
    }

    useEffect(() => {
        getCampaignsFunc()
    }, [dispatch]) // Dispatch dependency added for best practice

    useEffect(() => {
        if (formId) getItenaryData(formId)
    }, [formId, dispatch]) // Dispatch dependency added for best practice

    // --- Form Fields Definition ---

    const customSx = {
        '& input, & textarea': {
            // Apply styles to both input and textarea
            backgroundColor: '#fff',
            padding: '12px 8px',
            height: '18px'
        },
        '& .MuiInputBase-root.MuiOutlinedInput-root': {
            backgroundColor: 'white'
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'gray'
        },
        flexGrow: 1
    }

    // Transform campaigns data for the Select component
    const campaignOptions = campaignsData?.map(camp => ({
        label: camp.title, // Use campaign title for display
        value: camp.id.toString() // Use campaign ID as value (must be string for Formik Select)
    }))

    const tabsFields = [
        {
            label: 'Itinerary Information',
            fields: [
                {
                    name: 'title',
                    label: 'Itinerary Title',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'campaignId',
                    label: 'Associated Campaign',
                    type: 'select', // Use select for the foreign key
                    options: campaignOptions,
                    required: true,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx,
                    disabled: campaignsLoading // Disable while loading campaign options
                },
                {
                    name: 'description',
                    label: 'Itinerary Description',
                    type: 'textarea', // Use textarea for a larger input area
                    minRows: 4,
                    required: false,
                    grid: { xs: 12, sm: 12, md: 12 },
                    size: 'small',
                    customSx
                }
            ]
        }
    ]

    const identityCardData = [
        { label: 'Title', value: formik.values?.title ?? 'N/A' },
        { label: 'Campaign ID', value: formik.values?.campaignId ?? 'N/A' },
        { label: 'Description', value: formik.values?.description ? 'Provided' : 'N/A' }
    ]

    return (
        <MainCard
            sx={{ py: '1px' }}
            contentSX={{ px: '2px', py: 1.5 }}
            title={formId ? 'Edit Itinerary' : 'Create New Itinerary'}
        >
            <Grid
                container
                gap={4}
                sx={{
                    border: '1px solid #d0d0d0',
                    px: 1.5,
                    py: 2,
                    borderRadius: '8px'
                }}
            >
                <Grid container xs={12} md={3.6} spacing={2}>
                    <Grid item xs={12} md={6} lg={12} sx={{ marginBottom: 2 }}>
                        <IdentityCard data={identityCardData} />
                    </Grid>
                </Grid>

                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        {/* We use the first (and only) tab's fields */}
                        <Box sx={{ padding: 2 }}>
                            <FormComponent
                                fields={tabsFields[0].fields} // Use fields from the single tab
                                formik={formik}
                                handleCustomChange={handleCustomChange}
                                // handleCustomChange is not needed as no custom logic was defined
                                submitting={createItenaryLKey || updateItenaryLKey}
                                customStyle={{
                                    backgroundColor: 'none'
                                }}
                                submitButtonText={formId ? 'Update' : 'Create'}
                                submitButtonSx={{
                                    textAlign: 'right',
                                    marginTop: 2
                                }}
                                showSeparaterBorder={false}
                            />
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12} md={12}>
                    <Divider
                        sx={{
                            marginTop: '-2rem',
                            borderColor: '#BCC1CA',
                            marginBottom: '1rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default ItenaryClientsForm
