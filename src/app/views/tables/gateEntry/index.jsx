import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { CircularProgress, IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Add, Attachment, Cancel, Edit, FilterAltOff, Print, PublishedWithChanges } from '@mui/icons-material'
import TruckIcon from '@/assets/icons/TruckIcon'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import CustomModal from '@core/components/extended/CustomModal'
import ImportFileModal from '@core/components/modals/ImportFileModal'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import StatusBadge from '@/core/components/StatusBadge'
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'
import CustomLink from '@/core/components/extended/CustomLink'
import GlobalModal from '@/core/components/modals/GlobalModal'
import FileUploadModal from '@/core/components/FileUploadModal'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'
import { CSVLink } from 'react-csv'

// ** import from redux
import { closeModal, openModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'

// ** import utils
import { getCustomSx, objectLength } from '@/utilities'
import {
    gateEntryDataTable,
    getGateEntryDocuments,
    useGetMarkAsCloseTemplateMutation,
    useUploadMarkAsCloseTemplateMutation,
    useMarkVehicleReleaseMutation,
    usePrintGateEntryIdsMutation,
    useUploadGateEntryDocumentsMutation
} from '@/app/store/slices/api/gateEntrySlice'

// ** import dummy data
import { getLocalDateTime, INBOUND_STATUS, isExcelQuery, TOGGLE_ALL } from '@/constants'
import CustomDateTimeInput from '@/core/components/extended/CustomDateTimeInput'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import useTemporaryToggle from '@/hooks/useTemporaryToggle'
import { headers } from './helper'

const customSx = getCustomSx()

// const staticQuery =
function GateEntryTable() {
    const dispatch = useDispatch()
    const hasCreateAccess = useUiAccess('create')
    const navigate = useNavigate()
    const location = useLocation()

    const csvLinkRef = useRef(null)
    const isOpen = useSelector(state => state.modal.open)
    const loading = useSelector(state => state.loading)
    const modalType = useSelector(state => state.modal.type)
    const { gateEntryDataTableLKey, markVehicleReleaseLKey } = useSelector(state => state.loading)

    const [getMarkAsCloseTemplate] = useGetMarkAsCloseTemplateMutation()
    const [uploadMarkAsCloseTemplate] = useUploadMarkAsCloseTemplateMutation()
    const [markVehicleReleaseReq] = useMarkVehicleReleaseMutation()
    const [printGateEntryIds] = usePrintGateEntryIdsMutation()
    const [uploadGateEntryDocuments] = useUploadGateEntryDocumentsMutation()

    // eslint-disable-next-line no-unused-vars
    const [config, setConfig] = useState({
        markClose: 0,
        markRelease: 0,
        vehicleReleaseDate: '',
        geCreatedAt: ''
    })
    const [columns, setColumns] = useState([...headers])
    const [excelHandler, setExcelHandler] = useState(false)
    const [refetch, setRefetch] = useTemporaryToggle(false)

    const [gEData, setGeData] = useState([])
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])

    const [recordCount, setRecordCount] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalData, setModalData] = useState(null)
    const [activeModal, setActiveModal] = useState(null)
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

        setCsvHeaders(columns.filter(item => item.key !== 'id' && item.label !== 'Sr.No' && item.key !== 'files'))
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

    // to get data for fileUploadModal in desired structure
    function formatDocumentData(id) {
        return async () => {
            try {
                const { data: response } = await dispatch(getGateEntryDocuments.initiate(id))

                const documentTypes = [
                    { key: 'invoiceDoc', label: 'Invoice Doc.', pattern: 'invoice_doc' },
                    { key: 'poNo', label: 'PO Doc.', pattern: 'pono_doc' },
                    { key: 'lrDoc', label: 'LR Doc.', pattern: 'lr_doc' },
                    { key: 'ewayBill', label: 'Eway Bill', pattern: 'ewaybill_doc' }
                ]

                const documents = documentTypes.map((docType, index) => {
                    let matchingFile = null

                    if (response && response.data) {
                        matchingFile = response.data.find(file =>
                            typeof file === 'string'
                                ? file.includes(docType.pattern)
                                : file.filename?.includes(docType.pattern)
                        )

                        if (matchingFile) {
                            matchingFile =
                                typeof matchingFile === 'string'
                                    ? matchingFile
                                    : matchingFile.url || matchingFile.path || matchingFile.filename
                        }
                    }

                    return {
                        key: docType.key,
                        label: docType.label,
                        src: matchingFile,

                        title:
                            index === 0 && response?.GENo && response?.invoiceNo
                                ? `${response.GENo} -- ${response.invoiceNo}`
                                : null,
                        gateEntryId: id
                    }
                })

                return documents
            } catch (error) {
                // Return empty document structure in case of error
                return [
                    { key: 'invoiceDoc', label: 'Invoice Doc.', src: null, title: null, gateEntryId: id },
                    { key: 'poNo', label: 'PO Doc.', src: null, title: null, gateEntryId: id },
                    { key: 'lrDoc', label: 'LR Doc.', src: null, title: null, gateEntryId: id },
                    { key: 'ewayBill', label: 'Eway Bill', src: null, title: null, gateEntryId: id }
                ]
            }
        }
    }

    // query handler
    const queryHandler = async query => {
        const { data: response } = await dispatch(gateEntryDataTable.initiate(query, false))
        if (isExcelQuery(query)) return
        setGeData(
            response?.data.map(item => ({
                ...item,
                original_no: item.no,
                no: (
                    <CustomLink href={`/inbound/gateEntry/view/${item?.id}`} icon>
                        <Tooltip title='View Details' placement='bottom' arrow>
                            {item?.no}
                        </Tooltip>
                    </CustomLink>
                ),
                invoice_no: item?.invoice_no ?? '',
                original_status: item.status,
                total_quantity: parseInt(item.total_quantity, 10) || 0,
                status: (
                    <StatusBadge
                        type={INBOUND_STATUS[item?.status]?.color}
                        label={INBOUND_STATUS[item?.status]?.label || 'Open'}
                    />
                ),
                original_document_type: item.document_type,
                document_type: (
                    <ArrowButton
                        label={item?.document_type}
                        variant={
                            // eslint-disable-next-line no-nested-ternary
                            item?.document_type === 'PO' ? 'blue' : item?.document_type === 'ASN' ? 'green' : 'orange'
                        }
                        nonClickable
                    />
                ),
                files: (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Tooltip title='View Attached Documents' arrow>
                            {' '}
                            {/* Added a more descriptive tooltip */}
                            <IconButton
                                aria-label='view documents' // More descriptive aria-label
                                sx={{
                                    padding: '2px 8px !important',
                                    borderRadius: '12px', // Give it a slight border-radius for a softer look
                                    // Initial state for the button content
                                    color: 'secondary.main', // Use your theme's secondary color
                                    transition: 'background-color 0.2s ease-in-out, color 0.2s ease-in-out', // Smooth transitions

                                    // Hover state for the IconButton itself
                                    '&:hover': {
                                        backgroundColor: 'secondary.light', // A lighter shade of secondary on hover
                                        color: 'secondary.dark' // A darker shade for text/icon on hover
                                        // Removed `scale` as it can be visually jarring; rely on color/background change
                                    },
                                    display: 'flex', // Ensure icon and text are side-by-side
                                    alignItems: 'center', // Vertically align
                                    justifyContent: 'center' // Horizontally center
                                }}
                                onClick={async () => {
                                    const fetchDocs = formatDocumentData(item.id)
                                    const docs = await fetchDocs()

                                    setModalData(docs)
                                    setIsModalOpen(true)
                                }}
                            >
                                {/* Place icon and text directly inside IconButton */}
                                <Attachment fontSize='small' sx={{ mr: 0.5 }} /> {/* Margin-right for spacing */}
                                <Typography variant='body2' sx={{ lineHeight: 1 }}>
                                    {' '}
                                    {/* Use body2 for smaller text, ensure no extra line-height */}
                                    View
                                </Typography>
                            </IconButton>
                        </Tooltip>
                    </Box>
                )
            })) || []
        )
        setRecordCount(response.recordsTotal || 0)
    }

    const handleAdd = () => {
        navigate('/inbound/gateEntry/create')
    }

    const handleDocumentUpload = async (file, docKey, docLabel) => {
        let isError = false
        let message = ''

        try {
            const formData = new FormData()

            const newFileName = `${modalData[0].gateEntryId}.${file.name}`

            const renamedFile = new File([file], newFileName, { type: file.type })

            const docTypeMap = {
                invoiceDoc: 'files[invoice_doc]',
                poNo: 'files[pono_doc]',
                lrDoc: 'files[lr_doc]',
                ewayBill: 'files[ewaybill_doc]'
            }

            formData.append(docTypeMap[docKey], renamedFile)

            formData.append('id', modalData[0].gateEntryId)

            await uploadGateEntryDocuments(formData).unwrap()

            message = `${docLabel} uploaded successfully!`

            // Refresh the documents after upload
            if (modalData && modalData[0].gateEntryId) {
                const fetchDocs = formatDocumentData(modalData[0].gateEntryId)
                const updatedDocs = await fetchDocs()
                setModalData(updatedDocs)
                setRefetch()
            }
        } catch (error) {
            isError = true
            message = error?.data?.message || error?.message || `Failed to upload ${docLabel}.`
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success', icon: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    function getTemplate() {
        return getMarkAsCloseTemplate(`?id=${config.markClose}`).unwrap()
    }
    const handleFileUpload = async file => {
        let isError = false
        let message = ''
        try {
            const formData = new FormData()
            formData.append('excel', file)
            formData.append('id', config.markClose)
            const response = await uploadMarkAsCloseTemplate(formData).unwrap()
            message = response.message
            setRefetch()
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
                    alert: { color: isError ? 'error' : 'success', icon: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    // open bulk import modal
    const handleBulkImport = id => {
        setConfig(prev => ({ ...prev, markClose: id, markRelease: 0, geCreatedAt: '' }))
    }

    useEffect(() => {
        setRefetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname])

    useEffect(() => {
        if (config.markClose) {
            dispatch(
                openModal({
                    content: (
                        <ImportFileModal
                            // eslint-disable-next-line react/jsx-no-bind
                            handleGetTemplate={getTemplate}
                            handleFileSubmission={handleFileUpload}
                            // sampleFilePath='/csv/inbound/gateEntryStatus.csv'
                            fileType={{
                                'text/csv': ['.csv'],
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                            }}
                        />
                    ),
                    title: <Typography variant='h3'>Mark As Completed</Typography>
                })
            )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config])

    const markVehicleRelease = async () => {
        let message = ''
        let isError = false
        try {
            const response = await markVehicleReleaseReq({
                id: config.markRelease,
                release_date: config.vehicleReleaseDate
            }).unwrap()

            message = response.message
            setConfig(prev => ({
                ...prev,
                markRelease: 0,
                geCreatedAt: ''
            }))
            setRefetch()
            dispatch(closeModal())
            setActiveModal(null)
        } catch (error) {
            isError = true
            message = error.data.message || error.message
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

    const closeHandler = (id, row) => {
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
        setConfig(prev => ({
            ...prev,
            markClose: 0,
            markRelease: id,
            geCreatedAt: row.created_at || ''
        }))
        setActiveModal('MarkReleasedPopup')
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

    const handlePrint = async id => {
        let message = ''
        let isError = false
        try {
            await printGateEntryIds({ gate_entry_id: id }).unwrap()
            message = 'success, IDs printed !'
        } catch (error) {
            isError = true
            message = error?.data.message || error?.message || 'unable to print IDs!'
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

    // Define context menu options
    const menuOptions = [
        {
            label: 'Mark as Close',
            icon: <PublishedWithChanges fontSize='small' sx={{ color: 'error.main' }} />,
            onClick: row => handleBulkImport(row.id),
            condition: row => row?.remaining,
            tooltip: 'Mark as close'
        },
        {
            label: 'Print Box IDs',
            icon: <Print fontSize='small' />,
            onClick: row => handlePrint(row.id),
            tooltip: 'Print/Reprint Box IDs',
            iconStyle: { color: 'primary.800' }
        },
        {
            label: 'Release Vehicle',
            icon: <TruckIcon />,
            onClick: row => closeHandler(row.id, row),
            condition: row => !row?.release_date,
            tooltip: 'Mark vehicle released',
            iconStyle: { color: 'green' }
        },
        {
            label: 'Edit Gate Entry',
            icon: <Edit fontSize='small' sx={{ fill: '#60498a' }} />,
            onClick: row => navigate(`/inbound/gateEntry/edit/${row?.id}`),
            tooltip: 'Edit',
            iconStyle: { color: 'success.main' }
        }
    ]

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd()
        }
    })

    return (
        <ContextMenuProvider>
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
                            <Typography variant='h3'>All Gate Entries</Typography>
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
                            <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAll} />
                            <CustomButton variant='clickable' color='primary' onClick={handleAdd}>
                                Add New
                                <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                            </CustomButton>
                            {/* render action column can be made dynamic based on user authorization  */}
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>
                    <MobileTableToolbar
                        title='All Gate Entries'
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAll}
                        setClearAllFilters={setClearAllFilters}
                        handleAdd={handleAdd}
                    />
                    <DataTable
                        data={gEData}
                        columns={columns}
                        addExcelQuery={excelHandler}
                        reqKey='gateEntryDataTableLKey'
                        queryHandler={queryHandler}
                        totalRecords={recordCount}
                        isCheckbox={false}
                        refetch={refetch}
                        renderAction={row => (
                            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                {row?.remaining ? (
                                    <IconButton
                                        sx={{ color: 'error.main' }}
                                        size='small'
                                        aria-label='close row'
                                        onClick={() => handleBulkImport(row.id)}
                                    >
                                        <Tooltip title='Mark as close'>
                                            <PublishedWithChanges fontSize='8px' />
                                        </Tooltip>
                                    </IconButton>
                                ) : (
                                    <IconButton
                                        size='small'
                                        sx={{ cursor: 'default' }}
                                        disableFocusRipple
                                        disableRipple
                                    >
                                        <Tooltip title='Closed'>
                                            <PublishedWithChanges fontSize='8px' />
                                        </Tooltip>
                                    </IconButton>
                                )}
                                <Tooltip title='Print/Reprint Box IDs'>
                                    <span>
                                        {loading[`printGateEntryIdsLKey${row?.id}`] ? (
                                            <CircularProgress
                                                size='14px'
                                                color='success'
                                                sx={{ ml: 0.5, mr: 1, mt: '5px' }}
                                            />
                                        ) : (
                                            <IconButton
                                                sx={{
                                                    color: 'primary.800'
                                                }}
                                                size='small'
                                                aria-label='print-ids'
                                                onClick={() => handlePrint(row.id)}
                                            >
                                                <Print fontSize='8px' />
                                            </IconButton>
                                        )}
                                    </span>
                                </Tooltip>
                                {!row?.release_date ? (
                                    <Tooltip title='Mark vehicle released'>
                                        <IconButton
                                            sx={{ color: 'green' }}
                                            size='small'
                                            onClick={() => closeHandler(row.id, row)}
                                        >
                                            <TruckIcon />
                                        </IconButton>
                                    </Tooltip>
                                ) : (
                                    <Tooltip title='Already released'>
                                        <IconButton
                                            sx={{ cursor: 'default' }}
                                            disableFocusRipple
                                            disableRipple
                                            size='small'
                                        >
                                            <TruckIcon fill='#2229' />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                <IconButton
                                    sx={{ color: 'success.main' }}
                                    size='small'
                                    aria-label='edit row'
                                    onClick={() => navigate(`/inbound/gateEntry/edit/${row?.id}`)}
                                >
                                    <Tooltip title='Edit'>
                                        <Edit fontSize='8px' sx={{ fill: '#60498a' }} />
                                    </Tooltip>
                                </IconButton>
                            </Box>
                        )}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        isLoading={gateEntryDataTableLKey}
                        enableContextMenu
                        showStripes={false}
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                {modalType === 'global_modal' && (
                    <CustomModal open={isOpen} handleClose={() => dispatch(closeModal())} />
                )}
                {/* confirm before close */}
                {activeModal === 'MarkReleasedPopup' && (
                    <ConfirmModal
                        title='Confirmation Before Releasing'
                        message='Are you sure you want to mark vehicle released ?'
                        childComponent={
                            <CustomDateTimeInput
                                name='markRelease'
                                label='Vehicle Release Date'
                                // outsideLabel='Vehicle Release Date'
                                // placeholder='Vehicle Release Date'
                                handleChange={value => setConfig(prev => ({ ...prev, vehicleReleaseDate: value }))}
                                minDate={config.geCreatedAt}
                                maxDate={getLocalDateTime()}
                                customSx={customSx}
                            />
                        }
                        icon='alert'
                        confirmText='Yes'
                        customStyle={{ width: { xs: '300px', sm: '456px' } }}
                        isLoading={markVehicleReleaseLKey}
                        onConfirm={async () => {
                            await markVehicleRelease()
                            // dispatch(
                            //     openSnackbar({
                            //         open: true,
                            //         message: 'Vehicle marked as released successfully!',
                            //         variant: 'alert',
                            //         alert: { color: 'success' },
                            //         anchorOrigin: { vertical: 'top', horizontal: 'center' }
                            //     })
                            // )
                            // dispatch(closeModal())
                            // setActiveModal(null)
                        }}
                    />
                )}
                <GlobalModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} closeOnBackdropClick>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            maxWidth: '90wh',
                            maxHeight: '70vh',
                            backgroundColor: '#fff',
                            boxShadow: 24,
                            p: 1,
                            borderRadius: '8px',
                            outline: 'none',
                            overflowY: { sm: 'hidden', xs: 'auto' },
                            overflowX: 'hidden'
                        }}
                    >
                        <CustomButton
                            onClick={() => setIsModalOpen(false)}
                            customStyles={{
                                mt: 2,
                                position: 'absolute',
                                top: '-15px',
                                right: '-14px',
                                '&:hover': {
                                    backgroundColor: 'transparent', // Keep the background color the same on hover
                                    boxShadow: 'none' // Remove any shadow effect
                                },
                                '&:focus': {
                                    backgroundColor: 'transparent', // Keep the background color the same on hover
                                    boxShadow: 'none' // Remove any shadow effect
                                }
                            }}
                            variant='text'
                            disableRipple
                        >
                            <Cancel />
                        </CustomButton>
                        <FileUploadModal modalData={modalData} onFileUpload={handleDocumentUpload} />
                    </Box>
                </GlobalModal>
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename={`GateEntry_Export_${new Date()}.csv`}
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}
/* eslint-disable */
export default GateEntryTable
