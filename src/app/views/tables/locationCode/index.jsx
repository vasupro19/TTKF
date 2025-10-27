import { useEffect, useMemo, useRef, useState, useCallback } from 'react'

import { CircularProgress, FormControlLabel, IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Add, Edit, FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import CustomModal from '@core/components/extended/CustomModal'
import ToggleColumns from '@core/components/ToggleColumns'
import CustomSwitch from '@core/components/extended/CustomSwitch'
import StatusBadge from '@core/components/StatusBadge'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'

// ** import utils
import { TOGGLE_ALL, isExcelQuery } from '@/constants'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { locationCodeDataTable, useDeactivateLocationCodeMutation } from '@/app/store/slices/api/storageLocationSlice'

// ** import sub-components
import { openSnackbar } from '@/app/store/slices/snackbar'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { CSVLink } from 'react-csv'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import useUiAccess from '@/hooks/useUiAccess'
import CreateLocationCodeModal from './CreateLocationCodeModal'

// ** import dummy data
import { headers, STATUS_TYPE, TYPE_COLOR } from './helper'

function MasterLocationCodeTable() {
    const dispatch = useDispatch()
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')
    const loading = useSelector(state => state.loading)
    const [deactivateLocationCode] = useDeactivateLocationCodeMutation()

    const [columns, setColumns] = useState([...headers])
    const [records, setRecords] = useState(0)
    const [rows, setRows] = useState([])
    const [excelHandler, setExcelHandler] = useState(false)
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const csvLinkRef = useRef(null)
    const isOpen = useSelector(state => state.modal.open)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [refetch, setRefetch] = useState(false)

    const queryHandler = async query => {
        const { data: response } = await dispatch(locationCodeDataTable.initiate(query, false))
        if (isExcelQuery(query)) return
        setRows(
            response?.data.map(item => {
                const tempItem = { ...item }
                tempItem.inventory_type = (
                    <StatusBadge type={TYPE_COLOR[tempItem.inventory_type]} label={tempItem.inventory_type} />
                )
                tempItem.status = (
                    <StatusBadge type={STATUS_TYPE[tempItem.status].color} label={STATUS_TYPE[tempItem.status].label} />
                )
                tempItem.movement_allowed = (
                    <StatusBadge
                        type={tempItem.movement_allowed ? 'success' : 'error'}
                        label={tempItem.movement_allowed ? 'YES' : 'NO'}
                    />
                )
                return tempItem
            }) || []
        )
        setRecords(response?.recordsTotal || 0)
    }

    const handleCurrentView = () => {
        if (!rows.length) return

        const dynamicHeaders = headers
            .filter(header => header.label !== 'Sr. No.')
            .map(header => ({
                label: header.label,
                key: header.key
            }))

        const exportData = rows.map(item => {
            const row = {}

            dynamicHeaders.forEach(header => {
                if (header.key === 'status') {
                    row[header.key] = item[header.key]?.props?.label || ''
                } else if (header.key === 'movement_allowed') {
                    row[header.key] = item[header.key]?.props?.label || ''
                } else if (header.key === 'inventory_type') {
                    row[header.key] = item[header.key]?.props?.label || ''
                } else if (header.key === 'created_at') {
                    row[header.key] = item[header.key] ? new Date(item[header.key]).toLocaleString() : ''
                } else if (header.key === 'updated_at') {
                    row[header.key] = item[header.key] ? new Date(item[header.key]).toLocaleString() : ''
                } else {
                    row[header.key] = item[header.key] || ''
                }
            })

            return row
        })

        setCsvHeaders(dynamicHeaders)
        setCsvData(exportData)

        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click()
            }
        }, 500)
    }

    const handleExportAllExcel = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    // open add modal
    const handleAdd = (id = null) => {
        dispatch(
            openModal({
                content: <CreateLocationCodeModal editId={id} />,
                closeOnBackdropClick: false,
                title: <Typography variant='h3'>Import Location Codes</Typography>
            })
        )
    }

    const editHandler = useCallback(id => handleAdd(id), [])

    const handleUpdateStatus = async id => {
        let isError
        let message
        try {
            const response = await deactivateLocationCode(id).unwrap()
            message = response?.message || response?.data?.message || 'deactivated location code'
        } catch (error) {
            isError = true
            message = error?.data?.message || error?.message || 'unable to deactivate  location code!'
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            if (!isError) {
                setRefetch(true)
                setTimeout(() => setRefetch(false), 500)
            }
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

    const menuOptions = useMemo(
        () => [
            {
                label: 'Edit',
                icon: <Edit fontSize='small' sx={{ fill: '#60498a' }} />,
                onClick: row => editHandler(row.id, row),
                condition: row => hasEditAccess
            }
        ],
        [editHandler, hasEditAccess]
    )

    useEffect(() => {
        if (!isOpen) {
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd()
        }
    })

    useDocumentTitle('Location Codes | Warehouse')

    return (
        <ContextMenuProvider>
            <MainCard content={false}>
                <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: '2px' }}>
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            gap: 2,
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <Box>
                            <Typography variant='h3'>All Location Codes</Typography>
                        </Box>
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
                            <UiAccessGuard>
                                <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAllExcel} />
                            </UiAccessGuard>
                            {/* add your custom filters here */}
                            <UiAccessGuard type='create'>
                                <CustomButton variant='clickable' color='primary' onClick={handleAdd}>
                                    Add New
                                    <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                                </CustomButton>
                            </UiAccessGuard>

                            {/* render action column can be made dynamic based on user authorization  */}
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>
                    <MobileTableToolbar
                        title='All Location Codes'
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAllExcel}
                        setClearAllFilters={setClearAllFilters}
                        handleAdd={handleAdd}
                    />
                    <DataTable
                        data={rows}
                        columns={columns}
                        queryHandler={queryHandler}
                        reqKey='locationCodeDataTableLKey'
                        refetch={refetch}
                        isCheckbox={false}
                        totalRecords={records}
                        addExcelQuery={excelHandler}
                        renderAction={row => (
                            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                <UiAccessGuard type='edit'>
                                    <IconButton
                                        sx={{ color: 'success.main' }}
                                        size='small'
                                        aria-label='edit row'
                                        onClick={() => editHandler(row.id, row)}
                                    >
                                        <Tooltip title='Edit'>
                                            <Edit fontSize='8px' sx={{ fill: '#60498a' }} />
                                        </Tooltip>
                                    </IconButton>
                                </UiAccessGuard>
                                <UiAccessGuard type='edit'>
                                    <Tooltip title='Update Status'>
                                        {loading[`deactivateLocationCodeDL${row?.id}`] ? (
                                            <CircularProgress size='14px' color='success' sx={{ ml: 2 }} />
                                        ) : (
                                            <FormControlLabel
                                                sx={{ margin: '0px' }}
                                                control={
                                                    <CustomSwitch
                                                        // isChecked={Math.ceil(Math.random() * 10) >= 5}
                                                        isChecked={!!row?.active}
                                                        handleChange={() => {
                                                            handleUpdateStatus(row.id)
                                                        }}
                                                    />
                                                }
                                            />
                                        )}
                                    </Tooltip>
                                </UiAccessGuard>
                            </Box>
                        )}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        isLoading={loading.locationCodeDataTableLKey}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                <CustomModal open={isOpen} handleClose={() => dispatch(closeModal())} />
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename='Location_Code_Export.csv'
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default MasterLocationCodeTable
