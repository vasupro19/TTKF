/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-nested-ternary */
// material-ui
import { Alert, Button, Fade, Grow, IconButton, Slide } from '@mui/material'
import MuiSnackbar from '@mui/material/Snackbar'

// assets
import CloseIcon from '@mui/icons-material/Close'

import { useDispatch, useSelector } from '@app/store'
import { closeSnackbar } from '@app/store/slices/snackbar'
import {
    CheckCircleOutlineOutlined,
    ErrorOutlineOutlined,
    InfoOutlined,
    WarningAmberOutlined
} from '@mui/icons-material'

// animation function
function TransitionSlideLeft(props) {
    return <Slide {...props} direction='left' />
}

function TransitionSlideUp(props) {
    return <Slide {...props} direction='up' />
}

function TransitionSlideRight(props) {
    return <Slide {...props} direction='right' />
}

function TransitionSlideDown(props) {
    return <Slide {...props} direction='down' />
}

function GrowTransition(props) {
    return <Grow {...props} />
}

// animation options
const animation = {
    SlideLeft: TransitionSlideLeft,
    SlideUp: TransitionSlideUp,
    SlideRight: TransitionSlideRight,
    SlideDown: TransitionSlideDown,
    Grow: GrowTransition,
    Fade
}

// Default values to prevent errors
const DEFAULT_VALUES = {
    message: 'No message provided',
    variant: 'default',
    transition: 'Fade',
    anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
    alert: {
        color: 'info',
        variant: 'standard',
        icon: null
    },
    autoHideDuration: 3000,
    open: false,
    close: true,
    actionButton: false,
    key: Date.now()
}

// Palette object with specific colors
const colorPalette = {
    success: {
        iconContainerBg: '#04e40048',
        iconColor: '#269b24',
        messageColor: '#269b24'
    },
    error: {
        iconContainerBg: '#fc0c0c48',
        iconColor: '#d10d0d',
        messageColor: '#d10d0d'
    },
    warning: {
        iconContainerBg: '#ffa30d48',
        iconColor: '#db970e',
        messageColor: '#db970e'
    },
    info: {
        iconContainerBg: '#4777ff48',
        iconColor: '#124fff',
        messageColor: '#124fff'
    },
    // Add fallback for any other colors
    primary: {
        iconContainerBg: '#1976d248',
        iconColor: '#1976d2',
        messageColor: '#1976d2'
    },
    secondary: {
        iconContainerBg: '#9c27b048',
        iconColor: '#9c27b0',
        messageColor: '#9c27b0'
    }
}

function Snackbar() {
    const dispatch = useDispatch()
    const snackbar = useSelector(state => state.snackbar || {})

    // Apply defaults to prevent undefined errors
    const {
        actionButton = DEFAULT_VALUES.actionButton,
        anchorOrigin = DEFAULT_VALUES.anchorOrigin,
        alert = DEFAULT_VALUES.alert,
        close = DEFAULT_VALUES.close,
        message = DEFAULT_VALUES.message,
        open = DEFAULT_VALUES.open,
        transition = DEFAULT_VALUES.transition,
        variant = DEFAULT_VALUES.variant,
        autoHideDuration = DEFAULT_VALUES.autoHideDuration,
        key = DEFAULT_VALUES.key
    } = snackbar

    // Ensure alert object has defaults
    const safeAlert = {
        color: alert?.color || DEFAULT_VALUES.alert.color,
        variant: alert?.variant || DEFAULT_VALUES.alert.variant,
        icon: alert?.icon || DEFAULT_VALUES.alert.icon
    }

    // Ensure anchorOrigin has defaults
    const safeAnchorOrigin = {
        vertical: anchorOrigin?.vertical || DEFAULT_VALUES.anchorOrigin.vertical,
        horizontal: anchorOrigin?.horizontal || DEFAULT_VALUES.anchorOrigin.horizontal
    }

    // Get safe transition component
    const safeTransition = animation[transition] || animation[DEFAULT_VALUES.transition]

    // Get safe color palette
    const safeColorPalette = colorPalette[safeAlert.color] || colorPalette.info

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return
        }
        dispatch(closeSnackbar())
    }

    // Don't render if not open
    if (!open) {
        return null
    }

    return (
        <>
            {/* default snackbar */}
            {variant === 'default' && (
                <MuiSnackbar
                    key={key}
                    anchorOrigin={safeAnchorOrigin}
                    open={open}
                    autoHideDuration={autoHideDuration}
                    onClose={handleClose}
                    message={message || DEFAULT_VALUES.message}
                    TransitionComponent={safeTransition}
                    action={
                        <>
                            <Button color='secondary' size='small' onClick={handleClose}>
                                UNDO
                            </Button>
                            <IconButton
                                size='small'
                                aria-label='close'
                                color='inherit'
                                onClick={handleClose}
                                sx={{ mt: 0.25 }}
                            >
                                <CloseIcon fontSize='small' />
                            </IconButton>
                        </>
                    }
                />
            )}

            {/* alert snackbar */}
            {variant === 'alert' && (
                <MuiSnackbar
                    key={key} // Crucial for forcing re-render
                    TransitionComponent={safeTransition}
                    anchorOrigin={safeAnchorOrigin}
                    open={open}
                    autoHideDuration={autoHideDuration}
                    onClose={handleClose}
                >
                    <Alert
                        variant='standard'
                        color={safeAlert.color}
                        icon={
                            // Safe icon selection with fallback
                            safeAlert.icon === 'info' ? (
                                <InfoOutlined fontSize='small' />
                            ) : safeAlert.icon === 'error' ? (
                                <ErrorOutlineOutlined fontSize='small' />
                            ) : safeAlert.icon === 'warning' ? (
                                <WarningAmberOutlined fontSize='small' />
                            ) : safeAlert.icon === 'success' ? (
                                <CheckCircleOutlineOutlined fontSize='small' />
                            ) : (
                                // Default fallback icon
                                <InfoOutlined fontSize='small' />
                            )
                        }
                        action={
                            close !== false && (
                                <IconButton aria-label='close' onClick={handleClose} sx={{ color: 'grey.700' }}>
                                    <CloseIcon fontSize='small' />
                                </IconButton>
                            )
                        }
                        sx={{
                            // General card styles
                            width: '330px',
                            minHeight: '60px',
                            borderRadius: '8px',
                            bgcolor: '#ffffff',
                            boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
                            alignItems: 'center',
                            p: '6px 15px',

                            // Dynamic colored left border with safe fallback
                            borderLeft: `8px solid ${safeColorPalette.iconContainerBg}`,

                            // Icon container and icon styles
                            '& .MuiAlert-icon': {
                                width: '32px',
                                minWidth: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                backgroundColor: safeColorPalette.iconContainerBg,
                                color: safeColorPalette.iconColor,
                                margin: 0,
                                marginRight: '15px',

                                '& .MuiSvgIcon-root': {
                                    width: '16px',
                                    height: '16px'
                                }
                            },

                            // Message text styles
                            '& .MuiAlert-message': {
                                flexGrow: 1,
                                color: safeColorPalette.messageColor,
                                fontSize: '14px',
                                fontWeight: 500,
                                p: 0
                            }
                        }}
                    >
                        {message || DEFAULT_VALUES.message}
                    </Alert>
                </MuiSnackbar>
            )}
        </>
    )
}

export default Snackbar
