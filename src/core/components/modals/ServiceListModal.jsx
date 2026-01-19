import React, { useState } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Typography,
    Divider,
    Box,
    Button,
    Chip,
    CircularProgress,
    Menu,
    MenuItem,
    ListItemIcon,
    Tooltip
} from '@mui/material'
import { Edit, Close, InfoOutlined, Email, Delete, MoreVert } from '@mui/icons-material'

function ServiceListModal({ open, onClose, services, type, onEdit, onDelete, onSendEmail, isLoading, isSendingEmail }) {
    const filteredServices = services || []

    // State for the Action Menu (Delete)
    const [anchorEl, setAnchorEl] = useState(null)
    const [selectedService, setSelectedService] = useState(null)

    const handleMenuOpen = (event, service) => {
        setAnchorEl(event.currentTarget)
        setSelectedService(service)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
        setSelectedService(null)
    }

    const getStatusColor = status => {
        switch (status) {
            case 'Fully Paid':
                return 'success'
            case 'Partially Paid':
                return 'warning'
            default:
                return 'error'
        }
    }
    const [processingId, setProcessingId] = useState(null)

    const handleEmailClick = async id => {
        setProcessingId(id)
        await onSendEmail(id)
        setProcessingId(null)
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
            <DialogTitle
                sx={{
                    m: 0,
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'grey.50'
                }}
            >
                <Typography variant='h4' sx={{ fontWeight: 600 }}>
                    {type === 'Hotel' ? 'Hotel Bookings' : 'Transport Details'}
                </Typography>
                <IconButton onClick={onClose} size='small'>
                    <Close />
                </IconButton>
            </DialogTitle>
            <Divider />

            <DialogContent sx={{ p: 0, minHeight: '200px' }}>
                {/* eslint-disable-next-line no-nested-ternary */}
                {isLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
                        <CircularProgress size={32} />
                        <Typography sx={{ mt: 2 }} variant='body2' color='textSecondary'>
                            Fetching records...
                        </Typography>
                    </Box>
                ) : filteredServices.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <InfoOutlined sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
                        <Typography color='textSecondary'>No {type}s have been added to this package yet.</Typography>
                    </Box>
                ) : (
                    <List sx={{ py: 0 }}>
                        {filteredServices.map((service, index) => (
                            <React.Fragment key={service.id}>
                                <ListItem
                                    sx={{
                                        px: 3,
                                        py: 2,
                                        '&:hover': { bgcolor: 'grey.50' },
                                        transition: 'background 0.2s'
                                    }}
                                    secondaryAction={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Tooltip title='Send Query Email'>
                                                <Button
                                                    variant='outlined'
                                                    size='small'
                                                    color='info'
                                                    disabled={isSendingEmail && processingId === service.id}
                                                    startIcon={
                                                        isSendingEmail && processingId === service.id ? (
                                                            <CircularProgress size={16} color='inherit' />
                                                        ) : (
                                                            <Email />
                                                        )
                                                    }
                                                    onClick={() => handleEmailClick(service.id)}
                                                    sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                                >
                                                    {isSendingEmail && processingId === service.id
                                                        ? 'Sending...'
                                                        : 'Email'}
                                                </Button>
                                            </Tooltip>

                                            <Button
                                                startIcon={<Edit />}
                                                variant='contained'
                                                size='small'
                                                disableElevation
                                                onClick={() => onEdit(service)}
                                                sx={{ borderRadius: 1.5, textTransform: 'none' }}
                                            >
                                                Edit
                                            </Button>

                                            <IconButton size='small' onClick={e => handleMenuOpen(e, service)}>
                                                <MoreVert fontSize='small' />
                                            </IconButton>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                                                    {service.supplier?.businessname || 'Unknown Supplier'}
                                                </Typography>
                                                <Chip
                                                    label={service.paymentStatus || 'Unpaid'}
                                                    size='small'
                                                    color={getStatusColor(service.paymentStatus)}
                                                    variant='filled'
                                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box component='span'>
                                                <Typography
                                                    component='span'
                                                    variant='body2'
                                                    sx={{ color: 'primary.main', fontWeight: 600 }}
                                                >
                                                    Cost: ₹{service.cost?.toLocaleString('en-IN')}
                                                </Typography>
                                                <Typography
                                                    component='span'
                                                    variant='body2'
                                                    color='textSecondary'
                                                    sx={{ ml: 1 }}
                                                >
                                                    | Paid: ₹{service.paidAmount?.toLocaleString('en-IN')}
                                                </Typography>
                                                <br />
                                                <Typography component='span' variant='caption' color='textSecondary'>
                                                    📅{' '}
                                                    {service.startDate
                                                        ? new Date(service.startDate).toLocaleDateString('en-IN', {
                                                              day: '2-digit',
                                                              month: 'short',
                                                              year: 'numeric'
                                                          })
                                                        : 'N/A'}
                                                    {service.endDate
                                                        ? ` — ${new Date(service.endDate).toLocaleDateString('en-IN', {
                                                              day: '2-digit',
                                                              month: 'short',
                                                              year: 'numeric'
                                                          })}`
                                                        : ''}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < filteredServices.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </DialogContent>

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem
                    onClick={() => {
                        onDelete(selectedService.id)
                        handleMenuClose()
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon>
                        <Delete fontSize='small' color='error' />
                    </ListItemIcon>
                    Delete Booking
                </MenuItem>
            </Menu>
        </Dialog>
    )
}

export default ServiceListModal
