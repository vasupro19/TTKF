import { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, CircularProgress, IconButton, Modal, Stack, Typography } from '@mui/material'
import { CheckCircle, Close, RadioButtonUnchecked, Send } from '@mui/icons-material'
import {
    STEPS,
    SUPPLIER_EMAIL_WORDS,
    amount,
    dateRange,
    emailOutcome,
    rupees,
    shortDate,
    supplierHasBooking
} from './bookingFacts'
import { paymentShape, serviceShape } from './bookingShapes'

// ? read by screen readers, not shown
const visuallyHidden = {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap'
}

export function Section({ id, title, action = null, children }) {
    return (
        <Box component='section' id={id} aria-labelledby={`${id}-title`} sx={{ mb: 5, scrollMarginTop: 88 }}>
            <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                spacing={2}
                sx={{ mb: 1.5, minHeight: 36 }}
            >
                <Typography id={`${id}-title`} component='h2' sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
                    {title}
                </Typography>
                {action}
            </Stack>
            {children}
        </Box>
    )
}

Section.propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    action: PropTypes.node,
    children: PropTypes.node.isRequired
}

export function StepsBar({ progress }) {
    return (
        <Stack
            component='ol'
            direction='row'
            flexWrap='wrap'
            useFlexGap
            spacing={{ xs: 1.5, sm: 2.5 }}
            sx={{ listStyle: 'none', m: 0, p: 0 }}
            aria-label='Booking progress'
        >
            {STEPS.map(step => (
                <Stack component='li' key={step.key} direction='row' spacing={0.75} alignItems='center'>
                    {progress[step.key] ? (
                        <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} />
                    ) : (
                        <RadioButtonUnchecked sx={{ fontSize: 18, color: 'text.disabled' }} />
                    )}
                    <Typography
                        sx={{ fontSize: '0.875rem', color: progress[step.key] ? 'text.primary' : 'text.secondary' }}
                    >
                        {step.label}
                        <Box component='span' sx={visuallyHidden}>
                            {progress[step.key] ? ' — done' : ' — to do'}
                        </Box>
                    </Typography>
                </Stack>
            ))}
        </Stack>
    )
}

StepsBar.propTypes = { progress: PropTypes.objectOf(PropTypes.bool).isRequired }

export function MoneyCard({ title, lines, action = null }) {
    return (
        <Box sx={{ flex: 1, minWidth: 0, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', fontWeight: 600, mb: 1 }}>
                {title}
            </Typography>
            {lines.map(([label, value, strong]) => (
                <Stack key={label} direction='row' justifyContent='space-between' spacing={2} sx={{ py: 0.25 }}>
                    <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                        {label}
                    </Typography>
                    <Typography sx={{ fontSize: strong ? '1rem' : '0.9375rem', fontWeight: strong ? 700 : 500 }}>
                        {value}
                    </Typography>
                </Stack>
            ))}
            {action ? <Box sx={{ mt: 1.5 }}>{action}</Box> : null}
        </Box>
    )
}

MoneyCard.propTypes = {
    title: PropTypes.string.isRequired,
    lines: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.bool]))).isRequired,
    action: PropTypes.node
}

const STATUS_COLOR = { 'Fully Paid': 'success.dark', 'Partially Paid': '#b45309' }
const STATUS_TEXT = { 'Fully Paid': 'Paid', 'Partially Paid': 'Part paid' }

