import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    InputAdornment,
    MenuItem,
    Modal,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import Stack from '@mui/material/Stack'
import { Add, FilterAltOff, InfoOutlined, Search } from '@mui/icons-material'

import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
// project imports
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import CustomButton from '@core/components/extended/CustomButton'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import CustomSearchDateField from '@/core/components/extended/CustomSearchDateField'
import { openSnackbar } from '@app/store/slices/snackbar'
import AssigneeFilter from '@/core/components/AssigneeFilter'

import {
    getLeads,
    getLeadTimeline,
    useDeleteLeadMutation,
    useUpdateLeadMutation
} from '@/app/store/slices/api/leadSlice'

import ToggleColumns from '@/core/components/ToggleColumns'

import { TOGGLE_ALL, isExcelQuery } from '@/constants'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers } from './helper'
import {
    ALL,
    FOLLOW_UPS,
    FOLLOW_UP_HELP,
    filtersFromSearch,
    leadsCsv,
    searchWithFilters,
    withLeadFilters,
    withPaging
} from './leadStages'
import {
    FollowUpChip,
    HowLeadsWork,
    LeadEmptyState,
    LeadProcessBar,
    LeadRowActions,
    ReceivedCell,
    StageCell
} from './leadParts'

const EMPTY_DATES = { created_at: { from: '', to: '' } }
const EMPTY_SUMMARY = { stages: {}, total: 0 }

const snack = (message, color) =>
    openSnackbar({
        open: true,
        message,
        variant: 'alert',
        alert: { color },
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
    })

