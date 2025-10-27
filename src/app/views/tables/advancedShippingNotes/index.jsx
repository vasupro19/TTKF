import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { FilterAltOff, TextFields, Upload } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import DropdownMenu from '@/core/components/DropdownMenu'
import CustomModal from '@core/components/extended/CustomModal'
import ImportFileModal from '@core/components/modals/ImportFileModal'
import { CSVLink } from 'react-csv'

// ** import from redux
import { closeModal, openModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'

// ** import dummy data
import CustomLink from '@/core/components/extended/CustomLink'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import StatusBadge from '@/core/components/StatusBadge'
import CustomButton from '@/core/components/extended/CustomButton'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'
import {
    asnDataTable,
    useGetAsnBulkCreateTemplateMutation,
    useUploadAsnBulkCreateTemplateMutation
} from '@/app/store/slices/api/asnSlice'
import { isExcelQuery, INBOUND_STATUS, TOGGLE_ALL } from '@/constants'
import { objectLength } from '@/utilities'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import useTemporaryToggle from '@/hooks/useTemporaryToggle'
import { headers } from './helper'

function ASNTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const hasCreateAccess = useUiAccess('create')

    const [getAsnTemplate] = useGetAsnBulkCreateTemplateMutation()
    const [uploadExcel] = useUploadAsnBulkCreateTemplateMutation()

    const isOpen = useSelector(state => state.modal.open)
    const csvLinkRef = useRef(null)

    const [refetch, setRefetch] = useTemporaryToggle(false)

    const [columns, setColumns] = useState([...headers])
    const [excelHandler, setExcelHandler] = useState(false)
    const { asnDataTableLKey } = useSelector(state => state.loading)

    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const [asnData, setASNData] = useState([])
    const [recordCount, setRecordCount] = useState(0)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const queryHandler = async queryString => {
        const { data } = await dispatch(asnDataTable.initiate(queryString, false))
        if (isExcelQuery(queryString)) return
        setASNData(
            data.data?.map(item => ({
                id: item?.id,
                original_no: item.no || '-',
                no: (
                    <CustomLink href={`/inbound/asn/${item?.id}`} icon>
                        <Tooltip title='View Details' placement='bottom' arrow>
                            {item?.no}
                        </Tooltip>
                    </CustomLink>
                ),
                vendor_name: item?.vendor_name || '-', // not present
                vendor_code: item?.vendor_code || '-',
                invoice_no: item?.invoice_no || '-',
                asn_status: item?.status,
                status: (
                    <StatusBadge
                        customSx={{ width: '7rem' }}
                        type={INBOUND_STATUS[item?.status]?.color || 'unknown'}
                        label={INBOUND_STATUS[item?.status]?.label || 'unknown'}
                    />
                ),
                po_no: item?.ext_po_no || item.po_no || '-',
                transporter_name: item?.transporter_name || '-',
                total_po_qty: item?.total_po_qty || item?.total_invoice_quantity || 0,
                received_qty: item?.received_qty || 0,
                pending_quantity: item?.pending_quantity || 0,
                created_by: item?.created_by || '-',
                created_at: item?.created_at || '-',
                modified_by: item?.modified_by || '-',
                updated_at: item?.updated_at || '-' // Updated key here
            }))
        )
        setRecordCount(data.recordsTotal)
    }

    const handleAdd = () => {
        navigate('/inbound/asn/create')
    }

    const getTemplate = async () => getAsnTemplate().unwrap()

    const handleFileUpload = async file => {
        let isError = false
        let message = ''
        try {
            const formData = new FormData()
            formData.append('excel', file)

            const response = await uploadExcel(formData).unwrap()
            message = response.message
            if (response && objectLength(response) === 1) isError = true
            else if (objectLength(response) > 1) dispatch(closeModal())
        } catch (error) {
            isError = true
            message = error?.data?.message || error?.message || 'unable to upload file.'
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    // open bulk import modal
    const handleBulkImport = () => {
        // setActivePopup('bulkImport')
        dispatch(
            openModal({
                content: (
                    <ImportFileModal
                        handleGetTemplate={getTemplate}
                        handleFileSubmission={handleFileUpload}
                        sampleFilePath='/csv/inbound/asn.csv'
                        fileType={{
                            'text/csv': ['.csv'],
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                    />
                ),
                title: <Typography variant='h3'>Add ASN</Typography>
            })
        )
    }

    const handleOptionClick = action => {
        if (action === 'form') {
            handleAdd()
        } else {
            handleBulkImport()
        }
        // Add specific logic for each action
    }

    const dropdownOptions = [
        { label: 'Form', action: 'form', icon: <TextFields /> },
        { label: 'Upload', action: 'upload', icon: <Upload /> }
    ]

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
    const handleCurrentView = () => {
        if (!asnData.length) return

        setCsvHeaders(columns.filter(item => item.key !== 'id' && item.label !== 'Sr. No'))
        setCsvData(
            asnData.map(item => {
                const tempItem = { ...item }
                delete tempItem.id
                return {
                    ...tempItem,
                    no: tempItem.original_no,
                    status: tempItem.asn_status ? 'Gate Entry' : 'Pending'
                }
            })
        )

        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click()
            }
        }, 500)
    }

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    useEffect(() => {
        setRefetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname])

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd()
        }
    })

    return (
        <MainCard content={false}>
            <Box sx={{ paddingY: 2, paddingX: { xs: 1.5, sm: 1 }, paddingTop: '2px' }}>
                <Box
                    sx={{
                        display: { xs: 'none', md: 'flex' },
                        gap: 2,
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box>
                        <Typography variant='h3'>All Advanced Shipping Notes</Typography>
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
                        <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExcelClick} />
                        <DropdownMenu
                            buttonText='Add New'
                            options={dropdownOptions}
                            onOptionClick={handleOptionClick}
                        />
                        {/* render action column can be made dynamic based on user authorization  */}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                    </Stack>
                </Box>
                <MobileTableToolbar
                    title='All ASN'
                    isShowClearButton={isShowClearButton}
                    handleCurrentView={handleCurrentView}
                    handleExportAllExcel={handleExcelClick}
                    setClearAllFilters={setClearAllFilters}
                    handleAdd={handleAdd}
                />
                <DataTable
                    data={asnData}
                    columns={columns}
                    addExcelQuery={excelHandler}
                    queryHandler={queryHandler}
                    totalRecords={recordCount}
                    isCheckbox={false}
                    reqKey='asnDataTableLKey'
                    setIsShowClearButton={setIsShowClearButton}
                    isLoading={asnDataTableLKey}
                    clearAllFilters={clearAllFilters}
                    refetch={refetch}
                    // renderAction={row => (
                    //     <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    //         <IconButton
                    //             sx={{
                    //                 color: 'primary.800',
                    //                 '&:hover': {
                    //                     color: 'primary.main'
                    //                 }
                    //             }}
                    //             size='small'
                    //             aria-label='edit row'
                    //             // onClick={() => editHandler(row.id, row)}
                    //         >
                    //             <Tooltip title='Print PO'>
                    //                 <Shop2 fontSize='8px' />
                    //             </Tooltip>
                    //         </IconButton>
                    //         <IconButton
                    //             sx={{
                    //                 color: 'primary.800',
                    //                 '&:hover': {
                    //                     color: 'primary.main'
                    //                 }
                    //             }}
                    //             size='small'
                    //             aria-label='edit row'
                    //             // onClick={() => editHandler(row.id, row)}
                    //         >
                    //             <Tooltip title='Print UIDs CSV'>
                    //                 <InsertDriveFile fontSize='8px' />
                    //             </Tooltip>
                    //         </IconButton>
                    //         <IconButton
                    //             sx={{
                    //                 color: 'primary.800',
                    //                 '&:hover': {
                    //                     color: 'primary.main'
                    //                 }
                    //             }}
                    //             size='small'
                    //             aria-label='edit row'
                    //             // onClick={() => editHandler(row.id, row)}
                    //         >
                    //             <Tooltip title='Print Serial'>
                    //                 <Pin fontSize='8px' />
                    //             </Tooltip>
                    //         </IconButton>
                    //     </Box>
                    // )}
                />
            </Box>
            <CustomModal open={isOpen} handleClose={() => dispatch(closeModal())} />
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

export default ASNTable
