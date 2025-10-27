/* eslint-disable react/no-array-index-key */
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import {
    CircularProgress,
    FormControlLabel,
    IconButton,
    styled,
    Tooltip,
    tooltipClasses,
    Typography
} from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Add, ContentCopy, Delete, Edit } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import CustomModal from '@core/components/extended/CustomModal'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'
import { CSVLink } from 'react-csv'

// ** import from redux
import { closeModal, openModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'

// ** import utils
import { INBOUND_STATUS, isExcelQuery, TOGGLE_ALL } from '@/constants'

import { DeleteAnimIcon } from '@/assets/icons/DeleteAnimIcon'
import CustomSwitch from '@/core/components/extended/CustomSwitch'
// ** import dummy data
import {
    dataTable,
    useDeactivatePickWaveMutation,
    useDeletePickWaveMutation
} from '@/app/store/slices/api/pickWaveSlice'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import useUiAccess from '@/hooks/useUiAccess'
import { headers } from './helper'

// eslint-disable-next-line react/jsx-props-no-spreading
const CustomTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)(
    ({ theme }) => ({
        [`& .${tooltipClasses.tooltip}`]: {
            backgroundColor: '#fff', // Tooltip background color
            border: '1px solid #ddd', // Optional border
            borderRadius: '8px', // Rounded corners
            boxShadow: theme.shadows[2], // Subtle shadow
            padding: '8px', // Padding inside the tooltip
            minWidth: '100px'
        },
        [`& .${tooltipClasses.arrow}`]: {
            color: '#fff' // Arrow color to match the background
        }
    })
)

