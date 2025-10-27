/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useRef, memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Category, Edit, FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import CustomLink from '@/core/components/extended/CustomLink'
import StatusBadge from '@/core/components/StatusBadge'
import SLADisplay from '@/core/components/SLADisplay'
import MetricCards from '@/core/components/MetricCards'

import { CSVLink } from 'react-csv'

import AmazonColorIcon from '@/assets/icons/channel/AmazonColorIcon'
import MyntraColorIcon from '@/assets/icons/channel/MyntraColorIcon'
import ShopifyColorIcon from '@/assets/icons/channel/ShopifyColorIcon'
import flipkartColorIcon from '@/assets/icons/channel/flipkartColorIcon.svg'
import ExcelColouredIcon from '@/assets/icons/ExcelColouredIcon'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import DepartureBoardIcon from '@mui/icons-material/DepartureBoard'

import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import { TOGGLE_ALL } from '@/constants'
import { downloadFile } from '@/utilities'

// ** import dummy data
import PropTypes from 'prop-types'
import { headers, locations } from './helper'

const getChannelIcon = {
    Amazon: <AmazonColorIcon />,
    Myntra: <MyntraColorIcon />,
    Shopify: <ShopifyColorIcon />,
    Flipkart: <img src={flipkartColorIcon} alt='Flipkart' style={{ height: 18, width: 18 }} />
}

const b2cOrderTypes = new Set(['B2C', 'Exchange', 'Sample', 'Promotion'])

const getTopLevelOrderType = orderType => (b2cOrderTypes.has(orderType) ? 'B2C' : 'B2B')

const metricsConfig = [
    {
        id: 'orders_pending_pack',
        label: 'Total Orders Pending to pack',
        dataKey: 'orders_pending_pack',
        icon: ShoppingCartIcon,
        colorType: 'success',
        gridSize: { xs: 12, sm: 6, md: 3 },
        fallbackValue: 1250 // TODO:: remove fallbackValue from here after api integration
    },
    {
        id: 'items_pending_qty',
        label: 'Total Pending Item QTY',
        dataKey: 'items_pending_qty',
        icon: PendingActionsIcon,
        colorType: 'alert',
        gridSize: { xs: 12, sm: 6, md: 3 },
        fallbackValue: 345
    },
    {
        id: 'order_sorted_qty',
        label: 'Total Sorted Order QTY',
        dataKey: 'order_sorted_qty',
        icon: Category,
        colorType: 'info',
        gridSize: { xs: 12, sm: 6, md: 3 },
        fallbackValue: 2890
    },
    {
        id: 'sla_compliance',
        label: 'SLA Compliance',
        dataKey: 'sla_compliance_percentage',
        icon: DepartureBoardIcon,
        colorType: 'success',
        gridSize: { xs: 12, sm: 6, md: 3 },
        fallbackValue: (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                    variant='h5'
                    component='div'
                    sx={{
                        fontWeight: 'bold',
                        color: '#2E7D32',
                        lineHeight: 1.2,
                        fontSize: { xs: '1.25rem', md: '1.25rem' }
                    }}
                >
                    98%
                </Typography>
                <Typography
                    variant='body2'
                    sx={{ color: 'text.secondary', fontSize: { xs: '0.875rem', md: '0.875rem' } }}
                >
                    147/150
                </Typography>
            </Box>
        )
    }
]

// Memoize the PackActionCell component to prevent re-renders
const ActionCell = memo(({ row, downloadFileFunc }) => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}
    >
        <Tooltip title='Download Pending Items List'>
            <IconButton
                sx={{
                    color: 'primary.main', // base color
                    '&:hover': {
                        scale: 1.1,
                        color: 'primary.dark' // hover color
                    },
                    cursor: 'pointer'
                }}
                size='small'
                aria-label='download excel file'
                onClick={downloadFileFunc}
            >
                <ExcelColouredIcon />
            </IconButton>
        </Tooltip>
    </Box>
))

ActionCell.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    row: PropTypes.object,
    downloadFileFunc: PropTypes.func
}

// const staticQuery =
function PackPendencyTable() {
    const navigate = useNavigate()

    const csvLinkRef = useRef(null)

    const [columns, setColumns] = useState([...headers])
    const [excelHandler, setExcelHandler] = useState(false)
    const [tableData, setTableData] = useState([])
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const [recordCount, setRecordCount] = useState(0)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    // excel export all handler
    const handleExportAll = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    // excel current view handler
    const handleCurrentView = () => {
        // eslint-disable-next-line no-useless-return
        if (!tableData.length) return
    }

    // query handler
    const queryHandler = async query => {}

    useEffect(() => {
        // TODO: once API is integrated, remove this block completely
        const updatedDummyData = locations?.map(loc => ({
            id: loc?.id,
            orderId: loc?.orderId ?? '-',
            packId: loc?.packId || '-', // TODO:: use || just to show - remove || and use nullish coalescing
            orderDate: loc?.orderDate ?? '-',
            orderType: loc?.orderType ?? '-',
            orderQty: loc?.orderQty ?? '-',
            packedQty: loc?.packedQty ?? '-',
            pendingQty: <Typography sx={{ color: 'error.main' }}>{loc.pendingQty ?? 0}</Typography>,

            sla: (
                <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
                    <SLADisplay hours={loc?.sla ?? ''} />
                </Box>
            ),
            channel: (
                <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
                    <>
                        {getChannelIcon?.[loc?.channel]}
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
                            {loc?.channel || '-'}
                        </Typography>
                    </>
                </Box>
            ),
            status: (
                <StatusBadge
                    type={
                        {
                            Picked: 'purple',
                            'Part Picked': 'info',
                            'Part Packed': 'orange'
                        }[loc?.status]
                    }
                    label={loc?.status}
                    customSx={{
                        minWidth: '6rem',
                        paddingX: 0.5
                    }}
                />
            ),
            statusText: loc?.status ?? ''
        }))

        setTableData(updatedDummyData ?? [])
    }, [])

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

    // Define context menu options
    const menuOptions = [
        {
            label: 'Download Pending Items List',
            icon: <ExcelColouredIcon fontSize='small' />,
            onClick: () => {
                downloadFile('/csv/outbound/packItemPendency.csv', 'pending_items.csv')
            }
        }
        // Add more options as needed
    ]

    const renderAction = useCallback(
        // eslint-disable-next-line no-shadow
        row => (
            // Pass the functions as parameters if they change
            <ActionCell
                row={row}
                downloadFileFunc={() => {
                    downloadFile('/csv/outbound/packItemPendency.csv', 'pending_items.csv')
                }}
            />
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    return (
        <ContextMenuProvider>
            <MainCard content={false}>
                <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: 2 }}>
                    <MetricCards cards={metricsConfig} gridSpacing={2} />
                    <Box
                        sx={{
                            display: 'flex',
                            gap: { xs: 0, sm: 2 },
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant='h3'>Pack Pendency</Typography>
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

                            <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAll} />
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>

                    <DataTable
                        data={tableData}
                        columns={columns}
                        addExcelQuery={excelHandler}
                        queryHandler={queryHandler}
                        totalRecords={recordCount}
                        renderAction={renderAction}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>

                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename={`ASN_Export_${new Date()}.csv`}
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default PackPendencyTable
