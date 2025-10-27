/* eslint-disable */
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { FormControlLabel, IconButton, TextField, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Add, AllInbox, Cancel, Edit, Search, TextFields, Extension, Upload, FilterAltOff } from '@mui/icons-material'

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
import { useGetOrderByIdMutation } from '@/app/store/slices/api/orderSlice'

// import permission guard
import UiAccessGuard from '@/app/guards/UiPermissionGuard'

// ** import utils
import { OUTBOUND_STATUS, TOGGLE_ALL, isExcelQuery } from '@/constants'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { storageZoneDataTable, useDeactivateStorageZoneMutation } from '@/app/store/slices/api/storageLocationSlice'

// ** import sub-components
import { openSnackbar } from '@/app/store/slices/snackbar'

// ** import helper
import { headers, locations } from './helper'
import CustomLink from '@/core/components/extended/CustomLink'
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'
import { CSVLink } from 'react-csv'

function OutboundOrderDetails() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const csvLinkRef = useRef(null)

    const { id: orderId } = useParams()

    const modalType = useSelector(state => state.modal.type)
    const isOpen = useSelector(state => state.modal.open)
    const { getOrderByIdLKey } = useSelector(state => state.loading)

    const [deactivateStorageZone] = useDeactivateStorageZoneMutation()
    const [rows, setRows] = useState([])
    const [columns, setColumns] = useState([...headers])
    const [records, setRecords] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)
    const [refetch, setRefetch] = useState(false)
    const [activePopup, setActivePopup] = useState(null)
    const [inputVal, setInputVal] = useState('')
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const [getOrderById] = useGetOrderByIdMutation()

    const handleClearInput = () => {
        setInputVal('')
    }

    const handleInputChange = e => {
        setInputVal(e.target.value)
    }

    const queryHandler = async query => {
        const fetchItems = async () => {
            try {
                const { data } = await getOrderById(orderId).unwrap()
                setRows(
                    data.items.map(item => ({
                        id: item.id,
                        sku: item.product_code || '',
                        ean: item.item_no || '',
                        desc: item.description_2 || '',
                        ordered: item.quantity || 0,
                        confirm: item.confirmed_qty || 0,
                        pending: item.pending_qty || 0,
                        cancelled: item.cancel_qty || 0,
                        returned: item.returned_qty || 0,
                        sale_amount: item.sales_amount || 0,
                        shipping_charges: item.shipping_charges || 0,
                        final_amt: item.selling_price || 0,
                        status: (
                            <ArrowButton
                                label={
                                    <Typography variant='h6' sx={{ color: '#fff', fontSize: '12px' }}>
                                        {OUTBOUND_STATUS[item.status]?.label || 'Undefined'}
                                    </Typography>
                                }
                                variant={OUTBOUND_STATUS[item.status]?.variant || 'Undefined'}
                                nonClickable
                                customStyles={{ width: '100%' }}
                            />
                        ),
                        discount_amt: item.discount_amount || '',
                        tax: item.tax || ''
                    }))
                )
            } catch (err) {
                console.error('Failed to load items:', err)
            }
        }

        fetchItems()

        setRecords(locations?.length || 0)
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

    const handleExportAll = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCurrentView = () => {
        if (!rows.length) return

        const visibleHeaders = headers.filter(header => header.visible && header.label !== 'Sr.No')
        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))

        const exportData = rows.map(item => {
            const row = {}

            visibleHeaders.forEach(header => {
                if (header.key === 'status') {
                    row[header.key] = item[header.key]?.props?.label?.props?.children || ''
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

    useEffect(() => {
        if (!isOpen) {
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    return (
        <MainCard content={false}>
            <Box sx={{ paddingTop: '2px' }}>
                {/* Add your dummy buttons here */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Stack direction='row' spacing={2} alignItems='center' paddingY='4px'>
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
                            <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAll} />
                        </UiAccessGuard>
                        {/* render action column can be made dynamic based on user authorization  */}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                    </Stack>
                </Box>
                <DataTable
                    data={rows}
                    columns={columns}
                    queryHandler={queryHandler}
                    reqKey='getOrderByIdLKey'
                    refetch={refetch}
                    excelHandler={excelHandler}
                    totalRecords={records}
                    isCheckbox={false}
                    setIsShowClearButton={setIsShowClearButton}
                    isLoading={getOrderByIdLKey}
                    clearAllFilters={clearAllFilters}
                />
            </Box>
            <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={`orderItem_Export_${new Date()}.csv`}
                ref={csvLinkRef}
                style={{ display: 'none' }}
            />
        </MainCard>
    )
}

export default OutboundOrderDetails
