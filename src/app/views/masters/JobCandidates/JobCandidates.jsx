import React, { useState } from 'react'
import {
    Box,
    Card,
    IconButton,
    Tooltip,
    Typography,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    CircularProgress
} from '@mui/material'
import { Eye, Mail, PhoneCall } from 'lucide-react'
import { useSelector } from 'react-redux'
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import { useGetJobCandidatesQuery, useUpdateJobCandidateMutation } from '@/app/store/slices/api/jobSlice'
import { headers } from './helper'

export default function JobCandidates() {
    const user = useSelector(state => state.auth.user)
    const [selectedCandidate, setSelectedCandidate] = useState(null)
    const [openModal, setOpenModal] = useState(false)
    const [status, setStatus] = useState('')
    const [remarks, setRemarks] = useState('')
    const [columns] = useState([...headers])
    const clientId = user?.clientId
    const getStatusColor = val => {
        switch (val) {
            case 'Pending':
                return 'warning'
            case 'Viewed':
                return 'info'
            case 'Call Scheduled':
                return 'success'
            case 'Selected':
                return 'success'
            case 'Rejected':
                return 'error'
            case 'Closed':
                return 'default'
            default:
                return 'default'
        }
    }
    const { data: candidatesResponse, isLoading } = useGetJobCandidatesQuery(
        clientId ? `?clientId=${clientId}` : undefined,
        {
            skip: !clientId
        }
    )
    const [updateJobCandidate, { isLoading: actionLoading }] = useUpdateJobCandidateMutation()
    const candidates =
        candidatesResponse?.data?.map(item => ({
            ...item,
            fullName: item.jobApplication?.fullName || '-',
            email: item.jobApplication?.email || '-',
            phone: item.jobApplication?.phone || '-',
            createdAt: item.jobApplication?.createdAt
                ? new Date(item.jobApplication.createdAt).toLocaleDateString()
                : '-',
            statusLabel: <Chip label={item.status} color={getStatusColor(item.status)} size='small' />
        })) || []

    const handleOpenModal = candidate => {
        setSelectedCandidate(candidate)
        setStatus(candidate.status)
        setRemarks(candidate.remarks || '')
        setOpenModal(true)
    }

    const handleUpdateStatus = async () => {
        try {
            await updateJobCandidate({
                id: selectedCandidate.id,
                clientId,
                status,
                remarks
            }).unwrap()
            setOpenModal(false)
        } catch (err) {
            console.error('Failed to update candidate', err)
        }
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (!clientId) {
        return (
            <Box sx={{ p: 3 }}>
                <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Box sx={{ p: 4 }}>
                        <Typography variant='h6' sx={{ fontWeight: 700, color: '#1a2535', mb: 1 }}>
                            Client access required
                        </Typography>
                        <Typography sx={{ color: '#64748b' }}>
                            This screen is available for company users linked to a client account.
                        </Typography>
                    </Box>
                </Card>
            </Box>
        )
    }

    return (
        <MainCard content={false}>
            <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='h5' sx={{ fontWeight: 700, color: '#1a2535' }}>
                        Job Candidates
                    </Typography>
                    <Chip
                        label={user?.client?.name || `Client #${clientId}`}
                        sx={{ bgcolor: '#eef6ff', color: '#1c2d45', fontWeight: 700 }}
                    />
                </Box>

                <DataTable
                    data={candidates}
                    columns={columns}
                    queryHandler={async () => true}
                    totalRecords={candidates.length}
                    isCheckbox={false}
                    isLoading={isLoading}
                    renderAction={row => (
                        <Tooltip title='Review candidate'>
                            <IconButton size='small' onClick={() => handleOpenModal(row)}>
                                <Eye size={16} />
                            </IconButton>
                        </Tooltip>
                    )}
                />
            </Box>

            {/* Action Modal */}
            <Dialog
                open={openModal}
                onClose={() => setOpenModal(false)}
                maxWidth='sm'
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #e2e8f0', pb: 2 }}>
                    Review Candidate
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {selectedCandidate && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography variant='subtitle2' color='textSecondary'>
                                    Applicant Details
                                </Typography>
                                <Typography variant='body1' sx={{ fontWeight: 600, mt: 0.5 }}>
                                    {selectedCandidate.jobApplication.fullName}
                                </Typography>
                                <Typography variant='body2'>
                                    {selectedCandidate.jobApplication.email} • {selectedCandidate.jobApplication.phone}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                <Button
                                    component='a'
                                    href={`mailto:${selectedCandidate.jobApplication.email}`}
                                    startIcon={<Mail size={16} />}
                                    variant='outlined'
                                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                                >
                                    Email Applicant
                                </Button>
                                <Button
                                    component='a'
                                    href={`tel:${selectedCandidate.jobApplication.phone}`}
                                    startIcon={<PhoneCall size={16} />}
                                    variant='outlined'
                                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                                >
                                    Call Applicant
                                </Button>
                            </Box>

                            <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <Typography variant='subtitle2' color='textSecondary' sx={{ mb: 1 }}>
                                    Cover Letter / Details
                                </Typography>
                                <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                                    {selectedCandidate.jobApplication.coverLetter || 'No cover letter provided.'}
                                </Typography>
                            </Box>

                            <TextField
                                select
                                label='Status'
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                fullWidth
                                variant='outlined'
                                sx={{ mt: 2 }}
                                disabled={selectedCandidate.status === 'Closed'}
                            >
                                {['Pending', 'Viewed', 'Call Scheduled', 'Selected', 'Rejected', 'Closed'].map(
                                    option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    )
                                )}
                            </TextField>

                            <TextField
                                label='Internal Remarks'
                                multiline
                                rows={3}
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                fullWidth
                                variant='outlined'
                                placeholder='Add notes for your team here...'
                                disabled={selectedCandidate.status === 'Closed'}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setOpenModal(false)} color='inherit'>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdateStatus}
                        variant='contained'
                        disabled={actionLoading || selectedCandidate?.status === 'Closed'}
                        sx={{ bgcolor: '#39B54A', borderRadius: '8px', '&:hover': { bgcolor: '#2ea040' } }}
                    >
                        {actionLoading ? <CircularProgress size={20} color='inherit' /> : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </MainCard>
    )
}
