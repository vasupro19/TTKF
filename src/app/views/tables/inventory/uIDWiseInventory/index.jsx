import { useEffect, useState, useRef } from 'react'

import { Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { FilterAltOff } from '@mui/icons-material'

// ** import core components
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import StatusBadge from '@/core/components/StatusBadge'
import { CSVLink } from 'react-csv'
import { useDispatch, useSelector } from 'react-redux'

import { INBOUND_STATUS, isExcelQuery, TOGGLE_ALL } from '@/constants'
import { serialInventoryDataTable, inventoryFilterCount } from '@/app/store/slices/api/inventorySlice'
import { addFilterCounts } from '@/app/store/slices/inventoryFilterTabsSlice'
// ** import dummy data
import { headers } from './helper'

// Memoize the PackActionCell component to prevent re-renders
// const ActionCell = memo(({ row }) => (
//     <Box
//         sx={{
//             display: 'flex',
//             justifyContent: 'flex-start',
//             alignItems: 'center'
//         }}
//     />
// ))

function UIDWiseInventory({ tabValue }) {
    const csvLinkRef = useRef(null)
    const dispatch = useDispatch()
    // eslint-disable-next-line no-unused-vars
    const [config, setConfig] = useState({
        markClose: 0,
        markRelease: 0,
        vehicleReleaseDate: '',
        geCreatedAt: ''
    })
    const [columns, setColumns] = useState([])
    const [excelHandler, setExcelHandler] = useState(false)
    const [invData, setInvData] = useState([])
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const [recordCount, setRecordCount] = useState(0)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const { serialInventoryDataTableLKey } = useSelector(state => state.loading)

    useEffect(() => {
        // setIsLoading(true)
        // const currentConfig = columnConfig.find(cfg => cfg[tabValue])
        // if (!currentConfig) {
        //     setIsLoading(false)
        //     return
        // }

        // console.log('currentConfig', currentConfig)

        // const allowedLabels = new Set(currentConfig[tabValue])

        // Filter from the original headers array
        // setColumns(headers.filter(col => allowedLabels.has(col.label)))

        setColumns(headers[tabValue])

        // setTimeout(() => {
        //     setIsLoading(false)
        // }, 400)
    }, [tabValue])

    useEffect(() => {
        ;(async () => {
            try {
                const { data } = await dispatch(inventoryFilterCount.initiate())
                dispatch(addFilterCounts(data?.data || {}))
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error)
            }
        })()
    }, [])

    // excel export all handler
    const handleExportAll = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    // excel current view handler
    const handleCurrentView = () => {
        if (!invData.length) return

        const visibleHeaders = headers[tabValue].filter(header => header.visible && header.label !== 'Sr.No.')

        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))
        const modifiedKeys = ['storage_type', 'blocked_quantity', 'inventory_type', 'status']
        const exportData = invData.map((item, index) => {
            const row = {}

            visibleHeaders.forEach(header => {
                if (header.key === 's_no') row[header.key] = index
                else if (header.key === 'created_at' || header.key === 'modified_at') {
                    row[header.key] = item[header.key] ? new Date(item[header.key]).toLocaleString() : ''
                } else if (modifiedKeys.includes(header.key)) {
                    row[header.key] = item[`original_${header?.key}`] || ''
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
        const disableFilterRequest = ['kit_picked', 'returned']
        if (disableFilterRequest.includes(tabValue)) return // TODO: remove this check once all tabs are implemented

        const { data: response } = await dispatch(
            serialInventoryDataTable.initiate(`${query}&filter=${tabValue === 'storage' ? 'serial' : tabValue}`)
        )
        if (isExcelQuery(query)) return
        setInvData(
            response.data?.map(item => ({
                ...item,
                original_storage_type: item?.storage_type || item.qc_status === 'ok' ? 'GOOD' : 'BAD' || '',
                storage_type: (
                    <StatusBadge
                        type={
                            {
                                SELLABLE: 'info',
                                QUARANTINE: 'warning'
                            }[item?.storage_type]
                        }
                        label={item?.storage_type}
                        customSx={{
                            minWidth: '7.5rem',
                            paddingX: 0.5
                        }}
                    />
                ),
                original_inventory_type: item?.inventory_type || '',
                inventory_type: (
                    <StatusBadge
                        type={
                            {
                                GOOD: 'success',
                                BAD: 'danger'
                            }[item?.inventory_type || item.qc_status === 'ok' ? 'GOOD' : 'BAD']
                        }
                        label={item?.inventory_type || item.qc_status === 'ok' ? 'GOOD' : 'BAD'}
                        customSx={{
                            minWidth: '5rem',
                            paddingX: 0.5
                        }}
                    />
                ),
                original_blocked_quantity: item?.blocked_quantity || 0,
                blocked_quantity: <Typography sx={{ color: 'error.main' }}>{item.blocked_quantity ?? 0}</Typography>,
                item_category: item?.item_category ?? '',
                created_at: item?.created_at || '',
                original_status: item.status,
                status: item.status ? (
                    <StatusBadge
                        type={INBOUND_STATUS[item?.status]?.color}
                        label={INBOUND_STATUS[item?.status]?.label}
                    />
                ) : (
                    ''
                )
            }))
        )
        setRecordCount(response.recordsTotal || 0)
    }

    // useEffect(() => {
    //     // TODO: once API is integrated, remove this block completely
    //     const updatedDummyData = locations?.map(loc => ({
    //         id: loc?.id,
    //         location: loc?.location ?? '-',
    //         SKUNo: loc?.SKUNo ?? '-',
    //         uid: loc?.uid ?? '-',
    //         EAN: loc?.EAN ?? '-',
    //         description: loc?.description ?? '-',
    //         // For storageType
    //         storageType: (
    //             <StatusBadge
    //                 type={
    //                     {
    //                         SELLABLE: 'info',
    //                         QUARANTINE: 'warning'
    //                     }[loc?.storageType]
    //                 }
    //                 label={loc?.storageType}
    //                 customSx={{
    //                     minWidth: '7.5rem',
    //                     paddingX: 0.5
    //                 }}
    //             />
    //         ),
    //         // For inventoryType
    //         inventoryType: (
    //             <StatusBadge
    //                 type={
    //                     {
    //                         GOOD: 'success',
    //                         BAD: 'danger'
    //                     }[loc?.inventoryType]
    //                 }
    //                 label={loc?.inventoryType}
    //                 customSx={{
    //                     minWidth: '5rem',
    //                     paddingX: 0.5
    //                 }}
    //             />
    //         ),
    //         totalQuantity: loc?.totalQuantity ?? 0,
    //         availableQuantity: loc?.availableQuantity ?? 0,
    //         blockedQuantity: <Typography sx={{ color: 'error.main' }}>{loc.blockedQuantity ?? 0}</Typography>,
    //         itemCategory: loc?.itemCategory ?? ''
    //     }))

    //     setInvData(updatedDummyData ?? [])
    // }, [])

    // Column toggler (this remains the same as it manipulates the main 'columns' state)
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
        <>
            <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: '2px' }}>
                <Box
                    sx={{
                        display: 'flex',
                        gap: { xs: 0, sm: 2 },
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexDirection: { xs: 'column', sm: 'row' }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, paddingTop: { xs: 2, sm: 0 } }}>
                        <Typography variant='h3'>All Items</Typography>
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
                    reqKey='serialInventoryDataTableLKey'
                    data={invData}
                    columns={columns}
                    addExcelQuery={excelHandler}
                    queryHandler={queryHandler}
                    totalRecords={recordCount}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                    isLoading={serialInventoryDataTableLKey}
                />
            </Box>

            <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={`uid_wise_inventory_${new Date()}.csv`}
                ref={csvLinkRef}
                style={{ display: 'none' }}
            />
        </>
    )
}
/* eslint-disable */
export default UIDWiseInventory
