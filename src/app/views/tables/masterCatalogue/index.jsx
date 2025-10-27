import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Edit, FilterAltOff, TextFields, Upload } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import DropdownMenu from '@/core/components/DropdownMenu'
import CustomModal from '@core/components/extended/CustomModal'
import ImportFileModal from '@core/components/modals/ImportFileModal'

import DrawerComponent from '@/core/components/extended/DrawerComponent'
import CustomButton from '@/core/components/extended/CustomButton'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'

// ** import utils
import { objectLength } from '@/utilities'

// ** import from redux
import { closeModal, openModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useGetSkuExcelMutation, useUploadSkuExcelMutation, skuDataTable } from '@/app/store/slices/api/catalogueSlice'

// ** import dummy data
import { openSnackbar } from '@/app/store/slices/snackbar'
import { TOGGLE_ALL, isExcelQuery } from '@/constants'
import { CSVLink } from 'react-csv'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers, transformData } from './helper'
import ViewCatalogue from './ViewCatalogue'

function MasterCatalogueTable() {
    const location = useLocation()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const csvLinkRef = useRef(null)

    const [getSkuExcel] = useGetSkuExcelMutation()
    const [uploadSkuExcel] = useUploadSkuExcelMutation()

    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')
    const isOpen = useSelector(state => state.modal.open)
    const modalType = useSelector(state => state.modal.type)
    const { skuDataTableLKey, getSkuExcelLKey, uploadSkuExcelLKey } = useSelector(state => state.loading)

    const [columns, setColumns] = useState([...headers])
    const [pages, setPages] = useState(0)
    const [activePopup, setActivePopup] = useState(null)
    const [tableData, setTableData] = useState([])
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [currentId, setCurrentId] = useState(null)
    const [excelHandler, setExcelHandler] = useState(false)

    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [refetch, setRefetch] = useState(false)

    const toggleDrawer = open => () => {
        setIsDrawerOpen(open)
    }
    const handleProductClick = id => {
        setCurrentId(id)
        setIsDrawerOpen(true)
    }
    const handleExportAllExcel = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCurrentView = () => {
        if (!tableData.length) return

        const visibleHeaders = headers.filter(
            header => header.visible && header.label !== 'Sr.No.' && header.label !== 'Image'
        )

        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))

        const exportData = tableData.map(item => {
            const row = {}

            visibleHeaders.forEach(header => {
                if (header.key === 'expiry_reqd') {
                    row[header.key] = item[header.key]?.props?.label.children || ''
                } else if (header.key === 'manufacturing_reqd') {
                    row[header.key] = item[header.key]?.props?.label || ''
                } else if (header.key === 'lot_reqd') {
                    row[header.key] = item[header.key]?.props?.label || ''
                } else if (header.key === 'description') {
                    row[header.key] = item[header.key]?.props?.children?.props?.children?.props?.children || ''
                } else if (header.key === 'created_at') {
                    row[header.key] = item[header.key] ? new Date(item[header.key]).toLocaleString() : ''
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

    const queryHandler = async query => {
        const { data: response } = await dispatch(skuDataTable.initiate(query, false))
        if (isExcelQuery(query)) return
        setTableData(transformData(response?.data || [], handleProductClick))
        setPages(response?.recordsTotal || 0)
    }

    const handleAdd = () => navigate('/master/catalogue/create')
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editHandler = useCallback(id => navigate(`/master/catalogue/edit/${id}`), [])
    const getTemplate = async () => getSkuExcel().unwrap()

    const handleUpload = async (file, fileAction) => {
        const formData = new FormData()
        formData.append('action', fileAction)
        formData.append('excel', file)

        let isError = false
        let message = ''
        try {
            const response = await uploadSkuExcel(formData).unwrap()
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
        setActivePopup('bulkImport')
        dispatch(
            openModal({
                content: (
                    <ImportFileModal
                        handleFileSubmission={(file, fileAction) => handleUpload(file, fileAction)}
                        isDownloadSample
                        isLoadingDownload={getSkuExcelLKey}
                        isLoadingUpload={uploadSkuExcelLKey}
                        handleGetTemplate={getTemplate}
                        isFileAction
                        removeTitle
                        fileType={{
                            'text/csv': ['.csv'],
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                    />
                ),
                title: <Typography variant='h3'>Add Catalogues</Typography>
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
            }
        ],
        [editHandler, hasEditAccess]
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
                    {/* Add your dummy buttons here */}
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },

                            gap: 2,
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <Box>
                            <Typography variant='h3'>All Catalogues</Typography>
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
                        title='All Catalogues'
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAllExcel}
                        setClearAllFilters={setClearAllFilters}
                        handleAdd={handleAdd}
                    />
                    <DataTable
                        data={tableData}
                        columns={columns}
                        queryHandler={queryHandler}
                        reqKey='skuDataTableLKey'
                        refetch={refetch}
                        isCheckbox={false}
                        totalRecords={pages}
                        addExcelQuery={excelHandler}
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
                            </Box>
                        )}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        isLoading={skuDataTableLKey}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                    {activePopup === 'bulkImport' && modalType === 'global_modal' && <CustomModal open={isOpen} />}

                    <DrawerComponent
                        isOpen={isDrawerOpen}
                        toggleDrawer={toggleDrawer}
                        drawerContent={<ViewCatalogue currentId={currentId} />}
                    />
                </Box>
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename='Catalogue_Export.csv'
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default MasterCatalogueTable
