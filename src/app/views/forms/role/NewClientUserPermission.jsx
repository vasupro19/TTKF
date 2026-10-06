import { useEffect, useState } from 'react'
import {
    Box,
    Typography,
    Grid,
    Checkbox,
    FormControlLabel,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Alert,
    styled
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useParams } from 'react-router-dom'
import { useMenuByConfigClientQuery, useUpdateMenuAccessClientMutation } from '@app/store/slices/api/menuSlice' // <-- make sure mutation is defined here

const StyledCheckbox = styled(Checkbox)(() => ({
    paddingTop: '2px',
    paddingBottom: '2px'
}))

export default function UserMenuAccessClient() {
    const params = useParams()
    const dispatch = useDispatch()
    const [menuDialogOpen, setMenuDialogOpen] = useState(false)
    const [menus, setMenus] = useState([])
    const [permission, setPermission] = useState([])

    // ? the agency: from the link, else the signed-in user's own. An agency admin's own agency is used by the API
    // ? anyway; the super admin's request needs it to pick the workspace (it read "null" and failed)
    const myClientId = useSelector(state => state.auth.clientId ?? state.auth.user?.clientId ?? null)
    const linkClientId = /^\d+$/.test(String(params.id || '')) ? params.id : null
    const clientId = linkClientId || (myClientId ? String(myClientId) : null)
    const email = params.email || ''
    const query = new URLSearchParams({ ...(clientId ? { clientId } : {}), email }).toString()

    // ✅ Fetch menu access data using RTK Query
    const {
        data,
        isFetching,
        error: loadError,
        refetch
    } = useMenuByConfigClientQuery(`?${query}`, {
        skip: !email
    })

    // ✅ Mutation to update access
    const [updateMenuAccessClient, { isLoading: isUpdating }] = useUpdateMenuAccessClientMutation(`?${query}`)

    useEffect(() => {
        if (data?.data) {
            setMenus(data.data)
        }
    }, [data])
    useEffect(() => {
        if (menus && menus.length > 0) {
            // Find all menus that already have access and set their IDs as the initial state
            const alreadyHasAccess = menus
                .filter(menu => menu.access === true || menu.access === 1)
                .map(menu => menu.id)

            setPermission(alreadyHasAccess)
        }
    }, [menus]) //
    // ✅ Toggle access and update backend
    const handleMenuAccessChange = async menuId => {
        try {
            setPermission(
                prev =>
                    // eslint-disable-next-line no-nested-ternary
                    Array.isArray(prev) // make sure prev is always an array
                        ? prev.includes(menuId)
                            ? prev.filter(id => id !== menuId)
                            : [...prev, menuId]
                        : [menuId] // fallback if prev is corrupted
            )

            // update menus state for UI
            setMenus(prev => prev.map(menu => (menu.id === menuId ? { ...menu, access: !menu.access } : menu)))
        } catch (error) {
            console.error(error)
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Failed to update access',
                    variant: 'alert',
                    alert: { color: 'error' }
                })
            )
        }
    }
    const submit = async () => {
        try {
            // ? unwrap: a refused save (403) used to show "Access granted successfully"
            const reply = await updateMenuAccessClient({
                menuIds: permission,
                userId: email,
                ...(clientId ? { clientId: Number(clientId) } : {})
            }).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: reply?.message || 'Access granted successfully',
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
            setMenuDialogOpen(false)
            refetch() // optionally refetch menus
        } catch (error) {
            console.error(error)
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Failed to update access',
                    variant: 'alert',
                    alert: { color: 'error' }
                })
            )
        }
    }
    if (isFetching) return <CircularProgress />

    return (
        <Box p={2}>
            <Grid container spacing={2} alignItems='center'>
                <Grid item xs={3}>
                    <Typography variant='h6'>User Menu Access</Typography>
                    <Typography variant='body2' color='text.secondary'>
                        {email}
                    </Typography>
                    <IconButton onClick={() => setMenuDialogOpen(true)}>
                        <SettingsIcon />
                    </IconButton>
                </Grid>
            </Grid>

            {loadError ? (
                <Alert severity='error' sx={{ mt: 2 }}>
                    {loadError?.data?.message || 'Couldn’t load this user’s menus.'}
                </Alert>
            ) : null}

            {/* Menu Access Dialog */}
            <Dialog open={menuDialogOpen} onClose={() => setMenuDialogOpen(false)} maxWidth='sm' fullWidth>
                <DialogTitle>Set Menu Access</DialogTitle>
                <DialogContent dividers>
                    {menus.length === 0 && (
                        <Typography variant='body2' color='text.secondary'>
                            No menus found.
                        </Typography>
                    )}

                    {menus.map(menu => (
                        <Box
                            key={menu.id}
                            mb={1}
                            p={1}
                            border={1}
                            borderColor={menu.access ? 'primary.main' : 'grey.300'}
                            borderRadius={1}
                        >
                            <FormControlLabel
                                control={
                                    <StyledCheckbox
                                        checked={!!menu.access}
                                        disabled={isUpdating}
                                        onChange={() => handleMenuAccessChange(menu.id, menu.access)}
                                    />
                                }
                                label={
                                    <Typography variant='subtitle1'>
                                        {menu.label} ({menu.group})
                                    </Typography>
                                }
                            />
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMenuDialogOpen(false)}>Close</Button>
                    <Button onClick={() => submit()} variant='outlined' color='primary'>
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
