import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
    IconButton,
    Badge,
    Popper,
    Paper,
    ClickAwayListener,
    ListItemText,
    Typography,
    Box,
    Divider
} from '@mui/material'
import { ExpandMoreOutlined, FileDownloadOffTwoTone } from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import DownloadHeaderIcon from '@/assets/icons/DownloadHeaderIcon'
import CustomButton from '../extended/CustomButton'
import FileTransferSpinnerCard from '../FileTransferSpinnerCard'

/**
 * NotificationMenu component displays a dropdown menu with upload and download notifications.
 * It is designed to be used in the header of an application.
 *
 * @param {Object} props - Component props.
 * @param {Array} props.notifications - List of notifications to display.
 * Each notification object should have the following properties:
 * - `id` (string): Unique identifier for the notification.
 * - `type` (string): Type of the notification (`upload` or `download`).
 * - `fileName` (string): Name of the file associated with the notification.
 * - `progress` (number): Progress percentage (0-100).
 * - `status` (string): Current status of the notification (`success`, `uploading`, `downloading`, or `failed`).
 * - `message` (string): Additional message text for the notification.
 * - `read` (boolean): Whether the notification has been read.
 * @param {Function} props.onDelete - Callback triggered to delete a notification.
 * Accepts the notification's ID as an argument.
 * @returns {JSX.Element} The NotificationMenu component.
 */
function NotificationMenuComponent(props) {
    const { notifications, onDelete } = props
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [anchorEl, setAnchorEl] = useState(null)
    // State to track which chip is selected
    const unreadCount = notifications?.filter(n => !n.read)?.length

    /**
     * Opens the notification menu.
     * @param {React.MouseEvent} event - The click event.
     */
    const handleMenuOpen = event => setAnchorEl(event.currentTarget)

    /**
     * Closes the notification menu.
     */
    const handleMenuClose = () => setAnchorEl(null)

    /**
     * Closes the menu and navigates to the upload/download management page.
     */
    const handleCloseNavigate = () => {
        handleMenuClose() // Close the popper
        if (pathname !== '/manageUploadsDownloads') {
            setTimeout(() => navigate('/manageUploadsDownloads'), 0) // Navigate after the popper is closed
        }
    }

    return (
        <>
            <IconButton
                onClick={handleMenuOpen}
                color='inherit'
                aria-label='show-notifications-file-transfer'
                aria-describedby='notification-popper-file-transfer'
                aria-haspopup='true'
            >
                <Badge badgeContent={unreadCount ?? 4} color='error'>
                    <DownloadHeaderIcon fill='#fff' width='16' height='16' />
                </Badge>
            </IconButton>

            <Popper
                id='notification-popper-file-transfer'
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                placement='bottom-end'
                style={{
                    zIndex: 9999
                }}
                modifiers={[
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 10]
                        }
                    }
                ]}
            >
                <ClickAwayListener onClickAway={handleMenuClose}>
                    <Paper
                        style={{
                            maxHeight: 380,
                            width: notifications?.length === 0 ? 280 : 380,
                            minHeight: 240,
                            overflowY: 'hidden',
                            overflowX: 'hidden'
                        }}
                        elevation={3}
                    >
                        <AnimatePresence>
                            <Box>
                                <Typography sx={{ color: '#000', paddingX: 1, fontSize: '1rem', paddingY: 1 }}>
                                    File Transfer Process
                                </Typography>
                            </Box>
                            <Divider sx={{ margin: '0px 0px !important', borderWidth: '1.2px' }} />
                            {notifications?.length === 0 ? (
                                <Box
                                    sx={{
                                        height: '180px',
                                        width: '100%',
                                        padding: 1
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: 'max-content',
                                            width: '100%',
                                            flexDirection: 'column',
                                            padding: '2rem'
                                        }}
                                    >
                                        <FileDownloadOffTwoTone sx={{ fontSize: '36px' }} />
                                        <Typography variant='h4' color='textSecondary' sx={{ wordBreak: 'break-word' }}>
                                            No file transfer in process
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ maxHeight: 280, overflowY: 'auto', overflowX: 'hidden' }}>
                                    {notifications?.map(notification => (
                                        <Box
                                            key={notification.id}
                                            sx={{
                                                padding: 1,
                                                paddingBottom: '3px !important',
                                                paddingTop: '3px !important'
                                            }}
                                        >
                                            {notification.type === 'upload' || notification.type === 'download' ? (
                                                <FileTransferSpinnerCard
                                                    id={notification.id}
                                                    name={notification.fileName}
                                                    progress={notification.progress}
                                                    status={notification.status}
                                                    onDelete={() => onDelete(notification.id)} // Pass the ID to onDelete
                                                    onClick={handleCloseNavigate}
                                                    processType={notification.type}
                                                    onDownload={() => {
                                                        handleMenuClose()
                                                    }}
                                                    SpinnerIcon={notification.SpinnerIcon}
                                                />
                                            ) : (
                                                <ListItemText primary={notification.message} />
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </AnimatePresence>
                        {pathname !== '/manageUploadsDownloads' && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    position: 'sticky',
                                    bottom: 0,
                                    backgroundColor: 'white',
                                    padding: 1
                                }}
                                className='view-more-button'
                            >
                                <CustomButton variant='text' onClick={handleCloseNavigate}>
                                    <Typography variant='h6'>
                                        {notifications?.length !== 0 ? 'View more' : 'View in details'}
                                    </Typography>
                                    <ExpandMoreOutlined fontSize='medium' />
                                </CustomButton>
                            </Box>
                        )}
                    </Paper>
                </ClickAwayListener>
            </Popper>
        </>
    )
}

NotificationMenuComponent.propTypes = {
    /**
     * List of notification objects to display.
     */
    notifications: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            type: PropTypes.oneOf(['upload', 'download']).isRequired,
            fileName: PropTypes.string.isRequired,
            progress: PropTypes.number.isRequired,
            status: PropTypes.oneOf(['success', 'uploading', 'downloading', 'failed']).isRequired,
            message: PropTypes.string,
            read: PropTypes.bool.isRequired
        })
    ).isRequired,

    /**
     * Callback triggered to delete a notification.
     * Accepts the notification's ID as an argument.
     */
    onDelete: PropTypes.func.isRequired
}

const NotificationMenu = React.memo(NotificationMenuComponent)

export default NotificationMenu
