import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import { AttachFile, BrokenImage, Close, OpenInNew, PictureAsPdf, WarningAmber } from '@mui/icons-material'
import { PROOF_ACCEPT, decisionNote, isPdfProof, payDate, proofUrl, rupees, statusInfo } from './paymentFacts'
import paymentRowShape from './paymentShapes'

export function PaymentStatusChip({ payment, size = 'small' }) {
    const info = statusInfo(payment?.status)
    const note = decisionNote(payment)
    const chip = <Chip label={info.label} color={info.color} size={size} variant='outlined' sx={{ fontWeight: 600 }} />
    return note ? (
        <Tooltip title={note}>
            <span>{chip}</span>
        </Tooltip>
    ) : (
        chip
    )
}

PaymentStatusChip.propTypes = { payment: paymentRowShape.isRequired, size: PropTypes.string }

/** @description "same transaction id elsewhere" — shown to accounts before they verify */
export function DuplicateWarning({ payment }) {
    if (!payment?.duplicateOf?.length) return null
    return (
        <Tooltip title={`The same transaction ID is on payment ${payment.duplicateOf.map(n => `#${n}`).join(', ')}`}>
            <WarningAmber color='warning' fontSize='small' aria-label='Duplicate transaction ID' />
        </Tooltip>
    )
}

DuplicateWarning.propTypes = { payment: paymentRowShape.isRequired }

/** @description the proof itself, large: a picture in place, a PDF in a new tab (the API does not allow frames) */
function ProofView({ kind, payment, maxHeight = '70vh' }) {
    const [failed, setFailed] = useState(false)
    const url = proofUrl(kind, payment.id)
    if (!payment.hasProof)
        return (
            <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                No proof attached{/cash/i.test(payment.paymentMethod || '') ? ' (cash)' : ''}.
            </Typography>
        )
    if (isPdfProof(payment.proofName, payment.proofType) || failed)
        return (
            <Stack spacing={1} alignItems='flex-start'>
                {failed ? (
                    <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                        The proof couldn’t be shown here.
                    </Typography>
                ) : null}
                <Button
                    variant='outlined'
                    startIcon={failed ? <OpenInNew /> : <PictureAsPdf />}
                    href={url}
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    Open {payment.proofName || 'the proof'}
                </Button>
            </Stack>
        )
    return (
        <Box>
            <Box
                component='img'
                src={url}
                alt={`Proof of payment ${payment.id}`}
                onError={() => setFailed(true)}
                sx={{
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight,
                    objectFit: 'contain',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'grey.50'
                }}
            />
            <Button size='small' href={url} target='_blank' rel='noopener noreferrer' endIcon={<OpenInNew />}>
                Open full size
            </Button>
        </Box>
    )
}

ProofView.propTypes = {
    kind: PropTypes.oneOf(['guest', 'supplier']).isRequired,
    payment: paymentRowShape.isRequired,
    maxHeight: PropTypes.string
}

/**
 * @description a payment's proof in a list: a thumbnail that opens it large, a PDF link that opens a new tab, or a
 *              dash when there is none
 */
export function ProofLink({ kind = 'guest', payment, hideEmpty = false }) {
    const [open, setOpen] = useState(false)
    const [failed, setFailed] = useState(false)
    if (!payment?.hasProof)
        return hideEmpty ? null : (
            <Typography component='span' color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                —
            </Typography>
        )
    const url = proofUrl(kind, payment.id)
    if (isPdfProof(payment.proofName, payment.proofType))
        return (
            <Tooltip title={`Open ${payment.proofName || 'the PDF'}`}>
                <IconButton size='small' href={url} target='_blank' rel='noopener noreferrer' aria-label='Open proof'>
                    <PictureAsPdf fontSize='small' color='error' />
                </IconButton>
            </Tooltip>
        )
    return (
        <>
            <Tooltip title='View proof'>
                <IconButton size='small' onClick={() => setOpen(true)} aria-label='View proof' sx={{ p: 0.25 }}>
                    {failed ? (
                        <BrokenImage fontSize='small' />
                    ) : (
                        <Box
                            component='img'
                            src={url}
                            alt=''
                            loading='lazy'
                            onError={() => setFailed(true)}
                            sx={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 0.5, display: 'block' }}
                        />
                    )}
                </IconButton>
            </Tooltip>
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md'>
                <DialogTitle sx={{ pr: 6 }}>
                    Proof · {rupees(payment.amount)}
                    {payment.transactionId ? ` · Ref ${payment.transactionId}` : ''}
                    <IconButton
                        aria-label='Close'
                        onClick={() => setOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {open ? <ProofView kind={kind} payment={payment} maxHeight='75vh' /> : null}
                </DialogContent>
            </Dialog>
        </>
    )
}

ProofLink.propTypes = {
    kind: PropTypes.oneOf(['guest', 'supplier']),
    payment: paymentRowShape.isRequired,
    hideEmpty: PropTypes.bool
}

/**
 * @description the proof file input: a button, the chosen file's name, and what is needed or wrong
 */
export function ProofFileField({ file, onChange, error = '', required = true, hasProof = false }) {
    let hint = required ? 'Screenshot or PDF, up to 5 MB' : 'Not needed for cash'
    if (hasProof && !file) hint = 'A proof is attached — choose a file only to replace it'
    return (
        <Box>
            <Stack direction='row' spacing={1} alignItems='center' sx={{ minWidth: 0 }}>
                <Button
                    component='label'
                    variant='outlined'
                    size='small'
                    startIcon={<AttachFile />}
                    sx={{ flexShrink: 0 }}
                >
                    {file || hasProof ? 'Replace proof' : 'Attach proof'}
                    {required && !hasProof ? ' *' : ''}
                    <input
                        hidden
                        type='file'
                        accept={PROOF_ACCEPT}
                        aria-label='Payment proof'
                        onChange={event => {
                            onChange(event.target.files?.[0] || null)
                            // ? the same file can be chosen again after removing it
                            event.target.value = ''
                        }}
                    />
                </Button>
                {file ? (
                    <>
                        <Typography noWrap sx={{ fontSize: '0.875rem', minWidth: 0 }} title={file.name}>
                            {file.name}
                        </Typography>
                        <IconButton size='small' aria-label='Remove the chosen file' onClick={() => onChange(null)}>
                            <Close fontSize='small' />
                        </IconButton>
                    </>
                ) : null}
            </Stack>
            <Typography
                role={error ? 'alert' : undefined}
                color={error ? 'error' : 'text.secondary'}
                sx={{ fontSize: '0.75rem', mt: 0.5 }}
            >
                {error || hint}
            </Typography>
        </Box>
    )
}

ProofFileField.propTypes = {
    file: PropTypes.instanceOf(typeof Blob === 'undefined' ? Object : Blob),
    onChange: PropTypes.func.isRequired,
    error: PropTypes.string,
    required: PropTypes.bool,
    hasProof: PropTypes.bool
}

const TITLES = {
    verify: 'Verify payment',
    reject: 'Reject payment',
    reverse: 'Reverse payment'
}

/**
 * Accounts decides one guest payment. Verify shows the proof large beside the amount and transaction id, to compare
 * with the bank; reject and reverse need a reason (sales sees it).
 */
export function PaymentDecisionDialog({ mode = null, payment = null, busy = false, onConfirm, onClose }) {
    const [reason, setReason] = useState('')
    useEffect(() => {
        if (mode) setReason('')
    }, [mode, payment?.id])

    if (!mode || !payment) return null
    const needsReason = mode !== 'verify'
    const facts = [
        ['Amount', rupees(payment.amount)],
        ['Method', payment.paymentMethod || '—'],
        ['Transaction ID', payment.transactionId || '—'],
        ['Payment date', payDate(payment.paymentDate) || '—'],
        ['Guest', payment.guestName || payment.package?.lead?.fullName || '—'],
        ['Booking', payment.bookingNo || '—'],
        ['Recorded by', payment.recordedByName || '—']
    ]
    const price = payment.package?.sellingPrice
    if (price !== undefined && price !== null) {
        facts.push(['Booking price', rupees(price)])
        facts.push(['Already verified', rupees(payment.package?.guestPaidAmount)])
    }

    const details = (
        <Box sx={{ minWidth: 0 }}>
            {facts.map(([label, value]) => (
                <Stack key={label} direction='row' justifyContent='space-between' spacing={2} sx={{ py: 0.5 }}>
                    <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                        {label}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: label === 'Amount' || label === 'Transaction ID' ? '1rem' : '0.875rem',
                            fontWeight: label === 'Amount' || label === 'Transaction ID' ? 700 : 500,
                            textAlign: 'right',
                            wordBreak: 'break-all'
                        }}
                    >
                        {value}
                    </Typography>
                </Stack>
            ))}
            {payment.remarks ? (
                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mt: 1 }}>
                    {payment.remarks}
                </Typography>
            ) : null}
            {payment.duplicateOf?.length ? (
                <Alert severity='warning' sx={{ mt: 1.5 }}>
                    The same transaction ID is on payment {payment.duplicateOf.map(n => `#${n}`).join(', ')}. Check it
                    is not the same money recorded twice.
                </Alert>
            ) : null}
        </Box>
    )

    return (
        <Dialog
            open
            onClose={busy ? undefined : onClose}
            maxWidth={mode === 'verify' ? 'lg' : 'sm'}
            fullWidth
            aria-labelledby='payment-decision-title'
        >
            <DialogTitle id='payment-decision-title'>{TITLES[mode]}</DialogTitle>
            <DialogContent dividers>
                {mode === 'verify' ? (
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Box sx={{ flex: 2, minWidth: 0 }}>
                            <ProofView kind='guest' payment={payment} maxHeight='65vh' />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 260 }}>
                            {details}
                            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mt: 2 }}>
                                Compare the amount and transaction ID with the bank statement. Once verified it counts
                                toward the booking and can’t be edited — only reversed.
                            </Typography>
                        </Box>
                    </Stack>
                ) : (
                    <Stack spacing={2}>
                        {details}
                        <TextField
                            label={mode === 'reject' ? 'Why is it rejected? (sales sees this)' : 'Why is it reversed?'}
                            required
                            multiline
                            minRows={2}
                            fullWidth
                            value={reason}
                            inputProps={{ maxLength: 1000 }}
                            onChange={event => setReason(event.target.value)}
                        />
                        {mode === 'reverse' ? (
                            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                It stops counting toward the booking’s paid amount. To fix a mistake, record the payment
                                again.
                            </Typography>
                        ) : null}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
                <Button onClick={onClose} disabled={busy}>
                    Cancel
                </Button>
                <Button
                    variant='contained'
                    color={mode === 'verify' ? 'success' : 'error'}
                    disabled={busy || (needsReason && !reason.trim())}
                    startIcon={busy ? <CircularProgress size={16} color='inherit' /> : null}
                    onClick={() => onConfirm(needsReason ? reason.trim() : undefined)}
                >
                    {{ verify: 'Verify payment', reject: 'Reject', reverse: 'Reverse' }[mode]}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

PaymentDecisionDialog.propTypes = {
    mode: PropTypes.oneOf(['verify', 'reject', 'reverse', null]),
    payment: paymentRowShape,
    busy: PropTypes.bool,
    onConfirm: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
}
