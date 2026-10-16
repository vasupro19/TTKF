import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormControlLabel, IconButton, Tooltip, Typography, Box } from '@mui/material'
import { Edit, TextFields, Upload, PermDataSetting } from '@mui/icons-material'
import SettingsIcon from '@mui/icons-material/Settings'
import { useDispatch, useSelector } from 'react-redux'

import ListPage from '@core/listing/ListPage'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import CustomSwitch from '@core/components/extended/CustomSwitch'
import CustomModal from '@core/components/extended/CustomModal'
import ImportFileModal from '@core/components/modals/ImportFileModal'
import DropdownMenu from '@core/components/DropdownMenu'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { openSnackbar } from '@/app/store/slices/snackbar'
import {
    getUsers,
    useGetTemplateMutation,
    usePostUserExcelMutation,
    useDeactivateUserMutation
} from '@/app/store/slices/api/usersSlice'
import { useGetClientRolesQuery } from '@/app/store/slices/api/roleSlice'
import { isPlatformUser } from '@views/permissions/menuAccess'
import { objectLength } from '@/utilities'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers, userRows } from './helper'

// ? no choice shown is "Active": switched-off users stay out of the list unless asked for
const STATUS_FILTER = {
    key: 'status',
    label: 'Status',
    allLabel: 'Active',
    options: [
        { value: 'inactive', label: 'Inactive' },
        { value: 'all', label: 'Active and inactive' }
    ]
}

const ADD_OPTIONS = [
    { label: 'Form', action: 'form', icon: <TextFields /> },
    { label: 'Upload', action: 'upload', icon: <Upload /> }
]

// ? the agency's people: who they are, their role, and whether they can sign in
function SetupUserTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const hasCreateAccess = useUiAccess('create')

    // ? the signed-in user's agency, for links to its users' menus
    const myClientId = useSelector(state => state.auth.clientId ?? state.auth.user?.clientId ?? null)
    const platform = useSelector(state => isPlatformUser(state.auth))
    const isOpen = useSelector(state => state.modal.open)
    const modalType = useSelector(state => state.modal.type)
    const deactivateUserLKey = useSelector(state => state.loading?.deactivateUserLKey)

    // ? the Role dropdown lists the agency's roles (the super admin has no agency, so no roles to ask for)
    const { data: rolesReply } = useGetClientRolesQuery(undefined, { skip: platform })
    const filters = useMemo(() => {
        const roles = Array.isArray(rolesReply?.data) ? rolesReply.data : []
        return [
            {
                key: 'role',
                label: 'Role',
                options: roles.map(role => ({ value: role.id, label: role.name }))
            },
            STATUS_FILTER
        ]
    }, [rolesReply])

    const [getTemplate] = useGetTemplateMutation()
    const [postUserExcel] = usePostUserExcelMutation()
    const [deactivateUser] = useDeactivateUserMutation()

    const [removeId, setRemoveId] = useState(null)
    const [isActive, setIsActive] = useState(true)
    const [reloadSignal, setReloadSignal] = useState(0)

    const handleAdd = () => navigate('/userManagement/user/create')
    const editHandler = id => navigate(`/master/user/edit/${id}`)

    const toggleHandler = (id, active = false) => {
        setIsActive(!!active)
        setRemoveId(id)
        dispatch(openModal({ type: 'confirm_modal' }))
    }

    const toggleActionHandler = async () => {
        try {
            await deactivateUser({ id: removeId, active: isActive }).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'changed user status successfully!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            setReloadSignal(signal => signal + 1)
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
            else if (objectLength(response) > 1) {
                dispatch(closeModal())
                setReloadSignal(signal => signal + 1)
            }
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

    const handleOptionClick = action => (action === 'form' ? handleAdd() : handleBulkImport())

    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) handleAdd()
    })

    return (
        <>
            <ListPage
                title='Users'
                subtitle='Everyone in your agency, their role, and whether they can sign in.'
                noun='users'
                searchPlaceholder='Search name, email or phone'
                headers={headers}
                endpoint={getUsers}
                reqKey='getUsersLKey'
                filters={filters}
                rowsOf={userRows}
                csvName='users'
                canAdd={false}
                emptyText='Add the people who work with you, then give each a role.'
                reloadSignal={reloadSignal}
                extraActions={
                    <UiAccessGuard type='create'>
                        <DropdownMenu buttonText='Add New' options={ADD_OPTIONS} onOptionClick={handleOptionClick} />
                    </UiAccessGuard>
                }
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
                                onClick={() =>
                                    // ? the agency's id: a user row often has none of its own
                                    navigate(
                                        `/master/client/permissions/user/${row.clientId ?? myClientId ?? 'own'}/${encodeURIComponent(row.email)}`,
                                        { state: { name: row.name, role: row.role === 'No role' ? null : row.role } }
                                    )
                                }
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
                                onClick={() => editHandler(row.id)}
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
                                            isChecked={!!row?.active}
                                            handleChange={() => toggleHandler(row.id, row.active)}
                                        />
                                    }
                                />
                            </Tooltip>
                        </UiAccessGuard>
                    </Box>
                )}
            />
            <ConfirmModal
                title={isActive ? 'Deactivate User' : 'Activate User'}
                message={`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this user?`}
                icon='warning'
                confirmText={`Yes, ${isActive ? 'Deactivate' : 'Activate'}`}
                customStyle={{ width: { xs: '300px', sm: '456px' } }}
                onConfirm={toggleActionHandler}
                isLoading={deactivateUserLKey}
            />
            {modalType === 'global_modal' && <CustomModal open={isOpen} />}
        </>
    )
}

export default SetupUserTable
