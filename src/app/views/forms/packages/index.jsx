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

// 🚨 -----------------------------------------------------------
// 🚨 NEW/UPDATED IMPORTS FOR PACKAGES
// 🚨 Adjust the file paths as necessary for your project structure
// 🚨 -----------------------------------------------------------
import {
    useCreatePackageClientMutation,
    useUpdatePackageClientMutation,
    getPackageClientById
} from '@/app/store/slices/api/packageSlice' // 👈 **NEW Package Slice**

import {
    getCampaigns // Hook to fetch campaigns for dropdown
} from '@/app/store/slices/api/campaignSlice' // Existing Campaign Slice
import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'
import IdentityCard from '@/core/components/IdentityCard'

// CONSTANTS - assuming you have a way to import Select component data

function PackagesClientForm() {
    // 👈 **Renamed Component**
    // Note: Assuming `id` in useParams is the PackageClients ID for editing
    const { id: formId } = useParams()
    const navigate = useNavigate()

    // 👈 Hooks for creating/updating Packages
    const [createPackageClient] = useCreatePackageClientMutation()
    const [updatePackageClient] = useUpdatePackageClientMutation()

    const [editData, setEditData] = useState({})
    const [campaignsData, setcampaignsData] = useState([])

    // 👈 Assuming you will use appropriate loading keys for package operations
    const { createPackageLKey, updatePackageLKey } = useSelector(state => state.loading || {})

    const dispatch = useDispatch()

    // --- Initial Values and Validation Schema ---

    const initialValues = {
        name: '', // Package name
        campaignId: '' // Foreign key to CampaignClient
    }

    // 👈 Validation schema for PackageClient fields
    const validationSchema = z.object({
        name: z.string().min(3, 'Package Name must be at least 3 characters'), // 👈 Updated text
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
                    // 👈 Update existing package
                    response = await updatePackageClient({ id: formId, ...payload }).unwrap()
                } else {
                    // 👈 Create new package
                    response = await createPackageClient(payload).unwrap()
                }
                console.log(response)
                if (response.success || response.status_code === 200) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: response.message || 'Package saved successfully!', // 👈 Updated text
                            variant: 'alert',
                            alert: { color: 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                    // 👈 Navigate to the list view after submission
                    navigate(-1) // 👈 Updated navigation path
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

    const getPackageData = async id => {
        // 👈 Updated function name
        const { data, error } = await dispatch(getPackageClientById.initiate(id)) // 👈 Updated RTK query
        if (error) return

        if (data && data?.data && objectLength(data.data)) {
            setEditData(data.data)

            // Set form values for editing
            const packageData = data.data // 👈 Updated variable name
            formik.setValues({
                ...packageData,
                campaignId: packageData.campaignId.toString() // Convert number to string for Select component
            })
        }
    }

    useEffect(() => {
        if (formId) getPackageData(formId) // 👈 Updated function call
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
    // 👈 Updated field label/name
    const tabsFields = [
        {
            label: 'Package Information',
            fields: [
                {
                    name: 'name',
                    label: 'Package Name', // 👈 Updated label
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'campaignId',
                    label: 'Associated Campaign',
                    type: 'select',
                    options: campaignOptions,
                    required: true,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                }
            ]
        }
    ]

    // 👈 Updated IdentityCard labels/values
    const identityCardData = [
        { label: 'Package Name', value: formik.values?.name ?? 'N/A' },
        { label: 'Campaign ID', value: formik.values?.campaignId ?? 'N/A' },
        { label: 'Hotel Type', value: formik.values?.delux_hotel ? 'Delux' : 'Standard' } // Example update
    ]
    const getCampaignsFunc = async () => {
        const { data: response } = await dispatch(getCampaigns.initiate())
        setcampaignsData(response.data)
    }
    useEffect(() => {
        getCampaignsFunc()
    }, [])

    return (
        <MainCard
            sx={{ py: '1px' }}
            contentSX={{ px: '2px', py: 1.5 }}
            title={formId ? 'Edit Package' : 'Create New Package'} // 👈 Updated title
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
                        <Box sx={{ padding: 2 }}>
                            <FormComponent
                                fields={tabsFields[0].fields}
                                formik={formik}
                                handleCustomChange={handleCustomChange}
                                submitting={createPackageLKey || updatePackageLKey} // 👈 Updated loading keys
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

export default PackagesClientForm
