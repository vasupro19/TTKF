import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Delete, Edit, FilterAltOff, TextFields, Upload } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import DropdownMenu from '@/core/components/DropdownMenu'
import CustomModal from '@core/components/extended/CustomModal'
import ImportFileModal from '@core/components/modals/ImportFileModal'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import CustomButton from '@/core/components/extended/CustomButton'
import CustomLink from '@/core/components/extended/CustomLink'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'

// ** import utils
import { TOGGLE_ALL, isExcelQuery } from '@/constants'
import { objectLength } from '@/utilities'
// ** import from redux
import { closeModal, openModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import {
    getVendors,
    useGetVendorTemplateMutation,
    useUploadExcelMutation,
    useRemoveVendorMutation
} from '@/app/store/slices/api/vendorSlice'

// ** import dummy data
import { openSnackbar } from '@/app/store/slices/snackbar'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { CSVLink } from 'react-csv'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers } from './helper'

function MasterVendorTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const csvLinkRef = useRef(null)
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')

    const [getVendorTemplate] = useGetVendorTemplateMutation()
    const [uploadExcel] = useUploadExcelMutation()
    const [removeVendor] = useRemoveVendorMutation()

    const isOpen = useSelector(state => state.modal.open)
    const modalType = useSelector(state => state.modal.type)
    const { getVendorsLKey, removeVendorLKey } = useSelector(state => state.loading)

    const [refetch, setRefetch] = useState(false)
    const [columns, setColumns] = useState([...headers])
    const [activePopup, setActivePopup] = useState(null)
    const [excelHandler, setExcelHandler] = useState(false)
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])

    const [vendors, setVendors] = useState([])
    const [recordCount, setRecordCount] = useState(0)

    const [deleteId, setDeleteId] = useState()
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const handleExportAllExcel = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCurrentView = () => {
        if (!vendors.length) return

        const visibleHeaders = headers.filter(header => header.visible && header.label !== 'Sr. No.')

        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))

        const exportData = vendors.map(item => {
            const row = {}

            visibleHeaders.forEach(header => {
                if (header.key === 'created_at') {
                    row[header.key] = item[header.key] ? new Date(item[header.key]).toLocaleString() : ''
                } else if (header.key === 'updated_at') {
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

    const queryHandler = async queryString => {
        const { data } = await dispatch(getVendors.initiate(queryString, false))
        if (isExcelQuery(queryString)) return
        setVendors(
            data?.data?.map(item => ({
                ...item,
                refNo: (
                    <CustomLink href={`/master/vendor/view/${item?.id}`} icon>
                        <Tooltip title='View Details' placement='bottom' arrow>
                            {item?.refNo}
                        </Tooltip>
                    </CustomLink>
                )
            })) || []
        )

        setRecordCount(data?.recordsTotal || 0)
    }

    const handleAdd = () => {
        navigate('/master/vendor/create')
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editHandler = useCallback(id => navigate(`/master/vendor/edit/${id}`), [])

    const onModalConfirmHandleDelete = async () => {
        if (!deleteId) return
        let message
        let isError = false
        try {
            const response = await removeVendor(deleteId)
            dispatch(closeModal())
            message = response?.data?.data?.message || response?.data?.message || 'deactivated vendor successfully!'
        } catch (error) {
            isError = true
            message = error?.message || message
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
        }
    }
    const deleteHandler = useCallback(id => {
        setDeleteId(id)
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getTemplate = async () => getVendorTemplate().unwrap()

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
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
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
        setActivePopup('bulkImport')
        dispatch(
            openModal({
                content: (
                    <ImportFileModal
                        handleGetTemplate={getTemplate}
                        handleFileSubmission={handleFileUpload}
                        fileType={{
                            'text/csv': ['.csv'],
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                    />
                ),
                title: <Typography variant='h3'>Add Vendors</Typography>
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

    const menuOptions = useMemo(
        () => [
            {
                label: 'Edit',
                icon: <Edit fontSize='small' sx={{ fill: '#60498a' }} />,
                onClick: row => editHandler(row.id, row),
                condition: row => hasEditAccess
            },
            {
                label: 'Delete',
                icon: <Delete fontSize='small' sx={{ color: 'error.main' }} />,
                onClick: row => deleteHandler(row.id, row),
                condition: row => hasEditAccess
            }
        ],
        [editHandler, deleteHandler, hasEditAccess]
    )

    useEffect(() => {
        setRefetch(true)
        setTimeout(() => setRefetch(false), 500)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname])

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
                            <Typography variant='h3'>All Vendors</Typography>
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
                    <MobileTableToolbar
                        title='All Vendors'
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAllExcel}
                        setClearAllFilters={setClearAllFilters}
                        handleAdd={handleAdd}
                    />
                    <DataTable
                        data={vendors}
                        columns={columns}
                        addExcelQuery={excelHandler}
                        reqKey='getVendorsLKey'
                        refetch={refetch}
                        queryHandler={queryHandler}
                        totalRecords={recordCount}
                        isCheckbox={false}
                        renderAction={row => (
                            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                <UiAccessGuard type='edit'>
                                    <IconButton
                                        sx={{ color: 'success.main' }}
                                        size='small'
                                        aria-label='edit row'
                                        onClick={() => editHandler(row.id, row)}
                                    >
                                        <Tooltip title='Edit'>
                                            <Edit fontSize='8px' sx={{ fill: '#60498a' }} />
                                        </Tooltip>
                                    </IconButton>
                                </UiAccessGuard>
                                <UiAccessGuard type='edit'>
                                    <IconButton
                                        sx={{ color: 'error.main' }}
                                        size='small'
                                        aria-label='delete row'
                                        onClick={() => deleteHandler(row.id, row)}
                                    >
                                        <Tooltip title='Delete'>
                                            <Delete fontSize='8px' />
                                        </Tooltip>
                                    </IconButton>
                                </UiAccessGuard>
                            </Box>
                        )}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        isLoading={getVendorsLKey}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />

                    {/* confirm before delete */}
                    <ConfirmModal
                        title='Delete Vendor'
                        message={
                            <>
                                Are you sure you want to delete this vendor:{' '}
                                <strong>{vendors?.find(vendor => vendor?.id === deleteId)?.name || 'Unknown'}</strong>?
                            </>
                        }
                        icon='warning'
                        confirmText='Yes, Delete'
                        customStyle={{ width: { xs: '300px', sm: '456px' } }}
                        onConfirm={onModalConfirmHandleDelete}
                        isLoading={removeVendorLKey}
                    />
                    {activePopup === 'bulkImport' && modalType === 'global_modal' && <CustomModal open={isOpen} />}
                </Box>
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename='Vendors_Export.csv'
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default MasterVendorTable
