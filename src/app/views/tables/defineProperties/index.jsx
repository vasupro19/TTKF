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
import ToggleColumns from '@core/components/ToggleColumns'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { dataTable, deactivateProperty } from '@/app/store/slices/api/catalogueSlice'
// ** import sub-components
import { openSnackbar } from '@/app/store/slices/snackbar'
import { TOGGLE_ALL, isExcelQuery } from '@/constants'
import { CSVLink } from 'react-csv'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import useTemporaryToggle from '@/hooks/useTemporaryToggle'
import DefinePropertiesModal from './DefinePropertiesModal'
import { headers } from './helper'

function MasterDefinePropertiesTable() {
    const dispatch = useDispatch()
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')
    const isOpen = useSelector(state => state.modal.open)
    const [columns, setColumns] = useState([...headers])
    const [rows, setRows] = useState([])
    const [count, setCount] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const csvLinkRef = useRef(null)

    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const { dataTableLKey } = useSelector(state => state.loading)
    const [refetch, setRefetch] = useTemporaryToggle(false)

    const queryHandler = async query => {
        const { data } = await dispatch(dataTable.initiate(query, false))
        if (isExcelQuery(query)) return
        setRows(
            data?.data.map(item => {
                const tempItem = { ...item }
                if ('value' in tempItem) tempItem.value = tempItem.value.trim().slice(1, -1).trim()
                return tempItem
            }) || []
        )
        setCount(data?.recordsTotal || 0)
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

    const handleExportAllExcel = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCheckToggle = key => {
        setColumns([
            ...columns.map(item => {
                if (key === TOGGLE_ALL) return { ...item, visible: true }
                if (key === item.key) return { ...item, visible: !item.visible }
                return item
            })
        ])
    }

    // open add new pincode modal
    const handleAdd = (id = null) => {
        dispatch(
            openModal({
                content: <DefinePropertiesModal editId={id} />,
                closeOnBackdropClick: false,
                title: <Typography variant='h3'>Add New Property</Typography>,
                disableEscapeKeyDown: true
            })
        )
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editHandler = useCallback(id => handleAdd(id), [])
    // eslint-disable-next-line no-unused-vars
    const deleteHandler = async id => {
        try {
            await dispatch(deactivateProperty.initiate(id))
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'deactivated property successfully!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } catch (reqError) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'unable to deactivated property!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            // eslint-disable-next-line no-console
            console.log(reqError)
        }
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

    useEffect(() => {
        if (!isOpen) setRefetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

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
                            <Typography variant='h3'>All Properties</Typography>
                        </Box>
                        <Stack direction='row' spacing={2} alignItems='center' paddingY='12px'>
                            {/* <CustomButton variant='outlined'>
                            Export */}
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
                            {/* </CustomButton> */}
                            {/* add your custom filters here */}
                            <UiAccessGuard type='create'>
                                <CustomButton variant='clickable' color='primary' onClick={handleAdd}>
                                    Add Property
                                    <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                                </CustomButton>
                            </UiAccessGuard>

                            {/* render action column can be made dynamic based on user authorization  */}
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>
                    <MobileTableToolbar
                        title='All Properties'
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAllExcel}
                        setClearAllFilters={setClearAllFilters}
                        handleAdd={handleAdd}
                    />
                    <DataTable
                        data={rows}
                        columns={columns}
                        reqKey='dataTableLKey'
                        refetch={refetch}
                        queryHandler={queryHandler}
                        isCheckbox={false}
                        totalRecords={count}
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
                                    {/* <IconButton
                                    sx={{ color: 'error.main' }}
                                    size='small'
                                    aria-label='edit row'
                                    onClick={() => deleteHandler(row.id, row)}
                                >
                                    <Tooltip title='Delete'>
                                        <Delete />
                                    </Tooltip>
                                </IconButton> */}
                                </UiAccessGuard>
                            </Box>
                        )}
                        addExcelQuery={excelHandler}
                        isLoading={dataTableLKey}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                <CustomModal open={isOpen} handleClose={() => dispatch(closeModal())} />
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename='Define_Properties_Export.csv'
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default MasterDefinePropertiesTable
