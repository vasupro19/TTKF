/* eslint-disable react/no-array-index-key */

import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { Divider, IconButton, Paper, styled, Tooltip, tooltipClasses, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import {
    Cancel,
    ContentCopy,
    Edit,
    FilterAltOff,
    GroupAdd,
    Info,
    PersonRemove,
    QrCodeScanner,
    TextFields,
    Upload
} from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import CustomModal from '@core/components/extended/CustomModal'
import ImportFileModal from '@core/components/modals/ImportFileModal'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'
import GlobalModal from '@/core/components/modals/GlobalModal'
import DropdownMenu from '@/core/components/DropdownMenu'
import CustomLink from '@/core/components/extended/CustomLink'
import SearchFilterDropdown from '@/core/components/SearchFilterDropdown'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'
import TabsWithSlide from '@/core/components/TabsWithSlide'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'

import { CSVLink } from 'react-csv'
import CerebrumBrain from '@/assets/images/cerebrumBrain.jpg'

// ** import from redux
import { closeModal, openModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'

import { isExcelQuery, OUTBOUND_STATUS, TOGGLE_ALL } from '@/constants'

import { QRCode } from 'react-qrcode-logo'

// ** import dummy data
// import { dataTable, useAssignPickMutation, useUnAssignPickMutation } from '@/app/store/slices/api/pickSlice'
import { getPickers } from '@/app/store/slices/api/commonSlice'
import {
    dataTable,
    useAssignPickMutation,
    useUnAssignPickMutation,
    useGetPickBulkCreateTemplateMutation,
    useUploadPickItemTemplateMutation
} from '@/app/store/slices/api/pickListSlice'
import useUiAccess from '@/hooks/useUiAccess'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { headers } from './helper'

// eslint-disable-next-line react/jsx-props-no-spreading
const CustomTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)(
    ({ theme }) => ({
        [`& .${tooltipClasses.tooltip}`]: {
            backgroundColor: '#fff', // Tooltip background color
            border: '1px solid #ddd', // Optional border
            borderRadius: '8px', // Rounded corners
            boxShadow: theme.shadows[2], // Subtle shadow
            padding: '10px', // Padding inside the tooltip
            minWidth: '120px'
        },
        [`& .${tooltipClasses.arrow}`]: {
            color: '#fff' // Arrow color to match the background
        }
    })
)
// const staticQuery =
function PickListTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const hasCreateAccess = useUiAccess('create')

    const dropdownRef = useRef()

    const csvLinkRef = useRef(null)

    const [assignPick] = useAssignPickMutation()
    const [unAssignPick] = useUnAssignPickMutation()
    const isOpen = useSelector(state => state.modal.open)
    const modalType = useSelector(state => state.modal.type)
    const { dataTableLKey, unAssignPickLKey } = useSelector(state => state.loading)

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

    const [tableData, setTableData] = useState([])
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])

    const [recordCount, setRecordCount] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeModal, setActiveModal] = useState(null)
    const [tabVal, setTabVal] = useState(0)
    const clearSelectionRef = useRef(null)
    const [selectedRow, setSelectedRow] = useState([])
    const [pickListId, setPickListId] = useState('')
    const [pickers, setPickers] = useState([])
    const [totalFetchedRec, setTotalFetchedRec] = useState([])
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [getPickBulkCreateTemplate] = useGetPickBulkCreateTemplateMutation()
    const [uploadPickItemTemplate] = useUploadPickItemTemplateMutation()

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
                    status: OUTBOUND_STATUS[tempItem.original_status].label,
                    pending_quantity: tempItem.original_pending_quantity,
                    channel_codes: tempItem.original_channel_codes,
                    ref_no: tempItem.original_ref_no
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

    const createRow = (loc, currentTab = 0) => ({
        id: loc?.id,
        ref_no: renderArrayWithTooltip(loc?.ref_no) ?? '-',
        original_ref_no: loc?.ref_no,
        no: (
            <CustomLink
                href={`/outbound/pickList/view/${loc?.id}`}
                state={{ pickListStatus: currentTab === 0 ? 'Open' : 'Assigned' }}
                icon
            >
                <Tooltip title='View Details' placement='bottom' arrow>
                    {loc?.no}
                </Tooltip>
            </CustomLink>
        ),
        original_no: loc?.no,
        created_at: loc?.created_at ?? '',
        status: (
            <ArrowButton
                label={
                    <Typography variant='h6' sx={{ color: '#fff', fontSize: '12px' }}>
                        {OUTBOUND_STATUS[loc?.status].label}
                    </Typography>
                }
                variant={
                    {
                        Open: 'purple',
                        'In Progress': 'blue',
                        'Part Picked': 'gray',
                        Complete: 'green',
                        Assigned: 'orange',
                        Cancelled: 'red'
                    }[currentTab === 0 ? 'Open' : OUTBOUND_STATUS[loc?.status].color] ??
                    (OUTBOUND_STATUS[loc?.status].color || 'gray')
                }
                nonClickable
                customStyles={{ width: '100%' }}
            />
        ),
        original_status: loc?.status,
        pick_type: (loc?.pick_type === 'DISCRETE' ? 'ORDER' : loc?.pick_type) ?? '-',
        channel_codes: renderArrayWithTooltip(loc?.channel_codes) ?? '-',
        original_channel_codes: loc?.channel_codes,
        quantity: loc?.quantity ?? 0,
        picked_quantity: loc?.picked_quantity || '-',
        pending_quantity: (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center'
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
        original_pending_quantity: loc?.pending_quantity,
        order_count: loc?.order_count || 0,
        created_by: loc?.created_by || '-'
        // created_at: loc?.created_at || '-',
        // statusText: tabVal === 0 ? 'Open' : loc?.status || '-', // TODO: this should not be hard coded
        // pickListIDVal: loc?.pickListID
    })

    // query handler
    const queryHandler = async query => {
        setCurrentQuery(query)
        const { data: response } = await dispatch(dataTable.initiate(query, false))
        if (isExcelQuery(query)) return
        setRecordCount(response.recordsTotal || 0)
        setTableData(
            response?.data
                ?.map(loc => {
                    if (loc?.status && loc.status <= 5 && tabVal === 0) return createRow(loc)
                    if (loc?.status && loc.status > 5 && tabVal === 1) return createRow(loc)
                    return false
                })
                ?.filter(Boolean) || []
        )
        setTotalFetchedRec(response?.data || [])
    }

    const handleAdd = () => {
        navigate('/outbound/pickList/create')
    }

    const getTemplate = async () => getPickBulkCreateTemplate().unwrap()

    const handleUpload = async (file, fileAction, selectedVal) => {
        try {
            const formData = new FormData()
            formData.append('excel', file)

            if (selectedVal) {
                formData.append('pick_method', selectedVal.value)
            }

            const response = await uploadPickItemTemplate(formData).unwrap()

            dispatch(
                openSnackbar({
                    open: true,
                    message: response.message || 'Pick Created successfully',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error.message || 'Failed to upload',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            // return Promise.reject(error)
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
                        sampleFilePath='/csv/outbound/pickList.csv'
                        fileType={{
                            'text/csv': ['.csv'],
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                        handleFileSubmission={(file, fileAction, selectedVal) =>
                            handleUpload(file, fileAction, selectedVal)
                        }
                        showSelectField
                        fieldConfig={{
                            name: 'pickType',
                            label: 'Pick Type*',
                            options: [
                                { id: 1, label: 'Order Wise', value: 'DISCRETE' },
                                { id: 2, label: 'Batch Wise', value: 'BATCH' }
                            ]
                        }}
                    />
                ),
                title: <Typography variant='h3'>Create Pick List</Typography>
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

    const handleTabChange = (event, newValue) => {
        setTabVal(newValue)
        setTableData(
            () =>
                totalFetchedRec
                    ?.map(loc => {
                        if (loc?.status && loc.status <= 5 && newValue === 0) return createRow(loc, newValue)
                        if (loc?.status && loc.status > 5 && newValue === 1) return createRow(loc, newValue)
                        return false
                    })
                    ?.filter(Boolean) || []
        )
        setSelectedRow([])
        if (clearSelectionRef?.current) {
            clearSelectionRef?.current()
        }
    }

    const handleAssign = async selectedUsers => {
        if (!selectedUsers || selectedUsers.length <= 0) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please select at least one user',
                    variant: 'alert',
                    alert: { color: 'warning', icon: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return
        }
        const users = selectedUsers.map(item => item.value)

        let isError = false
        let message

        try {
            await assignPick({ user_ids: users, pick_ids: selectedRow }).unwrap()
            message = 'Assigned successfully'
        } catch (error) {
            isError = true
            message = error?.message || error?.data?.message || 'unable to assign pick!'
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
            if (!isError) {
                // Clear the selected options using the exposed ref method
                dropdownRef?.current?.clearSelectedOptions()
                if (clearSelectionRef?.current) {
                    clearSelectionRef?.current()
                }
                setSelectedRow([])
                queryHandler(currentQuery)
            }
        }
    }

    const handleUnAssign = async () => {
        if (!selectedRow || selectedRow.length <= 0) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please select at least one pick',
                    variant: 'alert',
                    alert: { color: 'warning', icon: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return
        }
        let isError = false
        let message

        try {
            await unAssignPick({ pick_id: selectedRow[0].id }).unwrap()
            message = 'All pickers unassigned from the pick list'
        } catch (error) {
            isError = true
            message = error?.message || error?.data?.message || 'unable to un assign pick!'
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
            if (!isError) {
                if (clearSelectionRef?.current) {
                    clearSelectionRef?.current()
                }
                setSelectedRow([])
                dispatch(closeModal())
                queryHandler(currentQuery)
            }
        }
    }
    const menuOptions = useMemo(
        () => [
            {
                label: 'Edit',
                icon: <Edit sx={{ fill: '#60498a', fontSize: '1rem' }} />,
                onClick: row =>
                    navigate(`/outbound/pickList/edit/${row.pickListIDVal}`, {
                        state: { pickListStatus: tabVal === 0 ? 'Open' : 'Assigned' }
                    }),
                condition: row => row?.statusText !== 'Complete' && row?.statusText !== 'Cancelled'
            },
            {
                label: 'Assign',
                icon: <QrCodeScanner sx={{ fill: '#1976d2', fontSize: '1rem' }} />,
                onClick: row => {
                    setPickListId(row?.pickListIDVal)
                    setIsModalOpen(true)
                },
                condition: row => row?.statusText !== 'Complete' && row?.statusText !== 'Cancelled'
            },
            {
                label: 'Unassign',
                icon: <PersonRemove sx={{ fontSize: '1rem', color: 'error.main' }} />,
                onClick: row => {
                    setSelectedRow([{ ...row }])
                    setActiveModal('unassignPicklist')
                    dispatch(openModal({ type: 'confirm_modal' }))
                },
                condition: row => tabVal === 1 && row?.statusText !== 'Complete' && row?.statusText !== 'Cancelled'
            }
        ],
        [tabVal, navigate, setPickListId, setIsModalOpen, setSelectedRow, setActiveModal, dispatch]
    )
    useEffect(() => {
        ;(async () => {
            try {
                const { data } = await dispatch(getPickers.initiate())
                setPickers(data.data || [])
            } catch (error) {
                // eslint-disable-next-line no-console
                console.log('error ', error)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            gap: 2
                        }}
                    >
                        {/* Left Section: Title */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                paddingTop: { xs: 2, sm: 0 },
                                width: '100%'
                            }}
                        >
                            <Typography variant='h3'>All Picklists</Typography>
                            <TabsWithSlide
                                labels={[
                                    `Open (${tabVal === 0 ? tableData?.length || 0 : totalFetchedRec.length - tableData.length})`,
                                    `Assigned (${tabVal === 1 ? tableData?.length || 0 : totalFetchedRec.length - tableData.length})`
                                ]}
                                tabIndex={tabVal}
                                onTabChange={handleTabChange}
                            />
                        </Box>

                        {/* Right Section: Controls */}
                        <Stack
                            direction='row'
                            spacing={1}
                            alignItems='center'
                            sx={{
                                flexGrow: 1,
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'flex-end',
                                gap: 1,
                                width: '100%',
                                padding: '12px'
                            }}
                        >
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
                            {/* Search Dropdown */}
                            {selectedRow?.length > 0 && (
                                <Box>
                                    <SearchFilterDropdown
                                        ref={dropdownRef}
                                        buttonText='Assign Picker'
                                        optionsProp={pickers}
                                        onApply={handleAssign}
                                        isSearchable
                                        applyButtonText='Assign'
                                        clearButtonText='Cancel'
                                        isClearButton
                                        isApplyButton
                                        singleSelect={false}
                                        customButtonSx={{
                                            padding: '2px',
                                            fontSize: '12px'
                                        }}
                                        startIcon={<GroupAdd />}
                                    />
                                </Box>
                            )}

                            {/* Export Buttons */}
                            <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAll} />

                            {/* Add New Dropdown */}
                            <DropdownMenu
                                buttonText='Add New'
                                options={dropdownOptions}
                                onOptionClick={handleOptionClick}
                            />

                            {/* Toggle Columns */}
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>
                    {/* show toolbar in mobile */}
                    <MobileTableToolbar
                        title={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant='h3'>Picklists</Typography>
                                <TabsWithSlide
                                    labels={[
                                        `Open (${tabVal === 0 ? tableData?.length || 0 : totalFetchedRec.length - tableData.length})`,
                                        `Assigned (${tabVal === 1 ? tableData?.length || 0 : totalFetchedRec.length - tableData.length})`
                                    ]}
                                    tabIndex={tabVal}
                                    onTabChange={handleTabChange}
                                />
                            </Box>
                        }
                        rightColumnElement={
                            selectedRow?.length > 0 && (
                                <Box>
                                    <SearchFilterDropdown
                                        ref={dropdownRef}
                                        buttonText=''
                                        optionsProp={pickers}
                                        onApply={handleAssign}
                                        isSearchable
                                        applyButtonText='Assign'
                                        clearButtonText='Cancel'
                                        isClearButton
                                        isApplyButton
                                        singleSelect={false}
                                        customButtonSx={{
                                            padding: '2px',
                                            fontSize: '12px'
                                        }}
                                        startIcon={
                                            <GroupAdd
                                                sx={{
                                                    '&.MuiButton-startIcon': { marginRight: 0 }
                                                }}
                                            />
                                        }
                                        // eslint-disable-next-line react/jsx-no-useless-fragment
                                        endIcon={null}
                                        buttonSx={{
                                            border: '1px solid',
                                            borderColor: 'primary.main',
                                            minWidth: '2rem',
                                            padding: '7px 4px',
                                            borderRadius: '10px',
                                            '& .MuiButton-startIcon': {
                                                marginRight: '0px !important'
                                            }
                                        }}
                                    />
                                </Box>
                            )
                        }
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAll}
                        setClearAllFilters={setClearAllFilters}
                        handleAdd={() => {
                            setIsModalOpen(true)
                        }}
                    />

                    <DataTable
                        data={tableData}
                        columns={columns}
                        addExcelQuery={excelHandler}
                        queryHandler={queryHandler}
                        reqKey='dataTableLKey'
                        totalRecords={recordCount}
                        isCheckbox={tabVal === 0}
                        renderAction={row => (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-around',
                                    alignItems: 'center',
                                    paddingX: '8px'
                                }}
                            >
                                {row?.statusText !== 'Complete' && row?.statusText !== 'Cancelled' ? (
                                    <IconButton
                                        sx={{
                                            color: 'success.main',
                                            '&:hover': {
                                                scale: 1.1
                                            }
                                        }}
                                        size='small'
                                        aria-label='edit row'
                                        onClick={() =>
                                            navigate(`/outbound/pickList/edit/${row.id}`, {
                                                state: { pickListStatus: tabVal === 0 ? 'Open' : 'Assigned' }
                                            })
                                        }
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
                                ) : (
                                    <IconButton
                                        size='small'
                                        sx={{ cursor: 'default' }}
                                        disableFocusRipple
                                        disableRipple
                                    >
                                        <Tooltip title='Action not available'>
                                            <Edit sx={{ fontSize: '1rem' }} />
                                        </Tooltip>
                                    </IconButton>
                                )}
                                {row?.statusText !== 'Complete' && row?.statusText !== 'Cancelled' ? (
                                    <IconButton
                                        sx={{
                                            color: 'info.main',
                                            '&:hover': {
                                                scale: 1.1
                                            }
                                        }}
                                        size='small'
                                        aria-label='scan QR code'
                                        onClick={() => {
                                            setPickListId(row?.pickListIDVal)
                                            setIsModalOpen(true)
                                        }}
                                    >
                                        <Tooltip title='Assign'>
                                            <QrCodeScanner
                                                sx={{
                                                    fill: '#1976d2', // Blue color
                                                    fontSize: '1rem'
                                                }}
                                            />
                                        </Tooltip>
                                    </IconButton>
                                ) : (
                                    <Tooltip title='Action not available'>
                                        <IconButton
                                            aria-label='discard row'
                                            sx={{ cursor: 'default' }}
                                            disableFocusRipple
                                            disableRipple
                                            size='small'
                                        >
                                            <QrCodeScanner
                                                sx={{
                                                    fontSize: '1rem'
                                                }}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {/* {row?.statusText !== 'Cancelled' ? (
                                <IconButton
                                    sx={{
                                        color: 'primary.main',
                                        '&:hover': {
                                            color: 'primary.dark',
                                            scale: 1.1
                                        }
                                    }}
                                    size='small'
                                    aria-label='print order'
                                >
                                    <Tooltip title='Print'>
                                        <Print
                                            sx={{
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </Tooltip>
                                </IconButton>
                            ) : (
                                <Tooltip title='Action not available'>
                                    <IconButton
                                        aria-label='discard row'
                                        sx={{ cursor: 'default' }}
                                        disableFocusRipple
                                        disableRipple
                                        size='small'
                                    >
                                        <Print
                                            sx={{
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </IconButton>
                                </Tooltip>
                            )} */}
                                {tabVal === 1 &&
                                    (row?.statusText !== 'Complete' && row?.statusText !== 'Cancelled' ? (
                                        <Tooltip title='Unassign'>
                                            <IconButton
                                                sx={{
                                                    color: 'error.main',
                                                    '&:hover': {
                                                        color: 'error.main',
                                                        scale: 1.1
                                                    }
                                                }}
                                                size='small'
                                                aria-label='print order'
                                                onClick={() => {
                                                    setSelectedRow([{ ...row }])
                                                    setActiveModal('unassignPicklist')
                                                    dispatch(
                                                        openModal({
                                                            type: 'confirm_modal'
                                                        })
                                                    )
                                                }}
                                            >
                                                <PersonRemove
                                                    sx={{
                                                        fontSize: '1rem'
                                                    }}
                                                />
                                            </IconButton>
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title='Action not available'>
                                            <IconButton
                                                aria-label='discard row'
                                                sx={{ cursor: 'default' }}
                                                disableFocusRipple
                                                disableRipple
                                                size='small'
                                            >
                                                <PersonRemove
                                                    sx={{
                                                        fontSize: '1rem'
                                                    }}
                                                />
                                            </IconButton>
                                        </Tooltip>
                                    ))}
                            </Box>
                        )}
                        setSelectedRow={setSelectedRow}
                        isLoading={dataTableLKey}
                        clearSelectionRef={clearSelectionRef}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                {modalType === 'global_modal' && (
                    <CustomModal open={isOpen} handleClose={() => dispatch(closeModal())} />
                )}
                {/* confirm before bulk actions */}
                {modalType === 'confirm_modal' &&
                    (activeModal === 'unassignPicklist' ? (
                        <ConfirmModal
                            title='Unassign All Pickers'
                            message='Are you sure you want to unassign all pickers from this pick list?'
                            icon='warning'
                            confirmText='Unassign All'
                            customStyle={{ width: { xs: '320px', sm: '480px' } }}
                            onConfirm={handleUnAssign}
                            isLoading={unAssignPickLKey}
                        />
                    ) : null)}

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
                        <Box sx={{ width: '100%', position: 'relative' }}>
                            <Typography variant='h4' component='div'>
                                Assign Picker
                            </Typography>
                            <CustomButton
                                onClick={() => {
                                    setIsModalOpen(false)
                                    setPickListId('')
                                }}
                                customStyles={{
                                    mt: 2,
                                    position: 'absolute',
                                    top: '-28px',
                                    right: '-14px',
                                    width: 'min-content',
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
                            <Divider sx={{ borderColor: 'primary.main', marginTop: '2px' }} />
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 1
                                }}
                            >
                                <Paper sx={{ padding: 1, textAlign: 'center' }}>
                                    <QRCode value={pickListId} size={150} logoImage={CerebrumBrain} logoWidth={40} />
                                    <Typography variant='h6' sx={{ marginTop: 2 }}>
                                        Picklist ID: {pickListId}
                                    </Typography>
                                    <Typography
                                        variant='body3'
                                        sx={{ marginTop: 1, display: 'flex', justifyContent: 'center', gap: 1 }}
                                    >
                                        <Info fontSize='small' color='info' />
                                        Scan this QR on your HHT to assign the chosen picklist!
                                    </Typography>
                                </Paper>
                            </Box>
                        </Box>
                    </Box>
                </GlobalModal>
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename={`ASN_Export_${new Date()}.csv`}
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}
/* eslint-disable */
export default PickListTable
