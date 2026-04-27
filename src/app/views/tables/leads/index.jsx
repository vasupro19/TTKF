import { useState, useEffect, useMemo, useCallback } from 'react'

import { Box, IconButton, Tooltip, Typography, Chip, Modal, CircularProgress } from '@mui/material'
import Stack from '@mui/material/Stack'
import { Add, Edit, Delete, FilterAltOff, Visibility } from '@mui/icons-material'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import VerifiedIcon from '@mui/icons-material/Verified'
import LocalHotelIcon from '@mui/icons-material/LocalHotel'

import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
// project imports
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import CustomButton from '@core/components/extended/CustomButton'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import CustomSearchDateField from '@/core/components/extended/CustomSearchDateField'
import { openSnackbar } from '@app/store/slices/snackbar'

import {
    getLeads,
    getLeadTimeline,
    useDeleteLeadMutation,
    useUpdateLeadMutation
} from '@/app/store/slices/api/leadSlice'

import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'

// import { getObjectKeys, toCapitalizedWords } from '@/utilities'
// import { Typography } from '@mui/material'
import ToggleColumns from '@/core/components/ToggleColumns'

import { TOGGLE_ALL, isExcelQuery } from '@/constants'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers } from './helper'

// const slimTextFieldStyle = {
//     '& .MuiInputBase-input': {
//         fontSize: 12,
//         height: 8,
//         padding: 1
//     }
// }

