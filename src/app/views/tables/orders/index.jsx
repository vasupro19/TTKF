/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { Divider, IconButton, TextField, Tooltip, Typography, Autocomplete } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import {
    Add,
    Cancel,
    CancelOutlined,
    Edit,
    FilterAltOff,
    InventoryOutlined,
    MoreHoriz,
    PanToolOutlined,
    PlaylistAddCheck
} from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import CustomModal from '@core/components/extended/CustomModal'
import ImportFileModal from '@core/components/modals/ImportFileModal'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import StatusBadge from '@/core/components/StatusBadge'
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'
import CustomLink from '@/core/components/extended/CustomLink'
import GlobalModal from '@/core/components/modals/GlobalModal'
import ZoomInCarousel from '@/core/components/ZoomInCarousel'
import CustomDropdownMenu from '@/core/components/CustomDropdownMenu'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import TabsWithSlide from '@/core/components/TabsWithSlide'
import { CSVLink } from 'react-csv'

// ** import from redux
import { closeModal, openModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'

import AmazonColorIcon from '@/assets/icons/channel/AmazonColorIcon'
import MyntraColorIcon from '@/assets/icons/channel/MyntraColorIcon'
import ShopifyColorIcon from '@/assets/icons/channel/ShopifyColorIcon'
import flipkartColorIcon from '@/assets/icons/channel/flipkartColorIcon.svg'
import InputConfirmModal from '@/core/components/modals/InputConfirmModal'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import B2CIcon from '@/assets/icons/orderTypes/B2CIcon'
import B2BIcon from '@/assets/icons/orderTypes/B2BIcon'
import StoIcon from '@/assets/icons/orderTypes/StoIcon'
import ReturnableChallanIcon from '@/assets/icons/orderTypes/ReturnableChallanIcon'
import NonReturnableChallanIcon from '@/assets/icons/orderTypes/NonReturnableChallanIcon'
import PurchaseReturnIcon from '@/assets/icons/orderTypes/PurchaseReturnIcon'
import JobIcon from '@/assets/icons/orderTypes/JobIcon'

import { TOGGLE_ALL, OUTBOUND_STATUS, ORDER_TYPES, isExcelQuery } from '@/constants'

// ** import dummy data
import {
    orderDataTable,
    useGetOrderBulkCreateTemplateMutation,
    useUploadOrderBulkCreateTemplateMutation
} from '@/app/store/slices/api/orderSlice'
import { dateTimeFormatter, objectLength } from '@/utilities'
import SLADisplay from '@/core/components/SLADisplay'
import { headers } from './helper'

const getChannelIcon = {
    Amazon: <AmazonColorIcon />,
    Myntra: <MyntraColorIcon />,
    Shopify: <ShopifyColorIcon />,
    Flipkart: <img src={flipkartColorIcon} alt='Flipkart' style={{ height: 18, width: 18 }} />
}

// helping object to keep size global
const sizeConfig = {
    width: 80,
    height: 72
}

// for carousel
const slides = [
    {
        title: 'B2C',
        icon: <B2CIcon {...sizeConfig} />,
        path: '/B2C',
        orderType: 'B2C'
    },
    {
        title: 'B2B',
        icon: <B2BIcon {...sizeConfig} />,
        path: '/B2B',
        orderType: 'B2B'
    },
    {
        title: 'STO',
        icon: <StoIcon {...sizeConfig} />,
        path: '/STO'
    },
    {
        title: 'Returnable Challan',
        icon: <ReturnableChallanIcon {...sizeConfig} />,
        path: '/ReturnableChallan'
    },
    {
        title: 'Non-Returnable Challan',
        icon: <NonReturnableChallanIcon {...sizeConfig} />,
        path: '/NonReturnableChallan'
    },
    {
        title: 'Purchase Return',
        icon: <PurchaseReturnIcon {...sizeConfig} />,
        path: '/PurchaseReturn'
    },
    {
        title: 'Job Work',
        icon: <JobIcon {...sizeConfig} />,
        path: '/JobWork'
    }
]

const B2C_ORDER_TYPES = ['B2C', 'Exchange', 'Sample', 'Promotion']
const B2B_ORDER_TYPES = ['B2B', 'ReturnableChallan', 'STO', 'Non-ReturnableChallan', 'PurchaseReturn', 'JobWork']

// const staticQuery =
function OrdersTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const csvLinkRef = useRef(null)
    const { orderDataTableLKey } = useSelector(state => state.loading)
    const isOpen = useSelector(state => state.modal.open)
    const modalType = useSelector(state => state.modal.type)

    // eslint-disable-next-line no-unused-vars
    const [config, setConfig] = useState({
        markClose: 0,
        markRelease: 0,
        vehicleReleaseDate: '',
        geCreatedAt: ''
    })
    const [columns, setColumns] = useState([...headers])
    const [excelHandler, setExcelHandler] = useState(false)

    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])

    const [recordCount, setRecordCount] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeModal, setActiveModal] = useState(null)
    const [tabVal, setTabVal] = useState(0)
    const [method, setMethod] = useState('form')
    const clearSelectionRef = useRef(null)
    const [selectedRow, setSelectedRow] = useState([]) // selected checkbox
    const storageLocationRef = useRef('')
    const [error, setError] = useState(false)
    const reasonRef = useRef(null)
    const [cancelError, setCancelError] = useState(false)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [orderData, setOrderData] = useState([])
    const [totalFetchedRec, setTotalFetchedRec] = useState([])
    const [orderCounts, setOrderCounts] = useState({ b2c: 0, b2b: 0 })

    const [getOrderBulkCreateTemplate] = useGetOrderBulkCreateTemplateMutation()
    const [uploadOrderBulkCreateTemplate] = useUploadOrderBulkCreateTemplateMutation()

    const cancellationReasons = ['Customer Request', 'Incorrect Order', 'Stock Unavailable', 'Duplicate Order', 'Other']
    // excel export all handler
    const handleExportAll = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCurrentView = () => {
        if (!orderData.length) return

        const visibleHeaders = headers.filter(header => header.visible && header.label !== 'Sr.No')

        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))

        const exportData = orderData.map(item => {
            const row = {}

            visibleHeaders.forEach(header => {
                if (header.key === 'status') {
                    row[header.key] =
                        item[header.key]?.props?.label?.props?.children || OUTBOUND_STATUS[item.statusText]?.label || ''
                } else if (header.key === 'order_no') {
                    const value = item.order_no?.props?.children?.props?.children
                    row.order_no = Array.isArray(value) ? value[1] || '' : value || ''
                } else if (header.key === 'channel_code') {
                    row[header.key] = item[header.key]?.props?.children?.props?.children[1]?.props?.children || ''
                } else if (header.key === 'paymentStatus') {
                    row[header.key] = item[header.key]?.props?.label || ''
                } else if (header.key === 'total_qty') {
                    row[header.key] = item[header.key]?.props?.children || ''
                } else if (header.key === 'lmdStatus') {
                    row[header.key] = item[header.key]?.props?.children || ''
                } else if (header.key === 'sla') {
                    row[header.key] = item[header.key]?.props?.children?.props?.hours || ''
                } else if (header.key === 'order_date') {
                    row[header.key] = item[header.key]?.props?.children
                } else if (header.key === 'createdAt') {
                    row[header.key] = item[header.key] ? new Date(item[header.key]).toLocaleString() : ''
                } else if (header.key === 'updatedAt') {
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

    const createRow = loc => ({
        id: loc?.id,
        order_no: (
            <CustomLink href={`/outbound/order/view/${loc?.id}`} icon>
                <Tooltip title='View Details' placement='bottom' arrow>
                    {loc?.order_no}
                </Tooltip>
            </CustomLink>
        ),
        external_order_id: loc?.external_order_id ?? '',
        order_date: (
            <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
                {loc?.order_date ? dateTimeFormatter(loc.order_date.slice(0, 10)) : ''}
            </Box>
        ),
        status: (
            <ArrowButton
                label={
                    <Typography variant='h6' sx={{ color: '#fff', fontSize: '12px' }}>
                        {OUTBOUND_STATUS[loc.status]?.label || 'Undefined'}
                    </Typography>
                }
                variant={OUTBOUND_STATUS[loc.status]?.variant || 'Undefined'}
                nonClickable
                customStyles={{ width: '100%' }}
            />
        ),
        orderType: loc?.order_type ?? '',
        channel_code: (
            <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
                <>
                    {getChannelIcon?.[loc?.channel_code]}
                    <Typography
                        variant='body2'
                        fontWeight={500}
                        sx={{
                            maxWidth: '100px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {loc?.channel_code || '-'}
                    </Typography>
                </>
            </Box>
        ),
        sla: (
            <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
                <SLADisplay hours={loc?.sla ?? ''} />
            </Box>
        ),
        paymentStatus: (
            <StatusBadge
                type={
                    {
                        'Partially Paid': 'orange',
                        Paid: 'success',
                        Pending: 'danger'
                    }[loc?.payment_mode] ?? 'default'
                }
                label={loc?.payment_mode ?? 'N/A'}
                customSx={{
                    minWidth: '6rem'
                }}
            />
        ),
        courier_code: loc?.courier_code ?? '',
        tracking_no: loc?.tracking_no ?? '',
        shipToName: loc?.shipToName ?? '',
        total_qty: (
            <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
                {loc?.total_qty ?? ''}
            </Box>
        ),
        lmdStatus: (
            <ArrowButton
                label={
                    <Typography variant='h6' sx={{ color: '#fff', fontSize: '12px' }}>
                        {loc?.lmdStatus ?? 'N/A'}
                    </Typography>
                }
                variant={
                    {
                        Booked: 'blue',
                        'In Transit': 'orange',
                        OFD: 'green',
                        Delivered: 'red',
                        CANCELLED: 'gray'
                    }[loc?.lmdStatus] ?? 'gray'
                }
                nonClickable
                customStyles={{ width: '100%' }}
            />
        ),
        zone: loc?.zone ?? '',
        createdAt: loc?.created_at ?? '',
        created_by: loc?.created_by ?? '',
        modified_by: loc?.modified_by ?? '',
        updatedAt: loc?.updated_at ?? '',
        statusText: loc?.status ?? ''
    })

    const queryHandler = async query => {
        const { data: response } = await dispatch(orderDataTable.initiate(query, false))

        if (isExcelQuery(query)) return
        setRecordCount(response.recordsTotal || 0)

        setTotalFetchedRec(response?.data || [])

        const b2cCount =
            response?.data?.filter(loc => loc?.order_type && B2C_ORDER_TYPES.includes(loc.order_type)).length || 0
        const b2bCount =
            response?.data?.filter(loc => loc?.order_type && B2B_ORDER_TYPES.includes(loc.order_type)).length || 0

        setOrderCounts({ b2c: b2cCount, b2b: b2bCount })

        setOrderData(
            response?.data
                ?.map(loc => {
                    if (loc?.order_type && B2C_ORDER_TYPES.includes(loc.order_type) && tabVal === 0)
                        return createRow(loc)
                    if (loc?.order_type && B2B_ORDER_TYPES.includes(loc.order_type) && tabVal === 1)
                        return createRow(loc)
                    return false
                })
                ?.filter(Boolean) || []
        )
    }

    const getTemplate = async orderType => {
        try {
            const formData = new FormData()
            formData.append('order_type', orderType)
            await getOrderBulkCreateTemplate(formData).unwrap()
        } finally {
            // eslint-disable-next-line no-console
            console.log('error in downloading file')
        }
    }

    const handleFileUpload = async (file, orderType) => {
        let isError = false
        let message = ''
        try {
            const formData = new FormData()
            formData.append('excel', file)
            formData.append('order_type', orderType)
            const response = await uploadOrderBulkCreateTemplate(formData).unwrap()
            message = response.message
            if (response && objectLength(response) === 1) isError = true
            else if (objectLength(response) > 1) dispatch(closeModal())
            // eslint-disable-next-line no-shadow
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
    const handleBulkImport = orderType => {
        setActiveModal('bulkImport')
        dispatch(
            openModal({
                content: (
                    <ImportFileModal
                        handleGetTemplate={() => getTemplate(orderType)}
                        handleFileSubmission={file => handleFileUpload(file, orderType)}
                        fileType={{
                            'text/csv': ['.csv'],
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                    />
                ),
                title: <Typography variant='h3'>Create Order</Typography>
            })
        )
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

    // useEffect(() => {
    //     queryHandler(currentQuery)
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [])

    const handleTabChange = (event, newValue) => {
        setTabVal(newValue)
        setSelectedRow([])
        const keyToCheck = ['orderType', 'order_type']

        setColumns(prevColumns =>
            prevColumns.map(column => ({
                ...column,
                // eslint-disable-next-line no-nested-ternary
                options: keyToCheck.includes(column.key)
                    ? newValue === 0
                        ? ORDER_TYPES?.B2C
                        : ORDER_TYPES?.B2B
                    : column?.options,
                visible: ['partyName', 'partyCode'].includes(column.key) ? newValue === 1 : column.visible
            }))
        )

        // Update orderData based on the new tab selection
        setOrderData(
            totalFetchedRec
                ?.map(loc => {
                    if (loc?.order_type && B2C_ORDER_TYPES.includes(loc.order_type) && newValue === 0)
                        return createRow(loc, newValue)
                    if (loc?.order_type && B2B_ORDER_TYPES.includes(loc.order_type) && newValue === 1)
                        return createRow(loc, newValue)
                    return false
                })
                ?.filter(Boolean) || []
        )

        if (clearSelectionRef?.current) {
            clearSelectionRef?.current()
        }
    }

    const menuItems = [
        {
            content: (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PanToolOutlined fontSize='small' />
                    Put On Hold
                </Box>
            ),
            onClick: () => {
                setActiveModal('putOnHoldPopup')
                dispatch(
                    openModal({
                        type: 'confirm_modal'
                    })
                )
            }
        },
        {
            content: (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PlaylistAddCheck />
                    Create Pick List
                </Box>
            ),
            onClick: () => {
                setActiveModal('createPickList')
                dispatch(
                    openModal({
                        type: 'confirm_modal'
                    })
                )
            }
        },
        {
            content: (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <InventoryOutlined />
                    Manual Allocation
                </Box>
            ),
            onClick: () => {
                setActiveModal('manualStockAllocation')
                dispatch(
                    openModal({
                        type: 'confirm_modal'
                    })
                )
            }
        },
        {
            content: (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CancelOutlined />
                    Cancel
                </Box>
            ),
            onClick: () => {
                setActiveModal('cancelOrder')
                dispatch(
                    openModal({
                        type: 'confirm_modal'
                    })
                )
            }
        }
    ]

    const menuOptions = [
        {
            label: 'Edit Order',
            icon: (
                <Edit
                    fontSize='small'
                    sx={{
                        fill: '#60498a'
                    }}
                />
            ),
            onClick: row => {
                navigate(`/outbound/order/edit/${row.id}`)
            },
            condition: row => row?.statusText !== 'SHIPPED'
        }
    ]

    useEffect(() => {
        setSelectedRow([])
        setMethod('form')
        clearSelectionRef?.current()
    }, [tabVal])

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        setIsModalOpen(true)
    })

    return (
        <ContextMenuProvider>
            <MainCard content={false}>
                <Box sx={{ paddingY: 2, paddingX: { xs: 1.5, sm: 1 }, paddingTop: '2px' }}>
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            gap: { xs: 0, sm: 2 },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexDirection: { xs: 'column', sm: 'row' }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, paddingTop: { xs: 2, sm: 0 } }}>
                            <Typography variant='h3'>Orders</Typography>
                            <TabsWithSlide
                                labels={[`B2C (${orderCounts.b2c})`, `B2B (${orderCounts.b2b})`]}
                                tabIndex={tabVal}
                                onTabChange={handleTabChange}
                            />
                        </Box>
                        <Stack direction='row' spacing={2} flexWrap='wrap' alignItems='center' paddingY='12px'>
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
                            {selectedRow?.length > 0 && (
                                <CustomDropdownMenu
                                    triggerButton={
                                        <CustomButton variant='outlined' endIcon={<MoreHoriz />}>
                                            More Options
                                        </CustomButton>
                                    }
                                    menuItems={menuItems}
                                />
                            )}
                            <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAll} />
                            <CustomButton
                                variant='contained'
                                color='primary'
                                onClick={() => {
                                    setIsModalOpen(true)
                                }}
                                clickable
                            >
                                New Order
                                <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                            </CustomButton>
                            {/* render action column can be made dynamic based on user authorization  */}
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>
                    {/* show toolbar in mobile */}
                    <MobileTableToolbar
                        title={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant='h3'>Orders</Typography>
                                <TabsWithSlide
                                    labels={[`B2C (${orderCounts.b2c})`, `B2B (${orderCounts.b2b})`]}
                                    tabIndex={tabVal}
                                    onTabChange={handleTabChange}
                                />
                            </Box>
                        }
                        rightColumnElement={
                            selectedRow?.length > 0 && (
                                <CustomDropdownMenu
                                    triggerButton={
                                        <CustomButton
                                            variant='outlined'
                                            customStyles={{
                                                border: '1px solid',
                                                borderColor: 'primary.main',
                                                minWidth: '2rem',
                                                paddingX: '4px !important',
                                                borderRadius: '10px'
                                            }}
                                        >
                                            <MoreHoriz />
                                        </CustomButton>
                                    }
                                    menuItems={menuItems}
                                />
                            )
                        }
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAll}
                        setClearAllFilters={setClearAllFilters}
                        handleAdd={() => {
                            setIsModalOpen(true)
                        }}
                    />

                    <DataTable
                        data={orderData}
                        columns={columns}
                        addExcelQuery={excelHandler}
                        queryHandler={queryHandler}
                        reqKey='orderDataTableLKey'
                        totalRecords={recordCount}
                        isCheckbox
                        renderAction={row => (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-around',
                                    alignItems: 'center'
                                }}
                            >
                                {row?.statusText !== 'SHIPPED' ? (
                                    <IconButton
                                        sx={{
                                            color: 'success.main',
                                            '&.Mui-disabled': {
                                                opacity: 0.3
                                            },
                                            '&:hover': {
                                                scale: 1.1
                                            }
                                        }}
                                        size='small'
                                        aria-label='edit row'
                                        onClick={() => navigate(`/outbound/order/edit/${row.id}`)}
                                    >
                                        <Tooltip title='Edit'>
                                            <Edit
                                                sx={{
                                                    fill: '#60498a',
                                                    fontSize: '1rem'
                                                }}
                                            />
                                        </Tooltip>
                                    </IconButton>
                                ) : (
                                    <IconButton
                                        size='small'
                                        sx={{ cursor: 'default' }}
                                        disableFocusRipple
                                        disableRipple
                                    >
                                        <Tooltip title="SHIPPED order can't be edited">
                                            <Edit sx={{ fontSize: '1rem' }} />
                                        </Tooltip>
                                    </IconButton>
                                )}
                            </Box>
                        )}
                        setSelectedRow={setSelectedRow}
                        clearSelectionRef={clearSelectionRef}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        isLoading={orderDataTableLKey}
                        enableContextMenu
                        showStripes={false}
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                {modalType === 'global_modal' && activeModal === 'bulkImport' && (
                    <CustomModal open={isOpen} handleClose={() => dispatch(closeModal())} />
                )}
                {/* eslint-disable */}
                {modalType === 'confirm_modal' &&
                    (activeModal === 'putOnHoldPopup' ? (
                        <ConfirmModal
                            title='Put Order On Hold'
                            message='Are you sure you want to put order (#SO193820) on hold?'
                            icon='alert'
                            confirmText='Hold Order'
                            customStyle={{ width: { xs: '320px', sm: '480px' } }}
                            onConfirm={() => {
                                if (clearSelectionRef?.current) {
                                    clearSelectionRef?.current()
                                }
                                setSelectedRow([])
                                dispatch(
                                    openSnackbar({
                                        open: true,
                                        message: 'Order put on hold',
                                        variant: 'alert',
                                        alert: { color: 'info', icon: 'info' },
                                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                    })
                                )
                                dispatch(closeModal())
                            }}
                        />
                    ) : activeModal == 'createPickList' ? (
                        <ConfirmModal
                            title='Add to Pick List'
                            message={`Are you sure you want to include ${selectedRow?.length > 1 ? 'these orders' : 'this order'} in the pick list? `}
                            icon='info'
                            confirmText={selectedRow?.length > 1 ? 'Add Orders' : 'Add Order'}
                            customStyle={{ width: { xs: '320px', sm: '480px' } }}
                            onConfirm={() => {
                                if (clearSelectionRef?.current) {
                                    clearSelectionRef?.current()
                                }
                                setSelectedRow([])
                                dispatch(
                                    openSnackbar({
                                        open: true,
                                        message: 'Order added to pick list',
                                        variant: 'alert',
                                        alert: { color: 'info', icon: 'info' },
                                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                    })
                                )
                                dispatch(closeModal())
                            }}
                        />
                    ) : activeModal == 'manualStockAllocation' ? (
                        <InputConfirmModal
                            title='Manual Stock Allocation'
                            message='Please enter the storage location before confirming allocation.'
                            icon='info'
                            confirmText='Allocate'
                            cancelText='Cancel'
                            onConfirm={() => {
                                const storageValue = storageLocationRef.current.value.trim()
                                if (!storageValue) {
                                    setError(true)
                                    return
                                }
                                if (clearSelectionRef?.current) {
                                    clearSelectionRef?.current()
                                }
                                setSelectedRow([])
                                dispatch(
                                    openSnackbar({
                                        open: true,
                                        message: 'Stock allocated successfully',
                                        variant: 'alert',
                                        alert: { color: 'info', icon: 'info' },
                                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                    })
                                )
                                dispatch(closeModal())
                            }}
                            onCancel={() => {
                                storageLocationRef.current.value = ''
                                setError(false)
                                dispatch(closeModal())
                            }}
                            childComponent={
                                <TextField
                                    inputRef={storageLocationRef}
                                    label='Storage Locations*'
                                    variant='outlined'
                                    fullWidth
                                    multiline
                                    rows={3}
                                    required
                                    onChange={() => setError(!storageLocationRef.current.value.trim())}
                                    error={error}
                                    helperText={error ? 'Storage location is required' : ''}
                                    sx={{
                                        '& .MuiInputBase-input.MuiOutlinedInput-input': {
                                            paddingTop: 1,
                                            backgroundColor: '#fff'
                                        }
                                    }}
                                />
                            }
                        />
                    ) : activeModal == 'cancelOrder' ? (
                        <InputConfirmModal
                            title={selectedRow?.length > 1 ? 'Cancel Orders' : 'Cancel Order'}
                            message='Please select a reason for cancellation before proceeding.'
                            icon='warning'
                            confirmText={selectedRow?.length > 1 ? 'Cancel Orders' : 'Cancel Order'}
                            cancelText='Back'
                            onConfirm={() => {
                                if (!reasonRef.current) {
                                    // Fix: Check if ref is valid
                                    setCancelError(true)
                                    return
                                }

                                const reason = reasonRef.current.value
                                if (!reason) {
                                    setCancelError(true)
                                    return
                                }

                                if (clearSelectionRef?.current) {
                                    clearSelectionRef.current()
                                }

                                dispatch(
                                    openSnackbar({
                                        open: true,
                                        message: 'Order cancelled successfully',
                                        variant: 'alert',
                                        alert: { color: 'info', icon: 'info' },
                                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                    })
                                )

                                dispatch(closeModal())
                            }}
                            onCancel={() => {
                                if (reasonRef.current) {
                                    reasonRef.current.value = '' // Fix: Check if ref exists before setting value
                                }
                                setCancelError(false)
                                dispatch(closeModal())
                            }}
                            childComponent={
                                <Autocomplete
                                    options={cancellationReasons}
                                    getOptionLabel={option => option}
                                    onChange={(event, newValue) => {
                                        if (reasonRef.current) {
                                            reasonRef.current.value = newValue || ''
                                        }
                                        setCancelError(!newValue)
                                    }}
                                    size='small'
                                    renderInput={params => (
                                        <TextField
                                            {...params}
                                            label='Cancellation Reason*'
                                            variant='outlined'
                                            error={cancelError}
                                            helperText={cancelError ? 'Please select a reason' : ''}
                                            inputRef={reasonRef} // Fix: Use inputRef properly
                                            sx={{
                                                '& input': {
                                                    backgroundColor: '#fff',
                                                    padding: '12px 8px'
                                                },
                                                '& .MuiInputBase-root.MuiOutlinedInput-root': {
                                                    backgroundColor: 'white' // Apply the white background to the root element
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'gray' // Optional: change border color if needed
                                                }
                                            }}
                                        />
                                    )}
                                />
                            }
                        />
                    ) : null)}
                <GlobalModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} closeOnBackdropClick>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            maxWidth: '90wh',
                            maxHeight: '70vh',
                            backgroundColor: '#fff',
                            boxShadow: 24,
                            p: 1,
                            borderRadius: '8px',
                            outline: 'none',
                            overflowY: { sm: 'hidden', xs: 'auto' },
                            overflowX: 'hidden'
                        }}
                    >
                        <Box sx={{ width: '100%', position: 'relative' }}>
                            <Typography variant='h4' component='div'>
                                Select Order Type
                            </Typography>
                            <CustomButton
                                onClick={() => {
                                    setIsModalOpen(false)
                                    setMethod('form')
                                }}
                                customStyles={{
                                    mt: 2,
                                    position: 'absolute',
                                    top: '-28px',
                                    right: '-14px',
                                    width: 'min-content',
                                    '&:hover': {
                                        backgroundColor: 'transparent', // Keep the background color the same on hover
                                        boxShadow: 'none' // Remove any shadow effect
                                    },
                                    '&:focus': {
                                        backgroundColor: 'transparent', // Keep the background color the same on hover
                                        boxShadow: 'none' // Remove any shadow effect
                                    }
                                }}
                                variant='text'
                                disableRipple
                            >
                                <Tooltip title='Close' arrow>
                                    <Cancel />
                                </Tooltip>
                            </CustomButton>
                        </Box>
                        <Divider sx={{ borderColor: 'primary.main', marginTop: '2px' }} />
                        <ZoomInCarousel
                            slides={slides}
                            setIsOpen={setIsModalOpen}
                            method={method}
                            handleBulkImport={handleBulkImport}
                            onMethodChange={event => {
                                setMethod(event.target.value)
                            }}
                        />
                    </Box>
                </GlobalModal>
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename={`Order_Export_${new Date()}.csv`}
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}
/* eslint-disable */
export default OrdersTable
