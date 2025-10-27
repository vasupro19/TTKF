import { useEffect, useRef, useState } from 'react'

import { CircularProgress, FormControlLabel, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Add, FilterAltOff } from '@mui/icons-material'

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

// ** import utils
import { TOGGLE_ALL, isExcelQuery } from '@/constants'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'

// ** import sub-components
import { palletDataTable, useDeactivatePalletMutation } from '@/app/store/slices/api/storageLocationSlice'
import { openSnackbar } from '@/app/store/slices/snackbar'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { CSVLink } from 'react-csv'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import CreatePalletsModal from './CreatePalletsModal'

// ** import dummy data
import { headers, STATUS_TYPE } from './helper'

function MasterPalletsTable() {
    const dispatch = useDispatch()
    const hasCreateAccess = useUiAccess('create')
    const [deactivatePallet] = useDeactivatePalletMutation()
    const [refetch, setRefetch] = useState(false)
    const [columns, setColumns] = useState([...headers])
    const [records, setRecords] = useState(0)
    const [rows, setRows] = useState([])
    const [excelHandler, setExcelHandler] = useState(false)
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const csvLinkRef = useRef(null)
    const isOpen = useSelector(state => state.modal.open)
    const loading = useSelector(state => state.loading)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const queryHandler = async query => {
        const { data: response } = await dispatch(palletDataTable.initiate(query, false))
        if (isExcelQuery(query)) return
        setRows(
            response?.data.map(item => {
                const tempItem = { ...item }
                tempItem.available = (
                    <StatusBadge
                        type={STATUS_TYPE[tempItem.available].color}
                        label={STATUS_TYPE[tempItem.available].label}
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
                if (header.key === 'available') {
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

    // open add new pincode modal
    const handleAdd = () => {
        dispatch(
            openModal({
                content: <CreatePalletsModal />,
                closeOnBackdropClick: false,
                title: <Typography variant='h3'>Generate Pallets</Typography>
            })
        )
    }
    const handleUpdateStatus = async id => {
        let isError
        let message
        try {
            const response = await deactivatePallet(id).unwrap()
            message = response?.message || response?.data?.message || 'deactivated pallet'
        } catch (error) {
            isError = true
            message = error?.data?.message || error?.message || 'unable to deactivate  pallet!'
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

    useDocumentTitle('Pallets | Warehouse')

    return (
        <MainCard content={false}>
            <Box sx={{ paddingY: 2, paddingX: { xs: 1.5, sm: 1 }, paddingTop: '2px' }}>
                <Box
                    sx={{
                        display: { xs: 'none', md: 'flex' },
                        gap: 2,
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box>
                        <Typography variant='h3'>All Pallets</Typography>
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
                        {/* <Tooltip title='Map bin and storage location'>
                            <CustomButton
                                variant='outlined'
                                color='primary'
                                onClick={() => {
                                    navigate('/master/warehouse/pallets/mapStorageLocation')
                                }}
                            >
                                Pallet Mapping
                                <Polyline sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                            </CustomButton>
                        </Tooltip> */}
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
                    title='All Pallets'
                    isShowClearButton={isShowClearButton}
                    handleCurrentView={handleCurrentView}
                    handleExportAllExcel={handleExportAllExcel}
                    setClearAllFilters={setClearAllFilters}
                    handleAdd={handleAdd}
                />
                <DataTable
                    data={rows}
                    columns={columns}
                    addExcelQuery={excelHandler}
                    reqKey='palletDataTableLKey'
                    totalRecords={records}
                    queryHandler={queryHandler}
                    refetch={refetch}
                    isCheckbox={false}
                    renderAction={row => (
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <UiAccessGuard type='edit'>
                                <Tooltip title='Update Status'>
                                    {loading[`deactivatePalletDL${row?.id}`] ? (
                                        <CircularProgress size='14px' color='success' sx={{ ml: 2 }} />
                                    ) : (
                                        <FormControlLabel
                                            sx={{ margin: '0px' }}
                                            control={
                                                <CustomSwitch
                                                    // isChecked={Math.ceil(Math.random() * 10) >= 5}
                                                    isChecked={!!row.active}
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
                    isLoading={loading.palletDataTableLKey}
                    clearAllFilters={clearAllFilters}
                />
            </Box>
            <CustomModal open={isOpen} handleClose={() => dispatch(closeModal())} />
            <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename='Pallets_Export.csv'
                ref={csvLinkRef}
                style={{ display: 'none' }}
            />
        </MainCard>
    )
}

export default MasterPalletsTable
