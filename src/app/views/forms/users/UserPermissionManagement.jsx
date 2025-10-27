import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Box, FormControlLabel, Checkbox, Grid, styled } from '@mui/material'
import { openSnackbar } from '@app/store/slices/snackbar'

import { getUserMappedMenus, useStoreUserMenuMappingMutation } from '@app/store/slices/api/usersSlice'

import { useDispatch } from 'react-redux'
import usePrompt from '@hooks/usePrompt'
import PermissionCheckboxGroup from './PermissionCheckboxGroup'

// Styled components
const StyledCheckbox = styled(Checkbox)(() => ({
    paddingTop: '2px',
    paddingBottom: '2px'
}))

function UserPermissionManagement() {
    usePrompt()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { id: userId } = useParams()
    const [storeUserMenuMapping] = useStoreUserMenuMappingMutation()

    const [permissionsAndAccess, setPermissionsAndAccess] = useState(null)

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
    const [user, setUser] = useState({})

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
        const permissionObj = permissionsAndAccess.access?.child.reduce((acc, accessChild) => {
            if (permissions[accessChild.menu_code]) acc[accessChild.menu_code] = accessChild.id.toString()
            return acc
        }, {})

        if (userId) permissionObj.user_id = typeof userId === 'string' ? userId : userId.toString()

        const response = await storeUserMenuMapping({
            access: '1',
            name: user?.name || '', // TODO: set user name here
            ...permissionObj,
            ...permissionValues
        }).unwrap()
        // const response = {}

        dispatch(
            openSnackbar({
                open: true,
                message: response?.success
                    ? response?.message || 'user menu mapping added!'
                    : response?.message || 'something went wrong',
                variant: 'alert',
                alert: { color: response?.success ? 'success' : 'error' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            })
        )
        navigate(-1)
    }

    const getMenuMapping = async id => {
        const response = await dispatch(getUserMappedMenus.initiate(id))

        if (!response?.data?.data) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: response?.data?.success
                        ? response?.data?.message || 'unable to fetch user menu mapping data!'
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
        setUser(response?.data?.data?.selectedUser || null)
    }

    // useEffect(() => {
    //     if (
    //         !userId &&
    //         rolePermissions &&
    //         rolePermissions.data &&
    //         objectLength(rolePermissions.data) > 0 &&
    //         rolePermissions.data?.menus
    //     ) {
    //         setPermissionsAndAccess({
    //             menus: rolePermissions?.data?.menus,
    //             access: rolePermissions?.data?.moduleAccess[0] || {}
    //         })
    //         setPermissionsAccess(
    //             rolePermissions?.data?.moduleAccess[0]?.child.reduce((acc, accessChild) => {
    //                 acc[accessChild.menu_code] = accessChild.user_access
    //                 return acc
    //             }, {})
    //         )
    //         setPermissions(
    //             rolePermissions?.data?.moduleAccess[0]?.child.reduce((acc, accessChild) => {
    //                 acc[accessChild.menu_code] = accessChild.user_access
    //                 return acc
    //             }, {})
    //         )
    //     }
    // }, [rolePermissions, isLoading])

    useEffect(() => {
        if (userId) getMenuMapping(userId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])

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
                    />
                )}
            </Box>
        </Box>
    )
}

export default UserPermissionManagement