const downloadCsv = (rows, name) => {
    const blob = new Blob([`\uFEFF${leadsCsv(rows)}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const dash = <Typography sx={{ fontSize: '12px', color: 'text.disabled' }}>—</Typography>

// ? the table draws whatever is in a row's field, so each lead gets its cells drawn here; the lead itself stays on
// ? the row for the actions
const displayRow = (lead, now) => ({
    ...lead,
    leadCell: (
        <Box sx={{ textAlign: 'left', py: 0.5, minWidth: 0 }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'text.primary' }} noWrap>
                {lead.fullName || 'Unnamed guest'}
            </Typography>
            <Stack direction='row' spacing={0.75} alignItems='center' sx={{ mt: 0.25 }}>
                {lead.leadNo && (
                    <Typography sx={{ fontSize: '11px', color: 'text.secondary' }} noWrap>
                        {lead.leadNo}
                    </Typography>
                )}
                {lead.leadSource && (
                    <Chip
                        size='small'
                        label={lead.leadSource}
                        variant='outlined'
                        sx={{ height: 18, fontSize: '10px', '& .MuiChip-label': { px: 0.75 } }}
                    />
                )}
            </Stack>
        </Box>
    ),
    contactCell: (
        <Box sx={{ textAlign: 'left', py: 0.5, minWidth: 0 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 500 }} noWrap>
                {lead.phone || '—'}
            </Typography>
            {lead.senderEmail && (
                <Typography sx={{ fontSize: '11px', color: 'text.secondary' }} noWrap title={lead.senderEmail}>
                    {lead.senderEmail}
                </Typography>
            )}
        </Box>
    ),
    tripCell: lead.campaignName ? (
        <Typography sx={{ fontSize: '12px', textAlign: 'left' }} noWrap title={lead.campaignName}>
            {lead.campaignName}
        </Typography>
    ) : (
        dash
    ),
    stepCell: <StageCell row={lead} now={now} />,
    followUpCell: <FollowUpChip value={lead.followUpState} />,
    assignedCell: lead.assignedTo ? (
        <Typography sx={{ fontSize: '12px', textAlign: 'left' }} noWrap>
            {lead.assignedTo}
        </Typography>
    ) : (
        <Typography sx={{ fontSize: '12px', color: 'text.disabled', textAlign: 'left' }}>Unassigned</Typography>
    ),
    receivedCell: <ReceivedCell value={lead.createdAt} now={now} />
})

/**
 * Every enquiry, from the first message to a confirmed booking: the five steps with their counts on top, the table
 * of leads below, and on each row the one thing to do next.
 */
function MasterLeadsTable() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const location = useLocation()
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')
    const { getLeadsMasterLKey, deleteLeadKey, updateLeadKey } = useSelector(state => state.loading)

    const [columns, setColumns] = useState([...headers])
    const [leads, setLeads] = useState([])
    const [recordsCount, setRecordsCount] = useState(0)
    const [summary, setSummary] = useState(EMPTY_SUMMARY)
    const [loaded, setLoaded] = useState(false)
    const [excelHandler, setExcelHandler] = useState(false)
    const [modalAction, setModalAction] = useState('')
    const [selectedLead, setSelectedLead] = useState(null)
    const [justVerified, setJustVerified] = useState(null)
    const [timelineModal, setTimelineModal] = useState({
        open: false,
        loading: false,
        leadName: '',
        events: []
    })

    const [refetch, setRefetch] = useState(false)
    const [updateLeads] = useUpdateLeadMutation()
    const [deleteLead] = useDeleteLeadMutation()
    const { user } = useSelector(state => state.auth)

    // ? the step, follow-up and person live in the address bar, so a link (or the dashboard) can open a filtered list
    const { stage, followUpState, assignedTo } = useMemo(() => filtersFromSearch(location.search), [location.search])
    const [searchText, setSearchText] = useState('')
    const [search, setSearch] = useState({ value: '', regex: false })
    const [filters, setFilters] = useState(EMPTY_DATES)
    const [datesKey, setDatesKey] = useState(0)

    // ? the latest filters for the table's query, and which request is the newest (an older reply is dropped)
    const leadFilters = useRef({ stage, followUpState, assignedTo })
    leadFilters.current = { stage, followUpState, assignedTo }
    const requestNo = useRef(0)
    const lastQuery = useRef('')

    const triggerRefetch = useCallback(() => {
        setRefetch(true)
        setTimeout(() => setRefetch(false), 500)
    }, [])

    // ? search once the agent stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            const value = searchText.trim()
            setSearch(prev => (prev.value === value ? prev : { value, regex: false }))
        }, 400)
        return () => clearTimeout(timer)
    }, [searchText])

    const setUrlFilters = next => {
        const nextSearch = searchWithFilters(location.search, { stage, followUpState, assignedTo, ...next })
        navigate({ pathname: location.pathname, search: nextSearch }, { replace: true })
    }

    const editHandler = useCallback(row => navigate(`/process/leads/edit/${row.id}`), [navigate])

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const queryHandler = async queryString => {
        const finalQuery = withLeadFilters(queryString, leadFilters.current)

        if (isExcelQuery(queryString || '')) {
            const { data: response } = await dispatch(getLeads.initiate(finalQuery, false))
            downloadCsv(response?.data || [], 'leads.csv')
            return true
        }

        requestNo.current += 1
        const mine = requestNo.current
        lastQuery.current = finalQuery
        const { data: response } = await dispatch(getLeads.initiate(finalQuery, false))
        if (mine !== requestNo.current) return true
        setLeads(response?.data || [])
        setRecordsCount(response?.count || 0)
        setSummary(response?.summary || EMPTY_SUMMARY)
        setLoaded(true)
        return true
    }

    const exportAll = async () => {
        const count = Math.max(recordsCount, 1)
        const { data: response } = await dispatch(getLeads.initiate(withPaging(lastQuery.current, 0, count), false))
        downloadCsv(response?.data || [], 'leads-all.csv')
    }

    const hasFilters = Boolean(
        search.value || filters.created_at?.from || filters.created_at?.to || followUpState || assignedTo
    )

    const clearFilters = () => {
        setSearchText('')
        setSearch({ value: '', regex: false })
        setFilters(EMPTY_DATES)
        setDatesKey(key => key + 1) // ? the date boxes keep what was typed until they are drawn again
        setUrlFilters({ followUpState: '', assignedTo: '' })
    }

    const openConfirmModal = useCallback(
        (action, row) => {
            setModalAction(action)
            setSelectedLead(row)
            dispatch(openModal({ type: 'confirm_modal' }))
        },
        [dispatch]
    )

    const resetModal = () => {
        setModalAction('')
        setSelectedLead(null)
        dispatch(closeModal())
    }

    const deleteActionHandler = async () => {
        try {
            const response = await deleteLead(selectedLead.id).unwrap()
            dispatch(snack(response?.message || 'Lead deleted', 'success'))
            if (justVerified?.id === selectedLead.id) setJustVerified(null)
            triggerRefetch()
        } catch (reqError) {
            dispatch(
                snack(reqError?.data?.data?.message || reqError?.data?.message || 'Unable to delete lead', 'error')
            )
        } finally {
            resetModal()
        }
    }

    const verifyLead = async row => {
        try {
            await updateLeads({ id: row.id, leadStatus: 'verified', updatedBy: user?.id }).unwrap()
            dispatch(snack(`${row.fullName || 'Lead'} verified`, 'success'))
            setJustVerified({ id: row.id, name: row.fullName || 'This lead' })
            triggerRefetch()
        } catch (error) {
            dispatch(snack(error?.data?.message || 'Unable to verify lead', 'error'))
        } finally {
            resetModal()
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

    useEffect(() => {
        triggerRefetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname])

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd()
        }
    })

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
            dispatch(snack(error?.data?.message || 'Unable to load lead timeline', 'error'))
        }
    }

    const rows = useMemo(() => {
        const now = new Date()
        return leads.map(lead => displayRow(lead, now))
    }, [leads])

    const total = Number(summary?.total) || 0
    let emptyKind = null
    if (loaded && !getLeadsMasterLKey && !leads.length) {
        if (hasFilters) emptyKind = 'filtered'
        else if (stage !== ALL) emptyKind = 'stage'
        else emptyKind = 'first'
    }

    // ? a new step, follow-up, person or search starts again from the first page
    const tableKey = `${stage}|${followUpState}|${assignedTo}|${search.value}|${filters.created_at?.from}|${filters.created_at?.to}`
    const verifiedRow = justVerified && leads.find(lead => lead.id === justVerified.id)

    return (
        <MainCard content={false} sx={{ py: '2px' }}>
            <Stack spacing={2} sx={{ py: 1.5 }}>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        flexDirection: { xs: 'column', md: 'row' }
                    }}
                >
                    <Box>
                        <Typography variant='h3'>Leads</Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                            Every enquiry, from the first message to a confirmed booking.
                        </Typography>
                    </Box>
                    <Stack direction='row' spacing={1.5} alignItems='center' flexWrap='wrap' useFlexGap>
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        <UiAccessGuard>
                            <CSVExport handleExcelClick={handleExcelClick} exportAllFunc={exportAll} />
                        </UiAccessGuard>
                        <UiAccessGuard type='create'>
                            <Tooltip title='Alt+A'>
                                <span>
                                    <CustomButton variant='clickable' onClick={handleAdd}>
                                        Add lead <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                                    </CustomButton>
                                </span>
                            </Tooltip>
                        </UiAccessGuard>
                    </Stack>
                </Box>

                <LeadProcessBar
                    stages={summary?.stages}
                    total={total}
                    selected={stage}
                    onSelect={key => setUrlFilters({ stage: key })}
                />

                <HowLeadsWork />

                {verifiedRow && (
                    <Alert
                        severity='success'
                        onClose={() => setJustVerified(null)}
                        action={
                            verifiedRow.stage === 'verified' ? (
                                <Button
                                    color='inherit'
                                    size='small'
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                    onClick={() => navigate(`/process/guest/add/${verifiedRow.id}`)}
                                >
                                    Build quote
                                </Button>
                            ) : null
                        }
                    >
                        {justVerified.name} is verified. Next step: build their quotation.
                    </Alert>
                )}

                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1.5}
                    alignItems={{ md: 'center' }}
                    useFlexGap
                    flexWrap='wrap'
                >
                    <TextField
                        size='small'
                        placeholder='Search name, phone or email'
                        value={searchText}
                        onChange={event => setSearchText(event.target.value)}
                        sx={{ width: { xs: '100%', md: 280 }, '& .MuiInputBase-root': { height: 34 } }}
                        InputProps={{
                            inputProps: { 'aria-label': 'Search leads' },
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <Search fontSize='small' />
                                </InputAdornment>
                            )
                        }}
                    />
                    <Stack direction='row' spacing={1.5} key={datesKey}>
                        <CustomSearchDateField
                            type='from'
                            filters={filters}
                            setFilters={setFilters}
                            placeholder='From date'
                            label='From'
                        />
                        <CustomSearchDateField
                            type='to'
                            filters={filters}
                            setFilters={setFilters}
                            placeholder='To date'
                            label='To'
                        />
                    </Stack>
                    <Stack direction='row' spacing={0.5} alignItems='center'>
                        <TextField
                            select
                            size='small'
                            label='Follow-up'
                            value={followUpState || 'All'}
                            onChange={event =>
                                setUrlFilters({ followUpState: event.target.value === 'All' ? '' : event.target.value })
                            }
                            sx={{ width: { xs: '100%', md: 160 }, '& .MuiInputBase-root': { height: 34 } }}
                        >
                            <MenuItem value='All'>All</MenuItem>
                            {FOLLOW_UPS.map(item => (
                                <MenuItem key={item.key} value={item.key}>
                                    {item.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Tooltip
                            arrow
                            title={<Box sx={{ whiteSpace: 'pre-line', fontSize: '0.75rem' }}>{FOLLOW_UP_HELP}</Box>}
                        >
                            <InfoOutlined
                                fontSize='small'
                                sx={{ color: 'text.secondary' }}
                                aria-label='What the follow-up states mean'
                            />
                        </Tooltip>
                    </Stack>
                    <AssigneeFilter value={assignedTo} onChange={id => setUrlFilters({ assignedTo: id })} />
                    {hasFilters && (
                        <CustomButton
                            variant='text'
                            customStyles={{
                                color: 'error.main',
                                '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                            }}
                            startIcon={<FilterAltOff />}
                            onClick={clearFilters}
                        >
                            Clear filters
                        </CustomButton>
                    )}
                </Stack>

                {emptyKind && (
                    <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: '12px' }}>
                        <LeadEmptyState
                            kind={emptyKind}
                            stage={stage}
                            canCreate={hasCreateAccess}
                            onAdd={handleAdd}
                            onClear={clearFilters}
                        />
                    </Box>
                )}

                {/* the table stays mounted while empty so it keeps fetching */}
                <Box sx={{ display: emptyKind ? 'none' : 'block' }}>
                    <DataTable
                        key={tableKey}
                        data={rows}
                        columns={columns}
                        queryHandler={queryHandler}
                        reqKey='getLeadsMasterLKey'
                        refetch={refetch}
                        globalSearch={search}
                        globalFilters={filters}
                        addExcelQuery={excelHandler}
                        totalRecords={recordsCount}
                        isColumnsSearchable={false}
                        renderAction={row => (
                            <LeadRowActions
                                row={row}
                                canEdit={hasEditAccess}
                                onVerify={lead => openConfirmModal('verify', lead)}
                                onGo={to => navigate(to)}
                                onTimeline={handleOpenTimeline}
                                onEdit={editHandler}
                                onDelete={lead => openConfirmModal('delete', lead)}
                            />
                        )}
                        isLoading={getLeadsMasterLKey}
                    />
                </Box>
            </Stack>

            <ConfirmModal
                title={modalAction === 'delete' ? 'Delete lead' : 'Verify lead'}
                message={
                    modalAction === 'delete' ? (
                        <>Delete {selectedLead?.fullName || 'this lead'}? This can&apos;t be undone.</>
                    ) : (
                        <>
                            Mark <strong>{selectedLead?.fullName || 'this lead'}</strong> as verified? Do this once
                            you&apos;ve spoken to the guest and the enquiry is real. Next you&apos;ll build their
                            quotation.
                        </>
                    )
                }
                icon={modalAction === 'delete' ? 'warning' : 'info'}
                confirmText={modalAction === 'delete' ? 'Delete' : 'Mark as verified'}
                customStyle={{ width: { xs: '300px', sm: '456px' } }}
                onConfirm={() => (modalAction === 'delete' ? deleteActionHandler() : verifyLead(selectedLead))}
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
    )
}

export default MasterLeadsTable
