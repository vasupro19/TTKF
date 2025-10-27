/* eslint-disable */
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconButton, LinearProgress, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Delete, FilterAltOff, PersonOff, TextFields, Upload } from '@mui/icons-material'

import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import CustomModal from '@core/components/extended/CustomModal'
import ToggleColumns from '@core/components/ToggleColumns'
import DropdownMenu from '@/core/components/DropdownMenu'
import ImportFileModal from '@/core/components/modals/ImportFileModal'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'

import { TOGGLE_ALL, isExcelQuery } from '@/constants'
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useDeactivateStorageZoneMutation } from '@/app/store/slices/api/storageLocationSlice'
import { openSnackbar } from '@/app/store/slices/snackbar'

import { getStatusVariant, headers, locations } from './helper'
import CustomLink from '@/core/components/extended/CustomLink'
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'
import EditUserIcon from '@/assets/icons/EditUserIcon'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import UpdateAssigneeModalForm from './UpdateAssigneeModalForm'
import { DeleteAnimIcon } from '@/assets/icons/DeleteAnimIcon'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'

function ManageJobsTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const hasCreateAccess = useUiAccess('create')

    const modalType = useSelector(state => state.modal.type)
    const isOpen = useSelector(state => state.modal.open)
    const clearSelectionRef = useRef(null)
    const [deactivateStorageZone] = useDeactivateStorageZoneMutation()
    const [rows, setRows] = useState([])
    const [columns, setColumns] = useState([...headers])
    const [records, setRecords] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)
    const [staticQuery, setStaticQuery] = useState('?start=0&length=10')
    const [activePopup, setActivePopup] = useState(null)
    const [selectedRow, setSelectedRow] = useState([])
    const [jobId, setJobId] = useState('')
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const queryHandler = async query => {
        // You can integrate your API call here if needed
        const mappedRows = locations.map(loc => ({
            id: loc?.id,
            job_id: (
                <CustomLink href={`/inbound/putAway/manageJobs/view/${loc?.job_id}`} icon>
                    <Tooltip title='View Details' placement='bottom' arrow>
                        {loc?.job_id}
                    </Tooltip>
                </CustomLink>
            ),
            progress_bar: (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant='body2' sx={{ fontSize: '12px' }}>
                        {loc?.progress_bar}
                    </Typography>
                    <Box sx={{ width: '100%' }}>
                        <LinearProgress
                            variant='determinate'
                            value={parseFloat(loc?.progress_bar)}
                            sx={{ height: 8, borderRadius: 1 }}
                        />
                    </Box>
                </Box>
            ),
            created_by: loc?.created_by ?? '-',
            created_at: loc?.created_at ?? '-',
            assigned_to: loc?.assigned_to ?? '-',
            status: (
                <ArrowButton
                    label={
                        <Typography variant='h6' sx={{ color: '#fff', fontSize: '12px' }}>
                            {loc.status}
                        </Typography>
                    }
                    variant={getStatusVariant(loc?.status)}
                    nonClickable={true}
                    customStyles={{ width: '140px' }}
                />
            ),
            no_of_bins: loc?.no_of_bins ?? 0,
            total_qty: loc?.total_qty ?? 0,
            pending_qty: (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography sx={{ color: 'error.main', fontSize: '12px' }}>
                        {loc?.pending_qty > 0 ? loc?.pending_qty : '-'}
                    </Typography>
                </Box>
            ),
            started_at: loc?.started_at ?? <Typography variant='body2'>-</Typography>,
            completed_at: loc?.completed_at ?? <Typography variant='body2'>-</Typography>,
            status_text: loc?.status,
            job_id_text: loc?.job_id,
            isDisabled: loc.status == 'Discarded' || loc.status == 'Completed' || loc.status == 'Part Completed'
        }))
        setRows(mappedRows)
        setRecords(locations?.length || 0)
    }

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleAdd = () => navigate('/inbound/putAway/manageJobs/create')

    const handleUpdateAssignee = id => {
        setActivePopup('updateAssignee')
        setJobId(id)
        dispatch(
            openModal({
                content: <UpdateAssigneeModalForm />,
                closeOnBackdropClick: false,
                customStyles: { paddingTop: 3, paddingBottom: '8px' }
            })
        )
    }

    const handleRemoveAssignee = id => {
        setActivePopup('unAssignUser')
        setJobId(id)
        dispatch(openModal({ type: 'confirm_modal' }))
    }

    const handleDiscardJob = id => {
        setActivePopup('discardJobs')
        setJobId(id)
        dispatch(openModal({ type: 'confirm_modal' }))
    }

    const handleDiscardBulkJobs = () => {
        setJobId('')
        setActivePopup('discardJobs')
        dispatch(openModal({ type: 'confirm_modal' }))
    }

    const handleCheckToggle = key => {
        setColumns(
            columns.map(item => {
                if (key === TOGGLE_ALL) return { ...item, visible: true }
                if (key === item.key) return { ...item, visible: !item.visible }
                return item
            })
        )
    }

    const handleBulkImport = () => {
        setActivePopup('bulkImport')
        setJobId('')
        dispatch(
            openModal({
                content: (
                    <ImportFileModal
                        sampleFilePath='/csv/inbound/manageJobs.csv'
                        isDownloadSample
                        removeTitle
                        fileType={{
                            'text/csv': ['.csv'],
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                    />
                ),
                title: <Typography variant='h3'>Assign Jobs</Typography>
            })
        )
    }

    const handleOptionClick = optionAction => {
        if (optionAction === 'form') {
            handleAdd()
        } else {
            handleBulkImport()
        }
    }

    const dropdownOptions = [
        { label: 'Form', action: 'form', icon: <TextFields /> },
        { label: 'Upload', action: 'upload', icon: <Upload /> }
    ]

    useEffect(() => {
        if (!isOpen) {
            queryHandler(staticQuery)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    useEffect(() => {
        setJobId('')
    }, [selectedRow])

    const renderRowActions = useCallback(row => (
        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            {row.status_text !== 'Part Completed' &&
            row.status_text !== 'Discarded' &&
            row.status_text !== 'Completed' ? (
                <Tooltip title='Update assignee'>
                    <IconButton
                        size='small'
                        aria-label='edit row'
                        onClick={() => handleUpdateAssignee(row.job_id_text)}
                    >
                        <EditUserIcon fill='#60498a' />
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip title={`Job already ${row.status_text === 'Completed' ? 'completed' : 'discarded'}`}>
                    <IconButton
                        sx={{ cursor: 'default' }}
                        disableFocusRipple
                        disableRipple
                        aria-label='edit row'
                        size='small'
                    >
                        <EditUserIcon fill='#2229' />
                    </IconButton>
                </Tooltip>
            )}
            {row.status_text !== 'Open' &&
            row.status_text !== 'Discarded' &&
            row.status_text !== 'Completed' &&
            row.status_text !== 'Part Completed' ? (
                <Tooltip title='Remove assignee'>
                    <IconButton
                        size='small'
                        aria-label='remove assignee row'
                        onClick={() => handleRemoveAssignee(row.job_id_text)}
                    >
                        <PersonOff
                            fontSize='small'
                            sx={{ color: 'primary.main', '&:hover': { color: 'primary.dark' } }}
                        />
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip title="Can't remove assignee">
                    <IconButton
                        aria-label='remove assignee row'
                        sx={{ cursor: 'default' }}
                        disableFocusRipple
                        disableRipple
                        size='small'
                    >
                        <PersonOff fontSize='small' />
                    </IconButton>
                </Tooltip>
            )}
            {row.status_text !== 'Discarded' &&
            row.status_text !== 'Completed' &&
            row.status_text !== 'Part Completed' ? (
                <Tooltip title='Discard job'>
                    <IconButton
                        sx={{ color: 'error.main' }}
                        size='small'
                        aria-label='discard row'
                        onClick={() => handleDiscardJob(row.job_id_text)}
                    >
                        <Delete fontSize='small' />
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip title="Can't be marked discarded">
                    <IconButton
                        aria-label='discard row'
                        sx={{ cursor: 'default' }}
                        disableFocusRipple
                        disableRipple
                        size='small'
                    >
                        <Delete fontSize='small' />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
  ), [handleUpdateAssignee, handleRemoveAssignee, handleDiscardJob])

  const menuOptions = useMemo(() => [
    {
        label: 'Update Assignee',
        icon: <EditUserIcon fill='#60498a' />,
        onClick: row => handleUpdateAssignee(row.job_id_text),
        condition: row => 
            row.status_text !== 'Part Completed' &&
            row.status_text !== 'Discarded' &&
            row.status_text !== 'Completed'
    },
    {
        label: 'Remove Assignee',
        icon: <PersonOff fontSize='small' sx={{ color: 'primary.main' }} />,
        onClick: row => handleRemoveAssignee(row.job_id_text),
        condition: row => 
            row.status_text !== 'Open' &&
            row.status_text !== 'Discarded' &&
            row.status_text !== 'Completed' &&
            row.status_text !== 'Part Completed'
    },
    {
        label: 'Discard Job',
        icon: <Delete fontSize='small' sx={{ color: 'error.main' }} />,
        onClick: row => handleDiscardJob(row.job_id_text),
        condition: row => 
            row.status_text !== 'Discarded' &&
            row.status_text !== 'Completed' &&
            row.status_text !== 'Part Completed'
    }
], [handleUpdateAssignee, handleRemoveAssignee, handleDiscardJob])

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd()
        }
    })

    return (
        <ContextMenuProvider>
            <MainCard content={false}>
                <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: '2px' }}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='h3'>All Put Away Jobs</Typography>
                        <Stack direction='row' spacing={2} alignItems='center' paddingY='12px'>
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
                            {selectedRow.length > 0 && (
                                <CustomButton
                                    variant='outlined'
                                    shouldAnimate
                                    endIcon={<DeleteAnimIcon stroke='#f44336' />}
                                    customStyles={{ borderColor: 'primary.main' }}
                                    onClick={handleDiscardBulkJobs}
                                >
                                    Discard
                                </CustomButton>
                            )}
                            <UiAccessGuard>
                                <CSVExport handleExcelClick={handleExcelClick} />
                            </UiAccessGuard>
                            <UiAccessGuard type='create'>
                                <DropdownMenu
                                    buttonText='Add New'
                                    options={dropdownOptions}
                                    onOptionClick={handleOptionClick}
                                />
                            </UiAccessGuard>
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>
                    <DataTable
                        data={rows}
                        columns={columns}
                        queryHandler={queryHandler}
                        isCheckbox
                        excelHandler={excelHandler}
                        totalRecords={records}
                        setSelectedRow={setSelectedRow}
                        clearSelectionRef={clearSelectionRef}
                        renderAction={renderRowActions}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                {(activePopup === 'bulkImport' || activePopup === 'updateAssignee') && modalType === 'global_modal' && (
                    <CustomModal open={isOpen} />
                )}
                {activePopup === 'discardJobs' && (
                    <ConfirmModal
                        title={selectedRow.length <= 0 || jobId ? 'Discard Job' : 'Discard Jobs'}
                        message={
                            <>
                                Are you sure you want to discard{' '}
                                {selectedRow.length <= 0 || jobId ? (
                                    <>
                                        this Job (<strong>JobId: {jobId}</strong>)?
                                    </>
                                ) : selectedRow.length > 1 ? (
                                    <>
                                        all selected (<strong>{selectedRow.length}</strong>) jobs?
                                    </>
                                ) : (
                                    <>
                                        selected job (<strong>JobId: {selectedRow?.[0]}</strong>)?
                                    </>
                                )}
                            </>
                        }
                        icon='warning'
                        confirmText='Yes, Discard'
                        customStyle={{ width: { xs: '300px', sm: '456px' } }}
                        onConfirm={() => {
                            dispatch(
                                openSnackbar({
                                    open: true,
                                    message: 'Discarded successfully',
                                    variant: 'alert',
                                    alert: { color: 'success', icon: 'success' },
                                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                })
                            )
                            if (clearSelectionRef?.current) {
                                clearSelectionRef.current()
                            }
                            setSelectedRow([])
                            dispatch(closeModal())
                        }}
                    />
                )}
                {activePopup === 'unAssignUser' && (
                    <ConfirmModal
                        title='Unassign Job'
                        message={
                            <>
                                Are you sure you want to unassign this Job (<strong>JobId: {jobId}</strong>)?
                            </>
                        }
                        icon='warning'
                        confirmText='Yes, Unassign'
                        customStyle={{ width: { xs: '300px', sm: '456px' } }}
                        onConfirm={() => {
                            dispatch(
                                openSnackbar({
                                    open: true,
                                    message: 'Unassigned successfully',
                                    variant: 'alert',
                                    alert: { color: 'success', icon: 'success' },
                                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                })
                            )
                            dispatch(closeModal())
                        }}
                    />
                )}
            </MainCard>
        </ContextMenuProvider>
    )
}

export default ManageJobsTable
