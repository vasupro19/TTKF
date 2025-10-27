import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { AllInbox, Extension, FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'

// import permission guard
import UiAccessGuard from '@/app/guards/UiPermissionGuard'

// ** import utils
import { TOGGLE_ALL, isExcelQuery } from '@/constants'

// ** import from redux
import { useDispatch } from 'react-redux'

// ** import sub-components
// import { openSnackbar } from '@/app/store/slices/snackbar'

// ** import helper
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'
import CustomButton from '@/core/components/extended/CustomButton'
import { itemsDataTable } from '@/app/store/slices/api/putAwaySlice'
import { CSVLink } from 'react-csv'
import { headers } from './helper'

function InboundPutAwayDetails() {
    const { id: viewId } = useParams()
    const dispatch = useDispatch()

    const [rows, setRows] = useState([])
    const [columns, setColumns] = useState([...headers])
    const [records, setRecords] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)

    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const csvLinkRef = useRef(null)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const queryHandler = async query => {
        if (!viewId || !parseInt(viewId, 10)) return
        const idQuery = query.startsWith(`?id=${viewId}`) ? query : query.replace('?', `?id=${viewId}&`)
        const { data: response } = await dispatch(itemsDataTable.initiate(idQuery))
        if (isExcelQuery(idQuery)) return

        setRows(
            response.data?.map((loc, index) => ({
                id: loc?.id || index,
                created_by: loc?.created_by ?? 'N/A',
                // put_away_type: loc?.put_away_type,
                type: (
                    <ArrowButton
                        label={
                            <Typography
                                variant='h6'
                                sx={{
                                    color: '#fff',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                }}
                            >
                                {loc?.type === 'Piece' ? (
                                    <Extension sx={{ fontSize: '16px' }} />
                                ) : (
                                    <AllInbox sx={{ fontSize: '16px' }} />
                                )}
                                {loc.type}
                            </Typography>
                        }
                        variant={loc?.type === 'Piece' ? 'blue' : 'green'}
                        nonClickable
                        customStyles={{ width: '100%' }}
                    />
                ),
                uid: (
                    <Tooltip title={loc?.uid} placement='bottom' unselectable='on' disableInteractive arrow>
                        <Typography
                            sx={{
                                fontSize: '12px',
                                userSelect: 'none', // Prevent text selection
                                cursor: 'default' // Avoid text cursor appearance
                            }}
                        >
                            {`${loc?.uid.slice(0, 2)}****${loc?.uid.slice(-2)}`}
                        </Typography>
                    </Tooltip>
                ),
                sku: loc?.item_no ?? 'N/A',
                bin_no: loc?.bin_no ?? 'N/A',
                location_code: loc?.location_code ?? 'N/A',
                created_at: loc?.created_at ?? ''
            })) || []
        )

        setRecords(response?.recordsTotal || 0)
        // setRecords(response?.recordsTotal || 0)
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

    const handleExportAllExcel = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCurrentView = () => {
        if (!rows.length) return

        const visibleHeaders = headers.filter(header => header.visible && header.label !== 'Id')

        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))

        const exportData = rows.map(item => {
            const row = {}

            dynamicHeaders.forEach(header => {
                if (header.key === 'put_away_type') {
                    const putAwayTypeText = item.put_away_type.props.label.props.children[1] || ''
                    row[header.key] = putAwayTypeText
                } else if (header.key === 'type') {
                    row[header.key] = item[header.key]?.props?.label?.props?.children[1] || ''
                } else if (header.key === 'uid') {
                    row[header.key] = item[header.key]?.props?.children?.props?.children || ''
                } else if (header.key === 'item_id') {
                    if (item[header.key]?.props?.title) {
                        row[header.key] = item[header.key].props.title || ''
                    } else {
                        row[header.key] = item[header.key]?.props?.children || ''
                    }
                } else if (header.key === 'created_at') {
                    if (typeof item[header.key] === 'string') {
                        row[header.key] = item[header.key]
                    } else {
                        row[header.key] = item[header.key]?.props?.children || '-'
                    }
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

    return (
        <MainCard content={false}>
            <Box sx={{ paddingTop: '2px' }}>
                {/* Add your dummy buttons here */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
                    {/* <Box>
                        <Typography variant='h3'>Put Away Details</Typography>
                    </Box> */}
                    <Stack direction='row' spacing={2} alignItems='center' paddingY='4px'>
                        {/* add your custom filters here */}
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
                            <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAllExcel} />
                        </UiAccessGuard>

                        {/* render action column can be made dynamic based on user authorization  */}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                    </Stack>
                </Box>
                <DataTable
                    data={rows}
                    columns={columns}
                    queryHandler={queryHandler}
                    excelHandler={excelHandler}
                    totalRecords={records}
                    isCheckbox={false}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                />
            </Box>
            <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={`PutAway_Details_Export_${new Date()}.csv`}
                ref={csvLinkRef}
                style={{ display: 'none' }}
            />
        </MainCard>
    )
}

export default InboundPutAwayDetails