export function ServiceRow({ service, onPay, onEmail, onCancel, onEdit, onRemove, emailing = false }) {
    const [confirmRemove, setConfirmRemove] = useState(false)
    const cost = amount(service.cost)
    const paid = amount(service.paidAmount)
    const due = Math.max(0, cost - paid)
    const name = service.supplier?.businessname || 'Supplier'
    const details = service.details || {}
    const request = emailOutcome(
        service.lastEmail,
        SUPPLIER_EMAIL_WORDS[service.lastEmail?.kind] || SUPPLIER_EMAIL_WORDS.request
    )
    // ? the supplier has this booking: removing the line should tell them
    const booked = supplierHasBooking(service)
    const isHotel = service.type === 'Hotel'
    const facts = [
        dateRange(service.startDate, service.endDate),
        isHotel && service.quantity ? `${service.quantity} room${service.quantity === 1 ? '' : 's'}` : '',
        isHotel ? service.roomType : details.vehicleType,
        isHotel ? details.mealPlan : [details.pickupPoint, details.dropPoint].filter(Boolean).join(' → '),
        !isHotel && details.driverName
            ? `Driver ${details.driverName}${details.driverPhone ? ` (${details.driverPhone})` : ''}`
            : '',
        service.supplier?.phone || ''
    ].filter(Boolean)

    return (
        <Box component='li' sx={{ listStyle: 'none', borderTop: '1px solid', borderColor: 'divider', py: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }} justifyContent='space-between'>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>
                        {name}
                        <Typography
                            component='span'
                            sx={{
                                ml: 1,
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: STATUS_COLOR[service.paymentStatus] || 'error.main'
                            }}
                        >
                            {STATUS_TEXT[service.paymentStatus] || 'Unpaid'}
                        </Typography>
                    </Typography>
                    {facts.length ? (
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                            {facts.join(' · ')}
                        </Typography>
                    ) : null}
                    {service.remarks ? (
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                            {service.remarks}
                        </Typography>
                    ) : null}
                    {request ? (
                        <Typography
                            role='status'
                            color={request.failed ? 'error.main' : 'success.main'}
                            sx={{ fontSize: '0.8125rem', mt: 0.25 }}
                        >
                            {request.text}
                        </Typography>
                    ) : null}
                </Box>
                <Box sx={{ textAlign: { sm: 'right' }, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>{rupees(cost)}</Typography>
                    <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                        {due ? `${rupees(paid)} paid · ${rupees(due)} due` : 'Paid in full'}
                    </Typography>
                </Box>
            </Stack>
            <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap sx={{ mt: 1, ml: -0.75 }}>
                {confirmRemove && booked ? (
                    <>
                        <Typography sx={{ fontSize: '0.875rem', px: 0.75, alignSelf: 'center' }}>
                            {name} has this booking. Send them a cancellation?
                        </Typography>
                        <Button
                            size='small'
                            color='error'
                            onClick={() => {
                                setConfirmRemove(false)
                                onCancel(service, true)
                            }}
                        >
                            Send cancellation
                        </Button>
                        <Button size='small' sx={{ color: 'text.secondary' }} onClick={() => onRemove(service)}>
                            Remove without email
                        </Button>
                        <Button size='small' onClick={() => setConfirmRemove(false)}>
                            Keep
                        </Button>
                    </>
                ) : null}
                {confirmRemove && !booked ? (
                    <>
                        <Typography sx={{ fontSize: '0.875rem', px: 0.75, alignSelf: 'center' }}>
                            Remove {name} from this booking?
                        </Typography>
                        <Button size='small' color='error' onClick={() => onRemove(service)}>
                            Remove
                        </Button>
                        <Button size='small' onClick={() => setConfirmRemove(false)}>
                            Keep
                        </Button>
                    </>
                ) : null}
                {confirmRemove ? null : (
                    <>
                        {due ? (
                            <Button size='small' onClick={() => onPay(service)}>
                                Record payment
                            </Button>
                        ) : null}
                        <Button
                            size='small'
                            onClick={() => onEmail(service)}
                            disabled={emailing}
                            startIcon={emailing ? <CircularProgress size={14} color='inherit' /> : null}
                        >
                            {emailing ? 'Sending…' : `Email ${service.type === 'Hotel' ? 'hotel' : 'transporter'}`}
                        </Button>
                        <Button size='small' onClick={() => onEdit(service)}>
                            Edit
                        </Button>
                        {booked ? (
                            <Button size='small' color='error' onClick={() => onCancel(service, false)}>
                                Cancel booking
                            </Button>
                        ) : null}
                        <Button size='small' sx={{ color: 'text.secondary' }} onClick={() => setConfirmRemove(true)}>
                            Remove
                        </Button>
                    </>
                )}
            </Stack>
        </Box>
    )
}

ServiceRow.propTypes = {
    service: serviceShape.isRequired,
    onPay: PropTypes.func.isRequired,
    onEmail: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    emailing: PropTypes.bool
}

export function PaymentRow({ payment, onReceipt, canEmail = true }) {
    const receipt = emailOutcome(payment.receipt, 'Receipt')
    return (
        <Box component='li' sx={{ listStyle: 'none', borderTop: '1px solid', borderColor: 'divider', py: 1.5 }}>
            <Stack direction='row' justifyContent='space-between' spacing={2}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
                        {[shortDate(payment.paymentDate), payment.paymentMethod].filter(Boolean).join(' · ')}
                    </Typography>
                    {payment.transactionId || payment.remarks ? (
                        <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                            {[payment.transactionId ? `Ref ${payment.transactionId}` : '', payment.remarks]
                                .filter(Boolean)
                                .join(' · ')}
                        </Typography>
                    ) : null}
                </Box>
                <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, flexShrink: 0 }}>
                    {rupees(payment.amount)}
                </Typography>
            </Stack>
            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap sx={{ ml: -0.75 }}>
                <Button size='small' disabled={!canEmail} onClick={() => onReceipt(payment)}>
                    {canEmail ? 'Email receipt' : 'No guest email for a receipt'}
                </Button>
                {receipt ? (
                    <Typography
                        role='status'
                        color={receipt.failed ? 'error.main' : 'text.secondary'}
                        sx={{ fontSize: '0.8125rem' }}
                    >
                        {receipt.text}
                    </Typography>
                ) : null}
            </Stack>
        </Box>
    )
}

