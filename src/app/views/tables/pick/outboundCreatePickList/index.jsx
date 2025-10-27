/* eslint-disable */

import { useEffect, useState } from 'react'

import { Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { ShoppingCartOutlined, InventoryOutlined, LayersOutlined } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'

// ** import utils
import { isExcelQuery, OUTBOUND_STATUS, TOGGLE_ALL } from '@/constants'

// ** import from redux
import { useDispatch, useSelector } from 'react-redux'

// ** import sub-components

// ** import helper
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'
import SLADisplay from '@/core/components/SLADisplay'
import AmazonColorIcon from '@/assets/icons/channel/AmazonColorIcon'
import MyntraColorIcon from '@/assets/icons/channel/MyntraColorIcon'
import ShopifyColorIcon from '@/assets/icons/channel/ShopifyColorIcon'
import flipkartColorIcon from '@/assets/icons/channel/flipkartColorIcon.svg'
import ListAnimIcon from '@/assets/icons/ListAnimIcon'
import { headers } from './helper'
import { orderDataTable } from '@/app/store/slices/api/orderSlice'
import { useAllocationDatatableMutation } from '@/app/store/slices/api/pickListSlice'

const getChannelIcon = {
    Amazon: <AmazonColorIcon />,
    Myntra: <MyntraColorIcon />,
    Shopify: <ShopifyColorIcon />,
    Flipkart: <img src={flipkartColorIcon} alt='Flipkart' style={{ height: 20, width: 20 }} />
}

function OutboundCreatePickList({
    selectedRow,
    setSelectedRow,
    clearSelectionRef,
    showTooltip,
    tableData,
    dataHandler,
    filters,
    openSnackbar,
    createPickList,
    navigate
}) {
    const dispatch = useDispatch()

    const isOpen = useSelector(state => state.modal.open)
    const [rows, setRows] = useState([])
    const [columns, setColumns] = useState([...headers])
    const [records, setRecords] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)
    const { createPickListLKey } = useSelector(state => state.loading)

    const [formattedData, setFormattedData] = useState([])
    const [stats, setStats] = useState({
        orderQuantity: 0,
        noOfBatches: 0
    })

    const [currentQuery, setCurrentQuery] = useState('?start=0&length=10')
    const [allocationDatatable] = useAllocationDatatableMutation()

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

    const queryHandler = async (
        queryString,
        queryObj = {
            start: 0,
            length: 10
        }
    ) => {
        setCurrentQuery(queryString)

        if (tableData.length === 0) {
            return
        }

        const response = await allocationDatatable({ ...queryObj, ...tableData }).unwrap()

        const orderQuantity = (response.data && response.data[0]?.total_orders_quantity) || 0
        const noOfBatches = (response.data && response.data[0]?.no_of_batches) || 0

        setStats({
            orderQuantity,
            noOfBatches
        })

        const formatted = response.data.map(loc => ({
            id: loc?.id,
            order_no: loc?.order_no || '-',
            quantity: loc?.quantity || '-',
            channel: (
                <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
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
            customer: (
                <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
                    {loc?.customer_no ?? '-'}
                </Box>
            ),
            sla: <SLADisplay hours={loc?.sla} /> || '',
            courier: (
                <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
                    {loc?.courier_code ?? '-'}
                </Box>
            )
        }))

        setFormattedData(formatted)
        setRecords(response?.recordsTotal || 0)
    }

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleGenerate = async () => {
        try {
            const payload = {
                orders: formattedData.filter(row => selectedRow.includes(row.id)).map(row => row.order_no) || [],
                pick_method: filters.pickType?.value || '',
                seller: filters.sellerId || '',
                batch_type: filters.batchType?.value?.toLowerCase() || '',
                cutoff_time: filters.cutOffTime ? dayjs(filters.cutOffTime).format('HH:mm:ss') : null
            }

            const response = await createPickList(payload).unwrap()

            dispatch(
                openSnackbar({
                    open: true,
                    message:
                        response.message ||
                        `${selectedRow?.length} ${selectedRow?.length > 1 ? 'Orders' : 'Order'} added to pick list`,
                    variant: 'alert',
                    alert: { color: 'success', icon: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )

            if (clearSelectionRef?.current) {
                clearSelectionRef?.current()
            }
            setSelectedRow([])

            navigate('/outbound/pickList')
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Failed to create picklist',
                    variant: 'alert',
                    alert: { color: 'error', icon: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    useEffect(() => {
        if (dataHandler) {
            queryHandler('')
        }
    }, [dataHandler])

    useEffect(() => {
        if (tableData?.length > 0) {
            queryHandler('')
        }
    }, [])

    return (
        <MainCard content={false}>
            <Box sx={{ paddingTop: '2px' }}>
                {/* Add your dummy buttons here */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: 1,
                            alignItems: 'center'
                        }}
                    >
                        {[
                            {
                                icon: <ShoppingCartOutlined sx={{ fontSize: 20, color: 'primary.main' }} />,
                                label: 'Order Count',
                                value: records
                            },
                            {
                                icon: <InventoryOutlined sx={{ fontSize: 20, color: 'primary.main' }} />,
                                label: 'Order Quantity',
                                value: stats.orderQuantity
                            }
                            // {
                            //     icon: <LayersOutlined sx={{ fontSize: 20, color: 'primary.main' }} />,
                            //     label: 'No of Batches',
                            //     value: stats.noOfBatches
                            // }
                        ].map((item, index) => (
                            <Box
                                key={index}
                                sx={{
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: 3,
                                    border: '1px solid #ddd',
                                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingY: '2px',
                                    paddingX: '14px',
                                    gap: 0.5,
                                    minWidth: '180px'
                                }}
                            >
                                {item.icon}
                                <Typography variant='subtitle1' sx={{ fontWeight: 'bold', color: '#333' }}>
                                    {item.label}
                                </Typography>
                                <Typography variant='h4' sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                                    {item.value}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    <Stack direction='row' spacing={2} alignItems='center' sx={{ py: 1 }}>
                        {selectedRow?.length ? (
                            <Typography variant='body1'>
                                <strong>{selectedRow?.length}</strong> Selected out of <strong>{records}</strong>{' '}
                            </Typography>
                        ) : (
                            ''
                        )}
                        <CustomButton
                            variant='clickable'
                            shouldAnimate
                            endIcon={<ListAnimIcon />}
                            disabled={selectedRow?.length <= 0}
                            loading={createPickListLKey}
                            showTooltip={selectedRow?.length <= 0 && showTooltip}
                            tooltip='Please select an order first'
                            onClick={() => {
                                handleGenerate?.()
                            }}
                        >
                            Generate Picklist
                        </CustomButton>
                        <ToggleColumns columns={columns} onClick={handleCheckToggle} />
                    </Stack>
                </Box>
                <DataTable
                    data={formattedData}
                    columns={columns}
                    queryHandler={queryHandler}
                    excelHandler={excelHandler}
                    totalRecords={records}
                    isCheckbox={true}
                    setSelectedRow={setSelectedRow}
                    clearSelectionRef={clearSelectionRef}
                    isColumnsSearchable={false}
                />
            </Box>
        </MainCard>
    )
}

export default OutboundCreatePickList
