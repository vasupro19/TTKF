import React from 'react'
import PropTypes from 'prop-types'
import { Card, CardContent, Typography, IconButton, Box, Chip } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import {
    AccessTimeOutlined,
    DeleteOutlineOutlined,
    FileDownloadOutlined,
    FileUploadOutlined
} from '@mui/icons-material'
import ErrorIcon from '@mui/icons-material/Error'
import { motion } from 'framer-motion'
import CircularProgressWithLabel from './CircularProgressWithLabel'

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
function FileTransferSpinnerCard({ name, progress, status, onDelete, processType, onClick, onDownload, SpinnerIcon }) {
    const getStatusDetails = () => {
        switch (status) {
            case 'success':
                return {
                    color: '#17A948FF',
                    text: `File ${processType === 'upload' ? 'uploaded' : 'downloaded'} successfully`,
                    icon: <CheckCircleIcon sx={{ fill: '#17A948FF', fontSize: '16px' }} />
                }
            case 'uploading':
                return {
                    color: 'grey.500',
                    text: 'Uploading...',
                    icon: <FileUploadOutlined color='primary' fontSize='small' />
                }
            case 'downloading':
                return {
                    color: 'grey.500',
                    text: 'Downloading...',
                    icon: <FileDownloadOutlined color='primary' fontSize='small' />
                }
            case 'failed':
                return {
                    color: '#DE3B40FF',
                    text: `File ${processType === 'upload' ? 'upload' : 'download'} Failed`,
                    icon: <ErrorIcon color='error' sx={{ fontSize: '16px', color: '#DE3B40FF' }} />
                }
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
                <CardContent sx={{ padding: 0.5, paddingBottom: '4px !important' }}>
                    <Box display='flex' justifyContent='space-between' alignItems='flex-start'>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                flex: 1
                            }}
                        >
                            {/* eslint-disable no-nested-ternary */}

                            <CircularProgressWithLabel
                                value={progress}
                                status={
                                    status === 'uploading' || status === 'downloading'
                                        ? 'inProgress' // Custom green
                                        : status
                                }
                                icon={SpinnerIcon}
                            />
                            <Box>
                                {/* <Typography variant='h6'>{`${name} (${progress}%)`}</Typography> */}
                                <Box display='flex' alignItems='center' gap={0.2} sx={{ fontSize: '16px' }}>
                                    <Typography
                                        variant='h6'
                                        noWrap
                                        sx={{
                                            maxWidth: '160px',
                                            textOverflow: 'ellipsis',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {name}
                                    </Typography>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                                        {`(${progress}%)`}
                                    </Typography>
                                </Box>
                                {/* {(status === 'success' || status === 'failed') && ( */}
                                <Box display='flex' alignItems='center' gap={0.4} sx={{ fontSize: '16px' }}>
                                    {icon}
                                    <Typography variant='h6' sx={{ color }} fontStyle='italic'>
                                        {text}
                                    </Typography>
                                </Box>
                                {/* )} */}
                            </Box>
                        </Box>
                        <Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    width: '100%',
                                    flex: 1,
                                    alignItems: 'center',
                                    justifyContent: processType === 'upload' ? 'flex-end' : 'unset'
                                }}
                            >
                                {status === 'failed' ? (
                                    <Chip
                                        label='Download'
                                        color='error'
                                        icon={<FileDownloadOutlined sx={{ fontSize: '16px' }} />}
                                        sx={{
                                            fontSize: '10px',
                                            height: '20px',
                                            padding: '2px 4px !important',
                                            '& .MuiChip-labelMedium': {
                                                paddingX: '8px !important'
                                            },
                                            background: '#DE3B40FF'
                                        }}
                                        onClick={e => {
                                            e.stopPropagation()
                                            if (onDownload) {
                                                onDownload()
                                            }
                                        }}
                                    />
                                ) : status === 'success' && processType !== 'upload' ? (
                                    <Chip
                                        label='Download'
                                        color='success'
                                        icon={<FileDownloadOutlined sx={{ fontSize: '16px' }} />}
                                        sx={{
                                            fontSize: '10px',
                                            height: '20px',
                                            padding: '2px 4px !important',
                                            '& .MuiChip-labelMedium': {
                                                paddingX: '8px !important'
                                            },
                                            background: '#17A948FF',
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
                                {(status === 'failed' || status === 'success') && (
                                    <IconButton
                                        onClick={e => {
                                            e.stopPropagation() // Prevent bubbling up
                                            onDelete() // Call the function to delete the notification
                                        }}
                                        sx={{ padding: '2px' }}
                                    >
                                        <DeleteOutlineOutlined fontSize='small' color='error' />
                                    </IconButton>
                                )}
                            </Box>
                            {status === 'success' && (
                                <Typography
                                    sx={{
                                        fontSize: '10px',
                                        display: 'flex',
                                        justifyContent: 'end',
                                        alignItems: 'center',
                                        gap: 0.2,
                                        color: 'grey.500',
                                        paddingRight: '6px'
                                    }}
                                >
                                    <AccessTimeOutlined sx={{ fontSize: '10px' }} />2 mins ago
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    {/* eslint-enable no-nested-ternary */}
                </CardContent>
            </Card>
        </motion.div>
    )
}

FileTransferSpinnerCard.propTypes = {
    name: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    status: PropTypes.oneOf(['success', 'uploading', 'downloading', 'failed']).isRequired,
    onDelete: PropTypes.func.isRequired,
    processType: PropTypes.oneOf(['upload', 'download']).isRequired,
    onClick: PropTypes.func,
    onDownload: PropTypes.func,
    SpinnerIcon: PropTypes.func
}

export default FileTransferSpinnerCard
