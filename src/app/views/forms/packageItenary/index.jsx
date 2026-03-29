import React, { useState, useCallback, useEffect } from 'react'
import { z } from 'zod'
import { useFormik } from 'formik'

// router
import { useParams, useNavigate } from 'react-router-dom'

// theme components
import { Box, Divider, Grid, Button, Skeleton, ImageList, ImageListItem, Typography } from '@mui/material'
import { CheckCircle } from '@mui/icons-material'

// components
import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
import DownloadIcon from '@mui/icons-material/Download'

// redux imports
import { useDispatch, useSelector } from 'react-redux'
import { getItenaryClients } from '@/app/store/slices/api/itenarySlice'
import { getDestinationClients } from '@/app/store/slices/api/destinationSlice'
import { getTravelImages } from '@/app/store/slices/api/aiSlice'

// 🚨 -----------------------------------------------------------
// 🚨 NEW/UPDATED IMPORTS FOR PACKAGES
// 🚨 Adjust the file paths as necessary for your project structure
// 🚨 -----------------------------------------------------------
import {
    useCreatePackageItenaryClientMutation,
    useUpdatePackageClientMutation,
    getPackageClientItenaryById
} from '@/app/store/slices/api/packageItenarySlice' // 👈 **NEW Package Slice**

import {
    getCampaigns // Hook to fetch campaigns for dropdown
} from '@/app/store/slices/api/campaignSlice' // Existing Campaign Slice
import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'
import IdentityCard from '@/core/components/IdentityCard'
import AiFormAssistant from '@core/components/forms/AiAssiastantForm'

// CONSTANTS - assuming you have a way to import Select component data

