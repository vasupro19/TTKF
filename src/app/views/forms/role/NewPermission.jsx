import { useMemo } from 'react'
import { Typography } from '@mui/material'
import { useLocation, useParams } from 'react-router-dom'
import { useMenuByConfigQuery, useUpdateMenuAccessMutation } from '@app/store/slices/api/menuSlice'
import MenuAccessPage from '@views/permissions/MenuAccessPage'

const NO_MENUS = []

/**
 * @description the super admin gives an agency the screens it may use (its own login, and what its admin can pass on).
 * Route /master/client/permissions/:id/:email — :id is the agency, :email its own login.
 */
export default function UserMenuAccess() {
    const params = useParams()
    const location = useLocation()
    const email = params.email || ''
    const query = new URLSearchParams({ clientId: params.id || '', email }).toString()

    const { data, isFetching, error, refetch } = useMenuByConfigQuery(`?${query}`, { skip: !params.id || !email })
    const [updateMenuAccess] = useUpdateMenuAccessMutation()

    const menus = useMemo(() => (Array.isArray(data?.data) ? data.data : NO_MENUS), [data])
    const agency = location.state?.name

    const save = menuIds => updateMenuAccess({ menuIds, userId: email }).unwrap()

    return (
        <MenuAccessPage
            title={agency ? `Screens for ${agency}` : 'Screens for this agency'}
            backTo='/master/client'
            backLabel='Clients'
            subtitle={
                <>
                    <Typography variant='body1' sx={{ fontWeight: 600 }} component='span'>
                        {email || 'No agency chosen'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                        The agency’s own login opens these screens, and its admin can give them to the agency’s roles
                        and users.
                    </Typography>
                </>
            }
            menus={menus}
            loading={isFetching && !data}
            error={error || (!params.id || !email ? { message: 'No agency in the link.' } : null)}
            onRetry={params.id && email ? refetch : null}
            onSave={save}
            emptyText='No screens are set up on the platform yet.'
        />
    )
}
