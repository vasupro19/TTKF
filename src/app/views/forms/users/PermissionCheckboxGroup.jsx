import { useState, useEffect } from 'react'
import { Box, Typography, Grid, FormControlLabel, Checkbox, Button, Paper, styled, Divider } from '@mui/material'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import { objectLength } from '@/utilities'

let valuesToSubmit = {}
function PermissionCheckboxGroup({ handleSubmitAll, permissionsAndAccess, modulePermissions }) {
    const dispatch = useDispatch()
    const [canSelect, setCanSelect] = useState(false)

    const [tempPermission, setTempPermission] = useState(null)
    // here uncomment to make dark theme cards
    const StyledCheckbox = styled(Checkbox)(() => ({
        paddingTop: '2px',
        paddingBottom: '2px'
    }))

    const checkCanSelect = () => {
        if (!canSelect) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please select at least one module access first.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return false
        }
        return true
    }
    const checkUserAccess = (access = []) => {
        if (!access.filter(Boolean).length) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'You do not have access to change this permission.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return false
        }
        return true
    }

    const updateChildren = (parentChecked, children) => {
        const spreadChildren = { ...children }
        if (spreadChildren && Object.keys(spreadChildren).length)
            Object.keys(spreadChildren).map(key => {
                const childAccess = spreadChildren[key].user_access === false ? false : parentChecked
                spreadChildren[key].access = childAccess
                if (spreadChildren[key]?.children && Object.keys(spreadChildren[key]?.children).length)
                    spreadChildren[key].children = updateChildren(childAccess, spreadChildren[key].children)
                return key
            })

        return spreadChildren
    }

    const handleParentChange = (section, item) => {
        if (!checkCanSelect()) return
        setTempPermission(prev => {
            const newSection = { ...prev[section] }
            const newParent = { ...newSection.children[item] }
            const parentAccess = !newParent.access
            newSection.access = newSection.access || parentAccess
            newParent.access = parentAccess

            if (!checkUserAccess([newSection.user_access, newParent.user_access])) return prev

            if (newParent?.children && Object.keys(newParent?.children).length)
                newParent.children = updateChildren(parentAccess, newParent?.children)

            newSection.children[item] = newParent
            return { ...prev, [section]: newSection }
        })
    }

    const handleChildChange = (section, item, child) => {
        if (!checkCanSelect()) return
        setTempPermission(prev => {
            const newSection = { ...prev[section] }
            const newParent = { ...newSection.children[item] }
            const newChild = { ...newSection.children[item].children[child] }

            const childAccess = !newChild.access
            newChild.access = childAccess
            newParent.access = newChild.access || childAccess
            newSection.access = newSection.access || childAccess

            if (!checkUserAccess([newSection.user_access, newParent.user_access, newChild.user_access])) return prev

            if (newChild?.children && Object.keys(newChild?.children).length)
                newChild.children = updateChildren(childAccess, newChild?.children)

            newParent.children[child] = newChild
            newSection.children[item] = newParent

            return { ...prev, [section]: newSection }
        })
    }

    const handleSectionChange = section => {
        if (!checkCanSelect()) return
        setTempPermission(prev => {
            const newSection = { ...prev[section] }
            const sectionAccess = !newSection.access
            newSection.access = sectionAccess

            if (!checkUserAccess([newSection.user_access])) return prev
            if (newSection?.children) newSection.children = updateChildren(sectionAccess, newSection?.children)

            return { ...prev, [section]: newSection }
        })
    }

    const setDataToSubmit = data => {
        Object.values(data).map(values => {
            if (values.access) valuesToSubmit[values.code] = values.id.toString()
            if (values.children && Object.keys(values.children)) {
                setDataToSubmit(values.children)
            }
            return values
        })
        return valuesToSubmit
    }

    const handleSubmit = () => {
        valuesToSubmit = {}

        const formData = setDataToSubmit(tempPermission)

        if (!Object.keys(formData).length) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'You must enable at least one permission to submit.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return
        }

        handleSubmitAll(formData)
    }

    const getPermissionObjects = menu => {
        if (!menu || !menu.length) return {}
        const permissionObject = menu.reduce((acc, item) => {
            acc[item.menu_code] = {
                label: item.display_name,
                user_access: modulePermissions === false ? false : item.user_access,
                id: item.id,
                access: !!item?.selected_role_access,
                code: item.menu_code
            }
            const children = getPermissionObjects(item?.child)
            acc[item.menu_code].children = children
            return acc
        }, {})
        return permissionObject
    }

    useEffect(() => {
        if (permissionsAndAccess && objectLength(permissionsAndAccess) === 2)
            setTempPermission(getPermissionObjects(permissionsAndAccess.menus))
        if (modulePermissions && objectLength(modulePermissions))
            setCanSelect(Object.values(modulePermissions).reduce((acc, moduleAccess) => acc || moduleAccess, false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permissionsAndAccess, modulePermissions])

    return (
        <Box p={1.5} sx={{ borderRadius: '8px', border: '1px solid #e2e2e2', backgroundColor: '#ececec' }}>
            <Grid container spacing={1.2}>
                {tempPermission &&
                    Object.entries(tempPermission).map(([section, sectionData]) => (
                        <Grid item xs={12} md={4} key={section} sx={{ display: 'flex', flexDirection: 'column' }}>
                            {/* here uncomment to make dark theme cards */}
                            <Paper
                                elevation={3}
                                sx={{
                                    padding: 2,
                                    flex: 1,
                                    // backgroundColor: '#3c3c44',
                                    borderRadius: '8px'
                                    // color: '#fff'
                                }}
                            >
                                <Box display='flex' alignItems='center' mb={1}>
                                    <FormControlLabel
                                        control={
                                            <StyledCheckbox
                                                checked={sectionData?.access}
                                                disabled={!sectionData?.user_access}
                                                onChange={() => handleSectionChange(section)}
                                                size='small'
                                            />
                                        }
                                        label={
                                            <Typography
                                                variant='h4'
                                                fontWeight='700'
                                                // here uncomment to make dark theme cards
                                                sx={{
                                                    // color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    color: !sectionData?.user_access ? 'text.disabled' : 'inherit'
                                                }}
                                            >
                                                {sectionData?.label}
                                                {sectionData?.icon && (
                                                    <sectionData.icon sx={{ mr: 1, fontSize: '18px' }} />
                                                )}{' '}
                                                {/* Render the icon here */}
                                            </Typography>
                                        }
                                    />
                                </Box>
                                <Box
                                    sx={{
                                        '&::before, &::after': {
                                            display: 'none' // Removes default lines on either side
                                        },
                                        boxShadow: '1px 2px 7px 0px #11182754',
                                        backgroundColor: '#a1a1aa',
                                        height: '0.5px'
                                    }}
                                >
                                    {' '}
                                </Box>
                                {Object.entries(sectionData?.children).map(([itemKey, itemData]) => (
                                    <Box key={itemKey} sx={{ pl: 2 }}>
                                        <FormControlLabel
                                            control={
                                                <StyledCheckbox
                                                    disabled={!itemData?.user_access}
                                                    checked={itemData?.access}
                                                    onChange={() => handleParentChange(section, itemKey)}
                                                    size='small'
                                                />
                                            }
                                            label={
                                                <Typography
                                                    sx={{
                                                        // color: '#fff',
                                                        fontWeight: '500',
                                                        fontSize: '14px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        color: !itemData?.user_access ? 'text.disabled' : 'inherit'
                                                    }}
                                                >
                                                    {itemData?.label}
                                                    {itemData?.icon && (
                                                        <itemData.icon sx={{ mr: 1, fontSize: '18px' }} />
                                                    )}{' '}
                                                    {/* Render the icon here */}
                                                </Typography>
                                            }
                                            sx={{
                                                marginY: '4px',
                                                width: '100%'
                                            }}
                                        />
                                        {itemData?.children && (
                                            <Grid
                                                container
                                                spacing={1}
                                                sx={{
                                                    ml: 3.4,
                                                    pl: 1,
                                                    width: 'auto'
                                                }}
                                            >
                                                {Object.entries(itemData?.children).map(([child, childData]) => (
                                                    <FormControlLabel
                                                        key={child}
                                                        disabled={!childData?.user_access}
                                                        control={
                                                            <StyledCheckbox
                                                                checked={childData?.access}
                                                                disabled={!childData?.user_access}
                                                                onChange={() =>
                                                                    handleChildChange(section, itemKey, child)
                                                                }
                                                                size='small'
                                                            />
                                                        }
                                                        label={childData?.label}
                                                        sx={{ marginY: '2px' }}
                                                    />
                                                ))}
                                            </Grid>
                                        )}
                                        <Divider
                                            sx={{
                                                '&::before, &::after': {
                                                    display: 'none' // Removes default lines on either side
                                                },
                                                boxShadow: '0px 2px 4px #ffffff45', // Subtle shadow
                                                backgroundColor: 'gray', // Line color
                                                height: '0.2px' // Line thickness
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Paper>
                        </Grid>
                    ))}
            </Grid>

            <Box mt={4} display='flex' justifyContent='flex-end'>
                <Button variant='contained' color='primary' onClick={handleSubmit}>
                    Submit
                </Button>
            </Box>
        </Box>
    )
}

PermissionCheckboxGroup.propTypes = {
    handleSubmitAll: PropTypes.func.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    permissionsAndAccess: PropTypes.object,
    // eslint-disable-next-line react/forbid-prop-types
    modulePermissions: PropTypes.object
}

export default PermissionCheckboxGroup
