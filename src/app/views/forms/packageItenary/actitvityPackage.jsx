import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Typography, Card, CardContent, Stack, Grid, IconButton, Tooltip, Skeleton, Chip } from '@mui/material'
import { Delete, Edit, LocationOn, NightsStay } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import {
    getPackageClientItenaryById,
    useDeletePackageItenaryClientMutation
} from '@/app/store/slices/api/packageItenarySlice'
import { openSnackbar } from '@/app/store/slices/snackbar'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import CustomButton from '@/core/components/extended/CustomButton'

const HOTEL_TIERS = [
    { key: 'deluxe', label: 'Deluxe', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
    { key: 'superDeluxe', label: 'Super Deluxe', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    { key: 'luxury', label: 'Luxury', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    { key: 'premium', label: 'Premium', color: '#b45309', bg: '#fffbeb', border: '#fde68a' }
]

export default function PackageItenaryView() {
    const params = useParams()
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [deletePackageItenaryClient] = useDeletePackageItenaryClientMutation()

    const [itenaryData, setItenaryData] = useState([])
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState(null)
    const [deleteCampaignId, setDeleteCampaignId] = useState(null)

    const { deletePackageItenaryClientLKey } = useSelector(state => state.loading || {})

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: response } = await dispatch(getPackageClientItenaryById.initiate(params.packageId, false))
            setItenaryData(response?.data || [])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [params.packageId])

    const handleBack = () => {
        navigate(-1)
    }

    const getCampaignIdFromItem = item =>
        item?.campaignId || item?.package?.campaignId || item?.package?.campaign?.id || deleteCampaignId

    const handleEditClick = event => {
        const { activityId, campaignId } = event.currentTarget.dataset
        if (!campaignId) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Campaign details are missing for this activity',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }

        navigate(`/package/activities/${campaignId}/${params.packageId}`, {
            state: { focusActivityId: Number(activityId) }
        })
    }

    const handleAskDelete = event => {
        const { activityId, campaignId } = event.currentTarget.dataset
        setDeleteId(Number(activityId))
        setDeleteCampaignId(campaignId ? Number(campaignId) : null)
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
            fetchData()
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
            setDeleteId(null)
            setDeleteCampaignId(null)
        }
    }

    const handleManageAll = () => {
        const campaignId = getCampaignIdFromItem(itenaryData[0])
        if (!campaignId) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Campaign details are missing for this package',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }

        navigate(`/package/activities/${campaignId}/${params.packageId}`)
    }

    const travelDestinations = ['OVERNIGHT JOURNEY', 'FRESH UP', 'DAY JOURNEY']

    const formattedItineraries = itenaryData.map(item => ({
        id: item.id,
        title: item.title || item.itenary?.title || 'Untitled Activity',
        description:
            item.itenary?.description || 'Enjoy your day exploring beautiful landscapes and local attractions.',
        image: item.image || '',
        destination: item?.destination?.name || 'FRESH UP',
        hotels: {
            deluxe: item?.destination?.delux_hotel,
            superDeluxe: item?.destination?.super_delux_hotel,
            luxury: item?.destination?.luxury_hotel,
            premium: item?.destination?.premium_hotel
        },
        rawItem: item
    }))

    const staysBreakdown = formattedItineraries.reduce((acc, item) => {
        const destinationName = (item.destination || '').toUpperCase()
        if (travelDestinations.includes(destinationName)) return acc

        const existing = acc.find(stay => stay.destination === item.destination)
        if (existing) {
            existing.nights += 1
        } else {
            acc.push({ destination: item.destination, nights: 1 })
        }

        return acc
    }, [])

    const totalNights = staysBreakdown.reduce((sum, stay) => sum + stay.nights, 0)

    let content

    if (loading) {
        content = (
            <Grid container spacing={2}>
                {[1, 2].map(item => (
                    <Grid item xs={12} key={item}>
                        <Skeleton variant='rounded' height={260} />
                    </Grid>
                ))}
            </Grid>
        )
    } else if (itenaryData.length === 0) {
        content = <Typography>No Itinerary Found</Typography>
    } else {
        content = (
            <>
                <Box
                    sx={{
                        mb: 3,
                        p: 3,
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #e8f0fe 0%, #f0f7ff 100%)',
                        border: '1px solid #bfdbfe',
                        boxShadow: '0 4px 16px rgba(37,99,235,0.08)'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <NightsStay sx={{ color: '#1d4ed8', fontSize: 20 }} />
                        <Typography sx={{ fontWeight: 800, color: '#1d4ed8', fontSize: '1rem' }}>
                            {formattedItineraries.length} Days
                        </Typography>
                        <Chip
                            label={`${totalNights} Nights`}
                            size='small'
                            sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 700 }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {staysBreakdown.map(stay => (
                            <Chip
                                key={stay.destination}
                                icon={<LocationOn sx={{ fontSize: '14px !important' }} />}
                                label={`${stay.destination}: ${stay.nights}N`}
                                size='small'
                                sx={{
                                    bgcolor: 'white',
                                    border: '1px solid #bfdbfe',
                                    fontWeight: 700,
                                    color: '#1e40af'
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    {formattedItineraries.map((item, index) => {
                        const campaignId = getCampaignIdFromItem(item.rawItem)

                        return (
                            <Grid item xs={12} key={item.id}>
                                <Card
                                    sx={{
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        border: '1px solid #e2e8f0',
                                        bgcolor: 'white',
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            px: 3,
                                            py: 1.8,
                                            background: 'linear-gradient(135deg, #1c2d45, #2a4a7f)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 2,
                                            flexWrap: 'wrap'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box
                                                sx={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: '50%',
                                                    bgcolor: 'rgba(255,255,255,0.15)',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 800,
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                {index + 1}
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, color: 'white', fontSize: '1rem' }}>
                                                    Day {index + 1}: {item.title}
                                                </Typography>
                                                <Typography
                                                    sx={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.82rem' }}
                                                >
                                                    {item.destination}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title='Edit activity'>
                                                <IconButton
                                                    sx={{ color: 'white' }}
                                                    data-activity-id={item.id}
                                                    data-campaign-id={campaignId || ''}
                                                    onClick={handleEditClick}
                                                >
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title='Delete activity'>
                                                <IconButton
                                                    sx={{ color: '#fecaca' }}
                                                    data-activity-id={item.id}
                                                    data-campaign-id={campaignId || ''}
                                                    onClick={handleAskDelete}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>

                                    <Grid container>
                                        {item.image ? (
                                            <Grid item xs={12} md={4}>
                                                <Box
                                                    component='img'
                                                    src={item.image}
                                                    alt={item.title}
                                                    sx={{
                                                        width: '100%',
                                                        height: 260,
                                                        objectFit: 'cover',
                                                        display: 'block'
                                                    }}
                                                />
                                            </Grid>
                                        ) : null}

                                        <Grid item xs={12} md={item.image ? 8 : 12}>
                                            <CardContent sx={{ p: 3 }}>
                                                <Stack spacing={2.5}>
                                                    <Box>
                                                        <Typography
                                                            sx={{
                                                                fontSize: '0.72rem',
                                                                fontWeight: 800,
                                                                color: '#94a3b8',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.08em',
                                                                mb: 0.75
                                                            }}
                                                        >
                                                            Itinerary Description
                                                        </Typography>
                                                        <Typography
                                                            sx={{
                                                                color: '#475569',
                                                                lineHeight: 1.8,
                                                                fontSize: '0.95rem'
                                                            }}
                                                        >
                                                            {item.description}
                                                        </Typography>
                                                    </Box>

                                                    <Box>
                                                        <Typography
                                                            sx={{
                                                                fontSize: '0.72rem',
                                                                fontWeight: 800,
                                                                color: '#94a3b8',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.08em',
                                                                mb: 1.25
                                                            }}
                                                        >
                                                            Accommodation Options
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                                            {HOTEL_TIERS.map(tier => (
                                                                <Box
                                                                    key={tier.key}
                                                                    sx={{
                                                                        px: 2,
                                                                        py: 1,
                                                                        borderRadius: '10px',
                                                                        bgcolor: tier.bg,
                                                                        border: `1px solid ${tier.border}`,
                                                                        minWidth: 132
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        sx={{
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: 800,
                                                                            color: tier.color,
                                                                            textTransform: 'uppercase',
                                                                            mb: 0.3
                                                                        }}
                                                                    >
                                                                        {tier.label}
                                                                    </Typography>
                                                                    <Typography
                                                                        sx={{
                                                                            fontSize: '0.82rem',
                                                                            fontWeight: 600,
                                                                            color: '#1e293b'
                                                                        }}
                                                                    >
                                                                        {item.hotels?.[tier.key] || '—'}
                                                                    </Typography>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                </Stack>
                                            </CardContent>
                                        </Grid>
                                    </Grid>
                                </Card>
                            </Grid>
                        )
                    })}
                </Grid>
            </>
        )
    }

    return (
        <Box p={3}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 3
                }}
            >
                <Typography variant='h3'>Package Activities</Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    {itenaryData.length > 0 ? (
                        <CustomButton variant='outlined' color='secondary' onClick={handleManageAll}>
                            Manage All
                        </CustomButton>
                    ) : null}
                    <CustomButton onClick={handleBack}>Back</CustomButton>
                </Box>
            </Box>
            {content}

            <ConfirmModal
                title='Delete Activity'
                message='Are you sure you want to delete this package activity?'
                icon='warning'
                confirmText='Yes, Delete'
                customStyle={{ width: { xs: '300px', sm: '456px' } }}
                onConfirm={handleDeleteActivity}
                isLoading={deletePackageItenaryClientLKey}
            />
        </Box>
    )
}
