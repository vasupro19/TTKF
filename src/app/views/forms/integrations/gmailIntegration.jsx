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
    // useCreateDestinationClientMutation,
    // useUpdateDestinationClientMutation,
    useCreateGmailConfigMutation,
    useGetGmailConfigsQuery,
    // updateGmailClient,
    useUpdateGmailConfigMutation,
    // getDestinationClientById
    useConnectGmailQuery,
    connectGmail
    // useGetAllCampaignsQuery // New hook to fetch campaigns for dropdown
} from '@/app/store/slices/api/gmailSlice' // Adjust the slice name if needed

import {
    // Assuming you will create these new hooks for DestinationClients

    getCampaigns // New hook to fetch campaigns for dropdown
} from '@/app/store/slices/api/campaignSlice' // Adjust the slice name if needed
import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'
import IdentityCard from '@/core/components/IdentityCard'

// CONSTANTS - assuming you have a way to import Select component data

function GmailIntegrationForm() {
    // Note: Assuming `id` in useParams is the DestinationClients ID for editing
    const { id: formId } = useParams()
    const navigate = useNavigate()

    // Hooks for creating/updating destinations
    const [createGmailClient] = useCreateGmailConfigMutation()
    const [updateGmailClient] = useUpdateGmailConfigMutation()

    // Hook to fetch all campaigns for the dropdown list
    // const { data: campaignsData, isLoading: campaignsLoading } = useGetAllCampaignsQuery()

    const [editData, setEditData] = useState({})
    const [campaignsData, setcampaignsData] = useState([])

    // Assuming you will use appropriate loading keys for destination operations
    const { createDestinationLKey, updateDestinationLKey } = useSelector(state => state.loading || {})

    const dispatch = useDispatch()
    const { data: connectData, refetch: refetchConnectGmail } = useConnectGmailQuery(null, { skip: true })

    // --- Initial Values and Validation Schema ---

    const initialValues = {
        clientId: '',
        clientSecret: '',
        redirectUri: '',
        pubsubTopic: '',
        pushEndpoint: ''
    }

    // Validation schema for DestinationClient fields
    const validationSchema = z.object({
        clientId: z.string().min(5, 'Client ID required'),
        clientSecret: z.string().min(5, 'Client Secret required'),
        redirectUri: z.string().url('Invalid Redirect URI'),
        pubsubTopic: z.string().optional(),
        pushEndpoint: z.string().optional()
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
                    response = await updateGmailClient({ id: formId, ...payload }).unwrap()
                } else {
                    // Create new destination
                    response = await createGmailClient(payload).unwrap()
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
                    navigate(-1)
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

    // const getDestinationData = async id => {
    //     const { data, error } = await dispatch(getDestinationClientById.initiate(id))
    //     if (error) return

    //     if (data && data?.data && objectLength(data.data)) {
    //         setEditData(data.data)

    //         // Set form values for editing
    //         const destinationData = data.data
    //         formik.setValues({
    //             ...destinationData,
    //             campaignId: destinationData.campaignId.toString() // Convert number to string for Select component
    //         })
    //     }
    // }

    // useEffect(() => {
    //     if (formId) getDestinationData(formId)
    // }, [formId])

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
            label: 'Gmail Integration',
            fields: [
                {
                    name: 'clientId',
                    label: 'Client ID',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'clientSecret',
                    label: 'Client Secret',
                    type: 'password',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'redirectUri',
                    label: 'Redirect URI',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'pubsubTopic',
                    label: 'Pub/Sub Topic',
                    type: 'text',
                    required: false,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'pushEndpoint',
                    label: 'Push Endpoint',
                    type: 'text',
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
                        <Box sx={{ mt: 2, textAlign: 'right' }}>
                            <button
                                type='button'
                                onClick={async () => {
                                    const response = await dispatch(connectGmail.initiate())
                                    console.log(response)

                                    const authUrl =
                                        response?.data?.data?.authUrl || response?.data?.authUrl || response?.data?.data

                                    if (authUrl) {
                                        window.location.href = authUrl.url
                                        console.log(authUrl)
                                    } else {
                                        console.error('Auth URL not received from backend')
                                    }
                                }}
                                style={{
                                    backgroundColor: '#4285F4',
                                    color: 'white',
                                    padding: '10px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: 'none',
                                    fontWeight: 600
                                }}
                            >
                                Connect Gmail
                            </button>
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

export default GmailIntegrationForm
