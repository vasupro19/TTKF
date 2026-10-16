import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import { Add, DeleteOutline, Download, Edit, FilterAltOff, Lock, Search } from '@mui/icons-material'
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import ListEmptyState from '@core/listing/ListEmptyState'
import { csvOf, downloadCsv } from '@core/listing/listingFacts'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    useDeleteClientRoleMutation,
    useGetClientRolesQuery,
    useGetMainRolesQuery
} from '@/app/store/slices/api/roleSlice'
import { LoadState } from '@views/permissions/PermissionParts'
import { accessMeta, isPlatformUser, plural, whyNotDeletable } from '@views/permissions/menuAccess'
import { ACCESS_OPTIONS, ROLE_CSV_COLUMNS, countText, filterRoles } from './roleList'

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

function RoleRow({ role, onEdit, onDelete }) {
    const level = accessMeta(role.access)
    const blocked = whyNotDeletable(role)
    const screens = Array.isArray(role.menuIds) ? role.menuIds.length : 0
    return (
        <TableRow hover>
            <TableCell sx={{ maxWidth: 360 }}>
                <Stack direction='row' spacing={1} alignItems='center'>
                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                        {role.name}
                    </Typography>
                    {role.isSystem ? (
                        <Tooltip title='Made with the agency: its name and access stay, and it can’t be deleted'>
                            <Chip size='small' label='System' icon={<Lock sx={{ fontSize: 14 }} />} />
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
                    <Chip size='small' color={level.color} variant='outlined' label={level.title} />
                </Tooltip>
            </TableCell>
            <TableCell align='right'>{plural(role.users ?? 0, 'user')}</TableCell>
            <TableCell align='right'>{plural(screens, 'screen')}</TableCell>
            <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                <UiAccessGuard type='edit'>
                    <Tooltip title='Edit role'>
                        <IconButton size='small' aria-label={`Edit ${role.name}`} onClick={onEdit}>
                            <Edit fontSize='small' sx={{ fill: '#60498a' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={blocked || 'Delete role'}>
                        <span>
                            <IconButton
                                size='small'
                                aria-label={`Delete ${role.name}`}
                                disabled={Boolean(blocked)}
                                onClick={onDelete}
                            >
                                <DeleteOutline fontSize='small' color={blocked ? 'disabled' : 'error'} />
                            </IconButton>
                        </span>
                    </Tooltip>
                </UiAccessGuard>
            </TableCell>
        </TableRow>
    )
}

RoleRow.propTypes = {
    role: PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        description: PropTypes.string,
        access: PropTypes.string,
        accessLabel: PropTypes.string,
        users: PropTypes.number,
        menuIds: PropTypes.arrayOf(PropTypes.number),
        isSystem: PropTypes.bool
    }).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
}

/** @description an agency's own roles: what each may do, how many hold it, how many screens it opens */
function AgencyRoles() {
    const navigate = useNavigate()
    const [params, setParams] = useSearchParams()
    const { data, isFetching, error, refetch } = useGetClientRolesQuery()
    const [toDelete, setToDelete] = useState(null)
    const [search, setSearch] = useState('')
    const roles = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data])
    const onlySystem = roles.length > 0 && roles.every(role => role.isSystem)

    const rawAccess = params.get('access') || ''
    const access = ACCESS_OPTIONS.some(option => option.value === rawAccess) ? rawAccess : ''
    const setAccess = value =>
        setParams(
            previous => {
                const next = new URLSearchParams(previous)
                if (value) next.set('access', value)
                else next.delete('access')
                return next
            },
            { replace: true }
        )

    const shown = useMemo(() => filterRoles(roles, { search, access }), [roles, search, access])
    const hasFilters = Boolean(search.trim() || access)
    const clearFilters = () => {
        setSearch('')
        setAccess('')
    }
    let emptyKind = null
    if (!roles.length) emptyKind = 'first'
    else if (!shown.length) emptyKind = 'filtered'

    return (
        <MainCard content={false} sx={{ py: '2px' }}>
            <Stack spacing={2} sx={{ py: 1.5 }}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    justifyContent='space-between'
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                >
                    <Box>
                        <Typography variant='h3'>Roles</Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                            Everyone with a role opens its screens; a user can be given extra screens on their own.
                        </Typography>
                    </Box>
                    <Stack direction='row' spacing={1.5} alignItems='center'>
                        <UiAccessGuard>
                            <Button
                                variant='outlined'
                                startIcon={<Download />}
                                disabled={!shown.length}
                                onClick={() => downloadCsv(csvOf(shown, ROLE_CSV_COLUMNS), 'roles.csv')}
                                sx={{ textTransform: 'none' }}
                            >
                                Export CSV
                            </Button>
                        </UiAccessGuard>
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
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={1.5}
                            alignItems={{ md: 'center' }}
                            useFlexGap
                            flexWrap='wrap'
                        >
                            <TextField
                                size='small'
                                placeholder='Search role name or description'
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                sx={{ width: { xs: '100%', md: 340 }, '& .MuiInputBase-root': { height: 34 } }}
                                InputProps={{
                                    inputProps: { 'aria-label': 'Search roles' },
                                    startAdornment: (
                                        <InputAdornment position='start'>
                                            <Search fontSize='small' />
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <TextField
                                select
                                size='small'
                                label='Access'
                                value={access || 'All'}
                                onChange={event => setAccess(event.target.value === 'All' ? '' : event.target.value)}
                                sx={{ width: { xs: '100%', md: 180 }, '& .MuiInputBase-root': { height: 34 } }}
                            >
                                <MenuItem value='All'>All</MenuItem>
                                {ACCESS_OPTIONS.map(option => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                            {hasFilters && (
                                <CustomButton
                                    variant='text'
                                    customStyles={{
                                        color: 'error.main',
                                        '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                                    }}
                                    startIcon={<FilterAltOff />}
                                    onClick={clearFilters}
                                >
                                    Clear filters
                                </CustomButton>
                            )}
                            {shown.length > 0 && (
                                <Typography variant='body2' color='text.secondary' sx={{ ml: { md: 'auto' } }}>
                                    {countText(shown.length, roles.length)}
                                </Typography>
                            )}
                        </Stack>

                        {onlySystem ? (
                            <Alert severity='info'>
                                Only ADMIN so far. Create roles such as SALES or ACCOUNTS to give your team the screens
                                they need.
                            </Alert>
                        ) : null}

                        {emptyKind ? (
                            <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: '12px' }}>
                                <ListEmptyState
                                    kind={emptyKind}
                                    noun='roles'
                                    text='Create roles such as SALES or ACCOUNTS to give your team the screens they need.'
                                    canAdd
                                    addLabel='Add Role'
                                    onAdd={() => navigate('/userManagement/role/create')}
                                    onClear={clearFilters}
                                />
                            </Box>
                        ) : (
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
                                        {shown.map(role => (
                                            <RoleRow
                                                key={role.id}
                                                role={role}
                                                onEdit={() => navigate(`/userManagement/role/${role.id}`)}
                                                onDelete={() => setToDelete(role)}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </>
                )}
            </Stack>
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
