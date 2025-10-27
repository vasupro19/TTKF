/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useRef, memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Edit, FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import CustomLink from '@/core/components/extended/CustomLink'
import StatusBadge from '@/core/components/StatusBadge'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'
import { CSVLink } from 'react-csv'

import AmazonColorIcon from '@/assets/icons/channel/AmazonColorIcon'
import MyntraColorIcon from '@/assets/icons/channel/MyntraColorIcon'
import ShopifyColorIcon from '@/assets/icons/channel/ShopifyColorIcon'
import flipkartColorIcon from '@/assets/icons/channel/flipkartColorIcon.svg'
import ExcelColouredIcon from '@/assets/icons/ExcelColouredIcon'

import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import { isExcelQuery, OUTBOUND_STATUS, TOGGLE_ALL } from '@/constants'
import { downloadFile } from '@/utilities'

// ** import dummy data
import PropTypes from 'prop-types'
import { packDataTable } from '@/app/store/slices/api/packSlice'
import { useDispatch, useSelector } from 'react-redux'
import { headers, locations } from './helper'

const getChannelIcon = {
    Amazon: <AmazonColorIcon />,
    Myntra: <MyntraColorIcon />,
    Shopify: <ShopifyColorIcon />,
    Flipkart: <img src={flipkartColorIcon} alt='Flipkart' style={{ height: 18, width: 18 }} />
}

const b2cOrderTypes = new Set(['B2C', 'Exchange', 'Sample', 'Promotion'])

const getTopLevelOrderType = orderType => (b2cOrderTypes.has(orderType) ? 'B2C' : 'B2B')

// Memoize the PackActionCell component to prevent re-renders
const ActionCell = memo(({ row, downloadFileFunc, navigate }) => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center'
        }}
    >
        <Tooltip title='Download pack summary'>
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
        {getTopLevelOrderType(row?.order_type) === 'B2B' && row?.original_status === 1 ? (
            <Tooltip title='Edit'>
                <IconButton
                    sx={{
                        '&:hover': {
                            scale: 1.1
                        }
                    }}
                    size='small'
                    aria-label='edit row'
                    onClick={navigate}
                >
                    <Edit
                        sx={{
                            fill: '#60498a',
                            fontSize: '1rem'
                        }}
                    />
                </IconButton>
            </Tooltip>
        ) : (
            <Tooltip title='Non-editable'>
                <IconButton
                    aria-label='non-editable'
                    sx={{ cursor: 'default' }}
                    disableFocusRipple
                    disableRipple
                    size='small'
                >
                    <Edit
                        sx={{
                            fontSize: '1rem'
                        }}
                    />
                </IconButton>
            </Tooltip>
        )}
    </Box>
))

ActionCell.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    row: PropTypes.object,
    downloadFileFunc: PropTypes.func,
    navigate: PropTypes.func
}

