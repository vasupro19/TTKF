import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, FormControlLabel, Grid, Paper, Radio, RadioGroup, TextField, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import MainCard from '@core/components/extended/MainCard'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    useCreateClientRoleMutation,
    useGetClientRoleByIdQuery,
    useGetClientRoleMenusQuery,
    useUpdateClientRoleMutation
} from '@/app/store/slices/api/roleSlice'
import MenuAccessEditor from '@views/permissions/MenuAccessEditor'
import { LoadState, PageHeader, UnsavedBar } from '@views/permissions/PermissionParts'
import useLeaveGuard from '@views/permissions/useLeaveGuard'
import {
    accessLevelsWith,
    initialIdsOf,
    isPlatformUser,
    plural,
    roleFormChanges,
    roleNameProblem
} from '@views/permissions/menuAccess'

const NO_MENUS = []
const NEW_ROLE = { name: '', access: 'staff', description: '', menuIds: [] }

/** @description an agency's role: its name, what it may do (access), a description and the screens it opens */
function AccessManagement() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { id: roleId } = useParams()
    const auth = useSelector(state => state.auth)
    const platform = isPlatformUser(auth)
    const isNew = !roleId

    const roleQuery = useGetClientRoleByIdQuery(roleId, { skip: isNew || platform })
    const menusQuery = useGetClientRoleMenusQuery(undefined, { skip: !isNew || platform })
    const { data, isFetching, error, refetch } = isNew ? menusQuery : roleQuery
    const loaded = data?.data || null

    const [createClientRole] = useCreateClientRoleMutation()
    const [updateClientRole] = useUpdateClientRoleMutation()

    const menus = useMemo(() => (Array.isArray(loaded?.menus) ? loaded.menus : NO_MENUS), [loaded])
    const levels = useMemo(() => accessLevelsWith(loaded?.accessOptions), [loaded])
    const isSystem = Boolean(loaded?.isSystem)

    const saved = useMemo(
        () =>
            isNew || !loaded
                ? { ...NEW_ROLE, menuIds: initialIdsOf(menus) }
                : {
                      name: loaded.name || '',
                      access: loaded.access || 'staff',
                      description: loaded.description || '',
                      menuIds: initialIdsOf(menus)
                  },
        [isNew, loaded, menus]
    )
    const [form, setForm] = useState(saved)
    const [touched, setTouched] = useState(false)
    const [saving, setSaving] = useState(false)
    const [problem, setProblem] = useState('')

    useEffect(() => {
        setForm(saved)
    }, [saved])

    const { count, payload } = roleFormChanges(saved, form, { isSystem, isNew })
    const nameProblem = roleNameProblem(form.name, { isSystem })
    const showNameProblem = (touched || String(form.name || '').length > 0) && nameProblem
    useLeaveGuard(count > 0 && !saving)

    const set = field => value => setForm(previous => ({ ...previous, [field]: value }))

    const save = async () => {
        setTouched(true)
        setProblem('')
        if (nameProblem) return
        setSaving(true)
        try {
            const reply = isNew
                ? await createClientRole(payload).unwrap()
                : await updateClientRole({ id: roleId, ...payload }).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: reply?.message || 'Role saved',
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
            navigate('/userManagement/role')
        } catch (failure) {
            const message = failure?.data?.message || failure?.message || 'Couldn’t save the role'
            setProblem(message)
            dispatch(openSnackbar({ open: true, message, variant: 'alert', alert: { color: 'error' } }))
            setSaving(false)
        }
    }

    if (platform) {
        return (
            <MainCard content={false}>
                <Box sx={{ p: { xs: 2, md: 3 } }}>
                    <PageHeader backTo='/userManagement/role' backLabel='Roles' title='Roles' />
                    <Alert severity='info'>
                        The platform has two roles: ADMIN (you) and CLIENT (each agency’s own login). Agencies create
                        their own roles.
                    </Alert>
                </Box>
            </MainCard>
        )
    }

    let title = 'New role'
    if (!isNew) title = loaded?.name ? `Role ${loaded.name}` : 'Edit role'

    return (
        <MainCard content={false} sx={{ overflow: 'visible' }}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
                <PageHeader
                    backTo='/userManagement/role'
                    backLabel='Roles'
                    title={title}
                    subtitle={
                        isNew
                            ? 'Everyone given this role opens the screens chosen below.'
                            : `${plural(loaded?.users ?? 0, 'user')} ${loaded?.users === 1 ? 'has' : 'have'} this role.`
                    }
                />

                {(isFetching && !data) || error ? (
                    <LoadState
                        loading={isFetching}
                        error={error}
                        onRetry={refetch}
                        fallback='Couldn’t load the role.'
                    />
                ) : (
                    <>
                        {isSystem ? (
                            <Alert severity='info' sx={{ mb: 3 }}>
                                {loaded?.name} is the agency’s own role: its name and access can’t change and it can’t
                                be deleted. Its screens and description can.
                            </Alert>
                        ) : null}
                        {problem ? (
                            <Alert severity='error' sx={{ mb: 3 }} onClose={() => setProblem('')}>
                                {problem}
                            </Alert>
                        ) : null}

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={5}>
                                <TextField
                                    fullWidth
                                    size='small'
                                    label='Role name'
                                    value={form.name}
                                    disabled={isSystem}
                                    onChange={event => set('name')(event.target.value)}
                                    onBlur={() => setTouched(true)}
                                    placeholder='e.g. SALES'
                                    inputProps={{ maxLength: 60, style: { textTransform: 'uppercase' } }}
                                    error={Boolean(showNameProblem)}
                                    helperText={
                                        showNameProblem ||
                                        (isSystem ? 'The agency’s own role keeps its name' : 'Saved in capitals')
                                    }
                                />
                            </Grid>
                            <Grid item xs={12} md={7}>
                                <TextField
                                    fullWidth
                                    size='small'
                                    label='Description'
                                    value={form.description}
                                    onChange={event => set('description')(event.target.value)}
                                    placeholder='What people with this role do'
                                    inputProps={{ maxLength: 500 }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant='h5' sx={{ mb: 0.5 }}>
                                    What the role may do
                                </Typography>
                                <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                                    {isSystem
                                        ? 'Fixed for the agency’s own role.'
                                        : 'Decides whose leads and bookings they see, and whether they manage the team.'}
                                </Typography>
                                <RadioGroup value={form.access} onChange={event => set('access')(event.target.value)}>
                                    <Grid container spacing={1.5}>
                                        {levels.map(level => {
                                            const chosen = form.access === level.value
                                            return (
                                                <Grid item xs={12} sm={6} lg={3} key={level.value}>
                                                    <Paper
                                                        variant='outlined'
                                                        sx={{
                                                            height: '100%',
                                                            borderWidth: 2,
                                                            borderColor: chosen ? `${level.color}.main` : 'divider',
                                                            opacity: isSystem && !chosen ? 0.55 : 1
                                                        }}
                                                    >
                                                        <FormControlLabel
                                                            value={level.value}
                                                            disabled={isSystem}
                                                            control={<Radio size='small' color={level.color} />}
                                                            sx={{
                                                                m: 0,
                                                                p: 1.5,
                                                                alignItems: 'flex-start',
                                                                width: '100%',
                                                                height: '100%'
                                                            }}
                                                            label={
                                                                <Box sx={{ pt: 0.75 }}>
                                                                    <Typography
                                                                        variant='subtitle1'
                                                                        sx={{ fontWeight: 600 }}
                                                                    >
                                                                        {level.title}
                                                                    </Typography>
                                                                    <Typography variant='body2' color='text.secondary'>
                                                                        {level.meaning}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                    </Paper>
                                                </Grid>
                                            )
                                        })}
                                    </Grid>
                                </RadioGroup>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant='h5' sx={{ mb: 0.5 }}>
                                    Screens
                                </Typography>
                                <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                                    Everyone with this role opens these. Extra screens for one person are given on their
                                    own permissions page.
                                </Typography>
                                <MenuAccessEditor
                                    menus={menus}
                                    value={form.menuIds}
                                    onChange={set('menuIds')}
                                    disabled={saving}
                                    emptyText='The platform hasn’t given this agency any screens yet.'
                                />
                            </Grid>
                        </Grid>

                        <UnsavedBar
                            count={count}
                            saving={saving}
                            saveLabel={isNew ? 'Create role' : 'Save role'}
                            canSave={!nameProblem}
                            onDiscard={() => {
                                setForm(saved)
                                setTouched(false)
                                setProblem('')
                            }}
                            onSave={save}
                        />
                    </>
                )}
            </Box>
        </MainCard>
    )
}

export default AccessManagement