function PackagesItenary() {
    // 👈 **Renamed Component**
    // Note: Assuming `id` in useParams is the PackageClients ID for editing
    const { id: formId } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const params = useParams()

    // 👈 Hooks for creating/updating Packages
    const [createPackageItenaryClient] = useCreatePackageItenaryClientMutation()
    const [updatePackageClient] = useUpdatePackageClientMutation()

    const [itenaryData, setItenaryData] = useState([])
    const [destinationData, setDestinationData] = useState([])
    const [imageOptions, setImageOptions] = useState([])
    const [loadingImages, setLoadingImages] = useState(false)
    const [filters, setFilters] = useState({
        created_at: { from: '', to: '' },
        campaignId: params.campaignId
    })

    const getItenaryAndDestination = async () => {
        const { data: itenaryRes } = await dispatch(getItenaryClients.initiate(`?campaignId=${params.campaignId}`))
        const { data: destinationRes } = await dispatch(
            getDestinationClients.initiate(`?campaignId=${params.campaignId}`)
        )
        setItenaryData(itenaryRes?.data || [])
        setDestinationData(destinationRes?.data || [])
    }

    useEffect(() => {
        // getCampaignsFunc()
        getItenaryAndDestination()
    }, [])

    const [editData, setEditData] = useState({})
    const [campaignsData, setcampaignsData] = useState([])

    // 👈 Assuming you will use appropriate loading keys for package operations
    const { createPackageLKey, updatePackageLKey } = useSelector(state => state.loading || {})

    // const dispatch = useDispatch()

    // --- Initial Values and Validation Schema ---

    const initialValues = {
        packageId: params.packageId,
        campaignId: '',
        itenaryId: '',
        destinationId: ''
    }

    // 👈 Validation schema for PackageClient fields
    const validationSchema = z.object({
        campaignId: z.number({ invalid_type_error: 'Campaign is required' }).int().positive(),
        itenaryId: z.number({ invalid_type_error: 'Itenary is required' }).int().positive(),
        destinationId: z.number().optional().nullable(),
        image: z.string().optional()
    })

    const validate = values => {
        try {
            // Convert campaignId to number for Zod validation
            const parsedValues = {
                ...values,
                campaignId: values.campaignId ? parseInt(values?.campaignId, 10) : '',
                itenaryId: values.itenaryId ? parseInt(values?.itenaryId, 10) : '',
                destinationId: values.destinationId ? parseInt(values?.destinationId, 10) : null
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
                    campaignId: parseInt(values.campaignId, 10),
                    itenaryId: parseInt(values.itenaryId, 10),
                    destinationId: parseInt(values.destinationId, 10)
                }

                let response
                if (formId) {
                    // 👈 Update existing package
                    response = await updatePackageClient({ id: formId, ...payload }).unwrap()
                } else {
                    // 👈 Create new package
                    response = await createPackageItenaryClient(payload).unwrap()
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
        const { data, error } = await dispatch(getPackageClientItenaryById.initiate(id)) // 👈 Updated RTK query
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

    const itenaryOptions = itenaryData?.map(item => ({
        label: item.title,
        value: item.id.toString()
    }))

    const destinationOptions = destinationData?.map(item => ({
        label: item.name,
        value: item.id.toString()
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
                    name: 'campaignId',
                    label: 'Associated Campaign',
                    type: 'select',
                    options: campaignOptions,
                    required: true,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'itenaryId',
                    label: 'Itenary',
                    type: 'select',
                    options: itenaryOptions,
                    required: true,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'destinationId',
                    label: 'Destination',
                    type: 'select',
                    options: destinationOptions,
                    required: true,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'image',
                    label: 'Image URL',
                    type: 'text',
                    required: false,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                }
            ]
        }
    ]

    // 👈 Updated IdentityCard labels/values
    const identityCardData = [
        { label: 'Campaign ID', value: formik.values?.campaignId ?? 'N/A' },
        { label: 'Itenary', value: formik.values?.itenaryId ?? 'N/A' },
        { label: 'Destination', value: formik.values?.destinationId ?? 'N/A' }
    ]
    const getCampaignsFunc = async () => {
        const { data: response } = await dispatch(getCampaigns.initiate())
        setcampaignsData(response.data)
    }
    useEffect(() => {
        getCampaignsFunc()
    }, [])
    const selectedItenary = itenaryData.find(i => i.id.toString() === formik.values.itenaryId)
    const selectedDestination = destinationData.find(d => d.id.toString() === formik.values.destinationId)
    useEffect(() => {
        const keyword = selectedDestination?.name || selectedItenary?.title
        if (!keyword) return

        setLoadingImages(true)
        dispatch(getTravelImages.initiate(keyword))
            .then(res => {
                setImageOptions(res.data?.urls || [])
            })
            .catch(() => setImageOptions([]))
            .finally(() => setLoadingImages(false))
    }, [formik.values.destinationId, formik.values.itenaryId])
    return (
        <MainCard
            sx={{ py: '1px' }}
            contentSX={{ px: '2px', py: 1.5 }}
            title={formId ? 'Edit Package' : 'Create New Package'} // 👈 Updated title
            // secondary={
            // <Grid item xs={12}>
            //     <Button
            //         variant='outlined'
            //         color='secondary'
            //         fullWidth
            //         startIcon={<DownloadIcon />}
            //         onClick={handleDownload}
            //         disabled={isDownloading} // 👈 Disable while generating
            //         sx={{ mt: 2 }}
            //     >
            //         {isDownloading ? 'Generating...' : 'Download Sample Excel'}
            //     </Button>
            // </Grid>
            // }
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
                        {(loadingImages || imageOptions.length > 0) && (
                            <Box sx={{ mt: 2 }}>
                                <Typography
                                    variant='caption'
                                    sx={{ color: 'text.secondary', mb: 1, display: 'block', fontWeight: 600 }}
                                >
                                    SUGGESTED IMAGES — click to select
                                </Typography>

                                {loadingImages ? (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                            <Skeleton
                                                key={i}
                                                variant='rectangular'
                                                width={150}
                                                height={100}
                                                sx={{ borderRadius: '8px', flexShrink: 0 }}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {imageOptions.map((img, i) => (
                                            <Box
                                                key={img.name}
                                                onClick={() => formik.setFieldValue('image', img.url)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    border: '3px solid',
                                                    borderColor:
                                                        formik.values.image === img.url
                                                            ? 'primary.main'
                                                            : 'transparent',
                                                    transition: 'all 0.2s',
                                                    position: 'relative',
                                                    '&:hover': {
                                                        borderColor: 'primary.light',
                                                        transform: 'scale(1.02)'
                                                    }
                                                }}
                                            >
                                                <img
                                                    src={img.thumb}
                                                    alt={`travel-${i}`}
                                                    style={{
                                                        width: '150px',
                                                        height: '100px',
                                                        objectFit: 'cover',
                                                        display: 'block'
                                                    }}
                                                />
                                                {/* ✅ Checkmark on selected */}
                                                {formik.values.image === img.url && (
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 4,
                                                            right: 4,
                                                            backgroundColor: 'primary.main',
                                                            borderRadius: '50%',
                                                            width: 20,
                                                            height: 20,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <CheckCircle sx={{ fontSize: 16, color: '#fff' }} />
                                                    </Box>
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                )}

                                {/* ✅ Preview selected image */}
                                {formik.values.image && (
                                    <Box sx={{ mt: 1.5 }}>
                                        <Typography variant='caption' color='text.secondary'>
                                            Selected Image Preview:
                                        </Typography>
                                        <Box
                                            component='img'
                                            src={formik.values.image}
                                            sx={{
                                                mt: 0.5,
                                                width: '100%',
                                                maxHeight: '200px',
                                                objectFit: 'cover',
                                                borderRadius: '8px'
                                            }}
                                            onError={e => {
                                                e.target.style.display = 'none'
                                            }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}
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

export default PackagesItenary
