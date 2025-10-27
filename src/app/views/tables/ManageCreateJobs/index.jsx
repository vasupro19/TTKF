/* eslint-disable */
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { FormControlLabel, IconButton, TextField, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import {
    Add,
    AllInbox,
    Cancel,
    Edit,
    RemoveCircleOutlineOutlined,
    Search,
    TextFields,
    Upload
} from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import CustomModal from '@core/components/extended/CustomModal'
import ToggleColumns from '@core/components/ToggleColumns'
import CustomSwitch from '@core/components/extended/CustomSwitch'
import StatusBadge from '@core/components/StatusBadge'
import DropdownMenu from '@/core/components/DropdownMenu'
import ImportFileModal from '@/core/components/modals/ImportFileModal'

// import permission guard
import UiAccessGuard from '@/app/guards/UiPermissionGuard'

// ** import utils
import { TOGGLE_ALL, isExcelQuery } from '@/constants'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { storageZoneDataTable, useDeactivateStorageZoneMutation } from '@/app/store/slices/api/storageLocationSlice'

// ** import sub-components
import { openSnackbar } from '@/app/store/slices/snackbar'

// ** import helper
import { headers, locations, STATUS_TYPE } from './helper'
import CustomLink from '@/core/components/extended/CustomLink'
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'
import AlignedText from '@/core/components/alignedText'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { DeleteAnimIcon } from '@/assets/icons/DeleteAnimIcon'

function ManageCreateJobsTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const modalType = useSelector(state => state.modal.type)
    const isOpen = useSelector(state => state.modal.open)
    const clearSelectionRef = useRef(null)
    const [deactivateStorageZone] = useDeactivateStorageZoneMutation()
    const [rows, setRows] = useState([])
    const [columns, setColumns] = useState([...headers])
    const [records, setRecords] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)

    const [activePopup, setActivePopup] = useState(null)
    const [inputVal, setInputVal] = useState('')
    const [selectedRow, setSelectedRow] = useState([])
    const [itemId, setItemId] = useState('')
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [refetch, setRefetch] = useState(false)

    const handleClearInput = () => {
        setInputVal('')
    }

    const handleInputChange = e => {
        setInputVal(e.target.value)
    }

    const queryHandler = async query => {
        // const { data: response } = await dispatch(storageZoneDataTable.initiate(query))
        // if (isExcelQuery(query)) return

        setRows(
            locations.map(loc => ({
                id: loc?.id,
                user_name: loc?.user_name ?? '-',
                item_id: (
                    <Tooltip title={loc?.item_id} placement='bottom' unselectable='on' disableInteractive arrow>
                        <Typography
                            sx={{
                                fontSize: '12px',
                                userSelect: 'none', // Prevent text selection
                                cursor: 'default' // Avoid text cursor appearance
                            }}
                        >
                            {`${loc?.item_id.slice(0, 2)}****${loc?.item_id.slice(-2)}`}
                        </Typography>
                    </Tooltip>
                ),
                EAN: loc?.EAN ?? '-',
                bin_id: loc?.bin_id ?? '-',
                location: loc?.location ?? '-',
                started_at: <AlignedText alignment='center' />,
                completed_at: <AlignedText alignment='center' />,
                putaway_status: <AlignedText alignment='center' />
            })) || []
        )

        setRecords(locations?.length || 0)
        // setRecords(response?.recordsTotal || 0)
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

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    useEffect(() => {
        if (!isOpen) {
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    const handleRemoveItem = id => {
        setActivePopup('removeJobItems')
        setItemId(id)
        dispatch(openModal({ type: 'confirm_modal' }))
    }

    const handleRemoveBulkItems = () => {
        setItemId('')
        setActivePopup('removeJobItems')
        dispatch(openModal({ type: 'confirm_modal' }))
    }

    return (
        <MainCard content={false}>
            <Box sx={{ paddingTop: '2px' }}>
                {/* Add your dummy buttons here */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Stack direction='row' spacing={2} alignItems='center' paddingY='4px'>
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
                        {selectedRow.length > 0 && (
                            <CustomButton
                                variant='outlined'
                                shouldAnimate
                                endIcon={<RemoveCircleOutlineOutlined fontSize='small' color='error' />}
                                customStyles={{ borderColor: 'primary.main' }}
                                onClick={handleRemoveBulkItems}
                            >
                                Remove
                            </CustomButton>
                        )}
                        <UiAccessGuard>
                            <CSVExport handleExcelClick={handleExcelClick} />
                        </UiAccessGuard>

                        {/* render action column can be made dynamic based on user authorization  */}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                    </Stack>
                </Box>
                <DataTable
                    data={rows}
                    columns={columns}
                    queryHandler={queryHandler}
                    excelHandler={excelHandler}
                    refetch={reftch}
                    totalRecords={records}
                    isCheckbox
                    setSelectedRow={setSelectedRow}
                    clearSelectionRef={clearSelectionRef}
                    renderAction={row => (
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <IconButton
                                sx={{ color: 'error.main' }}
                                size='small'
                                aria-label='delete row'
                                onClick={() => handleRemoveItem(row.id)}
                            >
                                <Tooltip title='Remove'>
                                    <RemoveCircleOutlineOutlined fontSize='small' />
                                </Tooltip>
                            </IconButton>
                        </Box>
                    )}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                />
                {activePopup === 'removeJobItems' && (
                    <ConfirmModal
                        title={selectedRow?.length <= 0 || itemId ? 'Remove Item' : 'Remove Items'}
                        message={
                            <>
                                Are you sure you want to remove{' '}
                                {selectedRow.length <= 0 || itemId ? (
                                    <>
                                        this item (<strong>itemId: {itemId}</strong>)?
                                    </>
                                ) : selectedRow.length > 1 ? (
                                    <>
                                        all selected (<strong>{selectedRow.length}</strong>) jobs?
                                    </>
                                ) : (
                                    <>
                                        selected item (<strong>itemId: {selectedRow?.[0]}</strong>)?
                                    </>
                                )}
                            </>
                        }
                        icon='warning'
                        confirmText='Yes, Remove'
                        customStyle={{ width: { xs: '300px', sm: '456px' } }}
                        onConfirm={() => {
                            dispatch(
                                openSnackbar({
                                    open: true,
                                    message: 'Removed successfully',
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
            </Box>
        </MainCard>
    )
}

export default ManageCreateJobsTable
