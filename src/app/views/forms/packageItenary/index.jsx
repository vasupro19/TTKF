import React, { useState, useEffect } from 'react'
import { z } from 'zod'
import { useFormik } from 'formik'

import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Box, Divider, Grid, Skeleton, Typography, Card, CardContent, IconButton, Tooltip } from '@mui/material'
import { CheckCircle, Delete, Edit } from '@mui/icons-material'
import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import { useDispatch, useSelector } from 'react-redux'
import { getItenaryClients } from '@/app/store/slices/api/itenarySlice'
import { getDestinationClients } from '@/app/store/slices/api/destinationSlice'
import { getTravelImages } from '@/app/store/slices/api/aiSlice'
import {
    useCreatePackageItenaryClientMutation,
    useUpdatePackageItenaryClientMutation,
    useDeletePackageItenaryClientMutation,
    getPackageClientItenaryById
} from '@/app/store/slices/api/packageItenarySlice'
import { getCampaigns } from '@/app/store/slices/api/campaignSlice'
import { openSnackbar } from '@app/store/slices/snackbar'
import IdentityCard from '@/core/components/IdentityCard'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'

function PackagesItenary() {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    const params = useParams()

    const [createPackageItenaryClient] = useCreatePackageItenaryClientMutation()
    const [updatePackageItenaryClient] = useUpdatePackageItenaryClientMutation()
    const [deletePackageItenaryClient] = useDeletePackageItenaryClientMutation()

    const [itenaryData, setItenaryData] = useState([])
    const [destinationData, setDestinationData] = useState([])
    const [packageActivities, setPackageActivities] = useState([])
    const [imageOptions, setImageOptions] = useState([])
    const [loadingImages, setLoadingImages] = useState(false)
    const [editingActivity, setEditingActivity] = useState(null)
    const [deleteId, setDeleteId] = useState(null)

    async function fetchActivities() {
        const { data, error } = await dispatch(getPackageClientItenaryById.initiate(params.packageId))
        if (error) return
        setPackageActivities(data?.data || [])
    }

    const focusActivityId = location.state?.focusActivityId

    const getItenaryAndDestination = async () => {
        const { data: itenaryRes } = await dispatch(getItenaryClients.initiate(`?campaignId=${params.campaignId}`))
        const { data: destinationRes } = await dispatch(
            getDestinationClients.initiate(`?campaignId=${params.campaignId}`)
        )
        setItenaryData(itenaryRes?.data || [])
        setDestinationData(destinationRes?.data || [])
    }

    const [campaignsData, setcampaignsData] = useState([])

    const { createPackageItenaryClientLKey, updatePackageItenaryClientLKey, deletePackageItenaryClientLKey } =
        useSelector(state => state.loading || {})

    const initialValues = {
        packageId: params.packageId,
        campaignId: params.campaignId || '',
        itenaryId: '',
        destinationId: '',
        image: ''
    }

    const validationSchema = z.object({
        campaignId: z.number({ invalid_type_error: 'Campaign is required' }).int().positive(),
        itenaryId: z.number({ invalid_type_error: 'Itenary is required' }).int().positive(),
        destinationId: z.number().optional().nullable(),
        image: z.string().optional()
    })

    const validate = values => {
        try {
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

    const formik = useFormik({
        initialValues,
        validate,
        onSubmit: async values => {
            try {
                const payload = {
                    ...values,
                    campaignId: parseInt(values.campaignId, 10),
                    itenaryId: parseInt(values.itenaryId, 10),
                    destinationId: values.destinationId ? parseInt(values.destinationId, 10) : null
                }

                let response
                if (editingActivity?.id) {
                    response = await updatePackageItenaryClient({ id: editingActivity.id, ...payload }).unwrap()
                } else {
                    response = await createPackageItenaryClient(payload).unwrap()
                }

                if (response.success || response.status_code === 200) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message:
                                response.message ||
                                `Package activity ${editingActivity?.id ? 'updated' : 'created'} successfully!`,
                            variant: 'alert',
                            alert: { color: 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                    setEditingActivity(null)
                    formik.resetForm({
                        values: {
                            packageId: params.packageId,
                            campaignId: params.campaignId || '',
                            itenaryId: '',
                            destinationId: '',
                            image: ''
                        }
                    })
                    fetchActivities()
                }
            } catch (error) {
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

    function resetFormState() {
        setEditingActivity(null)
        formik.resetForm({
            values: {
                packageId: params.packageId,
                campaignId: params.campaignId || '',
                itenaryId: '',
                destinationId: '',
                image: ''
            }
        })
    }

    useEffect(() => {
        getItenaryAndDestination()
        fetchActivities()
    }, [params.packageId, params.campaignId])

    const customSx = {
        '& input, & textarea': {
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

    const campaignOptions = campaignsData?.map(camp => ({
        label: camp.title,
        value: camp.id.toString()
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
        formik.handleChange(e)
    }

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

    const identityCardData = [
        {
            label: 'Package',
            value: packageActivities?.[0]?.package?.name || params.packageId || 'N/A'
        },
        {
            label: 'Campaign',
            value: campaignsData?.find(item => item.id.toString() === formik.values?.campaignId)?.title || 'N/A'
        },
        { label: 'Activities', value: packageActivities.length || 0 }
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

    const handleEditActivity = activity => {
        setEditingActivity(activity)
        formik.setValues({
            packageId: activity.packageId?.toString() || params.packageId,
            campaignId: params.campaignId || '',
            itenaryId: activity.itenaryId?.toString() || '',
            destinationId: activity.destinationId?.toString() || '',
            image: activity.image || ''
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    useEffect(() => {
        if (!focusActivityId || packageActivities.length === 0) return

        const matchedActivity = packageActivities.find(item => item.id === Number(focusActivityId))
        if (!matchedActivity) return

        handleEditActivity(matchedActivity)
        navigate(location.pathname, { replace: true, state: null })
    }, [focusActivityId, packageActivities])

    const handleAskDelete = id => {
        setDeleteId(id)
        dispatch(openModal({ type: 'confirm_modal' }))
    }

    const handleDeleteActivity = async () => {
        try {
            const response = await deletePackageItenaryClient(deleteId).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: response?.message || 'Package activity deleted successfully!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            if (editingActivity?.id === deleteId) {
                resetFormState()
            }
            fetchActivities()
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Unable to delete package activity',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            dispatch(closeModal())
        }
    }

    return (
        <MainCard
            sx={{ py: '1px' }}
            contentSX={{ px: '2px', py: 1.5 }}
            title={editingActivity ? 'Edit Package Activity' : 'Add Package Activity'}
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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant='h4'>
                                    {editingActivity ? 'Update existing activity' : 'Create new activity'}
                                </Typography>
                                {editingActivity ? (
                                    // eslint-disable-next-line react/jsx-no-bind
                                    <CustomButton variant='outlined' color='secondary' onClick={resetFormState}>
                                        Cancel Edit
                                    </CustomButton>
                                ) : null}
                            </Box>
                            <FormComponent
                                fields={tabsFields[0].fields}
                                formik={formik}
                                handleCustomChange={handleCustomChange}
                                submitting={createPackageItenaryClientLKey || updatePackageItenaryClientLKey}
                                customStyle={{
                                    backgroundColor: 'none'
                                }}
                                submitButtonText={editingActivity ? 'Update Activity' : 'Create Activity'}
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
                            marginTop: '-1rem',
                            borderColor: '#BCC1CA',
                            marginBottom: '1rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant='h4'>Existing Activities</Typography>
                        <CustomButton variant='outlined' color='secondary' onClick={() => navigate(-1)}>
                            Back
                        </CustomButton>
                    </Box>

                    {packageActivities.length === 0 ? (
                        <Typography color='text.secondary'>No activities added for this package yet.</Typography>
                    ) : (
                        <Grid container spacing={2}>
                            {packageActivities.map(activity => (
                                <Grid item xs={12} md={6} key={activity.id}>
                                    <Card
                                        sx={{
                                            borderRadius: 3,
                                            border: '1px solid',
                                            borderColor:
                                                editingActivity?.id === activity.id ? 'primary.main' : 'divider',
                                            boxShadow: editingActivity?.id === activity.id ? 4 : 1
                                        }}
                                    >
                                        <CardContent>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    gap: 2
                                                }}
                                            >
                                                <Box>
                                                    <Typography variant='h5' sx={{ fontWeight: 700 }}>
                                                        {activity.title ||
                                                            activity.itenary?.title ||
                                                            'Untitled Activity'}
                                                    </Typography>
                                                    <Typography variant='body2' color='text.secondary'>
                                                        Destination: {activity.destination?.name || 'Not selected'}
                                                    </Typography>
                                                    <Typography variant='body2' color='text.secondary'>
                                                        Itinerary: {activity.itenary?.title || 'Not selected'}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title='Edit activity'>
                                                        <IconButton
                                                            color='primary'
                                                            onClick={() => handleEditActivity(activity)}
                                                        >
                                                            <Edit />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title='Delete activity'>
                                                        <IconButton
                                                            color='error'
                                                            onClick={() => handleAskDelete(activity.id)}
                                                        >
                                                            <Delete />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>

                                            {activity.image ? (
                                                <Box
                                                    component='img'
                                                    src={activity.image}
                                                    alt={activity.title || activity.itenary?.title || 'activity'}
                                                    sx={{
                                                        mt: 2,
                                                        width: '100%',
                                                        height: 220,
                                                        objectFit: 'cover',
                                                        borderRadius: 2,
                                                        border: '1px solid',
                                                        borderColor: 'divider'
                                                    }}
                                                />
                                            ) : (
                                                <Box
                                                    sx={{
                                                        mt: 2,
                                                        height: 220,
                                                        borderRadius: 2,
                                                        border: '1px dashed',
                                                        borderColor: 'divider',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'text.secondary'
                                                    }}
                                                >
                                                    No image selected
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Grid>
            </Grid>

            <ConfirmModal
                title='Delete Activity'
                message='Are you sure you want to delete this package activity?'
                icon='warning'
                confirmText='Yes, Delete'
                customStyle={{ width: { xs: '300px', sm: '456px' } }}
                onConfirm={handleDeleteActivity}
                isLoading={deletePackageItenaryClientLKey}
            />
        </MainCard>
    )
}

export default PackagesItenary
