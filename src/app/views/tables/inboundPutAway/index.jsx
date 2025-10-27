import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Extension, FilterAltOff, Inventory, TextFields, Upload } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import DataTable from '@core/components/extended/table/Table'
import CustomModal from '@core/components/extended/CustomModal'
import ToggleColumns from '@core/components/ToggleColumns'
// eslint-disable-next-line import/no-unresolved
import DropdownMenu from '@/core/components/DropdownMenu'
import ImportFileModal from '@/core/components/modals/ImportFileModal'
import CustomLink from '@/core/components/extended/CustomLink'
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'

// import permission guard
import UiAccessGuard from '@/app/guards/UiPermissionGuard'

// ** import utils
import { isExcelQuery, TOGGLE_ALL, INBOUND_STATUS } from '@/constants'

// ** import from redux
import { openModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useDeactivateStorageZoneMutation } from '@/app/store/slices/api/storageLocationSlice'
import CustomButton from '@/core/components/extended/CustomButton'

// ** import sub-components
// eslint-disable-next-line no-unused-vars
import { openSnackbar } from '@/app/store/slices/snackbar'

// ** import helper
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { dataTable } from '@store/slices/api/putAwaySlice'
import { CSVLink } from 'react-csv'
// eslint-disable-next-line no-unused-vars
import { headers, locations } from './helper'

// import ToasterComponent from '@/core/components/CustomToasterComponent'

function InboundPutAwayTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const hasCreateAccess = useUiAccess('create')
    const { dataTableLKey } = useSelector(state => state.loading)
    const modalType = useSelector(state => state.modal.type)
    const isOpen = useSelector(state => state.modal.open)
    // eslint-disable-next-line no-unused-vars
    const [deactivateStorageZone] = useDeactivateStorageZoneMutation()
    const [rows, setRows] = useState([])
    const [columns, setColumns] = useState([...headers])
    const [records, setRecords] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)

    const [activePopup, setActivePopup] = useState(null)
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const csvLinkRef = useRef(null)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [refetch, setRefetch] = useState(false)

    const queryHandler = async query => {
        const { data: response } = await dispatch(dataTable.initiate(query, false))
        if (isExcelQuery(query)) return
        setRows(
            // response?.data.map(item => {
            response.data.map(loc => ({
                id: loc?.id,
                no: (
                    <CustomLink href={`/inbound/putAway/view/${loc?.id}`} icon>
                        <Tooltip title='View Details' placement='bottom' arrow>
                            {loc?.no}
                        </Tooltip>
                    </CustomLink>
                ),
                gate_entry_no: loc?.gate_entry_no ?? '-',

                gate_entry_status: (
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
                                {/* <AssistantDirection sx={{ fontSize: '16px' }} /> */}
                                {INBOUND_STATUS[loc.gate_entry_status].label}
                            </Typography>
                        }
                        // variant={loc?.gate_entry_status === 'Completed' ? 'green' : 'orange'}
                        variant={INBOUND_STATUS[loc?.gate_entry_status].color}
                        nonClickable
                        customStyles={{ width: '100%' }}
                    />
                ),
                grn_no: loc?.grn_no ?? '',
                // put_away_status: (
                //     <StatusBadge
                //         type={STATUS_TYPE[loc.put_away_status].color}
                //         label={STATUS_TYPE[loc.put_away_status].label}
                //     />
                // ),
                status: (
                    <ArrowButton
                        label={
                            <Typography variant='h6' sx={{ color: '#fff', fontSize: '12px' }}>
                                {INBOUND_STATUS[loc.status].label}
                            </Typography>
                        }
                        variant={INBOUND_STATUS[loc?.status].color}
                        nonClickable
                        customStyles={{ width: '100%' }}
                    />
                ),
                total_grn_quantity: loc?.total_grn_quantity ?? 0,
                putaway_qty: loc?.putaway_qty ?? 0,
                pending_quantity: (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end'
                        }}
                    >
                        <Typography
                            sx={{
                                color: 'error.main',
                                fontSize: '12px'
                            }}
                        >
                            {loc?.pending_quantity > 0 ? loc?.pending_quantity : '-'}
                        </Typography>
                    </Box>
                ),
                created_at: loc?.created_at ?? <Typography variant='body2'>-</Typography>,
                closed_at: loc?.closed_at ?? <Typography variant='body2'>-</Typography>,
                created_by: loc?.created_by ?? <Typography variant='body2'>-</Typography>
            })) || []
        )
        setRecords(response?.recordsTotal || 0)
    }

    const handleCurrentView = () => {
        if (!rows.length) return

        const visibleHeaders = headers.filter(header => header.visible && header.label !== 'Sr. No.')
        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))

        const exportData = rows.map(item => {
            const row = {}

            visibleHeaders.forEach(header => {
                if (header.key === 'started_at' || header.key === 'closed_at') {
                    if (typeof item[header.key] === 'string') {
                        row[header.key] = item[header.key]
                    } else {
                        row[header.key] = item[header.key]?.props?.children || '-'
                    }
                } else if (header.key === 'no') {
                    row[header.key] = item[header.key]?.props?.children?.props?.children || ''
                } else if (header.key === 'put_away_status') {
                    row[header.key] = item[header.key]?.props?.children?.props?.children || ''
                } else if (header.key === 'status' || header.key === 'gate_entry_status') {
                    row[header.key] = item[header.key]?.props?.label?.props?.children || ''
                } else if (header.key === 'pending_quantity') {
                    row[header.key] = item[header.key]?.props?.children?.props?.children || ''
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

    const handleExportAllExcel = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleAdd = () => navigate('/inbound/putAway/create')

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

    const downloadOptions = [
        { value: 'Bin', label: 'Bin', icon: <Inventory fontSize='small' /> },
        { value: 'Piece', label: 'Piece', icon: <Extension fontSize='small' /> }
    ]

    const handleDownloadSampleFile = action => {
        const link = document.createElement('a')
        link.href = action === 'Piece' ? '/csv/inbound/putAwayPiece.csv' : '/csv/inbound/putAwayBin.csv'
        link.download = action === 'Piece' ? 'piece.csv' : 'bin.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // open bulk import modal
    const handleBulkImport = () => {
        setActivePopup('bulkImport')
        dispatch(
            openModal({
                content: (
                    <ImportFileModal
                        // handleFileSubmission={(file, fileAction) => handleUpload(file, fileAction)}
                        // handleGetTemplate={getTemplate}
                        // isFileAction
                        isDownloadSample
                        removeTitle
                        fileType={{
                            'text/csv': ['.csv'],
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                        downloadSampleTrigger
                        downloadOptions={downloadOptions}
                        handleDownloadSampleFile={handleDownloadSampleFile}
                    />
                ),
                title: <Typography variant='h3'>Create Put-Away</Typography>
            })
        )
    }

    const handleOptionClick = optionAction => {
        if (optionAction === 'form') {
            handleAdd()
        } else {
            handleBulkImport()
        }
    }

    const dropdownOptions = [
        { label: 'Form', action: 'form', icon: <TextFields /> },
        { label: 'Upload', action: 'upload', icon: <Upload /> }
    ]

    useEffect(() => {
        if (!isOpen) {
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])
    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd()
        }
    })
    return (
        <MainCard content={false}>
            <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: '2px' }}>
                {/* <ToasterComponent/> */}
                {/* Add your dummy buttons here */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant='h3'>All Put-Away</Typography>
                    </Box>
                    <Stack direction='row' spacing={2} alignItems='center' paddingY='12px'>
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
                        <UiAccessGuard type='create'>
                            <DropdownMenu
                                buttonText='Add New'
                                options={dropdownOptions}
                                onOptionClick={handleOptionClick}
                            />
                        </UiAccessGuard>

                        {/* render action column can be made dynamic based on user authorization  */}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                    </Stack>
                </Box>
                <DataTable
                    data={rows}
                    columns={columns}
                    reqKey='dataTableLKey'
                    refetch={refetch}
                    queryHandler={queryHandler}
                    excelHandler={excelHandler}
                    isLoading={dataTableLKey}
                    totalRecords={records}
                    isCheckbox={false}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                    // tableContainerSX={{
                    //     maxHeight:'100%'
                    // }}
                />
            </Box>
            {activePopup === 'bulkImport' && modalType === 'global_modal' && <CustomModal open={isOpen} />}
            <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={`PutAway_Export_${new Date()}.csv`}
                ref={csvLinkRef}
                style={{ display: 'none' }}
            />
        </MainCard>
    )
}

export default InboundPutAwayTable
