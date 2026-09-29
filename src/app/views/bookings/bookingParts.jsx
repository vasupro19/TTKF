import { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material'
import { STEPS, amount, dateRange, rupees, shortDate } from './bookingFacts'
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

export function ServiceRow({ service, onPay, onEmail, onEdit, onRemove, emailing = false }) {
    const [confirmRemove, setConfirmRemove] = useState(false)
    const cost = amount(service.cost)
    const paid = amount(service.paidAmount)
    const due = Math.max(0, cost - paid)
    const name = service.supplier?.businessname || 'Supplier'
    const facts = [
        dateRange(service.startDate, service.endDate),
        service.type === 'Hotel' && service.quantity
            ? `${service.quantity} room${service.quantity === 1 ? '' : 's'}`
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
                </Box>
                <Box sx={{ textAlign: { sm: 'right' }, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>{rupees(cost)}</Typography>
                    <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                        {due ? `${rupees(paid)} paid · ${rupees(due)} due` : 'Paid in full'}
                    </Typography>
                </Box>
            </Stack>
            <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap sx={{ mt: 1, ml: -0.75 }}>
                {confirmRemove ? (
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
                ) : (
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
                            {emailing ? 'Sending…' : 'Email supplier'}
                        </Button>
                        <Button size='small' onClick={() => onEdit(service)}>
                            Edit
                        </Button>
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
    onEdit: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    emailing: PropTypes.bool
}

export function PaymentRow({ payment }) {
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
        </Box>
    )
}

PaymentRow.propTypes = { payment: paymentShape.isRequired }
