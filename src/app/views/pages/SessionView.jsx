/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
import React, { useEffect, useState } from 'react'
import {
    Box,
    Typography,
    CardActions,
    Divider,
    IconButton,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Tooltip,
    useTheme,
    alpha
} from '@mui/material'
import {
    Computer as ComputerIcon,
    Smartphone as SmartphoneIcon,
    Tablet as TabletIcon,
    Security as SecurityIcon,
    ExitToApp as ExitToAppIcon
} from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { useLoginMutation, useLogOutSessionMutation } from '@app/store/slices/api/authApiSlice'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useNavigate } from 'react-router-dom'
import MainCard from '@core/components/extended/MainCard'
import { useLocalStorage, LOCAL_STORAGE_KEYS } from '@/hooks/useLocalStorage'
import endSessionPage from '@/assets/illustrations/endSessionPage.svg'
import toggleSession from '@/assets/illustrations/toggleSession.svg'
import CustomButton from '@/core/components/extended/CustomButton'
import { DeleteAnimIcon } from '@/assets/icons/DeleteAnimIcon'

function ActiveSessionLimit() {
    const theme = useTheme()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [login] = useLoginMutation()
    const [sessionLogout] = useLogOutSessionMutation()
    const { userId, credentials, userData } = useSelector(state => state.session)
    const [_, setToken] = useLocalStorage(LOCAL_STORAGE_KEYS.token, null)

    // UI State
    const [loadingStates, setLoadingStates] = useState({})
    const [isEndingAllSessions, setIsEndingAllSessions] = useState(false)

    useEffect(() => {
        if (!userId) {
            navigate('/login')
        }
    }, [userId, navigate])

    // Helper function to get device icon based on session name or user agent
    const getDeviceIcon = sessionName => {
        const name = sessionName?.toLowerCase() || ''
        if (name.includes('mobile') || name.includes('android') || name.includes('iphone')) {
            return <SmartphoneIcon />
        }
        if (name.includes('tablet') || name.includes('ipad')) {
            return <TabletIcon />
        }
        return <ComputerIcon />
    }

    const handleEndAllSessions = async () => {
        setIsEndingAllSessions(true)
        try {
            if (!userId) {
                navigate('/login')
                return
            }

            // Log out each active session
            for (const session of userData.sessions) {
                // eslint-disable-next-line no-await-in-loop
                await sessionLogout({ userId, sessionId: session.id }).unwrap()
            }

            // Log back in with current credentials
            const response = await login(credentials).unwrap()

            if (response.success && response.data && response.data._token) {
                // Store the new token and show a success message
                setToken(response.data._token)
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'All other sessions ended successfully. You are logged in.',
                        variant: 'alert',
                        alert: { color: 'info', icon: 'info' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
                navigate('/dashboard')
            }
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Failed to end sessions. Please try again.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            setIsEndingAllSessions(false)
        }
    }

    const handleLogoutSession = async sessionId => {
        setLoadingStates(prev => ({ ...prev, [sessionId]: true }))
        try {
            await sessionLogout({ userId, sessionId }).unwrap()
            const response = await login(credentials).unwrap()

            if (response.success && response.data && response.data._token) {
                setToken(response.data._token)
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Session has been logged out successfully from other device.',
                        variant: 'alert',
                        alert: { color: 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
                navigate('/dashboard')
            }
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Failed to log out session. Please try again.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            setLoadingStates(prev => ({ ...prev, [sessionId]: false }))
        }
    }

    const activeSessions = userData?.sessions || []

    return (
        <Grid
            container
            alignItems='center'
            sx={{
                minHeight: '100vh',
                background: 'radial-gradient(circle, rgba(248, 250, 252, 0.72) 50%, rgba(225, 240, 245, 1) 100%)',
                // background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                position: 'relative',
                padding: '1rem',
                flexWrap: 'wrap',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '10%',
                    right: '8%',
                    width: '220px',
                    height: '260px',
                    backgroundImage: `url("${toggleSession}")`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    zIndex: 0,
                    '@media (max-width: 900px)': {
                        width: '200px',
                        height: '250px',
                        right: '5%'
                    },
                    '@media (max-width: 600px)': {
                        display: 'none'
                    }
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '8%',
                    left: '8%',
                    width: '220px',
                    height: '260px',
                    backgroundImage: `url("${endSessionPage}")`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    zIndex: 0,
                    '@media (max-width: 900px)': {
                        display: 'none'
                    }
                }
            }}
        >
            <MainCard
                sx={{
                    maxWidth: 500,
                    mx: 'auto',
                    mt: 3,
                    boxShadow: theme.shadows[4],
                    borderRadius: '20px',
                    overflow: 'visible',
                    position: 'relative',
                    zIndex: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                }}
                content={false}
            >
                {/* Header Section */}
                <Box sx={{ p: 3, pb: 2 }}>
                    <Box display='flex' alignItems='center' mb={2}>
                        <SecurityIcon
                            sx={{
                                fontSize: 40,
                                color: theme.palette.warning.main,
                                mr: 2,
                                p: 1,
                                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                borderRadius: '50%'
                            }}
                        />
                        <Box>
                            <Typography variant='h4' component='h1' sx={{ fontWeight: 600, mb: 0.5 }}>
                                User already logged in.
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                                You are currently logged in from multiple sessions. Log out from other devices to
                                continue.
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider />

                {/* Sessions List */}
                <Box sx={{ p: 2 }}>
                    <Box display='flex' flexDirection='column' gap={1.5}>
                        {activeSessions.map(session => (
                            <Card
                                key={session.id}
                                elevation={0}
                                sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: '12px',
                                    backgroundColor: 'transparent',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        boxShadow: theme.shadows[4],
                                        transform: 'translateY(-1px)'
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box display='flex' alignItems='center' justifyContent='space-between'>
                                        <Box display='flex' alignItems='center' flex={1}>
                                            <Box
                                                sx={{
                                                    p: 1,
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                    borderRadius: '8px',
                                                    mr: 2,
                                                    color: theme.palette.primary.main
                                                }}
                                            >
                                                {getDeviceIcon(session.name)}
                                            </Box>

                                            <Box flex={1}>
                                                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5 }}>
                                                    {session.name || 'Session'}
                                                </Typography>

                                                <Typography variant='caption' color='text.secondary'>
                                                    Expires at: {new Date(session.expires_at).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Tooltip title='End this session'>
                                            <IconButton
                                                color='error'
                                                size='small'
                                                disabled={loadingStates[session.id]}
                                                onClick={() => {
                                                    handleLogoutSession(session.id)
                                                }}
                                                sx={{
                                                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.error.main, 0.2)
                                                    }
                                                }}
                                            >
                                                {loadingStates[session.id] ? (
                                                    <CircularProgress size={16} color='error' />
                                                ) : (
                                                    <DeleteAnimIcon shouldAnimate animateOnHover />
                                                )}
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Box>

                <Divider />

                {/* Action Buttons */}
                <CardActions sx={{ justifyContent: 'center', p: 3 }}>
                    <CustomButton
                        variant='outlined'
                        clickable
                        color='primary'
                        disabled={isEndingAllSessions}
                        onClick={handleEndAllSessions}
                        startIcon={<ExitToAppIcon />}
                        loading={isEndingAllSessions}
                        customStyles={{
                            textTransform: 'none',
                            borderRadius: '8px',
                            px: 3
                        }}
                    >
                        {isEndingAllSessions ? 'Ending Sessions...' : 'End All Other Sessions'}
                    </CustomButton>
                </CardActions>
            </MainCard>
        </Grid>
    )
}

export default ActiveSessionLimit
