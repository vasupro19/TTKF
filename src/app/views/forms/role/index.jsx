import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TextField, Typography, Box, FormControlLabel, Checkbox, Grid, styled } from '@mui/material'
import { openSnackbar } from '@app/store/slices/snackbar'

import {
    useCreateRoleMenuPermissionsMutation,
    useGetRolePermissionsAndAccessQuery,
    getRolePermissionsAndAccessForEdit
} from '@app/store/slices/api/rolePermissionSlice'
import { objectLength } from '@/utilities'
import { useDispatch, useSelector } from 'react-redux'
import usePrompt from '@hooks/usePrompt'
import PermissionCheckboxGroup from './PermissionCheckboxGroup'

function AccessManagement() {
    usePrompt()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { id: roleId } = useParams()
    const { createRoleMenuPermissionsLKey, getRolePermissionsAndAccessForEditLKey } = useSelector(
        state => state.loading
    )
    const [createRoleMenuPermissions] = useCreateRoleMenuPermissionsMutation()
    const { data: rolePermissions, isLoading } = useGetRolePermissionsAndAccessQuery()

    const [permissionsAndAccess, setPermissionsAndAccess] = useState(null)
    const [role, setRole] = useState('')
    // Styled components
    const StyledCheckbox = styled(Checkbox)(() => ({
        paddingTop: '2px',
        paddingBottom: '2px'
    }))
    const [permissions, setPermissions] = useState({
        view: false,
        create: false,
        edit: false,
        export: false
    })
    const [permissionsAccess, setPermissionsAccess] = useState({
        view: false,
        create: false,
        edit: false,
        export: false
    })

    const handlePermissionChange = permission => {
        if (!permissionsAccess[permission]) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'you do not have permission to change module access.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return
        }
        setPermissions(prevPermissions => {
            // When "Create" or "Edit" is selected, ensure "View" is selected too
            const updatedPermissions = {
                ...prevPermissions,
                view:
                    permission === 'view'
                        ? !prevPermissions.view
                        : prevPermissions.view ||
                          permission === 'create' ||
                          permission === 'edit' ||
                          permission === 'export',
                [permission]: !prevPermissions[permission]
            }
            return updatedPermissions
        })
    }

    const handleSubmit = async permissionValues => {
        if (!role || role.length < 3) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'please enter a valid role name.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return
        }

        const permissionObj = permissionsAndAccess.access?.child.reduce((acc, accessChild) => {
            if (permissions[accessChild.menu_code]) acc[accessChild.menu_code] = accessChild.id.toString()
            return acc
        }, {})

        if (roleId) permissionObj.role_id = typeof roleId === 'string' ? roleId : roleId.toString()

        const response = await createRoleMenuPermissions({
            access: '1',
            role_name: role,
            ...permissionObj,
            ...permissionValues
        }).unwrap()
        // const response = {}

        dispatch(
            openSnackbar({
                open: true,
                message: response?.success
                    ? response?.message || 'role added!'
                    : response?.message || 'something went wrong',
                variant: 'alert',
                alert: { color: response?.success ? 'success' : 'error' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            })
        )

        if (response?.success) {
            navigate('/userManagement/role')
        }

        // form resets
        setRole('')
        setPermissionsAndAccess({
            menus: rolePermissions?.data?.menus,
            access: rolePermissions?.data?.moduleAccess[0] || {}
        })
        setPermissions({
            view: false,
            create: false,
            edit: false,
            export: false
        })
    }

    const getSelectedRoleData = async id => {
        const response = await dispatch(getRolePermissionsAndAccessForEdit.initiate(id))

        if (!response?.data?.data) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: response?.data?.success
                        ? response?.data?.message || 'unable to fetch role  data!'
                        : response?.data?.message || 'something went wrong',
                    variant: 'alert',
                    alert: { color: response?.data?.success ? 'success' : 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return
        }

        setPermissionsAndAccess({
            menus: response?.data?.data?.menus || [],
            access: response?.data.data?.moduleAccess[0] || {}
        })
        setPermissionsAccess(
            response?.data?.data?.moduleAccess[0]?.child.reduce((acc, accessChild) => {
                acc[accessChild.menu_code] = accessChild.user_access
                return acc
            }, {})
        )
        setPermissions(
            response?.data?.data?.moduleAccess[0]?.child.reduce((acc, accessChild) => {
                acc[accessChild.menu_code] = !!accessChild?.selected_role_access
                return acc
            }, {})
        )
        setRole(response?.data?.data?.selectedRole?.role || '')
    }

    useEffect(() => {
        if (
            !roleId &&
            rolePermissions &&
            rolePermissions.data &&
            objectLength(rolePermissions.data) > 0 &&
            rolePermissions.data?.menus
        ) {
            setPermissionsAndAccess({
                menus: rolePermissions?.data?.menus,
                access: rolePermissions?.data?.moduleAccess[0] || {}
            })
            setPermissionsAccess(
                rolePermissions?.data?.moduleAccess[0]?.child.reduce((acc, accessChild) => {
                    acc[accessChild.menu_code] = accessChild.user_access
                    return acc
                }, {})
            )
            setPermissions(
                rolePermissions?.data?.moduleAccess[0]?.child.reduce((acc, accessChild) => {
                    acc[accessChild.menu_code] = accessChild.user_access
                    return acc
                }, {})
            )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rolePermissions, isLoading])

    useEffect(() => {
        if (roleId) getSelectedRoleData(roleId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleId])

    return (
        <Box p={1} borderRadius={2}>
            <Grid
                container
                spacing={1}
                gap={2}
                marginTop={0.5}
                direction={{ sm: 'row', xs: 'column' }}
                alignItems='baseline'
            >
                <Grid item xs={3} container gap={1} alignItems='center' justifyContent='center'>
                    <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
                        Role Name:
                    </Typography>
                    <TextField
                        sx={{
                            '& input': {
                                padding: '4px 8px',
                                height: '1.5rem'
                            },
                            flexGrow: 1,
                            width: 'auto'
                        }}
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        placeholder='Enter role here'
                    />
                </Grid>
                <Grid
                    item
                    xs={6}
                    container
                    gap={{ xs: 0.4, sm: 1 }}
                    spacing={1}
                    alignItems='center'
                    justifyContent={{ xs: 'center', sm: 'unset' }}
                >
                    <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
                        Module Access:
                    </Typography>
                    <FormControlLabel
                        control={
                            <StyledCheckbox
                                size='small'
                                checked={permissions?.view}
                                disabled={!permissionsAccess?.view}
                                onChange={() => handlePermissionChange('view')}
                            />
                        }
                        label='View'
                    />
                    <FormControlLabel
                        control={
                            <StyledCheckbox
                                size='small'
                                checked={permissions?.create}
                                disabled={!permissionsAccess?.create}
                                onChange={() => handlePermissionChange('create')}
                            />
                        }
                        label='Create'
                    />
                    <FormControlLabel
                        control={
                            <StyledCheckbox
                                size='small'
                                checked={permissions?.edit}
                                disabled={!permissionsAccess?.edit}
                                onChange={() => handlePermissionChange('edit')}
                            />
                        }
                        label='Edit'
                    />
                    <FormControlLabel
                        control={
                            <StyledCheckbox
                                size='small'
                                checked={permissions?.export}
                                disabled={!permissionsAccess?.export}
                                onChange={() => handlePermissionChange('export')}
                            />
                        }
                        label='Export'
                        sx={{ marginRight: { xs: 'auto' } }}
                    />
                </Grid>
            </Grid>

            <Box mt={2}>
                {permissionsAndAccess && (
                    <PermissionCheckboxGroup
                        handleSubmitAll={handleSubmit}
                        permissionsAndAccess={permissionsAndAccess}
                        modulePermissions={permissions}
                        createRoleMenuPermissionsLKey={createRoleMenuPermissionsLKey}
                        getRolePermissionsAndAccessForEditLKey={getRolePermissionsAndAccessForEditLKey}
                    />
                )}
            </Box>
        </Box>
    )
}

export default AccessManagement
