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
    useCreateDestinationClientMutation,
    useUpdateDestinationClientMutation,
    getDestinationClientById
    // useGetAllCampaignsQuery // New hook to fetch campaigns for dropdown
} from '@/app/store/slices/api/destinationSlice' // Adjust the slice name if needed

import {
    // Assuming you will create these new hooks for DestinationClients

    getCampaigns // New hook to fetch campaigns for dropdown
} from '@/app/store/slices/api/campaignSlice' // Adjust the slice name if needed
import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'
import IdentityCard from '@/core/components/IdentityCard'

// CONSTANTS - assuming you have a way to import Select component data

function DestinationClientsForm() {
    // Note: Assuming `id` in useParams is the DestinationClients ID for editing
    const { id: formId } = useParams()
    const navigate = useNavigate()

    // Hooks for creating/updating destinations
    const [createDestinationClient] = useCreateDestinationClientMutation()
    const [updateDestinationClient] = useUpdateDestinationClientMutation()

    // Hook to fetch all campaigns for the dropdown list
    // const { data: campaignsData, isLoading: campaignsLoading } = useGetAllCampaignsQuery()

    const [editData, setEditData] = useState({})
    const [campaignsData, setcampaignsData] = useState([])

    // Assuming you will use appropriate loading keys for destination operations
    const { createDestinationLKey, updateDestinationLKey } = useSelector(state => state.loading || {})

    const dispatch = useDispatch()

    // --- Initial Values and Validation Schema ---

    const initialValues = {
        name: '', // Destination name
        campaignId: '', // Foreign key to CampaignClient
        delux_hotel: '',
        super_delux_hotel: '',
        luxury_hotel: '',
        premium_hotel: ''
    }

    // Validation schema for DestinationClient fields
    const validationSchema = z.object({
        name: z.string().min(3, 'Destination Name must be at least 3 characters'),
        campaignId: z.number({ invalid_type_error: 'Campaign is required' }).int().positive(),
        delux_hotel: z.string().optional(),
        super_delux_hotel: z.string().optional(),
        luxury_hotel: z.string().optional(),
        premium_hotel: z.string().optional()
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
                    // Update existing destination
                    response = await updateDestinationClient({ id: formId, ...payload }).unwrap()
                } else {
                    // Create new destination
                    response = await createDestinationClient(payload).unwrap()
                }
                console.log(response)
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
                    navigate('/master/destinations')
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

    // --- Data Fetching and Edit Logic ---

    const getDestinationData = async id => {
        const { data, error } = await dispatch(getDestinationClientById.initiate(id))
        if (error) return

        if (data && data?.data && objectLength(data.data)) {
            setEditData(data.data)

            // Set form values for editing
            const destinationData = data.data
            formik.setValues({
                ...destinationData,
                campaignId: destinationData.campaignId.toString() // Convert number to string for Select component
            })
        }
    }

    useEffect(() => {
        if (formId) getDestinationData(formId)
    }, [formId])

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

    const handleCustomChange = e => {
        const { name, value } = e.target

        formik.handleChange(e)
    }
    const tabsFields = [
        {
            label: 'Destination Information',
            fields: [
                {
                    name: 'name',
                    label: 'Destination Name',
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
                    customSx
                    // disabled: campaignsLoading // Disable while loading campaign options
                },
                {
                    name: 'delux_hotel',
                    label: 'Delux Hotel Details',
                    type: 'textarea', // Use multiline-text for better input area
                    minRows: 3,
                    required: false,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'super_delux_hotel',
                    label: 'Super Delux Hotel Details',
                    type: 'textarea',
                    minRows: 3,
                    required: false,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'luxury_hotel',
                    label: 'Luxury Hotel Details',
                    type: 'textarea',
                    minRows: 3,
                    required: false,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'premium_hotel',
                    label: 'Premium Hotel Details',
                    type: 'textarea',
                    minRows: 3,
                    required: false,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                }
            ]
        }
    ]

    const identityCardData = [
        { label: 'Destination', value: formik.values?.name ?? 'N/A' },
        { label: 'Campaign ID', value: formik.values?.campaignId ?? 'N/A' },
        { label: 'Delux Hotel', value: formik.values?.delux_hotel ? 'Provided' : 'N/A' }
    ]
    const getCampaignsFunc = async () => {
        const { data: response } = await dispatch(getCampaigns.initiate())
        setcampaignsData(response.data)
    }
    useEffect(() => {
        getCampaignsFunc()
    }, [])
    // const campaigns = campaignsData?.data || []

    return (
        <MainCard
            sx={{ py: '1px' }}
            contentSX={{ px: '2px', py: 1.5 }}
            title={formId ? 'Edit Destination' : 'Create New Destination'}
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
                                // handleCustomChange is not needed here as there's no postcode logic
                                submitting={createDestinationLKey || updateDestinationLKey}
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

export default DestinationClientsForm