// const staticQuery =
function ManageWavesTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const hasCreateAccess = useUiAccess('create')

    const csvLinkRef = useRef(null)
    const isOpen = useSelector(state => state.modal.open)
    const modalType = useSelector(state => state.modal.type)

    const [deactivatePickWave] = useDeactivatePickWaveMutation()
    const [deletePickWave] = useDeletePickWaveMutation()

    // eslint-disable-next-line no-unused-vars
    const [config, setConfig] = useState({
        markClose: 0,
        markRelease: 0,
        vehicleReleaseDate: '',
        geCreatedAt: ''
    })
    const [columns, setColumns] = useState([...headers])
    const [excelHandler, setExcelHandler] = useState(false)
    const [currentQuery, setCurrentQuery] = useState('?start=0&length=10')
    const [rows, setRows] = useState([])
    const loading = useSelector(state => state.loading)
    const { dataTableLKey, deletePickWaveLKey } = useSelector(state => state.loading)

    // eslint-disable-next-line no-unused-vars
    const [tableData, setTableData] = useState([])
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])

    const [recordCount, setRecordCount] = useState(0)
    // const [isModalOpen, setIsModalOpen] = useState(false)
    // const [modalData, setModalData] = useState(null)
    const [activeModal, setActiveModal] = useState(null)
    // const [method, setMethod] = useState('form')
    const clearSelectionRef = useRef(null)
    const [selectedRow, setSelectedRow] = useState([]) // selected checkbox
    // const [pickListId, setPickListId] = useState('')
    // excel export all handler
    const handleExportAll = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    // excel current view handler
    const handleCurrentView = () => {
        if (!tableData.length) return

        setCsvHeaders(columns.filter(item => item.key !== 'id'))
        setCsvData(
            tableData.map(item => {
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

    // Function to copy text to the clipboard with line breaks
    const copyToClipboard = text => {
        const formattedText = text.split(', ').join('\n') // Split by ', ' and join with line breaks
        navigator.clipboard.writeText(formattedText).then(() => {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'List copied!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        })
    }

    // Function to render array with tooltip when more than 2 elements,
    // otherwise display plain text
    const renderArrayWithTooltip = array => {
        if (!Array.isArray(array) || array.length === 0) return typeof array === 'string' && array ? array : '-'

        if (array.length === 1) {
            const text = array[0]
            return (
                <Typography
                    variant='subtitle2'
                    sx={{
                        color: 'text.dark',
                        fontWeight: '500',
                        fontSize: '12px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {text}
                </Typography>
            )
        }
        const displayText = array.join(', ')
        return (
            <CustomTooltip
                title={
                    <Box sx={{ position: 'relative', paddingTop: '4px' }}>
                        {/* Header row with title "Customers" and copy icon */}
                        <Box
                            sx={{
                                position: 'absolute',
                                right: '-8px',
                                top: '-8px'
                            }}
                        >
                            <IconButton
                                size='small'
                                onClick={e => {
                                    e.stopPropagation()
                                    copyToClipboard(displayText)
                                }}
                            >
                                <ContentCopy
                                    sx={{
                                        fontSize: '16px'
                                    }}
                                />
                            </IconButton>
                        </Box>
                        {array.map((item, index) => (
                            <Typography
                                key={index}
                                sx={{
                                    color: 'text.dark',
                                    fontWeight: '500',
                                    fontSize: '12px'
                                }}
                            >
                                {item}
                            </Typography>
                        ))}
                    </Box>
                }
                arrow
            >
                <Typography
                    sx={{
                        color: 'text.dark',
                        fontWeight: '500',
                        fontSize: '12px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {displayText}
                </Typography>
            </CustomTooltip>
        )
    }

    // query handler
    const queryHandler = async query => {
        setCurrentQuery(query)
        const { data: response } = await dispatch(dataTable.initiate(query, false))
        if (isExcelQuery(query)) return
        setRows(response?.data || [])
        setRecordCount(response?.recordsTotal || 0)
        setRows(
            response?.data?.map(loc => ({
                id: loc?.id || '',
                no: loc?.no ?? '',
                original_active: loc?.active || '',
                active: (
                    <ArrowButton
                        label={
                            <Typography variant='h6' sx={{ color: '#fff', fontSize: '12px' }}>
                                {loc?.active ? 'Active' : 'Disabled'}
                            </Typography>
                        }
                        variant={{ 1: 'green', 0: 'gray' }[loc?.active] ?? 'gray'}
                        nonClickable
                        customStyles={{ width: '100%' }}
                    />
                ),
                created_by: loc?.created_by ?? '-',
                created_at: loc?.created_at ?? '-',
                order_type: renderArrayWithTooltip(loc?.order_type) ?? '-',
                shipment_mode: renderArrayWithTooltip(loc?.shipment_mode) ?? '-',
                pick_type: loc?.pick_type ?? '-',
                channel_code: renderArrayWithTooltip(loc?.channel_code) ?? '-',
                batch_type: loc?.batch_type ?? '-',
                customer_no: renderArrayWithTooltip(loc?.customer_no) ?? '-',
                courier_code: renderArrayWithTooltip(loc?.courier_code) ?? '-',
                cut_off_time: loc?.cut_off_time ?? '-',
                scheduled_time: loc?.scheduled_time ?? '-'
            })) || []
        )
    }

    const handleAdd = () => {
        navigate('/outbound/pickList/setup/manageWaves/create')
    }

    const handleDeactivate = async id => {
        if (!id) return
        let isError = false
        let message
        try {
            await deactivatePickWave(id).unwrap()
            queryHandler(currentQuery)
            message = 'Wave enabled successfully!'
        } catch (error) {
            isError = true
            message = 'unable to update status!'
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'info', icon: isError ? 'error' : 'info' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    const handleDelete = async () => {
        if (!selectedRow.length) return
        let message
        let isError = false
        try {
            await deletePickWave(selectedRow[0].id).unwrap()
            setSelectedRow([])
            message = 'Wave deleted successfully'
            queryHandler(currentQuery)
            dispatch(closeModal())
        } catch (error) {
            isError = true
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'info', icon: isError ? 'error' : 'info' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
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

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd()
        }
    })

    useDocumentTitle('Picking Waves | Pick List')

    return (
        <MainCard content={false}>
            <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: '2px' }}>
                {/* Add your dummy buttons here */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant='h3'>Picking Waves</Typography>
                    </Box>
                    <Stack direction='row' spacing={2} alignItems='center' paddingY='12px'>
                        {selectedRow.length > 0 && (
                            <CustomButton
                                variant='outlined'
                                shouldAnimate
                                endIcon={<DeleteAnimIcon stroke='#f44336' />}
                                customStyles={{ borderColor: 'primary.main' }}
                                onClick={() => {
                                    setActiveModal('deleteWave')
                                    dispatch(
                                        openModal({
                                            type: 'confirm_modal'
                                        })
                                    )
                                }}
                            >
                                Delete
                            </CustomButton>
                        )}
                        <CustomButton variant='clickable' color='primary' onClick={handleAdd}>
                            Add New
                            <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                        </CustomButton>
                        <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAll} />
                        {/* render action column can be made dynamic based on user authorization  */}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                    </Stack>
                </Box>
                <DataTable
                    data={rows}
                    columns={columns}
                    addExcelQuery={excelHandler}
                    queryHandler={queryHandler}
                    reqKey='dataTableLKey'
                    totalRecords={recordCount}
                    isCheckbox
                    renderAction={row => (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-around',
                                alignItems: 'center',
                                paddingX: '8px'
                            }}
                        >
                            {/* {row?.statusText !== 'SHIPPED' ? (
                                
                            ) : (
                                <IconButton size='small' sx={{ cursor: 'default' }} disableFocusRipple disableRipple>
                                    <Tooltip title="SHIPPED order can't be edited">
                                        <Edit sx={{ fontSize: '1rem' }} />
                                    </Tooltip>
                                </IconButton>
                            )} */}
                            <IconButton
                                sx={{
                                    '&.Mui-disabled': {
                                        opacity: 0.3
                                    },
                                    '&:hover': {
                                        scale: 1.1
                                    }
                                }}
                                size='small'
                                aria-label='edit row'
                                onClick={() => {
                                    navigate(`/outbound/pickList/setup/manageWaves/edit/${row.id}`)
                                }}
                            >
                                <Tooltip title='Edit'>
                                    <Edit
                                        sx={{
                                            fill: '#60498a',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </Tooltip>
                            </IconButton>

                            <Tooltip title='Update Status'>
                                {loading[`deactivatePickWaveDL${row?.id}`] ? (
                                    <CircularProgress size='14px' color='success' sx={{ ml: 1, mr: 1 }} />
                                ) : (
                                    <FormControlLabel
                                        sx={{ margin: '0px' }}
                                        control={
                                            <CustomSwitch
                                                isChecked={!!row.original_active}
                                                // eslint-disable-next-line no-unused-vars
                                                handleChange={e => handleDeactivate(row.id)}
                                            />
                                        }
                                    />
                                )}
                            </Tooltip>
                            <Tooltip title='Delete Wave'>
                                <IconButton
                                    size='small'
                                    color='error'
                                    sx={{
                                        '&.Mui-disabled': {
                                            opacity: 0.3
                                        },
                                        '&:hover': {
                                            scale: 1.1
                                        }
                                    }}
                                    aria-label='delete row'
                                    onClick={() => {
                                        setSelectedRow([{ ...row }])
                                        setActiveModal('deleteWave')
                                        dispatch(
                                            openModal({
                                                type: 'confirm_modal'
                                            })
                                        )
                                    }}
                                >
                                    <Delete sx={{ fontSize: '1rem' }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                    setSelectedRow={setSelectedRow}
                    isLoading={dataTableLKey}
                    clearSelectionRef={clearSelectionRef}
                />
            </Box>
            {modalType === 'global_modal' && <CustomModal open={isOpen} handleClose={() => dispatch(closeModal())} />}
            {/* confirm before bulk actions */}
            {modalType === 'confirm_modal' &&
                (activeModal === 'deleteWave' ? (
                    <ConfirmModal
                        title='Delete Wave'
                        message={`Are you sure you want to delete ${selectedRow?.length > 1 ? `${selectedRow.length} waves` : 'this wave'}?`}
                        icon='warning'
                        confirmText='Delete Wave'
                        isLoading={deletePickWaveLKey}
                        customStyle={{ width: { xs: '320px', sm: '480px' } }}
                        onConfirm={() => {
                            if (clearSelectionRef?.current) {
                                clearSelectionRef?.current()
                            }
                            handleDelete()
                        }}
                    />
                ) : null)}
            <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={`Pick_Wave_${new Date()}.csv`}
                ref={csvLinkRef}
                style={{ display: 'none' }}
            />
        </MainCard>
    )
}

export default ManageWavesTable
