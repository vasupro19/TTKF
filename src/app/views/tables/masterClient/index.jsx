import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Edit from '@mui/icons-material/Edit'
import Delete from '@mui/icons-material/Delete'
import { Add, FilterAltOff } from '@mui/icons-material'
// import TextField from '@mui/material/TextField'

import { useDispatch, useSelector } from 'react-redux'
// project imports
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import CustomButton from '@core/components/extended/CustomButton'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import CustomSearchTextField from '@/core/components/extended/CustomSearchTextField'
import CustomSearchDateField from '@/core/components/extended/CustomSearchDateField'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import CustomSwitch from '@core/components/extended/CustomSwitch'

import { openSnackbar } from '@app/store/slices/snackbar'

import { getClient, removeClient } from '@app/store/slices/api/clientSlice'

import { TOGGLE_ALL, isExcelQuery } from '@/constants'
import { Typography } from '@mui/material'
import ToggleColumns from '@/core/components/ToggleColumns'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
// import { SettingsGearAnimIcon } from '@/assets/icons/SettingsGearAnimIcon'
import SettingsIcon from '@mui/icons-material/Settings'
import { headers } from './helper'

// const slimTextFieldStyle = {
//     '& .MuiInputBase-input': {
//         fontSize: 12,
//         height: 8,
//         padding: 1
//     }
// }

function MasterClientTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')
    const { getClientLKey, removeClientLKey } = useSelector(state => state.loading)

    const [totalRecords, setTotalRecords] = useState(0)
    const [columns, setColumns] = useState([...headers])
    const [users, setUsers] = useState([])
    const [removeId, setRemoveId] = useState(null)
    const [isActive, setIsActive] = useState(true)

    const [excelHandler, setExcelHandler] = useState(false)
    const [search, setSearch] = useState({
        value: '',
        regex: false
    })
    const [filters, setFilters] = useState({
        created_at: { from: '', to: '' }
    })
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [refetch, setRefetch] = useState(false)

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }
    const queryHandler = async queryString => {
        const result = await dispatch(getClient.initiate(queryString, false))
        if (isExcelQuery(queryString)) {
            return
        }
        setUsers(result?.data?.data || [])
        setTotalRecords(result?.data?.recordsTotal || 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editHandler = useCallback(id => navigate(`/master/client/edit/${id}`), [])

    const clearFilters = () => {
        setSearch({
            value: '',
            regex: false
        })
        setFilters({ created_at: { from: '', to: '' } })
    }

    const deleteHandler = useCallback(async (id, active) => {
        setRemoveId(id)
        setIsActive(!active)
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Add this inside MasterClientTable
    const handleUpdateStatus = async row => {
        try {
            // Toggle the current value (if active, send false; if inactive, send true)
            const newStatus = !row.isActive

            await dispatch(
                removeClient.initiate({
                    removeId: row.id,
                    isActive: newStatus
                })
            ).unwrap()

            dispatch(
                openSnackbar({
                    open: true,
                    message: `Client ${newStatus ? 'Activated' : 'Deactivated'} successfully!`,
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )

            // Refetch or manually update local state if needed
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
        } catch (err) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Failed to update status',
                    variant: 'alert',
                    alert: { color: 'error' }
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

    const handleAdd = () => {
        navigate('/master/client/create')
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
            <MainCard content={false} sx={{ py: '2px' }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant='h3'>All Clients</Typography>
                    </Box>
                    <Stack direction='row' spacing={2} alignItems='center' paddingY='12px'>
                        {/* add your custom filters here */}
                        {/* <TextField
                        placeholder='search data'
                        size='small'
                        type='search'
                        sx={{
                            '& .MuiInputBase-input': {
                                fontSize: 12
                            },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: 'primary.800',
                                    borderWidth: '1.2px'
                                },
                                '&:hover fieldset': {
                                    borderColor: 'primary.main'
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main'
                                }
                                // padding: '0px 4px'
                            },
                            '& .MuiInputBase-inputSizeSmall': {
                                padding: '3px 6px !important'
                            }
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') setSearch({ ...search, value: e.target.value })
                        }}
                    />
                    <TextField
                        placeholder='from date'
                        size='small'
                        type='date'
                        sx={slimTextFieldStyle}
                        defaultValue={filters?.created_at?.from}
                        onChange={e =>
                            setFilters({
                                ...filters,
                                created_at: { ...filters.created_at, from: `${e.target.value} 00:00:00` }
                            })
                        }
                    />
                    <TextField
                        placeholder='To Date'
                        type='date'
                        size='small'
                        sx={slimTextFieldStyle}
                        defaultValue={filters?.created_at?.to}
                        onChange={e =>
                            setFilters({
                                ...filters,
                                created_at: { ...filters.created_at, to: `${e.target.value} 23:59:59` }
                            })
                        }
                    /> */}
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
                        <CustomSearchTextField search={search} setSearch={setSearch} placeholder='Search clients...' />
                        {/* // Example for "From" date */}
                        {/* <CustomSearchDateField
                            type='from'
                            filters={filters}
                            setFilters={setFilters}
                            placeholder='From date'
                            label='From'
                        />
                        {/* </Box> */}

                        {/* // Example for "To" date */}
                        {/* <CustomSearchDateField
                            type='to'
                            filters={filters}
                            setFilters={setFilters}
                            placeholder='To date'
                            label='To'
                        /> */}
                        {/* <UiAccessGuard>
                            <CSVExport handleExcelClick={handleExcelClick} />
                        </UiAccessGuard> */}
                        <UiAccessGuard type='create'>
                            <CustomButton variant='clickable' onClick={handleAdd}>
                                Add New <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                            </CustomButton>
                        </UiAccessGuard>

                        {/* render action column can be made dynamic based on user authorization  */}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                    </Stack>
                </Box>
                <DataTable
                    isCheckbox
                    data={users || []}
                    columns={columns}
                    queryHandler={queryHandler}
                    reqKey='getClientLKey'
                    refetch={refetch}
                    globalSearch={search}
                    globalFilters={filters}
                    clearFilters={clearFilters}
                    totalRecords={totalRecords}
                    addExcelQuery={excelHandler}
                    renderAction={row => (
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            {/* Edit Button */}
                            <UiAccessGuard type='edit'>
                                <IconButton
                                    sx={{ color: 'success.main' }}
                                    size='small'
                                    aria-label='edit row'
                                    onClick={() => editHandler(row.id, row)}
                                >
                                    <Tooltip title='Edit'>
                                        <Edit fontSize='small' sx={{ fill: '#60498a' }} />
                                    </Tooltip>
                                </IconButton>
                            </UiAccessGuard>

                            {/* Gear Icon Button */}
                            <UiAccessGuard type='edit'>
                                <IconButton
                                    sx={{ color: 'primary.main' }}
                                    size='small'
                                    aria-label='settings row'
                                    onClick={() => {
                                        navigate(`/master/client/permissions/${row.id}/${row.email}`)
                                    }}
                                >
                                    <Tooltip title='Settings'>
                                        <SettingsIcon width={18} height={18} />
                                    </Tooltip>
                                </IconButton>
                            </UiAccessGuard>

                            {/* Delete Button */}
                            <UiAccessGuard type='edit'>
                                <Tooltip title={row.isActive ? 'Deactivate' : 'Activate'}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CustomSwitch
                                            // Using row.active (ensure this matches your API response key)
                                            isChecked={Boolean(row.isActive)}
                                            handleChange={() => handleUpdateStatus(row)}
                                        />
                                    </Box>
                                </Tooltip>
                            </UiAccessGuard>
                        </Box>
                    )}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                    isLoading={getClientLKey}
                    enableContextMenu
                />

                {/* <PopperContextMenu options={menuOptions} /> */}
                {/* <ConfirmModal
                    title='Delete Client'
                    message={
                        <>
                            Are you sure you want to delete this client:{' '}
                            <strong>{users?.find(user => user?.id === removeId)?.name || 'Unknown'}</strong>?
                        </>
                    }
                    icon='warning'
                    confirmText='Yes, Delete'
                    customStyle={{ width: { xs: '300px', sm: '456px' } }}
                    onConfirm={handle}
                    isLoading={removeClientLKey}
                /> */}
            </MainCard>
        </ContextMenuProvider>
    )
}

export default MasterClientTable
