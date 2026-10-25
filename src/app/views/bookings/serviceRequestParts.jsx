import { useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { Add } from '@mui/icons-material'
import { dateRange, shortDate } from './bookingFacts'
import { nounOf, requestState, requestSummary } from './serviceRequestFacts'

const requestShape = PropTypes.shape({
    id: PropTypes.number,
    type: PropTypes.string,
    place: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    quantity: PropTypes.number,
    note: PropTypes.string,
    status: PropTypes.string,
    requestedByName: PropTypes.string,
    repliedByName: PropTypes.string,
    reply: PropTypes.string,
    createdAt: PropTypes.string,
    guestName: PropTypes.string,
    bookingNo: PropTypes.string
})

const muted = { fontSize: '0.875rem' }

/**
 * One request: what the guest needs, how it stands, who asked, and what this person may do about it — withdraw it (sales),
 * or book it and decline it (operations). Which of these show is up to the buttons it is given.
 */
export function RequestRow({
    request,
    onWithdraw = null,
    onAnswer = null,
    onDecline = null,
    onOpen = null,
    withBooking = false,
    working = false
}) {
    const state = requestState(request)
    const open = request.status === 'Open'
    const who = [request.requestedByName ? `Asked by ${request.requestedByName}` : '', shortDate(request.createdAt)]
        .filter(Boolean)
        .join(' · ')
    return (
        <Box component='li' sx={{ listStyle: 'none', borderTop: '1px solid', borderColor: 'divider', py: 1.75 }}>
            {withBooking && request.guestName ? (
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.secondary' }}>
                    {[request.guestName, request.bookingNo].filter(Boolean).join(' · ')}
                </Typography>
            ) : null}
            <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>{requestSummary(request)}</Typography>
            <Typography role='status' sx={{ ...muted, fontWeight: 600, color: state.color }}>
                {state.label}
                {state.detail ? (
                    <Box component='span' sx={{ fontWeight: 400, color: 'text.primary' }}>
                        {` — ${state.detail}`}
                    </Box>
                ) : null}
            </Typography>
            <Typography color='text.secondary' sx={muted}>
                {who}
            </Typography>
            {request.note ? (
                <Typography color='text.secondary' sx={{ ...muted, whiteSpace: 'pre-wrap' }}>
                    {request.note}
                </Typography>
            ) : null}
            {(open && (onWithdraw || onAnswer || onDecline)) || onOpen ? (
                <Stack
                    direction='row'
                    spacing={0.5}
                    flexWrap='wrap'
                    useFlexGap
                    sx={{ mt: 0.75, ml: -0.75, '& .MuiButton-root': { textTransform: 'none' } }}
                >
                    {open && onAnswer ? (
                        <Button size='small' variant='contained' disabled={working} onClick={() => onAnswer(request)}>
                            {`Add the ${nounOf(request.type)}`}
                        </Button>
                    ) : null}
                    {open && onDecline ? (
                        <Button size='small' disabled={working} onClick={() => onDecline(request)}>
                            Can’t book it
                        </Button>
                    ) : null}
                    {open && onWithdraw ? (
                        <Button
                            size='small'
                            sx={{ color: 'text.secondary' }}
                            disabled={working}
                            onClick={() => onWithdraw(request)}
                        >
                            Withdraw
                        </Button>
                    ) : null}
                    {onOpen ? (
                        <Button size='small' onClick={() => onOpen(request)}>
                            Open the booking
                        </Button>
                    ) : null}
                </Stack>
            ) : null}
        </Box>
    )
}

RequestRow.propTypes = {
    request: requestShape.isRequired,
    onWithdraw: PropTypes.func,
    onAnswer: PropTypes.func,
    onDecline: PropTypes.func,
    onOpen: PropTypes.func,
    withBooking: PropTypes.bool,
    working: PropTypes.bool
}

/**
 * What sales sees in place of the hotels and transport: ask operations for one, and see how each ask stands. What
 * operations has booked is listed as the guest will hear of it — the dates and rooms, never the supplier or the cost.
 */
export function AskOperations({ requests, booked, onAsk, onWithdraw, working }) {
    return (
        <>
            <Typography color='text.secondary' sx={{ ...muted, mb: 1.5 }}>
                Operations books the hotels and transport. Ask them here and this page shows when it is done.
            </Typography>
            <Stack direction='row' spacing={1} sx={{ mb: 1 }}>
                <Button startIcon={<Add />} variant='outlined' onClick={() => onAsk('Hotel')}>
                    Ask for a hotel
                </Button>
                <Button startIcon={<Add />} variant='outlined' onClick={() => onAsk('Taxi')}>
                    Ask for transport
                </Button>
            </Stack>
            {requests.length ? (
                <Box component='ul' sx={{ m: 0, p: 0 }} aria-label='Your requests to operations'>
                    {requests.map(request => (
                        <RequestRow key={request.id} request={request} onWithdraw={onWithdraw} working={working} />
                    ))}
                </Box>
            ) : (
                <Typography
                    color='text.secondary'
                    sx={{ fontSize: '0.9375rem', borderTop: '1px solid', borderColor: 'divider', pt: 2 }}
                >
                    Nothing asked yet.
                </Typography>
            )}
            {booked.length ? (
                <Box sx={{ mt: 2 }}>
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                        Booked by operations
                    </Typography>
                    <Box component='ul' sx={{ m: 0, pl: 2.5 }}>
                        {booked.map(line => (
                            <Typography component='li' key={line.id} sx={{ fontSize: '0.9375rem' }}>
                                {[
                                    line.type === 'Hotel' ? 'Hotel' : 'Transport',
                                    dateRange(line.startDate, line.endDate),
                                    line.quantity
                                        ? `${line.quantity} ${line.type === 'Hotel' ? 'room' : 'vehicle'}${line.quantity === 1 ? '' : 's'}`
                                        : '',
                                    line.roomType
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </Typography>
                        ))}
                    </Box>
                </Box>
            ) : null}
        </>
    )
}

AskOperations.propTypes = {
    requests: PropTypes.arrayOf(requestShape).isRequired,
    booked: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number,
            type: PropTypes.string,
            startDate: PropTypes.string,
            endDate: PropTypes.string,
            quantity: PropTypes.number,
            roomType: PropTypes.string
        })
    ).isRequired,
    onAsk: PropTypes.func.isRequired,
    onWithdraw: PropTypes.func.isRequired,
    working: PropTypes.bool
}

