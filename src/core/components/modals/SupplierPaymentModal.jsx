import React, { useState, useEffect } from 'react'
import { Modal, Box, Divider, Typography, TextField, Stack, MenuItem } from '@mui/material'
import CustomButton from '../extended/CustomButton'

function SupplierPaymentModal({ open, onClose, onSave, row, isLoading }) {
    const today = new Date().toISOString().split('T')[0]

    const [form, setForm] = useState({
        amount: '',
        paymentMethod: 'Bank Transfer',
        transactionId: '',
        remarks: '',
        paymentDate: today
    })

    useEffect(() => {
        if (open) {
            setForm({
                amount: '',
                paymentMethod: 'Bank Transfer',
                transactionId: '',
                remarks: '',
                paymentDate: today
            })
        }
    }, [open, today])

    // row.cost is the total amount to be paid to supplier
    // row.paidAmount is what has already been paid
    const remainingBalance = (row?.cost || 0) - (row?.paidAmount || 0)

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 450,
                    bgcolor: 'background.paper',
                    p: 4,
                    borderRadius: 2,
                    boxShadow: 24
                }}
            >
                <Typography variant='h4' mb={1}>
                    Record Supplier Payment
                </Typography>
                <Typography variant='body2' color='textSecondary' mb={2}>
                    Service: {row?.type} for {row?.guestName}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box
                    sx={{
                        mb: 2,
                        p: 1.5,
                        bgcolor: 'primary.lighter',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'primary.light'
                    }}
                >
                    <Typography variant='subtitle2' color='textSecondary'>
                        Supplier: <b>{row?.supplierName}</b>
                    </Typography>
                    <Stack direction='row' justifyContent='space-between' mt={1}>
                        <Typography variant='body2'>
                            Total Cost: <b>${row?.cost}</b>
                        </Typography>
                        <Typography variant='body2' color='error.main'>
                            Pending Balance: <b>${remainingBalance.toFixed(2)}</b>
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
                            label='Amount Paid'
                            type='number'
                            fullWidth
                            value={form.amount}
                            onChange={e => setForm({ ...form, amount: e.target.value })}
                            helperText={form.amount > remainingBalance ? 'Amount exceeds balance' : ''}
                            error={form.amount > remainingBalance}
                        />
                    </Stack>

                    <TextField
                        select
                        label='Payment Method'
                        fullWidth
                        value={form.paymentMethod}
                        onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                    >
                        {['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Credit Card'].map(opt => (
                            <MenuItem key={opt} value={opt}>
                                {opt}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label='Transaction ID / Ref'
                        fullWidth
                        value={form.transactionId}
                        placeholder='e.g. UTR or Check Number'
                        onChange={e => setForm({ ...form, transactionId: e.target.value })}
                    />

                    <TextField
                        label='Internal Remarks'
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
                            disabled={!form.amount || form.amount <= 0 || isLoading}
                            onClick={() => onSave(form)}
                        >
                            Confirm Payment
                        </CustomButton>
                    </Box>
                </Stack>
            </Box>
        </Modal>
    )
}

export default SupplierPaymentModal
