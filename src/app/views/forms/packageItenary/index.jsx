import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Chip, Skeleton, Stack, Typography } from '@mui/material'
import { Add, LocationOn, NightsStay } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import MainCard from '@core/components/extended/MainCard'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import { openSnackbar } from '@app/store/slices/snackbar'
import { getPackageClientById } from '@/app/store/slices/api/packageSlice'
import {
    getPackageClientItenaryById,
    useDeletePackageItenaryClientMutation,
    useReorderPackageDaysMutation
} from '@/app/store/slices/api/packageItenarySlice'
import PackageDayForm from './PackageDayForm'
import PackageDayList from './PackageDayList'
import { dayTitle, moveItem, nightsOf, staysOf } from './packageDayFacts'

/**
 * A package's days: see them in order, drag or use the arrows to move one, add a day anywhere, edit or delete one.
 * The route is /package/activities/:campaignId/:packageId.
 */
function PackagesItenary() {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    const params = useParams()
    const formRef = useRef(null)

    const [reorderDays] = useReorderPackageDaysMutation()
    const [deleteDay] = useDeletePackageItenaryClientMutation()
    const { deletePackageItenaryClientLKey } = useSelector(state => state.loading || {})

    const [days, setDays] = useState([])
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [pack, setPack] = useState(null)
    const [editingDay, setEditingDay] = useState(null)
    const [insertIndex, setInsertIndex] = useState(null)
    const [toDelete, setToDelete] = useState(null)

    const say = useCallback(
        (message, isError = false) =>
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            ),
        [dispatch]
    )

    const fetchDays = useCallback(async () => {
        const { data, error } = await dispatch(
            getPackageClientItenaryById.initiate(params.packageId, { forceRefetch: true })
        )
        if (!error) setDays(Array.isArray(data?.data) ? data.data : [])
        setLoading(false)
    }, [dispatch, params.packageId])

    useEffect(() => {
        setLoading(true)
        fetchDays()
        dispatch(getPackageClientById.initiate(params.packageId)).then(({ data }) => setPack(data?.data || null))
    }, [fetchDays, dispatch, params.packageId])

    // ? the trip is in the address, else it is the package's own
    const campaignId = params.campaignId || (pack?.campaignId ? String(pack.campaignId) : '')

    // ? "Edit" on the read-only days page lands here with the day to open
    const focusDayId = location.state?.focusActivityId
    useEffect(() => {
        if (!focusDayId || days.length === 0) return
        const match = days.find(day => day.id === Number(focusDayId))
        if (!match) return
        setEditingDay(match)
        navigate(location.pathname, { replace: true, state: null })
    }, [focusDayId, days]) // eslint-disable-line react-hooks/exhaustive-deps

    const showForm = () => formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })

    const handleMove = async (from, to) => {
        if (busy) return
        const next = moveItem(days, from, to)
        if (next === days) return
        const before = days
        setDays(next)
        setEditingDay(null)
        setBusy(true)
        try {
            await reorderDays({ packageId: params.packageId, order: next.map(day => day.id) }).unwrap()
            // ? the server writes the new order into the rows: read them back
            await fetchDays()
        } catch (error) {
            setDays(before)
            say(error?.data?.message || 'Couldn’t move the day. Please try again.', true)
        } finally {
            setBusy(false)
        }
    }

    const handleInsert = index => {
        setEditingDay(null)
        setInsertIndex(index)
        showForm()
    }

    const handleAddAtEnd = () => {
        setEditingDay(null)
        setInsertIndex(null)
        showForm()
    }

    const handleEdit = day => {
        setEditingDay(day)
        showForm()
    }

    const handleAskDelete = day => {
        setToDelete(day)
        dispatch(openModal({ type: 'confirm_modal' }))
    }

    const handleDelete = async () => {
        try {
            const response = await deleteDay(toDelete.id).unwrap()
            say(response?.message || 'Day deleted')
            if (editingDay?.id === toDelete.id) setEditingDay(null)
            await fetchDays()
        } catch (error) {
            say(error?.data?.message || 'Couldn’t delete the day', true)
        } finally {
            dispatch(closeModal())
            setToDelete(null)
        }
    }

    const handleSaved = async () => {
        setEditingDay(null)
        setInsertIndex(null)
        await fetchDays()
    }

    const stays = staysOf(days)
    const nights = nightsOf(days)

    return (
        <MainCard sx={{ py: 2 }} contentSX={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <Box sx={{ '& .MuiButton-root': { textTransform: 'none' } }}>
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='flex-start'
                    spacing={2}
                    sx={{ flexWrap: 'wrap', rowGap: 1.5 }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            color='text.secondary'
                            sx={{ fontSize: '0.8125rem', letterSpacing: '0.08em', fontWeight: 600 }}
                        >
                            PACKAGE DAYS
                        </Typography>
                        <Typography
                            component='h1'
                            sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 600, mt: 0.5 }}
                        >
                            {pack?.name || days[0]?.package?.name || 'Package'}
                        </Typography>
                        <Typography color='text.secondary' sx={{ fontSize: '0.9375rem', mt: 0.5 }}>
                            Put the days in order. Drag a day, or use its arrows, and add a day anywhere in the trip.
                        </Typography>
                    </Box>
                    <Stack direction='row' spacing={1.5}>
                        <Button variant='outlined' onClick={() => navigate(-1)}>
                            Back
                        </Button>
                        <Button variant='contained' startIcon={<Add />} onClick={handleAddAtEnd}>
                            Add a day
                        </Button>
                    </Stack>
                </Stack>

                {days.length > 0 ? (
                    <Box
                        sx={{
                            mt: 2.5,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'success.lighter',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap'
                        }}
                    >
                        <NightsStay sx={{ color: 'success.dark', fontSize: 20 }} />
                        <Typography sx={{ fontWeight: 700, color: 'success.dark' }}>
                            {days.length} {days.length === 1 ? 'day' : 'days'}, {nights}{' '}
                            {nights === 1 ? 'night' : 'nights'}
                        </Typography>
                        {stays.map(stay => (
                            <Chip
                                key={`${stay.destination}-${stay.from}`}
                                size='small'
                                icon={<LocationOn sx={{ fontSize: '14px !important' }} />}
                                label={`${stay.destination} ${stay.nights}N`}
                                sx={{ bgcolor: 'background.paper', fontWeight: 600 }}
                            />
                        ))}
                    </Box>
                ) : null}

                <Box
                    sx={{
                        mt: 3,
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 420px' },
                        alignItems: 'start'
                    }}
                >
                    <Box>
                        {loading ? (
                            <Stack spacing={1.5}>
                                {[1, 2, 3].map(key => (
                                    <Skeleton key={key} variant='rounded' height={84} />
                                ))}
                            </Stack>
                        ) : null}
                        {!loading && days.length === 0 ? (
                            <Box
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                    borderRadius: 2
                                }}
                            >
                                <Typography sx={{ fontWeight: 600 }}>No days in this package yet</Typography>
                                <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mt: 0.5 }}>
                                    Add the first day with the form.
                                </Typography>
                            </Box>
                        ) : null}
                        {!loading && days.length > 0 ? (
                            <PackageDayList
                                days={days}
                                editingId={editingDay?.id}
                                busy={busy}
                                onMove={handleMove}
                                onEdit={handleEdit}
                                onDelete={handleAskDelete}
                                onInsert={handleInsert}
                            />
                        ) : null}
                    </Box>

                    <Box ref={formRef} sx={{ position: { lg: 'sticky' }, top: { lg: 80 }, scrollMarginTop: 80 }}>
                        <PackageDayForm
                            packageId={params.packageId}
                            campaignId={campaignId}
                            days={days}
                            editingDay={editingDay}
                            insertIndex={insertIndex ?? undefined}
                            onSaved={handleSaved}
                            onCancelEdit={() => setEditingDay(null)}
                            say={say}
                        />
                    </Box>
                </Box>
            </Box>

            <ConfirmModal
                title='Delete this day'
                message={`Delete Day ${days.findIndex(day => day.id === toDelete?.id) + 1}${toDelete ? ` (${dayTitle(toDelete)})` : ''}? The days after it move up.`}
                icon='warning'
                confirmText='Yes, delete'
                customStyle={{ width: { xs: '300px', sm: '456px' } }}
                onConfirm={handleDelete}
                isLoading={deletePackageItenaryClientLKey}
            />
        </MainCard>
    )
}

export default PackagesItenary