PaymentRow.propTypes = {
    payment: paymentShape.isRequired,
    onReceipt: PropTypes.func.isRequired,
    canEmail: PropTypes.bool
}

/**
 * An email exactly as it will be sent — to the guest (voucher, receipt, hotel and transport details) or to a hotel
 * or transporter (booking request, amendment, cancellation) — with the recipient and subject, and a button to send
 * it. `note` says something the agent should know first; `extra` sits above the buttons (a cancellation's "also
 * remove from the booking").
 */
export function EmailPreview({
    open,
    title,
    to = '',
    subject = '',
    html = '',
    loading = false,
    sending = false,
    sendLabel,
    canSend = true,
    closeLabel = 'Cancel',
    from = '',
    fromNote = '',
    note = '',
    extra = null,
    onClose,
    onSend
}) {
    return (
        <Modal open={open} onClose={onClose}>
            <Box
                role='dialog'
                aria-label={title}
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: '100vw', sm: '85vw' },
                    maxWidth: 900,
                    height: { xs: '100dvh', sm: '85vh' },
                    bgcolor: 'background.paper',
                    borderRadius: { xs: 0, sm: 2 },
                    boxShadow: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    '& .MuiButton-root': { textTransform: 'none' }
                }}
            >
                <Stack
                    direction='row'
                    alignItems='flex-start'
                    justifyContent='space-between'
                    spacing={2}
                    sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>{title}</Typography>
                        {from ? (
                            <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }} noWrap>
                                From {from}
                            </Typography>
                        ) : null}
                        {to ? (
                            <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }} noWrap>
                                To {to}
                            </Typography>
                        ) : null}
                        {subject ? (
                            <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }} noWrap>
                                Subject: {subject}
                            </Typography>
                        ) : null}
                    </Box>
                    <IconButton aria-label='Close' onClick={onClose}>
                        <Close />
                    </IconButton>
                </Stack>
                {fromNote ? (
                    <Typography
                        role='note'
                        aria-label='Sender'
                        sx={{
                            px: 3,
                            py: 1.25,
                            fontSize: '0.875rem',
                            color: 'warning.dark',
                            borderBottom: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        {fromNote}
                    </Typography>
                ) : null}
                {note ? (
                    <Typography
                        role='note'
                        sx={{
                            px: 3,
                            py: 1.25,
                            fontSize: '0.875rem',
                            bgcolor: 'action.hover',
                            borderBottom: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        {note}
                    </Typography>
                ) : null}
                <Box sx={{ flex: 1, overflow: 'hidden', bgcolor: 'grey.50' }}>
                    {loading ? (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CircularProgress aria-label='Loading the email' />
                        </Box>
                    ) : (
                        <iframe srcDoc={html} title={title} style={{ width: '100%', height: '100%', border: 'none' }} />
                    )}
                </Box>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent='flex-end'
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    spacing={2}
                    sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}
                >
                    {extra ? <Box sx={{ flex: 1, minWidth: 0 }}>{extra}</Box> : null}
                    <Button onClick={onClose}>{closeLabel}</Button>
                    <Button
                        variant='contained'
                        startIcon={sending ? <CircularProgress size={16} color='inherit' /> : <Send />}
                        disabled={sending || loading || !canSend}
                        onClick={onSend}
                    >
                        {sendLabel}
                    </Button>
                </Stack>
            </Box>
        </Modal>
    )
}

EmailPreview.propTypes = {
    open: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    to: PropTypes.string,
    subject: PropTypes.string,
    html: PropTypes.string,
    loading: PropTypes.bool,
    sending: PropTypes.bool,
    sendLabel: PropTypes.string.isRequired,
    canSend: PropTypes.bool,
    closeLabel: PropTypes.string,
    from: PropTypes.string,
    fromNote: PropTypes.string,
    note: PropTypes.string,
    extra: PropTypes.node,
    onClose: PropTypes.func.isRequired,
    onSend: PropTypes.func.isRequired
}

/** @description how a guest email last went, under its button */
export function EmailNote({ email = null }) {
    const outcome = emailOutcome(email)
    if (!outcome) return null
    return (
        <Typography
            role='status'
            color={outcome.failed ? 'error.main' : 'text.secondary'}
            sx={{ fontSize: '0.8125rem', maxWidth: 320 }}
        >
            {outcome.text}
        </Typography>
    )
}

EmailNote.propTypes = {
    email: PropTypes.shape({ status: PropTypes.string, sentAt: PropTypes.string, notes: PropTypes.string })
}
