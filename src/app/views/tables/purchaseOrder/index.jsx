import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CircularProgress, IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { TextFields, Upload, Shop2, Pin, LocalPrintshop, FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
// eslint-disable-next-line import/no-unresolved
import DropdownMenu from '@/core/components/DropdownMenu'
import CustomModal from '@core/components/extended/CustomModal'
import ImportFileModal from '@core/components/modals/ImportFileModal'
import CustomLink from '@/core/components/extended/CustomLink'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import StatusBadge from '@/core/components/StatusBadge'
import CustomButton from '@/core/components/extended/CustomButton'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'

// ** import utils
import { objectLength } from '@/utilities'

// ** import from redux
import { closeModal, openModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'

import {
    purchaseOrderDataTable,
    useGetPOBulkCreateTemplateMutation,
    useUploadPOBulkCreateTemplateMutation
} from '@/app/store/slices/api/purchaseOrderSlice'
import { useReprintPoSerialMutation } from '@/app/store/slices/api/serialSlice'

import { TOGGLE_ALL, isExcelQuery, INBOUND_STATUS } from '@/constants'
// ** import dummy data
import { openSnackbar } from '@/app/store/slices/snackbar'
import { CSVLink } from 'react-csv'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers } from './helper'

function PurchaseOrderTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const csvLinkRef = useRef(null)
    const hasCreateAccess = useUiAccess('create')

    const [getPOBulkCreateTemplate] = useGetPOBulkCreateTemplateMutation()
    const [uploadPOBulkCreateTemplate] = useUploadPOBulkCreateTemplateMutation()
    const [reprintPoSerial] = useReprintPoSerialMutation()
    const loading = useSelector(state => state.loading)
    const { purchaseOrderDataTableLKey } = useSelector(state => state.loading)
    const isOpen = useSelector(state => state.modal.open)

    const [refetch, setRefetch] = useState(false)
    const [columns, setColumns] = useState([...headers])
    const [excelHandler, setExcelHandler] = useState(false)

    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [recordCount, setRecordCount] = useState(0)

    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const handleExportAllExcel = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }
    const queryHandler = async queryString => {
        const { data } = await dispatch(purchaseOrderDataTable.initiate(queryString, false))
        if (isExcelQuery(queryString)) return
        setPurchaseOrders(
            data.data?.map(item => ({
                id: item?.id,
                no: (
                    <CustomLink href={`/inbound/purchaseOrder/${item?.id}`} icon>
                        <Tooltip title='View Details' placement='bottom' arrow>
                            <span>{item?.no}</span>
                        </Tooltip>
                    </CustomLink>
                ),
                vendor_name: item?.vendor_name || '-', // not present
                vendor_code: item?.vendor_code || '-',
                // wmsRefNo: item?.wmsRefNo || '-',
                po_status: item?.status,
                status: (
                    <StatusBadge
                        customSx={{ width: '7rem' }}
                        type={INBOUND_STATUS[item?.status]?.color || 'danger'}
                        label={INBOUND_STATUS[item?.status]?.label || 'undefined'}
                    />
                ),
                serial_generated: item?.serial_generated,
                ext_po_no: item?.ext_po_no || '-',
                total_quantity: item?.total_quantity || 0,
                received_quantity: item?.received_quantity || 0,
                pending_quantity: item?.pending_quantity || 0,
                created_by: item?.created_by || '-',
                created_at: item?.created_at || '-',
                modified_by: item?.modified_by || '-',
                updated_at: item?.updated_at || '-'
            }))
        )
        setRecordCount(data.recordsTotal)
    }

    const handleAdd = () => {
        navigate('/inbound/purchaseOrder/create')
    }

    const handleCurrentView = () => {
        if (!purchaseOrders.length) return

        const visibleHeaders = headers.filter(header => header.visible && header.label !== 'Sr.No.')

        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))

        const exportData = purchaseOrders.map(item => {
            const row = {}

            visibleHeaders.forEach(header => {
                if (header.key === 'status') {
                    row[header.key] = item[header.key]?.props?.label || ''
                } else if (header.key === 'no') {
                    row[header.key] = item[header.key]?.props?.children?.props?.children || ''
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

    const getTemplate = async () => getPOBulkCreateTemplate().unwrap()

    const handleFileUpload = async file => {
        let isError = false
        let message = ''
        try {
            const formData = new FormData()
            formData.append('excel', file)
            const response = await uploadPOBulkCreateTemplate(formData).unwrap()
            message = response.message
            if (response && objectLength(response) === 1) isError = true
            else if (objectLength(response) > 1) dispatch(closeModal())
        } catch (error) {
            isError = true
            message = error?.data?.message || error?.message || 'unable to upload file.'
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
        }
    }

    // open bulk import modal
    const handleBulkImport = () => {
        // setActivePopup('bulkImport')
        dispatch(
            openModal({
                content: (
                    <ImportFileModal
                        // handleFileSubmission={file => {
                        //     console.log('file uploaded', file)
                        // }}
                        handleGetTemplate={getTemplate}
                        handleFileSubmission={handleFileUpload}
                        // sampleFilePath='/csv/inbound/purchaseOrder.csv'
                        fileType={{
                            'text/csv': ['.csv'],
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                    />
                ),
                title: <Typography variant='h3'>Create Purchase Orders</Typography>
            })
        )
    }

    const handleOptionClick = action => {
        if (action === 'form') {
            handleAdd()
        } else {
            handleBulkImport()
        }
        // Add specific logic for each action
    }

    const dropdownOptions = [
        { label: 'Form', action: 'form', icon: <TextFields /> },
        { label: 'Upload', action: 'upload', icon: <Upload /> }
    ]

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

    const printSerial = async id => {
        try {
            await reprintPoSerial({ po_detail_id: id }).unwrap()
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'unable to print serial for this PO, please try again after some time!',
                    variant: 'alert',
                    alert: { color: 'error', icon: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    useEffect(() => {
        setRefetch(true)
        setTimeout(() => setRefetch(false), 400)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd()
        }
    })

    // Define context menu options
    const menuOptions = [
        {
            label: 'Print PO',
            icon: <Shop2 fontSize='small' />,
            onClick: row => {
                // implement PO print logic
                console.log('row', row)
            },
            condition: () => true
        },
        {
            label: 'Print UIDs CSV',
            icon: <LocalPrintshop fontSize='small' />,
            onClick: row => {
                // implement CSV print logic
                console.log('row', row)
            },
            condition: () => true
        },
        {
            label: 'Print Serial',
            icon: <Pin fontSize='small' />,
            onClick: row => {
                printSerial(row.id)
            },
            condition: row => row.serial_generated,
            disabledTooltip: 'Serial not generated yet'
        }
    ]

    return (
        <ContextMenuProvider>
            <MainCard content={false}>
                <Box sx={{ paddingY: 2, paddingX: { xs: 1.5, sm: 1 }, paddingTop: '2px' }}>
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },

                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <Box>
                            <Typography variant='h3'>All Purchase Orders</Typography>
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
                            <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAllExcel} />
                            <DropdownMenu
                                buttonText='Add New'
                                options={dropdownOptions}
                                onOptionClick={handleOptionClick}
                            />
                            {/* render action column can be made dynamic based on user authorization  */}
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>
                    <MobileTableToolbar
                        title='All Purchase Orders'
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAllExcel}
                        setClearAllFilters={setClearAllFilters}
                        handleAdd={handleAdd}
                    />
                    <DataTable
                        data={purchaseOrders}
                        columns={columns}
                        addExcelQuery={excelHandler}
                        reqKey='purchaseOrderDataTableLKey'
                        queryHandler={queryHandler}
                        totalRecords={recordCount}
                        isCheckbox={false}
                        refetch={refetch}
                        renderAction={row => (
                            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                <IconButton
                                    sx={{
                                        color: 'primary.800',
                                        '&:hover': {
                                            color: 'primary.main'
                                        }
                                    }}
                                    size='small'
                                    aria-label='edit row'
                                    // onClick={() => editHandler(row.id, row)}
                                >
                                    <Tooltip title='Print PO'>
                                        <Shop2 fontSize='8px' />
                                    </Tooltip>
                                </IconButton>
                                <IconButton
                                    sx={{
                                        color: 'primary.800',
                                        '&:hover': {
                                            color: 'primary.main'
                                        }
                                    }}
                                    size='small'
                                    aria-label='edit row'
                                    // onClick={() => editHandler(row.id, row)}
                                >
                                    <Tooltip title='Print UIDs CSV'>
                                        <LocalPrintshop fontSize='8px' />
                                    </Tooltip>
                                </IconButton>
                                <Tooltip title='Print Serial'>
                                    <span>
                                        {loading[`reprintPoSerialLKey${row?.id}`] ? (
                                            <CircularProgress size='14px' color='success' sx={{ mr: 1, mt: '5px' }} />
                                        ) : (
                                            <IconButton
                                                sx={{
                                                    color: 'primary.800',
                                                    '&:hover': {
                                                        color: 'primary.main'
                                                    }
                                                }}
                                                size='small'
                                                aria-label='Print Serial'
                                                onClick={() => printSerial(row.id)}
                                                disabled={!row.serial_generated}
                                            >
                                                <Pin fontSize='8px' />
                                            </IconButton>
                                        )}
                                    </span>
                                </Tooltip>
                            </Box>
                        )}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        isLoading={purchaseOrderDataTableLKey}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                <CustomModal open={isOpen} handleClose={() => dispatch(closeModal())} />
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename={`PO_Export_${new Date()}.csv`}
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default PurchaseOrderTable