/**
 * The form sales fills in to ask: where, when, how many, and anything operations should know. It starts from the
 * guest's trip, so most of it is already there.
 */
export function RequestDialog({ open, draft, error, sending, guestName, onChange, onClose, onSend }) {
    const hotel = draft.type === 'Hotel'
    return (
        <Dialog
            open={open}
            onClose={sending ? undefined : onClose}
            fullWidth
            maxWidth='sm'
            aria-labelledby='request-title'
        >
            <DialogTitle id='request-title'>
                {hotel ? 'Ask operations for a hotel' : 'Ask operations for transport'}
            </DialogTitle>
            <DialogContent>
                <Typography color='text.secondary' sx={{ ...muted, mb: 2 }}>
                    For <strong>{guestName}</strong>. Operations picks the {nounOf(draft.type)}, agrees the cost and
                    adds it to this booking.
                </Typography>
                {error ? (
                    <Alert severity='error' sx={{ mb: 2 }} role='alert'>
                        {error}
                    </Alert>
                ) : null}
                <Stack spacing={2}>
                    <TextField
                        label={hotel ? 'Where' : 'Route'}
                        placeholder={hotel ? 'Manali' : 'Delhi to Shimla'}
                        value={draft.place}
                        onChange={event => onChange('place', event.target.value)}
                        inputProps={{ maxLength: 120 }}
                        required
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label={hotel ? 'Check-in' : 'From'}
                            type='date'
                            value={draft.startDate}
                            onChange={event => onChange('startDate', event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label={hotel ? 'Check-out' : 'To'}
                            type='date'
                            value={draft.endDate}
                            onChange={event => onChange('endDate', event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label={hotel ? 'Rooms' : 'Vehicles'}
                            value={draft.quantity}
                            onChange={event => onChange('quantity', event.target.value.replace(/[^0-9]/g, ''))}
                            inputProps={{ inputMode: 'numeric', maxLength: 2 }}
                            sx={{ minWidth: 110 }}
                        />
                    </Stack>
                    <TextField
                        label='Anything operations should know'
                        placeholder={hotel ? 'Budget, near the mall, ground floor…' : 'Vehicle, pickup point, luggage…'}
                        value={draft.note}
                        onChange={event => onChange('note', event.target.value)}
                        multiline
                        minRows={2}
                        inputProps={{ maxLength: 1000 }}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, '& .MuiButton-root': { textTransform: 'none' } }}>
                <Button onClick={onClose} disabled={sending}>
                    Cancel
                </Button>
                <Button
                    variant='contained'
                    onClick={onSend}
                    disabled={sending}
                    startIcon={sending ? <CircularProgress size={16} color='inherit' /> : null}
                >
                    {sending ? 'Sending…' : 'Send to operations'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

RequestDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    draft: PropTypes.shape({
        type: PropTypes.string,
        place: PropTypes.string,
        startDate: PropTypes.string,
        endDate: PropTypes.string,
        quantity: PropTypes.string,
        note: PropTypes.string
    }).isRequired,
    error: PropTypes.string,
    sending: PropTypes.bool,
    guestName: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onSend: PropTypes.func.isRequired
}

/**
 * Operations says it cannot book it, and why: sales reads the reason on the booking and tells the guest.
 */
export function DeclineDialog({ request, sending, onClose, onDecline }) {
    const [reason, setReason] = useState('')
    const [shown, setShown] = useState(false)
    const close = () => {
        setReason('')
        setShown(false)
        onClose()
    }
    return (
        <Dialog
            open={Boolean(request)}
            onClose={sending ? undefined : close}
            fullWidth
            maxWidth='xs'
            aria-labelledby='decline-title'
        >
            <DialogTitle id='decline-title'>Can’t book it</DialogTitle>
            <DialogContent>
                <Typography color='text.secondary' sx={{ ...muted, mb: 2 }}>
                    {request ? requestSummary(request) : ''}
                </Typography>
                <TextField
                    label='Why not'
                    placeholder='No rooms that week, no vehicle free…'
                    value={reason}
                    onChange={event => setReason(event.target.value)}
                    error={shown && !reason.trim()}
                    helperText={shown && !reason.trim() ? 'Say why, so sales can tell the guest' : ' '}
                    multiline
                    minRows={2}
                    inputProps={{ maxLength: 500 }}
                    fullWidth
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, '& .MuiButton-root': { textTransform: 'none' } }}>
                <Button onClick={close} disabled={sending}>
                    Keep it open
                </Button>
                <Button
                    variant='contained'
                    color='error'
                    disabled={sending}
                    onClick={async () => {
                        setShown(true)
                        if (!reason.trim()) return
                        const ok = await onDecline(request, reason.trim())
                        if (ok) close()
                    }}
                >
                    Decline
                </Button>
            </DialogActions>
        </Dialog>
    )
}

DeclineDialog.propTypes = {
    request: requestShape,
    sending: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onDecline: PropTypes.func.isRequired
}