// const staticQuery =
function PackTable() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { packDataTableLKey } = useSelector(state => state.loading)

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
    const [packData, setPackData] = useState([])
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

    const handleCurrentView = () => {
        if (!packData.length) return

        const visibleHeaders = headers.filter(header => header.visible && header.label !== 'Sr. No.')

        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))

        const exportData = packData.map(item => {
            const row = {}

            visibleHeaders.forEach(header => {
                if (header.key === 'status') {
                    row[header.key] = item[header.key]?.props?.label || ''
                } else if (header.key === 'no') {
                    row[header.key] = item[header.key]?.props?.children?.props?.children || ''
                } else if (header.key === 'channel_code') {
                    row[header.key] = item[header.key]?.props?.children?.props?.children[0] || ''
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

    // query handler
    const queryHandler = async query => {
        if (!query) return
        const { data } = await dispatch(packDataTable.initiate(query, false))
        if (isExcelQuery(query)) return
        setPackData(
            data?.data.map(item => ({
                ...item,
                original_no: item?.no || '-',
                order_no: item?.orderNo || '-',
                no: (
                    <CustomLink
                        href={`/outbound/pack/${getTopLevelOrderType(item?.order_type)}/view/${item?.id}`}
                        icon
                        state={{
                            status: item?.status // TODO:: just using this state to get main status of pack, which will later be fetched using packID
                        }}
                    >
                        <Tooltip title='View Details' placement='bottom' arrow>
                            {item?.no}
                        </Tooltip>
                    </CustomLink>
                ),
                original_channel_code: item?.channel_code,
                channel_code: (
                    <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
                        <>
                            {getChannelIcon?.[item?.channel_code]}
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
                                {item?.channel_code || '-'}
                            </Typography>
                        </>
                    </Box>
                ),
                original_status: item?.status || '-',
                status: (
                    <StatusBadge
                        type={
                            {
                                'In Progress': 'info',
                                Packed: 'orange'
                            }[OUTBOUND_STATUS[item?.status].color]
                        }
                        label={OUTBOUND_STATUS[item?.status].label}
                        customSx={{
                            minWidth: '9rem',
                            paddingX: 0.5
                        }}
                    />
                )
            })) || []
        )
        setRecordCount(data?.recordsTotal || 0)
    }

    // useEffect(() => {
    //     // TODO: once API is integrated, remove this block completely
    //     const updatedDummyData = locations?.map(loc => ({
    //         id: loc?.id,
    //         orderId: loc?.orderId ?? '',
    //         packId: (
    //             <CustomLink
    //                 href={`/outbound/pack/${getTopLevelOrderType(loc?.orderType)}/view/${loc?.packId}`}
    //                 icon
    //                 state={{
    //                     status: loc?.status // TODO:: just using this state to get main status of pack, which will later be fetched using packID
    //                 }}
    //             >
    //                 <Tooltip title='View Details' placement='bottom' arrow>
    //                     {loc?.packId}
    //                 </Tooltip>
    //             </CustomLink>
    //         ),
    //         packIdText: loc?.packId ?? '',
    //         orderDate: loc?.orderDate ?? '',
    //         orderType: loc?.orderType ?? '-',
    //         channel: (
    //             <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
    //                 <>
    //                     {getChannelIcon?.[loc?.channel]}
    //                     <Typography
    //                         variant='body2'
    //                         fontWeight={500}
    //                         sx={{
    //                             maxWidth: '100px',
    //                             overflow: 'hidden',
    //                             textOverflow: 'ellipsis',
    //                             whiteSpace: 'nowrap'
    //                         }}
    //                     >
    //                         {loc?.channel || '-'}
    //                     </Typography>
    //                 </>
    //             </Box>
    //         ),
    //         status: (
    //             <StatusBadge
    //                 type={
    //                     {
    //                         'In Progress': 'info',
    //                         Packed: 'orange'
    //                     }[loc?.status]
    //                 }
    //                 label={loc?.status}
    //                 customSx={{
    //                     minWidth: '9rem',
    //                     paddingX: 0.5
    //                 }}
    //             />
    //         ),
    //         statusText: loc?.status ?? '',
    //         courier: loc?.courier ?? '',
    //         awbNo: loc?.awbNo ?? '',
    //         totalBoxes: loc?.totalBoxes ?? '',
    //         totalWeight: loc?.totalWeight ?? '',
    //         createdAt: loc?.createdAt ?? '',
    //         createdBy: loc?.createdBy ?? '',
    //         modifiedBy: loc?.modifiedBy ?? '', // changed to match `modifiedBy`
    //         modifiedAt: loc?.modifiedAt ?? '' // changed to match `modifiedAt`
    //     }))

    //     setPackData(updatedDummyData ?? [])
    // }, [])

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
            label: 'Edit Pack',
            icon: (
                <Edit
                    fontSize='small'
                    sx={{
                        fill: '#60498a'
                    }}
                />
            ),
            onClick: row => {
                navigate(`/outbound/pack/${getTopLevelOrderType(row?.orderType)}/edit/${row?.packIdText}`, {
                    state: {
                        status: row?.statusText
                    }
                })
            },
            condition: row => getTopLevelOrderType(row?.orderType) === 'B2B'
        },
        {
            label: 'Download Summary',
            icon: <ExcelColouredIcon fontSize='small' />,
            onClick: () => {
                downloadFile('/csv/outbound/packSummary.csv', 'pack_summary.csv')
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
                    downloadFile('/csv/outbound/packSummary.csv', 'pack_summary.csv')
                }}
                navigate={() => {
                    navigate(`/outbound/pack/${getTopLevelOrderType(row?.orderType)}/edit/${row?.id}`, {
                        state: {
                            status: row?.statusText // TODO:: just using this state to get main status of pack, which will later be fetched using packID
                        }
                    })
                }}
                getTopLevelOrderType={getTopLevelOrderType}
            />
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

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
                            <Typography variant='h3'>All Packed</Typography>
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

                    <MobileTableToolbar
                        title='All Packed'
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAll}
                        setClearAllFilters={setClearAllFilters}
                    />

                    <DataTable
                        reqKey='packDataTableLKey'
                        data={packData}
                        columns={columns}
                        addExcelQuery={excelHandler}
                        queryHandler={queryHandler}
                        totalRecords={recordCount}
                        renderAction={renderAction}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        enableContextMenu
                        isLoading={packDataTableLKey}
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>

                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename={`Pack_Export_${new Date()}.csv`}
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default PackTable
