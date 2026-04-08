import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, CircularProgress, Grid, TextField, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useCreateClientRoleMutation, useGetClientRoleByIdQuery } from '@/app/store/slices/api/roleSlice'

function AccessManagement() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { id: roleId } = useParams()
    const { user } = useSelector(state => state.auth)
    const [name, setName] = useState('')

    const [createClientRole, { isLoading: isCreating }] = useCreateClientRoleMutation()
    const { data: roleResponse, isLoading: isRoleLoading } = useGetClientRoleByIdQuery(roleId, { skip: !roleId })

    const title = useMemo(() => {
        if (roleId) return 'Edit Role'
        return 'Create Role'
    }, [roleId])
    const isSubmitting = isCreating
    const submitLabel = useMemo(() => {
        if (isSubmitting) return 'Saving...'
        if (roleId) return 'Update Role'
        return 'Create Role'
    }, [isSubmitting, roleId])

    useEffect(() => {
        if (roleResponse?.data?.name) {
            setName(roleResponse.data.name)
        }
    }, [roleResponse])

    const handleSubmit = async () => {
        const trimmedName = name.trim()

        if (trimmedName.length < 3) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Role name must be at least 3 characters.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return
        }

        try {
            if (roleId) {
                throw new Error('Client role update API is not available in TTKB yet.')
            }

            if (!user?.clientId) {
                throw new Error('Client context is required to create a role.')
            }
            const response = await createClientRole({ name: trimmedName, clientId: user.clientId }).unwrap()

            dispatch(
                openSnackbar({
                    open: true,
                    message: response?.message || `Role ${roleId ? 'updated' : 'created'} successfully.`,
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            navigate('/userManagement/role')
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || error?.message || 'Unable to save role.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    return (
        <MainCard content={false}>
            <Box sx={{ p: 3 }}>
                <Typography variant='h3' sx={{ mb: 3 }}>
                    {title}
                </Typography>

                {roleId && isRoleLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8} lg={6}>
                            <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>
                                Role Name
                            </Typography>
                            <TextField
                                fullWidth
                                value={name}
                                onChange={event => setName(event.target.value)}
                                placeholder='Enter role name'
                                size='small'
                            />
                        </Grid>

                        {roleId ? (
                            <Grid item xs={12}>
                                <Typography variant='body2' color='warning.main'>
                                    Client role update is not exposed by the current TTKB API yet. Creation is wired,
                                    but edit needs a client-role update endpoint from backend.
                                </Typography>
                            </Grid>
                        ) : null}

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <CustomButton variant='outlined' color='secondary' onClick={() => navigate(-1)}>
                                    Cancel
                                </CustomButton>
                                <CustomButton
                                    variant='clickable'
                                    color='primary'
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !!roleId}
                                >
                                    {submitLabel}
                                </CustomButton>
                            </Box>
                        </Grid>
                    </Grid>
                )}
            </Box>
        </MainCard>
    )
}

export default AccessManagement
