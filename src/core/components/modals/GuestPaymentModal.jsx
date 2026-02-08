import React, { useState, useEffect } from 'react'

import { Modal, Box, Divider, Typography, TextField, Stack, MenuItem } from '@mui/material'
import CustomButton from '../extended/CustomButton'

function GuestPaymentModal({ open, onClose, onSave, row, isLoading }) {
    // Set default date to today in YYYY-MM-DD format for the input
    const today = new Date().toISOString().split('T')[0]

    const [form, setForm] = useState({
        amount: '',
        paymentMethod: 'UPI',
        transactionId: '',
        remarks: '',
        paymentDate: today // Added date field
    })

    // Reset form when modal opens with a new row
    useEffect(() => {
        if (open) {
            setForm({
                amount: '',
                paymentMethod: 'UPI',
                transactionId: '',
                remarks: '',
                paymentDate: today
            })
        }
    }, [open, today])

    // Calculate remaining balance for UI display
    const remainingBalance = (row?.sellingPrice || 0) - (row?.guestPaidAmount || 0)

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 450, // Slightly wider for better layout
                    bgcolor: 'background.paper',
                    p: 4,
                    borderRadius: 2,
                    boxShadow: 24
                }}
            >
                <Typography variant='h4' mb={2}>
                    Record Guest Payment
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant='subtitle2' color='textSecondary'>
                        Guest: <b>{row?.lead?.guestName || row?.lead?.name || 'N/A'}</b>
                    </Typography>
                    <Stack direction='row' justifyContent='space-between' mt={1}>
                        <Typography variant='body2'>
                            Total: <b>₹{row?.sellingPrice}</b>
                        </Typography>
                        <Typography variant='body2' color='error'>
                            Pending: <b>₹{remainingBalance}</b>
                        </Typography>
                    </Stack>
                </Box>

                <Stack spacing={2}>
                    <Stack direction='row' spacing={2}>
                        <TextField
                            label='Payment Date'
                            type='date'
                            fullWidth
                            value={form.paymentDate}
                            InputLabelProps={{ shrink: true }}
                            onChange={e => setForm({ ...form, paymentDate: e.target.value })}
                        />
                        <TextField
                            label='Amount Received'
                            type='number'
                            fullWidth
                            value={form.amount}
                            onChange={e => setForm({ ...form, amount: e.target.value })}
                        />
                    </Stack>

                    <TextField
                        select
                        label='Payment Method'
                        fullWidth
                        value={form.paymentMethod}
                        onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                    >
                        {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit Card'].map(opt => (
                            <MenuItem key={opt} value={opt}>
                                {opt}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label='Transaction ID / Ref'
                        fullWidth
                        value={form.transactionId}
                        placeholder='e.g. UTR Number'
                        onChange={e => setForm({ ...form, transactionId: e.target.value })}
                    />

                    <TextField
                        label='Remarks'
                        multiline
                        rows={2}
                        fullWidth
                        value={form.remarks}
                        onChange={e => setForm({ ...form, remarks: e.target.value })}
                    />

                    <Box display='flex' gap={1} justifyContent='flex-end' mt={1}>
                        <CustomButton onClick={onClose} variant='outlined' color='secondary'>
                            Cancel
                        </CustomButton>
                        <CustomButton
                            variant='clickable'
                            loading={isLoading}
                            disabled={!form.amount || form.amount <= 0}
                            onClick={() => onSave(form)}
                        >
                            Save Payment
                        </CustomButton>
                    </Box>
                </Stack>
            </Box>
        </Modal>
    )
}
export default GuestPaymentModal
