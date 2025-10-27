import { useEffect, useMemo, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Edit from '@mui/icons-material/Edit'
import Delete from '@mui/icons-material/Delete'
import { Add, FilterAltOff } from '@mui/icons-material'

import { useDispatch, useSelector } from 'react-redux'
// project imports
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import CustomButton from '@core/components/extended/CustomButton'
import CustomSearchTextField from '@/core/components/extended/CustomSearchTextField'
import CustomSearchDateField from '@/core/components/extended/CustomSearchDateField'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import { openSnackbar } from '@app/store/slices/snackbar'

import { getMasterClient, removeMasterClient } from '@app/store/slices/api/accountSlice'

import { Typography } from '@mui/material'
import ToggleColumns from '@/core/components/ToggleColumns'
import { TOGGLE_ALL } from '@/constants'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers } from './helper'

function MasterAccountTable() {
    const location = useLocation()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')
    const { getMasterClientLKey, removeMasterClientLKey } = useSelector(state => state.loading)

    const [recordsCount, setRecordsCount] = useState(0)
    const [columns, setColumns] = useState([...headers])
    const [users, setUsers] = useState([])
    const [excelHandler, setExcelHandler] = useState(false)
    const [removeId, setRemoveId] = useState(null)
    const [refetch, setRefetch] = useState(false)

    const [search, setSearch] = useState({
        value: '',
        regex: false
    })
    const [filters, setFilters] = useState({
        created_at: { from: '', to: '' }
    })
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }
    // const queryHandler = async (queryString, queryObj = {}) //! this can be done if query need to be modified in parent
    const queryHandler = async queryString => {
        const result = await dispatch(getMasterClient.initiate(queryString, false))
        if (!result?.data?.data) {
            return
        }

        const tableData = result.data.data.map(item => {
            let values = []
            try {
                const parsed = JSON.parse(JSON.parse(item.fields))
                values = parsed.map(field => field.value)
            } catch (err) {
                console.error('Failed to parse fields', err)
            }
            return { ...item, fields: values }
        })

        setUsers(tableData)
        setRecordsCount(result?.data?.recordsTotal)
    }

    const clearFilters = () => {
        setSearch({
            value: '',
            regex: false
        })
        setFilters({ created_at: { from: '', to: '' } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editHandler = useCallback(id => navigate(`/setup/company/${id}`), [])

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
            await dispatch(removeMasterClient.initiate(removeId))
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'removed master account successfully!',
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
                    message: 'unable to remove master account!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            dispatch(closeModal())
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
        navigate('/setup/company/create')
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
                        <Typography variant='h3'>All Accounts</Typography>
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
                        <CustomSearchTextField search={search} setSearch={setSearch} placeholder='Search accounts...' />
                        {/* // Example for "From" date */}
                        <CustomSearchDateField
                            type='from'
                            filters={filters}
                            setFilters={setFilters}
                            placeholder='From date'
                            label='From'
                        />
                        {/* </Box> */}

                        {/* // Example for "To" date */}
                        <CustomSearchDateField
                            type='to'
                            filters={filters}
                            setFilters={setFilters}
                            placeholder='To date'
                            label='To'
                        />
                        <UiAccessGuard>
                            <CSVExport handleExcelClick={handleExcelClick} />
                        </UiAccessGuard>
                        <UiAccessGuard type='create'>
                            <CustomButton variant='clickable' onClick={handleAdd}>
                                Add New <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                            </CustomButton>{' '}
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
                    refetch={refetch}
                    reqKey='getMasterClientLKey'
                    globalSearch={search}
                    globalFilters={filters}
                    clearFilters={clearFilters}
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
                                        <Edit fontSize='small' sx={{ fill: '#60498a' }} />
                                    </Tooltip>
                                </IconButton>
                            </UiAccessGuard>
                            <UiAccessGuard type='edit'>
                                <IconButton
                                    sx={{ color: 'error.main' }}
                                    size='small'
                                    aria-label='edit row'
                                    onClick={() => deleteHandler(row.id, row)}
                                >
                                    <Tooltip title='Delete'>
                                        <Delete fontSize='small' />
                                    </Tooltip>
                                </IconButton>
                            </UiAccessGuard>
                        </Box>
                    )}
                    setIsShowClearButton={setIsShowClearButton}
                    isLoading={getMasterClientLKey}
                    clearAllFilters={clearAllFilters}
                    enableContextMenu
                />
                <PopperContextMenu options={menuOptions} />
                <ConfirmModal
                    title='Delete Master Account'
                    message={
                        <>
                            Are you sure you want to delete this master account:{' '}
                            <strong>{users?.find(user => user?.id === removeId)?.name || 'Unknown'}</strong>?
                        </>
                    }
                    icon='warning'
                    confirmText='Yes, Delete'
                    customStyle={{ width: { xs: '300px', sm: '456px' } }}
                    onConfirm={deleteActionHandler}
                    isLoading={removeMasterClientLKey}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default MasterAccountTable
