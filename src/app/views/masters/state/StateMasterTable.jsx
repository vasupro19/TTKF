import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import { Add, Delete, Edit, FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import { openSnackbar } from '@app/store/slices/snackbar'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'

// ** import utils
import { TOGGLE_ALL, isExcelQuery } from '@/constants'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { getStates, deactivateState } from '@app/store/slices/api/geoSlice'
import { useDispatch, useSelector } from 'react-redux'

// ** import sub-components
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { CSVLink } from 'react-csv'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import CustomModal from '@/core/components/extended/CustomModal'
import useTemporaryToggle from '@/hooks/useTemporaryToggle'
import ImportStates from './ImportStates'
import { headers } from './helper'

function StateMasterTable() {
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')

    const dispatch = useDispatch()
    const isOpen = useSelector(state => state.modal.open)
    const { getStatesLKey, deactivateStateLKey } = useSelector(state => state.loading)

    const [columns, setColumns] = useState([...headers])
    const [rows, setRows] = useState([])
    const [recordsCount, setRecordsCount] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)
    const [removeId, setRemoveId] = useState(null)

    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const [refetch, setRefetch] = useTemporaryToggle(false)
    const csvLinkRef = useRef(null)

    const queryHandler = async queryString => {
        const { data } = await dispatch(getStates.initiate(queryString, false))

        if (isExcelQuery(queryString)) return
        setRows(data?.data || [])
        setRecordsCount(data?.recordsTotal || 0)
    }

    const handleExportAllExcel = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCurrentView = () => {
        if (!rows.length) return

        const visibleHeaders = headers.filter(header => header.visible && header.label !== 'Sr.No.')

        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))

        const exportData = rows.map(item => {
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

    const deleteHandler = useCallback(async id => {
        setRemoveId(id)
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const deleteActionHandler = async () => {
        try {
            await dispatch(deactivateState.initiate(removeId))
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'State deactivated successfully!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            setRefetch()
        } catch (reqError) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Unable to deactivate state!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            dispatch(closeModal())
        }
    }

    const handleAdd = (id = null) => {
        dispatch(
            openModal({
                content: <ImportStates formId={id} />,
                title: <Typography variant='h3'>Add State</Typography>
            })
        )
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editHandler = useCallback(id => handleAdd(id), [])

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

    const menuOptions = useMemo(
        () => [
            {
                label: 'Edit',
                icon: <Edit fontSize='small' sx={{ fill: '#60498a' }} />,
                onClick: row => editHandler(row.id, row),
                // eslint-disable-next-line no-unused-vars
                condition: row => hasEditAccess
            },
            {
                label: 'Delete',
                icon: <Delete fontSize='small' sx={{ color: 'error.main' }} />,
                onClick: row => deleteHandler(row.id, row),
                // eslint-disable-next-line no-unused-vars
                condition: row => hasEditAccess
            }
        ],
        [editHandler, deleteHandler, hasEditAccess]
    )

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
                            <Typography variant='h3'>All States</Typography>
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
                                <CustomButton variant='clickable' color='primary' onClick={handleAdd}>
                                    Add New
                                    <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                                </CustomButton>
                            </UiAccessGuard>

                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>
                    <MobileTableToolbar
                        title='All State'
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAllExcel}
                        setClearAllFilters={setClearAllFilters}
                        handleAdd={handleAdd}
                    />
                    <DataTable
                        reqKey='getStatesLKey'
                        isLoading={getStatesLKey}
                        data={rows}
                        refetch={refetch}
                        columns={columns}
                        queryHandler={queryHandler}
                        totalRecords={recordsCount}
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
                        isCheckbox={false}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                <CustomModal open={isOpen} handleClose={() => dispatch(closeModal())} />
                <ConfirmModal
                    title='Deactivate State'
                    message={
                        <>
                            Are you sure you want to deactivate this state:{' '}
                            <strong>{rows?.find(state => state?.id === removeId)?.state || 'Unknown'}</strong>?
                        </>
                    }
                    icon='warning'
                    confirmText='Yes, Deactivate'
                    customStyle={{ width: { xs: '300px', sm: '456px' } }}
                    onConfirm={deleteActionHandler}
                    isLoading={deactivateStateLKey}
                />
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename='State_Master_Export.csv'
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default StateMasterTable
