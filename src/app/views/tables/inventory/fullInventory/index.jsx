/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useRef, memo, useCallback } from 'react'

import { Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import StatusBadge from '@/core/components/StatusBadge'
import { CSVLink } from 'react-csv'

import { isExcelQuery, TOGGLE_ALL } from '@/constants'
import { inventoryDataTable } from '@/app/store/slices/api/inventorySlice'
import { useDispatch, useSelector } from 'react-redux'

// ** import dummy data
import { headers } from './helper'

// Memoize the PackActionCell component to prevent re-renders
const ActionCell = memo(({ row }) => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center'
        }}
    />
))

// const staticQuery =
function FullInventory() {
    const csvLinkRef = useRef(null)

    const dispatch = useDispatch()
    // eslint-disable-next-line no-unused-vars
    const [config, setConfig] = useState({
        markClose: 0,
        markRelease: 0,
        vehicleReleaseDate: '',
        geCreatedAt: ''
    })
    const [columns, setColumns] = useState([...headers])
    const [excelHandler, setExcelHandler] = useState(false)
    const [invData, setInvData] = useState([])
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const [recordCount, setRecordCount] = useState(0)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const { inventoryDataTableLKey } = useSelector(state => state.loading)

    // excel export all handler
    const handleExportAll = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    // excel current view handler
    const handleCurrentView = () => {
        if (!invData.length) return

        const visibleHeaders = headers.filter(header => header.visible && header.label !== 'Sr.No.')

        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))
        const modifiedKeys = ['storage_type', 'blocked_quantity', 'inventory_type']
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
        const { data: response } = await dispatch(inventoryDataTable.initiate(`${query}&filter=full`))
        if (isExcelQuery(query)) return
        setInvData(
            response.data.map(item => ({
                ...item,
                storage_type: (
                    <StatusBadge
                        type={
                            {
                                SELLABLE: 'info',
                                QUARANTINE: 'warning'
                            }[item?.storageType]
                        }
                        label={item?.storageType || ''}
                        customSx={{
                            minWidth: '7.5rem',
                            paddingX: 0.5
                        }}
                    />
                ),
                original_storage_type: item?.storage_type || item.qc_status === 'ok' ? 'GOOD' : 'BAD' || '',
                inventory_type: (
                    <StatusBadge
                        type={
                            {
                                GOOD: 'success',
                                BAD: 'danger'
                            }[item?.inventoryType || item.qc_status === 'ok' ? 'GOOD' : 'BAD']
                        }
                        label={item?.inventoryType || item.qc_status === 'ok' ? 'GOOD' : 'BAD' || ''}
                        customSx={{
                            minWidth: '5rem',
                            paddingX: 0.5
                        }}
                    />
                ),
                original_inventory_type: item?.inventory_type || '',
                blocked_quantity: <Typography sx={{ color: 'error.main' }}>{item.blocked_quantity ?? 0}</Typography>,
                original_blocked_quantity: item?.blocked_quantity || '',
                item_category: item?.item_category ?? ''
            }))
        )
        setRecordCount(response.recordsTotal || 0)
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
                        <Typography variant='h3'>Full Inventory</Typography>
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
                    reqKey='inventoryDataTableLKey'
                    data={invData}
                    columns={columns}
                    addExcelQuery={excelHandler}
                    queryHandler={queryHandler}
                    totalRecords={recordCount}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                    isLoading={inventoryDataTableLKey}
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
export default FullInventory
