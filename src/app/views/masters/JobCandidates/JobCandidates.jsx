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
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import ListPage from '@core/listing/ListPage'
import { getJobCandidates, useUpdateJobCandidateMutation } from '@/app/store/slices/api/jobSlice'
import { headers } from './helper'
import { CANDIDATE_STATUSES, STATUS_FILTER, candidateRow, statusColor } from './candidateFacts'

const FILTERS = [STATUS_FILTER]

// ? the table's rows: the applicant's details, and the status as a coloured chip
const rowsOf = rows =>
    rows.map(item => ({
        ...candidateRow(item),
        statusLabel: <Chip label={item.status} color={statusColor(item.status)} size='small' />
    }))

export default function JobCandidates() {
    const dispatch = useDispatch()
    const user = useSelector(state => state.auth.user)
    const [selectedCandidate, setSelectedCandidate] = useState(null)
    const [openModal, setOpenModal] = useState(false)
    const [status, setStatus] = useState('')
    const [remarks, setRemarks] = useState('')
    const [reloadSignal, setReloadSignal] = useState(0)
    const clientId = user?.clientId
    const [updateJobCandidate, { isLoading: actionLoading }] = useUpdateJobCandidateMutation()

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
            setReloadSignal(value => value + 1)
        } catch (err) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: err?.data?.message || 'Could not update this candidate',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
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
        <>
            <ListPage
                title='Job Candidates'
                subtitle={`People who applied to ${user?.clientName || user?.client?.name || 'your company'}, and where each one stands.`}
                noun='candidates'
                searchPlaceholder='Search name, email or phone'
                headers={headers}
                endpoint={getJobCandidates}
                baseParams={{ clientId }}
                reqKey='getJobCandidatesKey'
                filters={FILTERS}
                rowsOf={rowsOf}
                csvName='job-candidates'
                canAdd={false}
                emptyTitle='No candidates yet'
                emptyText='People who apply for a job with you will show up here, with their status.'
                reloadSignal={reloadSignal}
                renderAction={row => (
                    <Tooltip title='Review candidate'>
                        <IconButton
                            size='small'
                            aria-label={`Review ${row.fullName}`}
                            onClick={() => handleOpenModal(row)}
                        >
                            <Eye size={16} />
                        </IconButton>
                    </Tooltip>
                )}
            />

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
                                {CANDIDATE_STATUSES.map(option => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
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
        </>
    )
}
