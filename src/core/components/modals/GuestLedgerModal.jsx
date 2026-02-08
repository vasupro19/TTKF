import React from 'react'
import {
    Modal,
    Box,
    Typography,
    Divider,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Stack
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useGetGuestPaymentHistoryQuery } from '@/app/store/slices/api/packageConvert'

function GuestLedgerModal({ open, onClose, packageId, guestName }) {
    const { data: response, isLoading } = useGetGuestPaymentHistoryQuery(packageId, {
        skip: !open || !packageId
    })

    const history = response?.data || []

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 700,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 24,
                    p: 4
                }}
            >
                <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
                    <Typography variant='h4'>Payment Ledger: {guestName}</Typography>
                    <IconButton onClick={onClose} size='small'>
                        <CloseIcon />
                    </IconButton>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer
                        sx={{ maxHeight: 400, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                    >
                        <Table stickyHeader size='small'>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell>
                                        <b>Date</b>
                                    </TableCell>
                                    <TableCell>
                                        <b>Amount</b>
                                    </TableCell>
                                    <TableCell>
                                        <b>Method</b>
                                    </TableCell>
                                    <TableCell>
                                        <b>Transaction ID</b>
                                    </TableCell>
                                    <TableCell>
                                        <b>Remarks</b>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {history.length > 0 ? (
                                    history.map(row => (
                                        <TableRow key={row.id} hover>
                                            <TableCell>{new Date(row.paymentDate).toLocaleDateString()}</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                ₹{row.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={row.paymentMethod}
                                                    size='small'
                                                    variant='outlined'
                                                    color='primary'
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>
                                                {row.transactionId || 'N/A'}
                                            </TableCell>
                                            <TableCell>{row.remarks || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align='center' sx={{ py: 3 }}>
                                            No payment records found for this package.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </Modal>
    )
}

export default GuestLedgerModal
