import React from 'react'
import PropTypes from 'prop-types'
import { Card, CardContent, Typography, LinearProgress, IconButton, Box, Chip } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { DeleteOutlineOutlined, FileDownloadOutlined, FileUploadOutlined } from '@mui/icons-material'
import ErrorIcon from '@mui/icons-material/Error'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import { motion } from 'framer-motion'
import StatusBadge from './StatusBadge'

/**
 * Notification card to display upload or download progress and status.
 *
 * @param {Object} props - Props for the component.
 * @param {string} props.name - The name of the file.
 * @param {number} props.progress - Progress percentage (0-100).
 * @param {string} props.status - Status of the process (`success`, `uploading`, `downloading`, or `failed`).
 * @param {function} props.onDelete - Callback for deleting the notification.
 * @param {string} props.processType - Type of process (`upload` or `download`).
 * @param {function} [props.onClick] - Optional callback for clicking the card.
 * @param {function} [props.onDownload] - Optional callback for downloading the file.
 * @returns {JSX.Element} The notification card component.
 */
function UploadDownloadNotificationCard({ name, progress, status, onDelete, processType, onClick, onDownload }) {
    const getStatusDetails = () => {
        switch (status) {
            case 'success':
                return {
                    color: 'secondary.main',
                    text: 'File uploaded successfully',
                    icon: <CheckCircleIcon sx={{ fill: '#4caf50' }} fontSize='small' />
                }
            case 'uploading':
                return {
                    color: 'blue',
                    text: 'Uploading...',
                    icon: <CloudUploadIcon color='primary' fontSize='small' />
                }
            case 'downloading':
                return {
                    color: 'orange',
                    text: 'Downloading...',
                    icon: <CloudDownloadIcon color='primary' fontSize='small' />
                }
            case 'failed':
                return { color: 'red', text: 'File Upload Failed', icon: <ErrorIcon color='error' fontSize='small' /> }
            default:
                return {}
        }
    }

    const { color, text, icon } = getStatusDetails()

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }} // Slide in from right with transparent
            animate={{ x: 0, opacity: 1 }} // Fully visible at its position
            exit={{ x: 600, opacity: 0 }} // Slide out to the right with transparent
            transition={{
                type: 'tween', // Use tween for smoother animation
                duration: 0.2, // Set duration in seconds
                ease: 'easeInOut' // Use a smooth ease-in-out effect
            }}
            layout // Automatically handles reordering of items
            style={{
                width: '100%'
            }}
        >
            <Card
                variant='outlined'
                sx={{
                    width: '100%',
                    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px'
                }}
                onClick={onClick}
            >
                <CardContent sx={{ padding: 1, paddingBottom: '8px !important' }}>
                    <Box display='flex' justifyContent='space-between' alignItems='center'>
                        <Typography variant='h5'>{`${name} (${progress}%)`}</Typography>
                        {(status === 'failed' || status === 'success') && (
                            <IconButton
                                onClick={e => {
                                    e.stopPropagation() // Prevent bubbling up
                                    onDelete() // Call the function to delete the notification
                                }}
                                sx={{ padding: '4px' }}
                            >
                                <DeleteOutlineOutlined fontSize='small' color='error' />
                            </IconButton>
                        )}
                    </Box>
                    {/* eslint-disable no-nested-ternary */}

                    <LinearProgress
                        variant='determinate'
                        value={progress}
                        sx={{
                            mt: 0.5,
                            mb: 0.5,
                            height: 5,
                            borderRadius: 4,
                            backgroundColor: '#f0f0f0', // Customize the track background color
                            '& .MuiLinearProgress-bar': {
                                backgroundColor:
                                    status === 'success'
                                        ? '#4caf50' // Custom green
                                        : status === 'failed'
                                          ? '#f33324' // Custom red
                                          : '#2196f3' // Custom blue for 'info'
                            }
                        }}
                    />
                    <Box display='flex' justifyContent='space-between' alignItems='center'>
                        {status === 'uploading' || status === 'downloading' ? (
                            <Box>
                                <StatusBadge
                                    label={text}
                                    type={processType === 'upload' ? 'info' : 'alert'}
                                    icon={
                                        processType === 'upload' ? (
                                            <FileUploadOutlined fontSize='small' />
                                        ) : (
                                            <FileDownloadOutlined fontSize='small' />
                                        )
                                    }
                                    customSx={{
                                        cursor: 'default',
                                        mt: 0.5,
                                        fontSize: '12px'
                                    }}
                                />
                            </Box>
                        ) : (
                            <Box display='flex' alignItems='center' gap={0.4} sx={{ cursor: 'default' }}>
                                {icon}
                                <Typography variant='h6' color={color} fontStyle='italic'>
                                    {text}
                                </Typography>
                            </Box>
                        )}

                        {status === 'failed' ? (
                            <Chip
                                label='Download Error File'
                                color='error'
                                icon={<FileDownloadOutlined sx={{ fontSize: '16px' }} />}
                                sx={{
                                    fontSize: '10px',
                                    height: '20px',
                                    padding: '2px 4px !important',
                                    '& .MuiChip-labelMedium': {
                                        paddingX: '8px !important'
                                    }
                                }}
                                onClick={e => {
                                    e.stopPropagation()
                                    if (onDownload) {
                                        onDownload()
                                    }
                                }}
                            />
                        ) : status === 'success' ? (
                            <Chip
                                label='Download File'
                                color='success'
                                icon={<FileDownloadOutlined sx={{ fontSize: '16px' }} />}
                                sx={{
                                    fontSize: '10px',
                                    height: '20px',
                                    padding: '2px 4px !important',
                                    '& .MuiChip-labelMedium': {
                                        paddingX: '8px !important'
                                    },
                                    background: '#4caf50',
                                    color: '#fff'
                                }}
                                onClick={e => {
                                    e.stopPropagation()
                                    if (onDownload) {
                                        onDownload()
                                    }
                                }}
                            />
                        ) : null}
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    )
}

UploadDownloadNotificationCard.propTypes = {
    name: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    status: PropTypes.oneOf(['success', 'uploading', 'downloading', 'failed']).isRequired,
    onDelete: PropTypes.func.isRequired,
    processType: PropTypes.oneOf(['upload', 'download']).isRequired,
    onClick: PropTypes.func,
    onDownload: PropTypes.func
}

export default UploadDownloadNotificationCard