function MasterLeadsTable() {
    const params = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const location = useLocation()
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')
    const { getLeadsMasterLKey, deleteLeadKey, updateLeadKey } = useSelector(state => state.loading)

    const [columns, setColumns] = useState([...headers])
    const [users, setUsers] = useState([])
    const [recordsCount, setRecordsCount] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)
    const [modalAction, setModalAction] = useState('')
    const [selectedLeadId, setSelectedLeadId] = useState(null)
    const [removeId, setRemoveId] = useState(null)
    const [quickFilter, setQuickFilter] = useState({ status: 'All', followUpState: 'All' })
    const [timelineModal, setTimelineModal] = useState({
        open: false,
        loading: false,
        leadName: '',
        events: []
    })

    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [refetch, setRefetch] = useState(false)
    const [updateLeads] = useUpdateLeadMutation()
    const [deleteLead] = useDeleteLeadMutation()
    const { user } = useSelector(state => state.auth)
    // const [getDestinationClient] = useGetDestinationClientsQuery()

    const [search, setSearch] = useState({
        // value: '',
        // regex: false
    })
    const [filters, setFilters] = useState({
        created_at: { from: '', to: '' },
        campaignId: params.id
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editHandler = useCallback(async id => navigate(`/process/leads/edit/${id}`), [])

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }
    const queryHandler = async queryString => {
        const extraParams = new URLSearchParams()
        if (quickFilter.status !== 'All') extraParams.set('quickStatus', quickFilter.status)
        if (quickFilter.followUpState !== 'All') extraParams.set('followUpState', quickFilter.followUpState)

        const enhancedQuery = `${queryString || ''}${queryString?.includes('?') ? '&' : '?'}${extraParams.toString()}`
        const finalQuery = extraParams.toString() ? enhancedQuery : queryString

        const { data: response } = await dispatch(getLeads.initiate(finalQuery, false))
        if (isExcelQuery(queryString)) {
            return true
        }
        setUsers(response?.data || [])
        setRecordsCount(response?.count || 0)
        return true
    }

    const clearFilters = () => {
        setSearch({
            value: '',
            regex: false
        })
        setFilters({ created_at: { from: '', to: '' } })
        setQuickFilter({ status: 'All', followUpState: 'All' })
    }

    const openConfirmModal = useCallback(
        (action, id) => {
            setModalAction(action)
            setSelectedLeadId(id)
            if (action === 'delete') {
                setRemoveId(id)
            }
            dispatch(
                openModal({
                    type: 'confirm_modal'
                })
            )
        },
        [dispatch]
    )

    const deleteActionHandler = async () => {
        try {
            const response = await deleteLead(removeId).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: response?.message || 'Lead deleted successfully!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
        } catch (reqError) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: reqError?.data?.data?.message || 'Unable to delete lead!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            setModalAction('')
            setSelectedLeadId(null)
            setRemoveId(null)
            dispatch(closeModal())
        }
    }

    // column toggler
    const handleCheckToggle = key => {
        setColumns([
            ...columns.map(item => {
                if (key === TOGGLE_ALL) return { ...item, visible: true }
                if (key === item.key) return { ...item, visible: !item.visible }
                return item
            })
        ])
    }

    const handleAdd = () => {
        navigate('/process/leads/add')
    }

    const menuOptions = useMemo(
        () => [
            {
                label: 'Edit',
                icon: <Edit fontSize='small' sx={{ fill: '#60498a' }} />,
                onClick: row => editHandler(row.id, row),
                condition: () => hasEditAccess
            },
            {
                label: 'Delete',
                icon: <Delete fontSize='small' sx={{ color: 'error.main' }} />,
                onClick: row => openConfirmModal('delete', row.id),
                condition: () => hasEditAccess
            }
        ],
        [editHandler, openConfirmModal, hasEditAccess]
    )

    useEffect(() => {
        setRefetch(true)
        setTimeout(() => setRefetch(false), 500)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname])

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd()
        }
    })

    const verifyLead = async id => {
        try {
            await updateLeads({ id, leadStatus: 'verified', updatedBy: user?.id }).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Lead Verified!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            setRefetch(true)
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Unable to verify lead',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            setModalAction('')
            setSelectedLeadId(null)
            dispatch(closeModal())
        }
    }

    const handleOpenTimeline = async row => {
        setTimelineModal({
            open: true,
            loading: true,
            leadName: row.fullName,
            events: []
        })

        try {
            const { data } = await dispatch(getLeadTimeline.initiate(row.id))
            setTimelineModal({
                open: true,
                loading: false,
                leadName: data?.data?.lead?.fullName || row.fullName,
                events: data?.data?.timeline || []
            })
        } catch (error) {
            setTimelineModal({
                open: false,
                loading: false,
                leadName: '',
                events: []
            })
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Unable to load lead timeline',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }

    const leadSummary = useMemo(() => {
        const total = users.length
        const confirmed = users.filter(item => item.status === 'Confirmed').length
        const verified = users.filter(item => item.status === 'verified').length
        const pending = total - confirmed - verified

        return [
            { label: 'Showing', value: `${total} leads`, color: '#1d4ed8', bg: '#eff6ff' },
            { label: 'Verified', value: verified, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Confirmed', value: confirmed, color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Pending', value: pending, color: '#b45309', bg: '#fffbeb' }
        ]
    }, [users])

    const getLeadStatusStyle = status => {
        if (status === 'Confirmed') {
            return { bg: '#f0fdf4', color: '#16a34a' }
        }

        if (status === 'verified') {
            return { bg: '#eff6ff', color: '#2563eb' }
        }

        return { bg: '#fff7ed', color: '#b45309' }
    }

    const getFollowUpStyle = status => {
        if (status === 'Overdue') {
            return { bg: '#fef2f2', color: '#dc2626' }
        }

        if (status === 'Due Today') {
            return { bg: '#fffbeb', color: '#b45309' }
        }

        if (status === 'On Track') {
            return { bg: '#f0fdf4', color: '#16a34a' }
        }

        return { bg: '#eff6ff', color: '#2563eb' }
    }

    const enhancedColumns = useMemo(
        () =>
            columns.map(column => {
                if (column.key === 'status') {
                    return {
                        ...column,
                        render: row => {
                            const statusStyle = getLeadStatusStyle(row.status)

                            return (
                                <Chip
                                    size='small'
                                    label={row.status || 'Pending'}
                                    sx={{
                                        bgcolor: statusStyle.bg,
                                        color: statusStyle.color,
                                        fontWeight: 700
                                    }}
                                />
                            )
                        }
                    }
                }

                if (column.key === 'followUpState') {
                    return {
                        ...column,
                        render: row => {
                            const followUpStyle = getFollowUpStyle(row.followUpState)

                            return (
                                <Chip
                                    size='small'
                                    label={row.followUpState || 'Needs Follow-up'}
                                    sx={{
                                        bgcolor: followUpStyle.bg,
                                        color: followUpStyle.color,
                                        fontWeight: 700
                                    }}
                                />
                            )
                        }
                    }
                }

                return column
            }),
        [columns]
    )

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search)
        const status = searchParams.get('status')
        const followUpState = searchParams.get('followUpState')

        if (status || followUpState) {
            setQuickFilter({
                status: status || 'All',
                followUpState: followUpState || 'All'
            })
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
        }
    }, [location.search])

    return (
        <ContextMenuProvider>
            <MainCard content={false} sx={{ py: '2px' }}>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        flexDirection: { xs: 'column', md: 'row' }
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant='h3'>All Leads</Typography>
                        <Typography variant='body2' color='text.secondary'>
                            Verify leads first, then move them into guest details and package conversion.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {leadSummary.map(item => (
                                <Chip
                                    key={item.label}
                                    label={`${item.label}: ${item.value}`}
                                    size='small'
                                    sx={{
                                        bgcolor: item.bg,
                                        color: item.color,
                                        fontWeight: 700,
                                        borderRadius: '8px'
                                    }}
                                />
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {[
                                { label: 'All', key: 'All' },
                                { label: 'Pending', key: 'Pending' },
                                { label: 'Verified', key: 'verified' },
                                { label: 'Confirmed', key: 'Confirmed' }
                            ].map(item => (
                                <Chip
                                    key={item.key}
                                    label={item.label}
                                    size='small'
                                    variant={quickFilter.status === item.key ? 'filled' : 'outlined'}
                                    color={quickFilter.status === item.key ? 'primary' : 'default'}
                                    onClick={() => {
                                        setQuickFilter(prev => ({ ...prev, status: item.key }))
                                        setRefetch(true)
                                        setTimeout(() => setRefetch(false), 500)
                                    }}
                                />
                            ))}
                            {[
                                { label: 'All Follow-ups', key: 'All' },
                                { label: 'Due Today', key: 'Due Today' },
                                { label: 'Overdue', key: 'Overdue' },
                                { label: 'On Track', key: 'On Track' }
                            ].map(item => (
                                <Chip
                                    key={item.key}
                                    label={item.label}
                                    size='small'
                                    variant={quickFilter.followUpState === item.key ? 'filled' : 'outlined'}
                                    color={quickFilter.followUpState === item.key ? 'secondary' : 'default'}
                                    onClick={() => {
                                        setQuickFilter(prev => ({ ...prev, followUpState: item.key }))
                                        setRefetch(true)
                                        setTimeout(() => setRefetch(false), 500)
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                    <Stack direction='row' spacing={2} alignItems='center' paddingY='12px'>
                        {/* add your custom filters here */}
                        {isShowClearButton && (
                            <CustomButton
                                variant='text'
                                customStyles={{
                                    color: 'error.main',
                                    '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                                }}
                                startIcon={<FilterAltOff />}
                                onClick={() => {
                                    setClearAllFilters(prev => !prev)
                                }}
                            >
                                Clear All Filters
                            </CustomButton>
                        )}
                        {/* <CustomSearchTextField
                            search={search}
                            setSearch={setSearch}
                            placeholder='Search locations...'
                        /> */}
                        {/* // Example for "From" date */}
                        <CustomSearchDateField
                            type='from'
                            filters={filters}
                            setFilters={setFilters}
                            placeholder='From date'
                            label='From'
                        />
                        {/* </Box> */}

                        {/* // Example for "To" date */}
                        <CustomSearchDateField
                            type='to'
                            filters={filters}
                            setFilters={setFilters}
                            placeholder='To date'
                            label='To'
                        />
                        {/* <TextField
                        placeholder='search data'
                        size='small'
                        type='search'
                        sx={{
                            '& .MuiInputBase-input': {
                                fontSize: 12
                            },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: 'primary.800',
                                    borderWidth: '1.2px'
                                },
                                '&:hover fieldset': {
                                    borderColor: 'primary.main'
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main'
                                }
                                // padding: '0px 4px'
                            },
                            '& .MuiInputBase-inputSizeSmall': {
                                padding: '3px 6px !important'
                            }
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') setSearch({ ...search, value: e.target.value })
                        }}
                    /> */}
                        {/* <TextField
                        placeholder='from date'
                        size='small'
                        type='date'
                        sx={slimTextFieldStyle}
                        defaultValue={filters?.created_at?.from}
                        onChange={e =>
                            setFilters({
                                ...filters,
                                created_at: { ...filters.created_at, from: `${e.target.value} 00:00:00` }
                            })
                        }
                    /> */}
                        {/* <TextField
                        placeholder='To Date'
                        type='date'
                        size='small'
                        sx={slimTextFieldStyle}
                        defaultValue={filters?.created_at?.to}
                        onChange={e =>
                            setFilters({
                                ...filters,
                                created_at: { ...filters.created_at, to: `${e.target.value} 23:59:59` }
                            })
                        }
                    /> */}
                        <UiAccessGuard>
                            <CSVExport handleExcelClick={handleExcelClick} />
                        </UiAccessGuard>
                        <UiAccessGuard type='create'>
                            <CustomButton variant='clickable' onClick={handleAdd}>
                                Add New <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                            </CustomButton>
                        </UiAccessGuard>

                        {/* render action column can be made dynamic based on user authorization  */}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                    </Stack>
                </Box>
                <DataTable
                    isCheckbox
                    data={users || []}
                    columns={enhancedColumns}
                    queryHandler={queryHandler}
                    reqKey='getLocationMasterLKey'
                    refetch={refetch}
                    globalSearch={search}
                    globalFilters={filters}
                    clearFilters={clearFilters}
                    addExcelQuery={excelHandler}
                    totalRecords={recordsCount}
                    renderAction={row => (
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <UiAccessGuard type='edit'>
                                <IconButton
                                    sx={{ color: 'info.main' }}
                                    size='small'
                                    aria-label='view lead timeline'
                                    onClick={() => handleOpenTimeline(row)}
                                >
                                    <Tooltip title='View Timeline'>
                                        <Visibility fontSize='small' />
                                    </Tooltip>
                                </IconButton>
                            </UiAccessGuard>
                            <UiAccessGuard type='edit'>
                                <IconButton
                                    sx={{ color: 'success.main' }}
                                    size='small'
                                    aria-label='edit row'
                                    onClick={() => editHandler(row.id, row)}
                                >
                                    <Tooltip title='Edit'>
                                        <Edit fontSize='small' sx={{ fill: '#60498a' }} />
                                    </Tooltip>
                                </IconButton>
                            </UiAccessGuard>
                            <UiAccessGuard type='edit'>
                                <IconButton
                                    sx={{ color: 'error.main' }}
                                    size='small'
                                    aria-label='delete lead'
                                    onClick={() => openConfirmModal('delete', row.id)}
                                >
                                    <Tooltip title='Delete Lead'>
                                        <Delete fontSize='small' color='error' />
                                    </Tooltip>
                                </IconButton>
                            </UiAccessGuard>
                            <UiAccessGuard type='edit'>
                                <IconButton
                                    sx={{ color: 'error.main' }}
                                    size='small'
                                    aria-label='verify lead'
                                    onClick={() => openConfirmModal('verify', row.id)}
                                >
                                    {row.status !== 'verified' && row.status !== 'Confirmed' ? (
                                        <Tooltip title='Verify'>
                                            <VerifiedOutlinedIcon fontSize='small' color='action' />
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title='Verified Lead'>
                                            <VerifiedIcon fontSize='small' color='success' />
                                        </Tooltip>
                                    )}
                                </IconButton>
                            </UiAccessGuard>

                            {(row.status === 'verified' || row.status === 'Confirmed') && (
                                <IconButton
                                    sx={{ color: 'error.main' }}
                                    size='small'
                                    aria-label='edit row'
                                    onClick={() => navigate(`/process/guest/add/${row.id}`)}
                                >
                                    <Tooltip title='Add Guest Details'>
                                        <LocalHotelIcon fontSize='small' />
                                    </Tooltip>
                                </IconButton>
                            )}
                        </Box>
                    )}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                    isLoading={getLeadsMasterLKey}
                    enableContextMenu
                />
                <PopperContextMenu options={menuOptions} />

                <ConfirmModal
                    title={modalAction === 'delete' ? 'Delete Lead' : 'Verify Lead'}
                    message={
                        modalAction === 'delete' ? (
                            <>Are you sure you want to delete this lead?</>
                        ) : (
                            <>Are you sure you want to verify this lead?</>
                        )
                    }
                    icon='warning'
                    confirmText={modalAction === 'delete' ? 'Delete' : 'Yes'}
                    customStyle={{ width: { xs: '300px', sm: '456px' } }}
                    onConfirm={() => (modalAction === 'delete' ? deleteActionHandler() : verifyLead(selectedLeadId))}
                    isLoading={modalAction === 'delete' ? deleteLeadKey : updateLeadKey}
                />

                <Modal open={timelineModal.open} onClose={() => setTimelineModal(prev => ({ ...prev, open: false }))}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: { xs: '92vw', md: '760px' },
                            maxHeight: '85vh',
                            overflow: 'auto',
                            bgcolor: 'background.paper',
                            borderRadius: '16px',
                            boxShadow: 24,
                            p: 3
                        }}
                    >
                        <Typography variant='h4' sx={{ mb: 1 }}>
                            {timelineModal.leadName} Timeline
                        </Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                            This shows lead progress, package conversion, service assignment, and payment activity.
                        </Typography>

                        {timelineModal.loading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress />
                            </Box>
                        )}
                        {!timelineModal.loading && timelineModal.events.length > 0 && (
                            <Stack spacing={2}>
                                {timelineModal.events.map(event => (
                                    <Box
                                        key={`${event.type}-${event.timestamp}-${event.title}`}
                                        sx={{
                                            p: 2,
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            bgcolor: '#fbfdff'
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: 1,
                                                flexWrap: 'wrap'
                                            }}
                                        >
                                            <Typography variant='subtitle1' fontWeight={700}>
                                                {event.title}
                                            </Typography>
                                            <Chip
                                                size='small'
                                                label={new Date(event.timestamp).toLocaleString('en-IN')}
                                                variant='outlined'
                                            />
                                        </Box>
                                        {event.description && (
                                            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                                {event.description}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Stack>
                        )}
                        {!timelineModal.loading && timelineModal.events.length === 0 && (
                            <Typography variant='body2' color='text.secondary'>
                                No timeline activity is available for this lead yet.
                            </Typography>
                        )}
                    </Box>
                </Modal>
            </MainCard>
        </ContextMenuProvider>
    )
}

export default MasterLeadsTable
