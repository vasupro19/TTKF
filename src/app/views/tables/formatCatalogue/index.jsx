import { useEffect, useMemo, useRef, useState, useCallback } from 'react'

import { IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Add, Edit, FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import CustomModal from '@core/components/extended/CustomModal'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import ToggleColumns from '@core/components/ToggleColumns'
import { formatDataTable } from '@/app/store/slices/api/catalogueSlice'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import StatusBadge from '@/core/components/StatusBadge'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'

// ** import utils
import { TOGGLE_ALL, isExcelQuery } from '@/constants'
// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { CSVLink } from 'react-csv'
import useTemporaryToggle from '@/hooks/useTemporaryToggle'
import { headers } from './helper'

// ** import sub-components
import DefineFormatCatalogueModal from './DefineFormatCatalogueModal'

function MasterDefineCatalogueFormatTable() {
    const dispatch = useDispatch()
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')
    const [rows, setRows] = useState([])
    const [columns, setColumns] = useState([...headers])
    const [pages, setPages] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)

    const isOpen = useSelector(state => state.modal.open)
    const { formatDataTableLKey } = useSelector(state => state.loading)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const [refetch, setRefetch] = useTemporaryToggle(false)
    const csvLinkRef = useRef(null)

    const queryHandler = async query => {
        const { data } = await dispatch(formatDataTable.initiate(query, false))
        if (isExcelQuery(query)) return
        setRows(
            data?.data?.map(item => {
                const tempItem = { ...item }
                if ('is_mandatory' in tempItem)
                    tempItem.is_mandatory = (
                        <StatusBadge
                            type={item.is_mandatory ? 'success' : 'danger'}
                            label={item.is_mandatory ? 'Yes' : 'No'}
                        />
                    )
                return tempItem
            }) || []
        )
        setPages(data?.recordsTotal || 0)
    }

    const handleExportAllExcel = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCurrentView = () => {
        if (!rows.length) return

        const dynamicHeaders = headers
            .filter(header => header.label !== 'Sr.No.')
            .map(header => ({
                label: header.label,
                key: header.key
            }))

        const exportData = rows.map(item => {
            const row = {}

            dynamicHeaders.forEach(header => {
                if (header.key === 'is_mandatory') {
                    row[header.key] = item[header.key]?.props?.label || ''
                } else if (header.key === 'created_at') {
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

    useEffect(() => {
        if (!isOpen) setRefetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    // open add new pincode modal
    const handleAdd = (id = null) => {
        dispatch(
            openModal({
                content: <DefineFormatCatalogueModal editId={id} />,
                closeOnBackdropClick: false,
                title: <Typography variant='h3'>Add Properties</Typography>,
                disableEscapeKeyDown: true
            })
        )
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editHandler = useCallback(id => handleAdd(id), [])

    // const handleUpdateStatus = id => {
    //     console.log('id updated ', id)
    // }

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
                condition: row => hasEditAccess // Replace with your access control logic
            }
        ],
        [editHandler, hasEditAccess]
    )

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
                            <Typography variant='h3'>Format Catalogue</Typography>
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
                            {/* add your custom filters here */}
                            <UiAccessGuard type='create'>
                                {/* use <UiAccessGuard></UiAccessGuard> guard component to add permission filter on individual ui components */}
                                <CustomButton variant='clickable' color='primary' onClick={handleAdd}>
                                    Add Properties
                                    <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                                </CustomButton>
                            </UiAccessGuard>

                            {/* render action column can be made dynamic based on user authorization  */}
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>
                    <MobileTableToolbar
                        title='Format Catalogue'
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAllExcel}
                        setClearAllFilters={setClearAllFilters}
                        handleAdd={handleAdd}
                    />
                    <DataTable
                        data={rows}
                        columns={columns}
                        queryHandler={queryHandler}
                        reqKey='formatDataTableLKey'
                        refetch={refetch}
                        isCheckbox={false}
                        addExcelQuery={excelHandler}
                        totalRecords={pages}
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
                        isLoading={formatDataTableLKey}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                <CustomModal open={isOpen} handleClose={() => dispatch(closeModal())} />
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename='Format_Catalogue_Export.csv'
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default MasterDefineCatalogueFormatTable
