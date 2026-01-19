import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { FormControlLabel, IconButton, Tooltip, Typography, Stack, Box } from '@mui/material'
import { Edit, TextFields, Upload, PermDataSetting, FilterAltOff } from '@mui/icons-material'
import SettingsIcon from '@mui/icons-material/Settings'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import CustomSwitch from '@core/components/extended/CustomSwitch'
import SearchFilterDropdown from '@core/components/SearchFilterDropdown'
import CustomModal from '@core/components/extended/CustomModal'
import { CSVExport } from '@/core/components/extended/CreateCSV'

import ImportFileModal from '@core/components/modals/ImportFileModal'
// ** rtk query import
import {
    getUsers,
    useGetTemplateMutation,
    usePostUserExcelMutation,
    useDeactivateUserMutation
} from '@/app/store/slices/api/usersSlice'

import StatusBadge from '@core/components/StatusBadge'

// ** import utils
import { objectLength } from '@/utilities'
import { TOGGLE_ALL, isExcelQuery } from '@/constants'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import DropdownMenu from '@core/components/DropdownMenu'
import CustomButton from '@/core/components/extended/CustomButton'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { CSVLink } from 'react-csv'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers } from './helper'

function SetupUserTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')

    const isOpen = useSelector(state => state.modal.open)
    const modalType = useSelector(state => state.modal.type)
    const { getUsersLKey, deactivateUserLKey } = useSelector(state => state.loading)

    const [getTemplate] = useGetTemplateMutation()
    const [postUserExcel] = usePostUserExcelMutation()
    const [deactivateUser] = useDeactivateUserMutation()

    const [rows, setRows] = useState([])
    const [recordsCount, setRecordsCount] = useState(0)
    const [columns, setColumns] = useState([...headers])
    const [excelHandler, setExcelHandler] = useState(false)
    const [removeId, setRemoveId] = useState(null)
    const [isActive, setIsActive] = useState(true)
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const csvLinkRef = useRef(null)
    const [refetch, setRefetch] = useState(false)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const handleExportAllExcel = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCurrentView = () => {
        if (!rows.length) return

        const dynamicHeaders = headers
            .filter(header => header.label !== 'Sr. No')
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

    const queryHandler = async query => {
        const { data: response } = await dispatch(getUsers.initiate(query, false))
        console.log(response)
        if (isExcelQuery(query)) return

        setRows(
            response?.data.map(item => {
                const newItem = { ...item }
                newItem.status = (
                    <StatusBadge type={item.active ? 'success' : 'error'} label={item.active ? 'Active' : 'Inactive'} />
                )
                newItem.role = newItem.role.name
                return newItem
            }) || []
        )
        setRecordsCount(response?.recordsTotal || 0)
    }

    // open add new user modal
    const handleAdd = () => navigate('/userManagement/user/create')

    const editHandler = id => navigate(`/master/user/edit/${id}`)

    const deleteHandler = (id, active = false) => {
        setIsActive(!!active)
        setRemoveId(id)
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
    }

    const deleteActionHandler = async () => {
        try {
            await deactivateUser(removeId).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'changed user status successfully!',
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
                    message: 'unable to change user status!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            dispatch(closeModal())
        }
    }

    const handleFileDownload = async () => {
        const response = await getTemplate().unwrap()
        dispatch(
            openSnackbar({
                open: true,
                message: response?.error?.data?.message || 'template file downloaded.',
                variant: response?.error?.data?.message ? 'alert' : 'success',
                alert: { color: 'error' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            })
        )
    }

    const handleFileUpload = async file => {
        const formData = new FormData()
        formData.append('excel', file)
        let isError = false
        let message = ''
        try {
            const response = await postUserExcel(formData).unwrap()
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
        dispatch(
            openModal({
                content: (
                    <ImportFileModal
                        handleFileSubmission={handleFileUpload}
                        handleGetTemplate={handleFileDownload}
                        fileType={{
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                    />
                ),
                title: <Typography variant='h3'>Add Users</Typography>
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
                label: 'Edit permissions',
                icon: <PermDataSetting />,
                onClick: row => navigate(`/userManagement/user/menu/${row.id}`),
                condition: row => hasEditAccess && !!row?.is_custom
            }
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: '2px' }}>
                    {/* Add your dummy buttons here */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant='h3'>All Users</Typography>
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
                            <SearchFilterDropdown
                                buttonText='Select Location'
                                optionsProp={['INR', 'USD', 'JPY', 'AUD', 'EUR', 'GBP', 'CAD']}
                                // onApply={selected => console.log('Selected options:', selected)}
                            />
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
                    <DataTable
                        data={rows}
                        columns={columns}
                        queryHandler={queryHandler}
                        isCheckbox={false}
                        reqKey='getUsersLKey'
                        refetch={refetch}
                        addExcelQuery={excelHandler}
                        totalRecords={recordsCount}
                        renderAction={row => (
                            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                {!!row?.is_custom && (
                                    <UiAccessGuard type='edit'>
                                        <IconButton
                                            sx={{ color: 'success.main' }}
                                            size='small'
                                            aria-label='edit permissions'
                                            onClick={() => navigate(`/userManagement/user/menu/${row.id}`)}
                                        >
                                            <PermDataSetting />
                                        </IconButton>
                                    </UiAccessGuard>
                                )}
                                <UiAccessGuard type='edit'>
                                    <IconButton
                                        sx={{ color: 'primary.main' }}
                                        size='small'
                                        aria-label='settings row'
                                        onClick={() => {
                                            console.log(row)
                                            navigate(`/master/client/permissions/user/${row.clientId}/${row.email}`)
                                        }}
                                    >
                                        <Tooltip title='Settings'>
                                            <SettingsIcon width={18} height={18} />
                                        </Tooltip>
                                    </IconButton>
                                </UiAccessGuard>
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
                                    <Tooltip title='Update Status'>
                                        <FormControlLabel
                                            sx={{ margin: '0px' }}
                                            control={
                                                <CustomSwitch
                                                    // isChecked={row?.status === 'Active'}
                                                    isChecked={!!row?.active}
                                                    handleChange={() => {
                                                        deleteHandler(row.id, row.active)
                                                    }}
                                                />
                                            }
                                        />
                                    </Tooltip>
                                </UiAccessGuard>

                                {/* <IconButton
                                sx={{ color: 'error.main' }}
                                size='small'
                                aria-label='delete row'
                                onClick={() => deleteHandler(row.id, row.active)}
                            >
                                <Tooltip title='Delete'>
                                    <Delete fontSize='8px' />
                                </Tooltip>
                            </IconButton> */}
                            </Box>
                        )}
                        setIsShowClearButton={setIsShowClearButton}
                        isLoading={getUsersLKey}
                        clearAllFilters={clearAllFilters}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                    {/* confirm before delete */}
                    <ConfirmModal
                        title={isActive ? 'Deactivate User' : 'Activate User'}
                        message={`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this user?`}
                        icon='warning'
                        confirmText={`Yes, ${isActive ? 'Deactivate' : 'Activate'}`}
                        customStyle={{ width: { xs: '300px', sm: '456px' } }}
                        onConfirm={deleteActionHandler}
                        isLoading={deactivateUserLKey}
                    />
                    {modalType === 'global_modal' && <CustomModal open={isOpen} />}
                </Box>
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename='User_Export.csv'
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default SetupUserTable
