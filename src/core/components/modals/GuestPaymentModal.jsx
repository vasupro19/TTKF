import React, { useState, useEffect } from 'react'

import { Alert, Modal, Box, Divider, Typography, TextField, Stack, MenuItem } from '@mui/material'
import dayjs from 'dayjs'
import { GUEST_METHODS, isCash, isoDay, paymentFormErrors } from '@/app/views/payments/paymentFacts'
import { ProofFileField } from '@/app/views/payments/paymentParts'
import CustomButton from '../extended/CustomButton'

/**
 * Records a guest payment — or, given `payment`, corrects one that is waiting or was rejected (it goes back to
 * accounts). The proof (screenshot or PDF) is needed unless the guest paid in cash; `onSave` gets the form with
 * `proof` (the File, or null).
 */
function GuestPaymentModal({ open, onClose, onSave, row, isLoading, payment = null }) {
    // Set default date to today in YYYY-MM-DD format for the input
    // ? today where the agent is: the UTC date was yesterday until 05:30 IST
    const today = dayjs().format('YYYY-MM-DD')

    const [form, setForm] = useState({
        amount: '',
        paymentMethod: 'UPI',
        transactionId: '',
        remarks: '',
        paymentDate: today // Added date field
    })

    const [proof, setProof] = useState(null)
    const [tried, setTried] = useState(false)

    // Reset form when modal opens with a new row
    useEffect(() => {
        if (open) {
            setForm({
                amount: payment ? String(payment.amount ?? '') : '',
                paymentMethod: payment?.paymentMethod || 'UPI',
                transactionId: payment?.transactionId || '',
                remarks: payment?.remarks || '',
                paymentDate: isoDay(payment?.paymentDate) || today
            })
            setProof(null)
            setTried(false)
        }
    }, [open, today, payment])

    const hasProof = Boolean(payment?.hasProof)
    const rejected = payment?.status === 'REJECTED'
    let title = 'Record Guest Payment'
    let saveLabel = 'Save Payment'
    if (payment) {
        title = rejected ? 'Correct and resubmit payment' : 'Edit payment'
        saveLabel = rejected ? 'Send to accounts' : 'Save changes'
    }
    const errors = paymentFormErrors(form, proof, { proof: 'unlessCash', hasProof })
    const valid = !Object.keys(errors).length
    // ? a wrong file is said at once; a missing one once Save is tried
    const proofError = proof || tried ? errors.proof || '' : ''
    const save = () => {
        setTried(true)
        if (valid) onSave({ ...form, proof })
    }

    // Calculate remaining balance for UI display (amounts may arrive as decimal strings)
    const remainingBalance = Math.max(0, (Number(row?.sellingPrice) || 0) - (Number(row?.guestPaidAmount) || 0))
    const rupees = value => `₹${(Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: 'calc(100vw - 32px)', sm: 450 },
                    maxHeight: 'calc(100dvh - 32px)',
                    overflowY: 'auto',
                    bgcolor: 'background.paper',
                    p: 4,
                    borderRadius: 2,
                    boxShadow: 24
                }}
            >
                <Typography variant='h4' mb={2}>
                    {title}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {rejected && payment.rejectionReason ? (
                    <Alert severity='error' sx={{ mb: 2 }}>
                        Rejected{payment.reviewedByName ? ` by ${payment.reviewedByName}` : ''}:{' '}
                        {payment.rejectionReason}
                    </Alert>
                ) : null}

                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant='subtitle2' color='textSecondary'>
                        Guest: <b>{row?.guestName || row?.lead?.fullName || 'Guest'}</b>
                    </Typography>
                    <Stack direction='row' justifyContent='space-between' mt={1}>
                        <Typography variant='body2'>
                            Total: <b>{rupees(row?.sellingPrice)}</b>
                        </Typography>
                        <Typography variant='body2' color='error'>
                            Balance: <b>{rupees(remainingBalance)}</b>
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
                            error={tried && Boolean(errors.amount)}
                            helperText={tried ? errors.amount : ''}
                        />
                    </Stack>

                    <TextField
                        select
                        label='Payment Method'
                        fullWidth
                        value={form.paymentMethod}
                        onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                    >
                        {GUEST_METHODS.map(opt => (
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

                    <ProofFileField
                        file={proof}
                        onChange={setProof}
                        error={proofError}
                        required={!isCash(form.paymentMethod)}
                        hasProof={hasProof}
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
                            disabled={isLoading || (tried && !valid)}
                            onClick={save}
                        >
                            {saveLabel}
                        </CustomButton>
                    </Box>
                </Stack>
            </Box>
        </Modal>
    )
}
export default GuestPaymentModal
