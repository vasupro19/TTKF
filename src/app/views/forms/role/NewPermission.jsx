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
    styled
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useParams } from 'react-router-dom'
import { useMenuByConfigQuery, useUpdateMenuAccessMutation } from '@app/store/slices/api/menuSlice' // <-- make sure mutation is defined here

const StyledCheckbox = styled(Checkbox)(() => ({
    paddingTop: '2px',
    paddingBottom: '2px'
}))

export default function UserMenuAccess() {
    const params = useParams()
    const dispatch = useDispatch()
    const [menuDialogOpen, setMenuDialogOpen] = useState(false)
    const [menus, setMenus] = useState([])
    const [permission, setPermission] = useState([])

    const query = new URLSearchParams({ clientId: params.id, email: params.email }).toString()

    // ✅ Fetch menu access data using RTK Query
    const { data, isFetching, refetch } = useMenuByConfigQuery(`?${query}`, {
        skip: !params.id
    })

    // ✅ Mutation to update access
    const [updateMenuAccess, { isLoading: isUpdating }] = useUpdateMenuAccessMutation(`?${query}`)

    useEffect(() => {
        if (data?.data) {
            setMenus(data.data)
        }
    }, [data])
    // Add this useEffect to sync the initial state
    useEffect(() => {
        if (menus && menus.length > 0) {
            // Find all menus that already have access and set their IDs as the initial state
            const alreadyHasAccess = menus
                .filter(menu => menu.access === true || menu.access === 1)
                .map(menu => menu.id)

            setPermission(alreadyHasAccess)
        }
    }, [menus]) // Only runs when the menus list is loaded/changed
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
                    message: 'Failed to update access',
                    variant: 'alert',
                    alert: { color: 'error' }
                })
            )
        }
    }
    const submit = async () => {
        try {
            await updateMenuAccess({ menuIds: permission, userId: params.email })
            dispatch(
                openSnackbar({
                    open: true,
                    message: `Access granted successfully`,
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
                    message: 'Failed to update access',
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
                    <IconButton onClick={() => setMenuDialogOpen(true)}>
                        <SettingsIcon />
                    </IconButton>
                </Grid>
            </Grid>

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
