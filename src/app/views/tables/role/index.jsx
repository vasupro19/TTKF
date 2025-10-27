import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { FormControlLabel, IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Add, Delete, Edit, FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import CustomSwitch from '@core/components/extended/CustomSwitch'
import StatusBadge from '@core/components/StatusBadge'
import { getRolePermissions, useRemoveRolePermissionMutation } from '@app/store/slices/api/rolePermissionSlice'
import { openSnackbar } from '@app/store/slices/snackbar'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'

// ** import utils
import { TOGGLE_ALL, isExcelQuery } from '@/constants'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'

import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { CSVLink } from 'react-csv'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers } from './helper'

function SetupRoleTable() {
    const dispatch = useDispatch()
    const location = useLocation()
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')
    const { getRolePermissionsLKey, removeRolePermissionLKey } = useSelector(state => state.loading)

    const [removeRolePermission] = useRemoveRolePermissionMutation()
    const [refetch, setRefetch] = useState(false)
    const [columns, setColumns] = useState([...headers])

    const [rows, setRows] = useState([])
    const [count, setCount] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)
    const [removeId, setRemoveId] = useState(null)
    const [isActive, setIsActive] = useState(true)
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const csvLinkRef = useRef(null)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const navigate = useNavigate()

    const queryHandler = async queryString => {
        const result = await dispatch(getRolePermissions.initiate(queryString, false))
        if (isExcelQuery(queryString)) return // ? if excel query do not overwrite data with empty array
        setRows(
            result?.data?.data.map(item => {
                const tempItem = { ...item }
                tempItem.status = (
                    <StatusBadge
                        type={tempItem?.active ? 'success' : 'danger'}
                        label={tempItem?.active ? 'Active' : 'Deactivated'}
                    />
                )
                return tempItem
            }) || []
        )
        setCount(result?.data?.recordsTotal || 0)
    }

    const handleCurrentView = () => {
        if (!rows.length) return

        const dynamicHeaders = headers
            .filter(header => header.label !== 'Sr. No.')
            .map(header => ({
                label: header.label,
                key: header.key
            }))

        const exportData = rows.map(item => {
            const row = {}

            dynamicHeaders.forEach(header => {
                if (header.key === 'status') {
                    row[header.key] = item[header.key]?.props?.label || ''
                } else if (header.key === 'created_at') {
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

    // open add new modal
    const handleAdd = () => navigate('/userManagement/role/create')

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editHandler = useCallback(id => navigate(`/userManagement/role/${id}`), [])

    const deleteHandler = useCallback((id, active = false) => {
        setIsActive(!!active)
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
            await removeRolePermission(removeId).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'changed role status successfully!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
        } catch (reqError) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'unable to changed role status!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            dispatch(closeModal())
        }
    }

    // const handleUpdateStatus = id => true

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
                <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: '2px' }}>
                    {/* Add your dummy buttons here */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant='h3'>Roles</Typography>
                        </Box>
                        <Stack direction='row' spacing={2} alignItems='center' paddingY='12px'>
                            {/* add your custom filters here */}
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

                            {/* render action column can be made dynamic based on user authorization  */}
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>
                    <DataTable
                        data={rows}
                        columns={columns}
                        queryHandler={queryHandler}
                        refetch={refetch}
                        reqKey='getRolePermissionsLKey'
                        totalRecords={count}
                        addExcelQuery={excelHandler}
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
                                    <Tooltip title='Update Status'>
                                        <FormControlLabel
                                            sx={{ margin: '0px' }}
                                            control={
                                                <CustomSwitch
                                                    isChecked={!!row?.active}
                                                    // isChecked={Math.ceil(Math.random() * 10) >= 5}
                                                    handleChange={() => {
                                                        deleteHandler(row.id, row?.active)
                                                    }}
                                                />
                                            }
                                        />
                                    </Tooltip>

                                    {/* <IconButton
                                        sx={{ color: 'error.main' }}
                                        size='small'
                                        aria-label='delete row'
                                        onClick={() => deleteHandler(row.id, row?.active)}
                                    >
                                        <Tooltip title='Delete'>
                                            <Delete fontSize='8px' />
                                        </Tooltip>
                                    </IconButton> */}
                                </UiAccessGuard>
                            </Box>
                        )}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        isLoading={getRolePermissionsLKey}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                    {/* confirm before delete */}
                    <ConfirmModal
                        title={isActive ? 'Deactivate Role' : 'Activate Role'}
                        message={`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this role?`}
                        icon='warning'
                        confirmText={`Yes, ${isActive ? 'Deactivate' : 'Activate'}`}
                        customStyle={{ width: { xs: '300px', sm: '456px' } }}
                        onConfirm={deleteActionHandler}
                        isLoading={removeRolePermissionLKey}
                    />
                </Box>
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename='Role_Export.csv'
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default SetupRoleTable
