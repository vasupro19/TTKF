/* eslint-disable no-unused-vars */
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import StatusBadge from '@/core/components/StatusBadge'
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'
import CustomLink from '@/core/components/extended/CustomLink'
import { CSVLink } from 'react-csv'

// ** import from redux
import { useDispatch } from 'react-redux'

// ** import dummy data
import { INBOUND_STATUS, TOGGLE_ALL } from '@/constants'
import SLADisplay from '@/core/components/SLADisplay'
import AmazonColorIcon from '@/assets/icons/channel/AmazonColorIcon'
import MyntraColorIcon from '@/assets/icons/channel/MyntraColorIcon'
import ShopifyColorIcon from '@/assets/icons/channel/ShopifyColorIcon'
import flipkartColorIcon from '@/assets/icons/channel/flipkartColorIcon.svg'
import { FilterAltOff } from '@mui/icons-material'
import { headers, locations } from './helper'
import FilterCard from './FilterCard'

const getChannelIcon = {
    Amazon: <AmazonColorIcon />,
    Myntra: <MyntraColorIcon />,
    Shopify: <ShopifyColorIcon />,
    Flipkart: <img src={flipkartColorIcon} alt='Flipkart' style={{ height: 20, width: 20 }} />
}

// const staticQuery =
function ArchivedOrdersTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const csvLinkRef = useRef(null)

    // eslint-disable-next-line no-unused-vars
    const [config, setConfig] = useState({
        markClose: 0,
        markRelease: 0,
        vehicleReleaseDate: '',
        geCreatedAt: ''
    })
    const [columns, setColumns] = useState([...headers])
    const [excelHandler, setExcelHandler] = useState(false)
    const [refetch, setRefetch] = useState(false)

    const [gEData, setGeData] = useState([])
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
        if (!gEData.length) return

        setCsvHeaders(columns.filter(item => item.key !== 'id'))
        setCsvData(
            gEData.map(item => {
                const tempItem = { ...item }
                delete tempItem.id
                return {
                    ...tempItem,
                    no: tempItem.original_no,
                    status: INBOUND_STATUS[tempItem.original_status].label,
                    document_type: tempItem.original_document_type
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
        // setCurrentQuery(query)
        // const { data: response } = await dispatch(gateEntryDataTable.initiate(query))
        // if (isExcelQuery(query)) return
        // setRecordCount(response.recordsTotal || 0)
    }

    useEffect(() => {
        // TODO: once API is integrated, remove this block completely
        /* eslint-disable */
        const updatedDummyData = locations?.map(loc => ({
            id: loc?.id,
            orderNo: (
                <CustomLink href={`/outbound/order/view/${loc?.id}`} icon>
                    <Tooltip title='View Details' placement='bottom' arrow>
                        {loc?.orderNo}
                    </Tooltip>
                </CustomLink>
            ),
            wmsRefNo: loc?.wmsRefNo ?? '',
            orderDate: loc?.orderDate ?? '',
            status: (
                <ArrowButton
                    label={
                        <Typography variant='h6' sx={{ color: '#fff', fontSize: '12px' }}>
                            {loc?.status}
                        </Typography>
                    }
                    variant={
                        {
                            SHIPPED: 'red',
                            CANCELLED: 'gray'
                        }[loc?.status] ?? 'gray'
                    }
                    nonClickable={true}
                    customStyles={{ width: '100%' }}
                />
            ),
            orderType: loc?.orderType ?? '-',
            channel: (
                <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
                    {
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
                    }
                </Box>
            ),
            sla: <SLADisplay hours={loc?.sla} />,
            paymentMode: (
                <StatusBadge
                    type={
                        {
                            COD: 'deepOrange',
                            PREPAID: 'success'
                        }[loc?.paymentMode] ?? 'default'
                    }
                    label={loc?.paymentMode ?? 'N/A'}
                />
            ),
            courier: loc?.courier ?? '',
            awbNo: loc?.awbNo ?? '',
            shipToName: loc?.shipToName ?? '',
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
                    nonClickable={true}
                    customStyles={{ width: '100%' }}
                />
            ),
            quantity: loc?.quantity ?? 0,
            zone: loc?.zone ?? '',
            createdAt: loc?.createdAt ?? '',
            createdBy: loc?.createdBy ?? '',
            statusText: loc?.status ?? ''
        }))

        setGeData(updatedDummyData ?? [])
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

    return (
        <MainCard content={false}>
            <Box sx={{ paddingY: 2, paddingTop: '0.75rem' }}>
                {/* Add your dummy buttons here */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: 0.5
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant='h3'>Archived Orders</Typography>
                    </Box>
                    <Stack direction='row' spacing={1} alignItems='center'>
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
                <FilterCard />
                <DataTable
                    data={gEData}
                    columns={columns}
                    addExcelQuery={excelHandler}
                    queryHandler={queryHandler}
                    totalRecords={recordCount}
                    isCheckbox={false}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                />
            </Box>
            <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={`ASN_Export_${new Date()}.csv`}
                ref={csvLinkRef}
                style={{ display: 'none' }}
            />
        </MainCard>
    )
}
/* eslint-disable */
export default ArchivedOrdersTable
