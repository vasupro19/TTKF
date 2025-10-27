/* eslint-disable */
import React from 'react'
import PropTypes from 'prop-types'
import { Card, CardContent, Typography, Box } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Launch } from '@mui/icons-material'

function GeneralNotificationCard({
    id,
    title = '',
    subtitle = '',
    timestamp = '',
    isRead = false,
    handleMarkAsRead = undefined,
    action = undefined,
    path = undefined,
    isExpanded = false,
    onToggleExpand = undefined,
    handleCloseNavigate = undefined
}) {
    const navigate = useNavigate()

    const handleCardClick = e => {
        if (action === 'navigate' && path && handleCloseNavigate) {
            handleCloseNavigate(path)
        } else if (action === 'expand' && onToggleExpand) {
            onToggleExpand(id)
        }
    }

    const renderMarkAsReadText = () => {
        if (!isRead && action === 'expand' && isExpanded && handleMarkAsRead) {
            return (
                <Typography
                    variant='caption'
                    color='primary'
                    sx={{
                        cursor: 'pointer',
                        marginTop: '4px',
                        textDecoration: 'underline'
                    }}
                    onClick={e => {
                        e.stopPropagation()
                        handleMarkAsRead(id)
                    }}
                >
                    Mark as read
                </Typography>
            )
        }
        return null
    }

    return (
        <motion.div
            initial={{ x: 300, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 600, opacity: 0, scale: 0.95 }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            layout
            style={{
                width: '100%'
            }}
            onClick={handleCardClick}
        >
            <Card
                variant='outlined'
                sx={{
                    width: '100%',
                    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px',
                    cursor: action ? 'pointer' : 'default'
                }}
            >
                <CardContent sx={{ padding: '2px 6px', paddingBottom: '4px !important' }}>
                    <Box>
                        <Box
                            sx={{
                                display: 'flex',
                                width: '100%',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <Box display='flex' alignItems='center' gap={0.1} sx={{ fontSize: '16px' }}>
                                <Typography
                                    variant='h6'
                                    fontWeight='bold'
                                    noWrap
                                    sx={{
                                        maxWidth: '160px',
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {title}
                                </Typography>
                                <Typography
                                    component='span'
                                    sx={{
                                        color: '#999',
                                        marginLeft: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '12px'
                                    }}
                                >
                                    <AccessTimeOutlined sx={{ fontSize: '12px' }} />
                                    {timestamp}
                                </Typography>
                                {action !== 'expand' && !isExpanded&&<Launch sx={{fontSize:'0.90rem', marginLeft:0.5, color:'blue.dark'}} />}
                            </Box>

                            {(action !== 'expand' || !isExpanded) && !isRead && (
                                <CheckCircleIcon
                                    sx={{
                                        fontSize: '18px',
                                        color: 'primary.main',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            color: 'primary.dark',
                                            scale: '1.05'
                                        }
                                    }}
                                    onClick={e => {
                                        e.stopPropagation()
                                        handleMarkAsRead && handleMarkAsRead(id)
                                    }}
                                />
                            )}
                        </Box>
                        <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{
                                maxWidth: isExpanded ? 'none' : '340px',
                                textOverflow: isExpanded ? 'unset' : 'ellipsis',
                                overflow: isExpanded ? 'unset' : 'hidden',
                                whiteSpace: isExpanded ? 'normal' : 'nowrap',
                                marginTop: '4px'
                            }}
                        >
                            {subtitle}
                        </Typography>
                        {renderMarkAsReadText()}
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    )
}

GeneralNotificationCard.propTypes = {
    id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ]).isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    isRead: PropTypes.bool,
    handleMarkAsRead: PropTypes.func,
    action: PropTypes.oneOf(['navigate', 'expand']),
    path: PropTypes.string,
    isExpanded: PropTypes.bool,
    onToggleExpand: PropTypes.func,
    handleCloseNavigate: PropTypes.func
}

// GeneralNotificationCard.defaultProps = {
//     isRead: false,
//     handleMarkAsRead: undefined,
//     action: undefined,
//     path: undefined,
//     isExpanded: false,
//     onToggleExpand: undefined,
//     handleCloseNavigate: undefined
// }

export default GeneralNotificationCard
