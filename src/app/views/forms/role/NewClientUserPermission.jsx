import { useMemo } from 'react'
import { Chip, Stack, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { useLocation, useParams } from 'react-router-dom'
import { useMenuByConfigClientQuery, useUpdateMenuAccessClientMutation } from '@app/store/slices/api/menuSlice'
import MenuAccessPage from '@views/permissions/MenuAccessPage'
import { roleNameOf } from '@views/permissions/menuAccess'

const NO_MENUS = []

/**
 * @description the screens one agency user opens: their role's (locked) plus any given to them alone.
 * Route /master/client/permissions/user/:id/:email — :id is the agency (the super admin needs it).
 */
export default function UserMenuAccessClient() {
    const params = useParams()
    const location = useLocation()

    // ? the agency: from the link, else the signed-in user's own. An agency admin's own agency is used by the API
    // ? anyway; the super admin's request needs it to pick the workspace (it read "null" and failed)
    const myClientId = useSelector(state => state.auth.clientId ?? state.auth.user?.clientId ?? null)
    const linkClientId = /^\d+$/.test(String(params.id || '')) ? params.id : null
    const clientId = linkClientId || (myClientId ? String(myClientId) : null)
    const email = params.email || ''
    const query = new URLSearchParams({ ...(clientId ? { clientId } : {}), email }).toString()

    const { data, isFetching, error, refetch } = useMenuByConfigClientQuery(`?${query}`, { skip: !email })
    const [updateMenuAccessClient] = useUpdateMenuAccessClientMutation()

    const menus = useMemo(() => (Array.isArray(data?.data) ? data.data : NO_MENUS), [data])
    const roleName = roleNameOf(menus) || location.state?.role || null
    const name = location.state?.name
    const fromRole = menus.some(menu => menu.fromRole)
    let hint = 'This user has no role yet: only the screens turned on here open for them.'
    if (fromRole)
        hint = 'Screens from the role are locked — change them on the role. Turn on extra screens for this user alone.'
    else if (roleName)
        hint = `The role ${roleName} gives no screens yet: only the screens turned on here open for this user.`

    // ? only the user's own extra screens are sent: what the role gives stays on the role
    const save = menuIds =>
        updateMenuAccessClient({
            menuIds,
            userId: email,
            ...(clientId ? { clientId: Number(clientId) } : {})
        }).unwrap()

    return (
        <MenuAccessPage
            title='Screens for this user'
            backTo='/master/user'
            backLabel='Users'
            subtitle={
                <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                    <Typography variant='body1' sx={{ fontWeight: 600 }} component='span'>
                        {name ? `${name} · ${email}` : email || 'No user chosen'}
                    </Typography>
                    {roleName ? <Chip size='small' color='primary' label={`Role ${roleName}`} /> : null}
                    <Typography variant='body2' color='text.secondary' component='span'>
                        {hint}
                    </Typography>
                </Stack>
            }
            menus={menus}
            loading={isFetching && !data}
            error={error || (!email ? { message: 'No user in the link.' } : null)}
            onRetry={email ? refetch : null}
            onSave={save}
            emptyText='The platform hasn’t given this agency any screens yet.'
        />
    )
}
