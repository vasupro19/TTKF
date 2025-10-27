import React from 'react'
import { Typography, IconButton, Tooltip, Box, Divider } from '@mui/material'
import { ContentCopy } from '@mui/icons-material'
import PropTypes from 'prop-types'

function OrderDetailCard({ name, address, phone, gst, title, businessName = '', orderType = '' }) {
    const handleCopy = () => {
        navigator.clipboard.writeText(`${name}\n${address}`)
    }

    return (
        <Box sx={{ maxWidth: 350 }}>
            {/* Header */}
            <Typography variant='h5' fontWeight='bold'>
                {title}
            </Typography>
            <Divider sx={{ borderColor: 'primary.main', mb: 1 }} />

            {/* Phone Number */}
            {!['B2C', 'Exchange', 'Promotion', 'Sample']?.includes(orderType) && (
                <Box display='flex' alignItems='center' mt={1}>
                    <Typography variant='body2' fontWeight='bold'>
                        Name:
                    </Typography>
                    <Typography variant='body2' color='textSecondary' sx={{ ml: 0.5 }}>
                        {businessName}
                    </Typography>
                </Box>
            )}
            {/* Ship To Address Section */}
            <Box display='flex' alignItems='center' justifyContent='space-between'>
                <Typography variant='body2' fontWeight='bold'>
                    Ship To Address
                </Typography>
                <Tooltip title='Copy Address'>
                    <IconButton onClick={handleCopy} size='small'>
                        <ContentCopy fontSize='small' />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Customer Info */}
            <Box
                sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                onClick={handleCopy}
            >
                <Typography variant='caption' fontWeight='bold'>
                    {name}
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                    {address}
                </Typography>
            </Box>

            {/* Phone Number */}
            <Box display='flex' alignItems='center' mt={1}>
                <Typography variant='body2' fontWeight='bold'>
                    Phone No:
                </Typography>
                <Typography variant='body2' color='textSecondary' sx={{ ml: 0.5 }}>
                    {phone}
                </Typography>
            </Box>

            {/* GST Number */}
            <Box display='flex' alignItems='center' mt={1}>
                <Typography variant='body2' fontWeight='bold'>
                    GST No:
                </Typography>
                <Typography variant='body2' color='textSecondary' sx={{ ml: 0.5 }}>
                    {gst}
                </Typography>
            </Box>
        </Box>
    )
}

export default OrderDetailCard

OrderDetailCard.propTypes = {
    name: PropTypes.string,
    address: PropTypes.string,
    phone: PropTypes.string,
    gst: PropTypes.string,
    title: PropTypes.string,
    businessName: PropTypes.string,
    orderType: PropTypes.string
}
