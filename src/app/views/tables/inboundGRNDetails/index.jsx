import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { styled, Tooltip, Typography, tooltipClasses } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'

// import permission guard
import UiAccessGuard from '@/app/guards/UiPermissionGuard'

// ** import utils
import { isExcelQuery, TOGGLE_ALL } from '@/constants'

// ** import from redux
import { useDispatch } from 'react-redux'
import { getGrnItemsDataTable } from '@/app/store/slices/api/grnSlice'

// ** import helper
import { FilterAltOff } from '@mui/icons-material'
import { CSVLink } from 'react-csv'
import { headers } from './helper'

// eslint-disable-next-line react/jsx-props-no-spreading
const CustomTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)(
    ({ theme }) => ({
        [`& .${tooltipClasses.tooltip}`]: {
            backgroundColor: '#fff', // Tooltip background color
            color: '#333', // Tooltip text color
            fontSize: '14px', // Text size
            border: '1px solid #ddd', // Optional border
            borderRadius: '8px', // Rounded corners
            boxShadow: theme.shadows[2], // Subtle shadow
            padding: '10px' // Padding inside the tooltip
        },
        [`& .${tooltipClasses.arrow}`]: {
            color: '#fff' // Arrow color to match the background
        }
    })
)

function InboundGRNDetails() {
    const { id: viewId } = useParams()
    const dispatch = useDispatch()

    const [rows, setRows] = useState([])
    const [columns, setColumns] = useState([...headers])
    const [records, setRecords] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)

    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const csvLinkRef = useRef(null)

    const queryHandler = async query => {
        let newQuery = query
        if (query) newQuery = `?id=${viewId}&${query.replace('?', '')}`
        // if (query) newQuery = `?id=${viewId}`
        const { data: response } = await dispatch(getGrnItemsDataTable.initiate(newQuery))
        if (isExcelQuery(query)) return

        setRows(
            response.data.map(loc => ({
                id: loc?.id,
                created_by: loc?.created_by ?? '-',
                item_id: (
                    <Tooltip title={loc?.item_id} placement='bottom' unselectable='on' disableInteractive arrow>
                        <Typography
                            sx={{
                                fontSize: '12px',
                                userSelect: 'none',
                                cursor: 'default'
                            }}
                        >
                            {`${loc?.item_id.slice(0, 2)}****${loc?.item_id.slice(-2)}`}
                        </Typography>
                    </Tooltip>
                ),
                ean: loc?.ean ?? '-',
                bin_no: loc?.bin_no ?? '-',
                table_id: loc?.table_id ?? '-',
                box_id: loc?.box_id ?? '-',
                batch: loc?.batch ?? '-',
                mfd_date: loc?.mfd_date ?? '-',
                mrp: loc?.mrp ?? '-',
                expiry_date: loc?.expiry_date ?? '-',
                qc_status: (
                    <Typography color={loc?.qc_status.toLowerCase() === 'ok' ? 'secondary.dark' : 'error'}>
                        {loc?.qc_status.toUpperCase() ?? '-'}
                    </Typography>
                ),
                reject_reason: (
                    <Typography
                        sx={{
                            color: 'text.dark',
                            fontWeight: '500',
                            fontSize: '12px',
                            // maxWidth: '100px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textAlign: 'center'
                        }}
                    >
                        {loc?.reject_reason ? (
                            <Tooltip title={loc?.reject_reason}>{loc?.reject_reason}</Tooltip>
                        ) : (
                            loc?.reject_reason
                        )}
                    </Typography>
                ),
                // Config: (
                //     <CustomTooltip
                //         title={
                //             <Box
                //                 sx={{
                //                     display: 'flex',
                //                     flexDirection: 'column',
                //                     alignItems: 'center',
                //                     backgroundColor: '#fff',
                //                     maxHeight: '300px',
                //                     overflowY: 'auto'
                //                 }}
                //             >
                //                 <Typography variant='subtitle1' fontWeight='bold'>
                //                     Base Doc: {loc?.Config?.baseDoc}
                //                 </Typography>
                //                 <Typography variant='subtitle1' color='text.secondary'>
                //                     <strong>Process Config:</strong> {loc?.Config?.processConfig}
                //                 </Typography>
                //                 <Typography variant='subtitle1' color='text.secondary'>
                //                     <strong>Additional Config: </strong>
                //                     {loc?.Config?.additionalConfig?.length > 0
                //                         ? loc?.Config?.additionalConfig.join(', ')
                //                         : 'None'}
                //                 </Typography>
                //             </Box>
                //         }
                //         arrow
                //         placement='top'
                //     >
                //         <Box
                //             sx={{
                //                 display: 'flex',
                //                 alignItems: 'center',
                //                 cursor: 'pointer',
                //                 justifyContent: 'center',
                //                 gap: 1
                //             }}
                //         >
                //             <Typography
                //                 sx={{
                //                     color: 'blue.main',
                //                     fontWeight: '500',
                //                     fontSize: '12px',
                //                     maxWidth: '100px',
                //                     overflow: 'hidden',
                //                     textOverflow: 'ellipsis',
                //                     whiteSpace: 'nowrap'
                //                 }}
                //             >
                //                 Config
                //             </Typography>
                //         </Box>
                //     </CustomTooltip>
                // ),
                created_at: loc?.created_at ?? '-'
            })) || []
        )

        setRecords(response?.recordsTotal || 0)
        // setRecords(response?.recordsTotal || 0)
    }

    const handleCurrentView = () => {
        if (!rows.length) return

        const visibleHeaders = headers.filter(header => header.visible && header.label !== 'Sr No.')

        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))

        const exportData = rows.map(item => {
            const row = {}

            visibleHeaders.forEach(header => {
                if (header.key === 'created_at') {
                    row[header.key] = item[header.key] ? new Date(item[header.key]).toLocaleString() : ''
                } else if (header.key === 'item_id') {
                    row[header.key] = item[header.key]?.props?.children?.props?.children || ''
                } else if (header.key === 'qc_status') {
                    row[header.key] = item[header.key]?.props?.children || ''
                } else if (header.key === 'reject_reason') {
                    row[header.key] = item[header.key]?.props?.children || ''
                } else if (header.key === 'modified_at') {
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
                        {/* add your custom filters here */}
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
                filename={`grn${viewId}ItemExcelExport.csv`}
                ref={csvLinkRef}
                style={{ display: 'none' }}
            />
        </MainCard>
    )
}

export default InboundGRNDetails
