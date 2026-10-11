import { useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    Alert,
    Box,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material'
import { Add, DeleteOutline, Edit, Lock } from '@mui/icons-material'
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    useDeleteClientRoleMutation,
    useGetClientRolesQuery,
    useGetMainRolesQuery
} from '@/app/store/slices/api/roleSlice'
import { LoadState } from '@views/permissions/PermissionParts'
import { accessMeta, isPlatformUser, plural, whyNotDeletable } from '@views/permissions/menuAccess'

/** @description the super admin's view: the platform's two roles are fixed; agencies make their own */
function PlatformRoles() {
    const { data, isFetching, error, refetch } = useGetMainRolesQuery()
    const roles = Array.isArray(data?.data) ? data.data : []
    const meaning = {
        ADMIN: 'You — the platform’s super admin.',
        CLIENT: 'Each agency’s own login, made with the agency.'
    }
    return (
        <MainCard content={false}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant='h3' sx={{ mb: 2 }}>
                    Roles
                </Typography>
                <Alert severity='info' sx={{ mb: 2 }}>
                    The platform has two roles: ADMIN (you) and CLIENT (each agency’s own login). Agencies create their
                    own roles.
                </Alert>
                {isFetching || error ? (
                    <LoadState
                        loading={isFetching}
                        error={error}
                        onRetry={refetch}
                        fallback='Couldn’t load the roles.'
                    />
                ) : (
                    <Stack spacing={1.5}>
                        {roles.map(role => (
                            <Paper
                                key={role.id}
                                variant='outlined'
                                sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}
                            >
                                <Lock fontSize='small' color='disabled' />
                                <Box>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        {role.name}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        {meaning[String(role.name).toUpperCase()] || 'A platform role.'}
                                    </Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Box>
        </MainCard>
    )
}

function DeleteRoleDialog({ role, onClose }) {
    const dispatch = useDispatch()
    const [deleteClientRole, { isLoading }] = useDeleteClientRoleMutation()
    const [problem, setProblem] = useState('')

    const confirm = async () => {
        setProblem('')
        try {
            const reply = await deleteClientRole(role.id).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: reply?.message || `Role ${role.name} deleted`,
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
            onClose()
        } catch (failure) {
            setProblem(failure?.data?.message || 'Couldn’t delete the role')
        }
    }

    return (
        <Dialog open={Boolean(role)} onClose={isLoading ? undefined : onClose} maxWidth='xs' fullWidth>
            <DialogTitle>Delete role {role?.name}?</DialogTitle>
            <DialogContent>
                <Typography variant='body2'>
                    The role and the screens it gives are removed. Nobody holds it, so no one loses access.
                </Typography>
                {problem ? (
                    <Alert severity='error' sx={{ mt: 2 }}>
                        {problem}
                    </Alert>
                ) : null}
            </DialogContent>
            <DialogActions>
                <CustomButton variant='outlined' color='secondary' onClick={onClose} disabled={isLoading}>
                    Cancel
                </CustomButton>
                <CustomButton variant='clickable' color='error' onClick={confirm} loading={isLoading}>
                    Delete
                </CustomButton>
            </DialogActions>
        </Dialog>
    )
}

DeleteRoleDialog.propTypes = {
    role: PropTypes.shape({ id: PropTypes.number, name: PropTypes.string }),
    onClose: PropTypes.func.isRequired
}

/** @description an agency's own roles: what each may do, how many hold it, how many screens it opens */
function AgencyRoles() {
    const navigate = useNavigate()
    const { data, isFetching, error, refetch } = useGetClientRolesQuery()
    const [toDelete, setToDelete] = useState(null)
    const roles = Array.isArray(data?.data) ? data.data : []
    const onlySystem = roles.length > 0 && roles.every(role => role.isSystem)

    return (
        <MainCard content={false}>
            <Box sx={{ px: { xs: 2, md: 3 }, py: 2.5 }}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    justifyContent='space-between'
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    sx={{ mb: 2.5 }}
                >
                    <Box>
                        <Typography variant='h3'>Role Master</Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                            Everyone with a role opens its screens; a user can be given extra screens on their own.
                        </Typography>
                    </Box>
                    <UiAccessGuard type='create'>
                        <CustomButton
                            variant='clickable'
                            color='primary'
                            onClick={() => navigate('/userManagement/role/create')}
                        >
                            Add Role
                            <Add sx={{ ml: 0.5, fontSize: 18 }} />
                        </CustomButton>
                    </UiAccessGuard>
                </Stack>

                {(isFetching && !data) || error ? (
                    <LoadState
                        loading={isFetching}
                        error={error}
                        onRetry={refetch}
                        fallback='Couldn’t load the roles.'
                    />
                ) : (
                    <>
                        {onlySystem ? (
                            <Alert severity='info' sx={{ mb: 2 }}>
                                Only ADMIN so far. Create roles such as SALES or ACCOUNTS to give your team the screens
                                they need.
                            </Alert>
                        ) : null}
                        <TableContainer component={Paper} variant='outlined'>
                            <Table size='small' sx={{ minWidth: 720 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Role</TableCell>
                                        <TableCell>Access</TableCell>
                                        <TableCell align='right'>Users</TableCell>
                                        <TableCell align='right'>Screens</TableCell>
                                        <TableCell align='right'>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {roles.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                align='center'
                                                sx={{ py: 4, color: 'text.secondary' }}
                                            >
                                                No roles yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : null}
                                    {roles.map(role => {
                                        const level = accessMeta(role.access)
                                        const blocked = whyNotDeletable(role)
                                        const screens = Array.isArray(role.menuIds) ? role.menuIds.length : 0
                                        return (
                                            <TableRow key={role.id} hover>
                                                <TableCell sx={{ maxWidth: 360 }}>
                                                    <Stack direction='row' spacing={1} alignItems='center'>
                                                        <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                                            {role.name}
                                                        </Typography>
                                                        {role.isSystem ? (
                                                            <Tooltip title='Made with the agency: its name and access stay, and it can’t be deleted'>
                                                                <Chip
                                                                    size='small'
                                                                    label='System'
                                                                    icon={<Lock sx={{ fontSize: 14 }} />}
                                                                />
                                                            </Tooltip>
                                                        ) : null}
                                                    </Stack>
                                                    {role.description ? (
                                                        <Typography variant='body2' color='text.secondary'>
                                                            {role.description}
                                                        </Typography>
                                                    ) : null}
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title={role.accessLabel || level.label}>
                                                        <Chip
                                                            size='small'
                                                            color={level.color}
                                                            variant='outlined'
                                                            label={level.title}
                                                        />
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell align='right'>{plural(role.users ?? 0, 'user')}</TableCell>
                                                <TableCell align='right'>{plural(screens, 'screen')}</TableCell>
                                                <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                                                    <UiAccessGuard type='edit'>
                                                        <Tooltip title='Edit role'>
                                                            <IconButton
                                                                size='small'
                                                                aria-label={`Edit ${role.name}`}
                                                                onClick={() =>
                                                                    navigate(`/userManagement/role/${role.id}`)
                                                                }
                                                            >
                                                                <Edit fontSize='small' sx={{ fill: '#60498a' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title={blocked || 'Delete role'}>
                                                            <span>
                                                                <IconButton
                                                                    size='small'
                                                                    aria-label={`Delete ${role.name}`}
                                                                    disabled={Boolean(blocked)}
                                                                    onClick={() => setToDelete(role)}
                                                                >
                                                                    <DeleteOutline
                                                                        fontSize='small'
                                                                        color={blocked ? 'disabled' : 'error'}
                                                                    />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </UiAccessGuard>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </Box>
            {toDelete ? <DeleteRoleDialog role={toDelete} onClose={() => setToDelete(null)} /> : null}
        </MainCard>
    )
}

function SetupRoleTable() {
    const auth = useSelector(state => state.auth)
    // ? the super admin has no agency: /role/client would fail for them
    return isPlatformUser(auth) ? <PlatformRoles /> : <AgencyRoles />
}

export default SetupRoleTable
