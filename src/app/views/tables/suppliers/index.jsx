import { useState, useEffect, useMemo, useCallback } from 'react'

import { Box, IconButton, Tooltip, Menu, MenuItem, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
// import Box from '@mui/material/Box'
// import Tooltip from '@mui/material/Tooltip'
// import IconButton from '@mui/material/IconButton'
// import TextField from '@mui/material/TextField'
import { Add, Edit, Delete, FilterAltOff, MoreVert } from '@mui/icons-material'

import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
// project imports
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import CustomButton from '@core/components/extended/CustomButton'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import CustomSearchTextField from '@/core/components/extended/CustomSearchTextField'
import CustomSearchDateField from '@/core/components/extended/CustomSearchDateField'
import { openSnackbar } from '@app/store/slices/snackbar'

import { getCampaigns, removeLocationMaster } from '@/app/store/slices/api/campaignSlice'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'

// import { getObjectKeys, toCapitalizedWords } from '@/utilities'
// import { Typography } from '@mui/material'
import ToggleColumns from '@/core/components/ToggleColumns'

import { TOGGLE_ALL, isExcelQuery } from '@/constants'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers } from './helper'
// const slimTextFieldStyle = {
//     '& .MuiInputBase-input': {
//         fontSize: 12,
//         height: 8,
//         padding: 1
//     }
// }

function MasterSupplierTable() {
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)

    // State to track which row ID the menu was opened for
    const [currentRowId, setCurrentRowId] = useState(null)
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const location = useLocation()
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')
    const { getLocationMasterLKey, removeLocationMasterLKey } = useSelector(state => state.loading)

    const [columns, setColumns] = useState([...headers])
    const [users, setUsers] = useState([])
    const [recordsCount, setRecordsCount] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)
    const [removeId, setRemoveId] = useState(null)

    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [refetch, setRefetch] = useState(false)

    const [search, setSearch] = useState({
        value: '',
        regex: false
    })
    const [filters, setFilters] = useState({
        created_at: { from: '', to: '' }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editHandler = useCallback(async id => navigate(`/setup/location/${id}`), [])

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }
    const queryHandler = async queryString => {
        const { data: response } = await dispatch(getCampaigns.initiate(queryString, false))
        if (isExcelQuery(queryString)) {
            return true
        }
        setUsers(response?.data || [])
        setRecordsCount(response?.recordsTotal || 0)
        return true
    }

    const clearFilters = () => {
        setSearch({
            value: '',
            regex: false
        })
        setFilters({ created_at: { from: '', to: '' } })
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
            await dispatch(removeLocationMaster.initiate(removeId))
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'removed location successfully!',
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
                    message: 'unable to remove location!',
                    variant: 'alert',
                    alert: { color: 'success' },
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
        navigate('/master/supplier/add')
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
    const handleMenuClick = (event, rowId) => {
        setAnchorEl(event.currentTarget)
        setCurrentRowId(rowId)
    }

    // Handler to close the menu
    const handleMenuClose = () => {
        setAnchorEl(null)
        setCurrentRowId(null)
    }

    // Handlers for the dropdown options (use currentRowId)
    const handleDestinationsClick = () => {
        handleMenuClose()
        navigate(`/master/destinations/${currentRowId}`)
        console.log(`Navigating to Destinations for Row ID: ${currentRowId}`)
        // Add your navigation or logic here
    }

    const handleItineraryClick = () => {
        handleMenuClose()
        navigate(`/master/itenary/${currentRowId}`)

        console.log(`Navigating to Itinerary for Row ID: ${currentRowId}`)
        // Add your navigation or logic here
    }
    const handlePackagesClick = () => {
        handleMenuClose()
        console.log(`Navigating to Itinerary for Row ID: ${currentRowId}`)
        // Add your navigation or logic here
    }
    return (
        <ContextMenuProvider>
            <MainCard content={false} sx={{ py: '2px' }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant='h3'>All Suppliers</Typography>
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
                        <CustomSearchTextField
                            search={search}
                            setSearch={setSearch}
                            placeholder='Search Suppliers...'
                        />
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
                    /> */}
                        {/* <TextField
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
                    /> */}
                        {/* <TextField
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
                        <UiAccessGuard>
                            <CSVExport handleExcelClick={handleExcelClick} />
                        </UiAccessGuard>
                        <UiAccessGuard type='create'>
                            <CustomButton variant='clickable' onClick={handleAdd}>
                                Add New Supplier
                                <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
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
                    reqKey='getLocationMasterLKey'
                    refetch={refetch}
                    globalSearch={search}
                    globalFilters={filters}
                    clearFilters={clearFilters}
                    addExcelQuery={excelHandler}
                    totalRecords={recordsCount}
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

                            <Tooltip title='Options'>
                                <IconButton
                                    sx={{ color: 'primary.main' }}
                                    size='small'
                                    aria-label='options menu'
                                    // Pass row.id to handleMenuClick to keep track of the current row
                                    onClick={event => handleMenuClick(event, row.id)}
                                >
                                    <MoreVert fontSize='small' />
                                </IconButton>
                            </Tooltip>

                            {/* The Menu component for the dropdown */}
                            <Menu
                                id='options-menu'
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleMenuClose}
                                MenuListProps={{
                                    'aria-labelledby': 'options-button'
                                }}
                                // Adjust placement if necessary
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right'
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right'
                                }}
                            >
                                <MenuItem onClick={() => handleDestinationsClick(row.id)}>Destinations</MenuItem>
                                <MenuItem onClick={() => handleItineraryClick(row.id)}>Itinerary</MenuItem>
                                <MenuItem onClick={() => handlePackagesClick(row.id)}>Packages</MenuItem>
                            </Menu>
                        </Box>
                    )}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                    isLoading={getLocationMasterLKey}
                    enableContextMenu
                />
                <PopperContextMenu options={menuOptions} />
                <ConfirmModal
                    title='Delete Location'
                    message={
                        <>
                            Are you sure you want to delete this location:{' '}
                            <strong>{users?.find(user => user?.id === removeId)?.name || 'Unknown'}</strong>?
                        </>
                    }
                    icon='warning'
                    confirmText='Yes, Delete'
                    customStyle={{ width: { xs: '300px', sm: '456px' } }}
                    onConfirm={deleteActionHandler}
                    isLoading={removeLocationMasterLKey}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default MasterSupplierTable
