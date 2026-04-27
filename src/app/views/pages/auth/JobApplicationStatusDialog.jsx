import { useState } from 'react'
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Typography
} from '@mui/material'
import { X } from 'lucide-react'
import { useLazyGetJobApplicationStatusQuery } from '@/app/store/slices/api/jobSlice'

const getStatusColor = status => {
    switch (status) {
        case 'Selected':
            return 'success'
        case 'Call Scheduled':
            return 'info'
        case 'Viewed':
            return 'warning'
        case 'Rejected':
            return 'error'
        case 'Closed':
            return 'default'
        default:
            return 'warning'
    }
}

export default function JobApplicationStatusDialog({ open, onClose }) {
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [triggerStatusLookup, { data, isFetching, error }] = useLazyGetJobApplicationStatusQuery()

    const application = data?.data

    const handleClose = () => {
        setEmail('')
        setPhone('')
        onClose()
    }

    const handleLookup = async () => {
        if (!email || !phone) {
            return
        }

        await triggerStatusLookup({ email, phone })
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
            <Box
                sx={{
                    bgcolor: '#1c2d45',
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Typography sx={{ fontWeight: 800, color: 'white', fontSize: '1.1rem' }}>
                    Track Application Status
                </Typography>
                <IconButton onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    <X size={20} />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label='Email' value={email} onChange={e => setEmail(e.target.value)} fullWidth />
                    <TextField label='Phone' value={phone} onChange={e => setPhone(e.target.value)} fullWidth />
                    <Button
                        variant='contained'
                        onClick={handleLookup}
                        disabled={isFetching || !email || !phone}
                        sx={{ bgcolor: '#39B54A', borderRadius: '8px', '&:hover': { bgcolor: '#2ea040' } }}
                    >
                        {isFetching ? <CircularProgress size={20} color='inherit' /> : 'Check Status'}
                    </Button>

                    {error?.data?.message && (
                        <Typography sx={{ color: '#dc2626', fontSize: '0.88rem' }}>{error.data.message}</Typography>
                    )}

                    {application && (
                        <Box
                            sx={{
                                mt: 1,
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                p: 2.5,
                                bgcolor: '#f8fafc'
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: 2,
                                    flexWrap: 'wrap',
                                    mb: 2
                                }}
                            >
                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: '#1a2535' }}>
                                        {application.fullName}
                                    </Typography>
                                    <Typography sx={{ color: '#64748b', fontSize: '0.88rem' }}>
                                        Applied on {new Date(application.createdAt).toLocaleDateString()}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={`Overall: ${application.overallStatus}`}
                                    color={getStatusColor(application.overallStatus)}
                                    size='small'
                                />
                            </Box>

                            <Typography sx={{ fontWeight: 700, color: '#1a2535', mb: 1.5 }}>Company Updates</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                                {application.companyInteractions.map(item => (
                                    <Box
                                        key={item.id}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: 2,
                                            p: 1.5,
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            border: '1px solid #e5e7eb'
                                        }}
                                    >
                                        <Box>
                                            <Typography sx={{ fontWeight: 700, color: '#1a2535' }}>
                                                {item.client?.name || `Company #${item.clientId}`}
                                            </Typography>
                                            {item.remarks && (
                                                <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                                                    {item.remarks}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Chip label={item.status} color={getStatusColor(item.status)} size='small' />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    )
}
