import React, { useState, useEffect } from 'react'
import { Card, CardContent, Avatar, Typography, Button, Grid, Box, Container } from '@mui/material'
import { getAuthUser, useLogoutMutation } from '@app/store/slices/api/authApiSlice'
import { useDispatch } from 'react-redux'
import { useLocalStorage, LOCAL_STORAGE_KEYS } from '@/hooks/useLocalStorage'
import { logout as logoutAction, setLocation } from '@app/store/slices/auth'
import { Logout } from '@mui/icons-material'
import { openSnackbar } from '@/app/store/slices/snackbar'

// Define a modern color scheme for a refined UI
const colors = {
    primary: '#1976d2',
    secondary: '#e3f2fd',
    accent: '#ff9800',
    background: '#fafafa',
    textPrimary: '#212121',
    textSecondary: '#757575'
}

function UserProfilePage() {
    const [logout] = useLogoutMutation()
    const dispatch = useDispatch()
    // eslint-disable-next-line no-unused-vars
    const [_, __, removeToken] = useLocalStorage(LOCAL_STORAGE_KEYS.token, null)
    // eslint-disable-next-line no-unused-vars
    const [___, ____, removeClientLocation] = useLocalStorage(LOCAL_STORAGE_KEYS.clientLocation, null, true)

    const [userData, setUserData] = useState(null)
    const [error, setError] = useState('')

    // const [getAuthUser] = useGetAuthUserMutation()

    // Fetch user data from API on mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // const response = await getAuthUser().unwrap()
                const { data: response } = await dispatch(
                    getAuthUser.initiate('', {
                        meta: { disableLoader: true },
                        subscribe: false,
                        forceRefetch: true
                    })
                )
                setUserData(response?.user || null)
            } catch (err) {
                setError('Failed to fetch user data.')
            }
        }
        fetchUser()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAuthUser])

    const handleLogout = async () => {
        await logout()
        removeClientLocation()
        dispatch(setLocation(null))
        dispatch(logoutAction())
        removeToken()
    }

    useEffect(() => {
        dispatch(
            openSnackbar({
                open: true,
                message: 'We are updating this UI!!',
                variant: 'alert',
                alert: { color: 'info', icon: 'info' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            })
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (error) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    bgcolor: colors.background
                }}
            >
                <Typography variant='h6' color='error' sx={{ mb: 2 }}>
                    {error}
                </Typography>
                <Button variant='contained' onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </Box>
        )
    }

    // Determine avatar: use image if available; otherwise, use initials.
    const avatarContent =
        userData && userData?.image ? (
            <Avatar src={userData?.image} alt={userData?.name} sx={{ width: 100, height: 100 }} />
        ) : (
            <Avatar sx={{ width: 100, height: 100, bgcolor: 'primary.800', color: 'text.paper', fontSize: 40 }}>
                {userData && userData?.name ? userData?.name?.charAt(0)?.toUpperCase() : ''}
            </Avatar>
        )

    return (
        <Container maxWidth='sm' sx={{ py: 2, bgcolor: colors.background, minHeight: '100vh' }}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems='center' justifyContent='center'>
                        <Grid item xs={12} container justifyContent='center'>
                            {avatarContent}
                        </Grid>
                        <Grid item xs={12} container justifyContent='center'>
                            <Typography
                                variant='h5'
                                sx={{ fontWeight: 600, color: colors.textPrimary, mt: 2, textTransform: 'capitalize' }}
                            >
                                {userData?.name}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} container justifyContent='center'>
                            <Typography variant='body1' sx={{ color: colors.textSecondary }}>
                                {userData?.email}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} container justifyContent='center'>
                            <Typography variant='body2' sx={{ color: colors?.textSecondary }}>
                                {userData?.contact_no}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.bgLight', borderRadius: 2 }}>
                                <Typography variant='subtitle1' sx={{ color: colors?.textPrimary, fontWeight: 500 }}>
                                    Recent Activity
                                </Typography>
                                <Typography variant='body2' sx={{ color: colors?.textSecondary }}>
                                    Last Activity:{' '}
                                    {userData?.last_activity ? userData?.last_activity : 'No recent activity'}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} container spacing={2} justifyContent='center' sx={{ mt: 1 }}>
                            <Grid item>
                                <Button variant='outlined' onClick={handleLogout} startIcon={<Logout />}>
                                    Logout
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Container>
    )
}

export default UserProfilePage
