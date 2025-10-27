import { useState, useRef } from 'react'

import { Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import StatusBadge from '@/core/components/StatusBadge'
import SLADisplay from '@/core/components/SLADisplay'
import CustomLink from '@/core/components/extended/CustomLink'
import CustomButton from '@/core/components/extended/CustomButton'
import MetricCards from '@/core/components/MetricCards'

import { CSVLink } from 'react-csv'

import { isExcelQuery, TOGGLE_ALL } from '@/constants'

import AmazonColorIcon from '@/assets/icons/channel/AmazonColorIcon'
import MyntraColorIcon from '@/assets/icons/channel/MyntraColorIcon'
import ShopifyColorIcon from '@/assets/icons/channel/ShopifyColorIcon'
import flipkartColorIcon from '@/assets/icons/channel/flipkartColorIcon.svg'

import { pickPendencyDataTable, usePickPendencyDetailsQuery } from '@/app/store/slices/api/pickListSlice'

import { useDispatch, useSelector } from 'react-redux'

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import PendingActionsIcon from '@mui/icons-material/PendingActions'

// ** import dummy data
import { headers } from './helper'

const getChannelIcon = {
    Amazon: <AmazonColorIcon />,
    Myntra: <MyntraColorIcon />,
    Shopify: <ShopifyColorIcon />,
    Flipkart: <img src={flipkartColorIcon} alt='Flipkart' style={{ height: 20, width: 20 }} />
}

// Define your cards configuration
const metricsConfig = [
    {
        id: 'total_orders',
        label: 'Total Order Count',
        dataKey: 'total_orders',
        icon: ShoppingCartIcon,
        colorType: 'success',
        gridSize: { xs: 12, sm: 6, md: 3 },
        formatter: value => value?.toLocaleString() || '0',
        fallbackValue: 0
    },
    {
        id: 'location_count',
        label: 'Location Count',
        dataKey: 'location_count',
        icon: LocationOnIcon,
        colorType: 'danger',
        gridSize: { xs: 12, sm: 6, md: 3 },
        fallbackValue: 0
    },
    {
        id: 'sku_count',
        label: 'Total SKU Count',
        dataKey: 'sku_count',
        icon: Inventory2Icon,
        colorType: 'info',
        gridSize: { xs: 12, sm: 6, md: 3 },
        fallbackValue: 0
    },
    {
        id: 'pending_quantity',
        label: 'Total Pending Qty',
        dataKey: 'total_pending_quantity',
        icon: PendingActionsIcon,
        colorType: 'alert',
        gridSize: { xs: 12, sm: 6, md: 3 },
        fallbackValue: 0
    }
]

// const staticQuery =
function PendencyTable() {
    const csvLinkRef = useRef(null)
    const dispatch = useDispatch()
    const { pickPendencyDataTableLKey } = useSelector(state => state.loading)

    const { data: reqData, isLoading: reqDataIsLoading } = usePickPendencyDetailsQuery()

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
        if (!tableData.length) return

        setCsvHeaders(columns.filter(item => item.key !== 'id'))
        setCsvData(
            tableData.map((item, index) => {
                const tempItem = { ...item }
                delete tempItem.id
                return {
                    s_no: index + 1,
                    ...tempItem,
                    picklist_no: tempItem.original_picklist_no,
                    pick_type: tempItem.original_pick_type,
                    channel: tempItem.original_channel,
                    sla: tempItem.original_sla
                }
            })
        )

        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click()
            }
        }, 500)
    }

    // query handler
    const queryHandler = async query => {
        const { data: response } = await dispatch(pickPendencyDataTable.initiate(query, false))
        if (isExcelQuery(query)) return
        if (response?.data) {
            setTableData(
                response?.data.map(item => ({
                    ...item,
                    original_picklist_no: item.picklist_no,
                    picklist_no: (
                        <CustomLink
                            href={`/outbound/pickList/view/${item?.picklist_no ? item?.picklist_no.replace('PICK/', '') : ''}`}
                            state={{ pickListStatus: 'Pendency' }}
                            icon
                        >
                            <Tooltip title='View Details' placement='bottom' arrow>
                                {item?.picklist_no}
                            </Tooltip>
                        </CustomLink>
                    ),
                    ref_no: item?.ref_no || 'N/A',
                    order_date: item?.order_date || 'N/A',
                    original_pick_type: item?.pick_type || 'N/A',
                    pick_type: (
                        <StatusBadge
                            type={
                                {
                                    Order: 'success',
                                    Batch: 'indigo'
                                }[item?.pick_type] ?? 'default'
                            }
                            label={item?.pick_type ?? 'N/A'}
                        />
                    ),
                    original_channel: item?.channel || '-',
                    channel: (
                        <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
                            <>
                                {getChannelIcon?.[item?.channel]}
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
                                    {item?.channel || '-'}
                                </Typography>
                            </>
                        </Box>
                    ),
                    original_sla: item?.sla || 'N/A',
                    sla: <SLADisplay hours={item?.sla} />
                }))
            )
        } else setTableData([])
        setRecordCount(response?.recordsTotal || 0)
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

    return (
        <MainCard content={false}>
            <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: 2 }}>
                <MetricCards
                    cards={metricsConfig}
                    data={reqData?.data ?? {}}
                    loading={reqDataIsLoading}
                    gridSpacing={2}
                />
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        gap: 2
                    }}
                >
                    {/* Left Section: Title */}
                    <Typography variant='h3' sx={{ minWidth: 'max-content' }}>
                        Order-wise Pick Pendency
                    </Typography>

                    {/* Right Section: Controls */}
                    <Stack
                        direction='row'
                        spacing={1}
                        alignItems='center'
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'flex-end',
                            gap: 1,
                            width: '100%',
                            padding: '12px'
                        }}
                    >
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
                        {/* Export Buttons */}
                        <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAll} />

                        {/* Toggle Columns */}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                    </Stack>
                </Box>

                <DataTable
                    data={tableData}
                    columns={columns}
                    addExcelQuery={excelHandler}
                    queryHandler={queryHandler}
                    totalRecords={recordCount}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                    isLoading={pickPendencyDataTableLKey}
                    reqKey='pickPendencyDataTableLKey'
                />
            </Box>
            <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={`pick_pendency_${new Date()}.csv`}
                ref={csvLinkRef}
                style={{ display: 'none' }}
            />
        </MainCard>
    )
}

export default PendencyTable
