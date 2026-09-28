import { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Collapse, IconButton, Stack, TextField, Typography } from '@mui/material'
import { Add, Close, MicNone, Remove } from '@mui/icons-material'
import CustomButton from '@core/components/extended/CustomButton'
import { addDestinationText, dateRangeLabel, totalNights } from './plannerInput'
import { plannerInputShape, voiceShape } from './shapes'

export function FieldLabel({ children, optional = false }) {
    return (
        <Typography component='div' sx={{ fontSize: '0.9375rem', fontWeight: 600, mb: 1 }}>
            {children}
            {optional ? (
                <Typography
                    component='span'
                    color='text.secondary'
                    sx={{ fontWeight: 400, ml: 1, fontSize: '0.875rem' }}
                >
                    optional
                </Typography>
            ) : null}
        </Typography>
    )
}

FieldLabel.propTypes = { children: PropTypes.node.isRequired, optional: PropTypes.bool }

function NightsStepper({ name, nights, onChange, onRemove }) {
    return (
        <Stack direction='row' alignItems='center' spacing={1} sx={{ py: 0.75 }}>
            <Typography sx={{ flex: 1, minWidth: 0, fontSize: '1rem' }} noWrap>
                {name}
            </Typography>
            <IconButton
                size='small'
                aria-label={`One night less in ${name}`}
                disabled={nights <= 1}
                onClick={() => onChange(nights - 1)}
                sx={{ border: '1px solid', borderColor: 'divider' }}
            >
                <Remove fontSize='small' />
            </IconButton>
            <Typography sx={{ width: 76, textAlign: 'center', fontSize: '0.9375rem' }} aria-live='polite'>
                {nights} {nights === 1 ? 'night' : 'nights'}
            </Typography>
            <IconButton
                size='small'
                aria-label={`One more night in ${name}`}
                disabled={nights >= 30}
                onClick={() => onChange(nights + 1)}
                sx={{ border: '1px solid', borderColor: 'divider' }}
            >
                <Add fontSize='small' />
            </IconButton>
            <IconButton size='small' aria-label={`Remove ${name}`} onClick={onRemove} sx={{ color: 'text.secondary' }}>
                <Close fontSize='small' />
            </IconButton>
        </Stack>
    )
}

NightsStepper.propTypes = {
    name: PropTypes.string.isRequired,
    nights: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired
}

/**
 * Step 1 — the only required questions: where from, where to (and how long in each), and optionally when.
 */
function StepTrip({ input, onChange, onContinue, error = '', onReadMessage, reading = false, voice = null }) {
    const [pending, setPending] = useState('')
    const [showEnd, setShowEnd] = useState(Boolean(input.endsAt))
    const [showMessage, setShowMessage] = useState(false)
    const [message, setMessage] = useState('')
    const [filledFromMessage, setFilledFromMessage] = useState(false)

    const nights = totalNights(input)
    const set = (field, value) => onChange({ ...input, [field]: value })

    const addPending = () => {
        if (!pending.trim()) return input
        const next = addDestinationText(input, pending)
        onChange(next)
        setPending('')
        return next
    }

    const updateNights = (index, value) =>
        set(
            'destinations',
            input.destinations.map((item, position) => (position === index ? { ...item, nights: value } : item))
        )

    const readMessage = async () => {
        const filled = await onReadMessage(message)
        if (filled) {
            setFilledFromMessage(true)
            setShowMessage(false)
            setShowEnd(Boolean(filled.endsAt))
        }
    }

    return (
        <Stack spacing={4}>
            {filledFromMessage ? (
                <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                    We filled this in from the message. Check it and continue.
                </Typography>
            ) : null}

            <Box>
                <FieldLabel>Starting from</FieldLabel>
                <TextField
                    fullWidth
                    value={input.origin}
                    onChange={event => set('origin', event.target.value)}
                    placeholder='e.g. Delhi'
                    inputProps={{ 'aria-label': 'Starting from' }}
                />
            </Box>

            <Box>
                <FieldLabel>Going to</FieldLabel>
                {input.destinations.length ? (
                    <Box sx={{ mb: 1 }}>
                        {input.destinations.map((item, index) => (
                            <NightsStepper
                                key={item.name}
                                name={item.name}
                                nights={Number(item.nights) || 1}
                                onChange={value => updateNights(index, value)}
                                onRemove={() =>
                                    set(
                                        'destinations',
                                        input.destinations.filter((_, position) => position !== index)
                                    )
                                }
                            />
                        ))}
                    </Box>
                ) : null}
                <TextField
                    fullWidth
                    value={pending}
                    onChange={event => setPending(event.target.value)}
                    onBlur={addPending}
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            event.preventDefault()
                            addPending()
                        }
                    }}
                    placeholder={input.destinations.length ? 'Add another place' : 'e.g. Shimla + Manali'}
                    helperText={
                        input.destinations.length
                            ? ''
                            : 'One place or several — “Shimla + Manali” or “2 nights Shimla, 3 nights Manali” both work.'
                    }
                    inputProps={{ 'aria-label': 'Going to' }}
                />
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mt: 1 }}>
                    <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                        {nights ? `${nights} ${nights === 1 ? 'night' : 'nights'} · ${nights + 1} days` : ''}
                    </Typography>
                    {!showEnd ? (
                        <Button size='small' onClick={() => setShowEnd(true)} sx={{ px: 0.5 }}>
                            Ends somewhere else?
                        </Button>
                    ) : null}
                </Stack>
                <Collapse in={showEnd} unmountOnExit>
                    <TextField
                        fullWidth
                        sx={{ mt: 2 }}
                        value={input.endsAt}
                        onChange={event => set('endsAt', event.target.value)}
                        placeholder={input.origin ? `Back in ${input.origin} if left empty` : 'e.g. Chandigarh'}
                        inputProps={{ 'aria-label': 'Ends in' }}
                    />
                </Collapse>
            </Box>

            <Box>
                <FieldLabel optional>When</FieldLabel>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }} alignItems={{ sm: 'center' }}>
                    <TextField
                        type='date'
                        value={input.startDate}
                        onChange={event => set('startDate', event.target.value)}
                        inputProps={{ 'aria-label': 'Start date' }}
                        sx={{ width: { xs: '100%', sm: 220 } }}
                    />
                    <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                        {input.startDate
                            ? dateRangeLabel(input)
                            : 'Not sure yet? Leave it — we’ll ask only if it matters.'}
                    </Typography>
                </Stack>
            </Box>

            {error ? (
                <Typography color='error' sx={{ fontSize: '0.9375rem' }} role='alert'>
                    {error}
                </Typography>
            ) : null}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <CustomButton size='large' onClick={() => onContinue(addPending())} sx={{ px: 5 }}>
                    Continue
                </CustomButton>
                <Button onClick={() => setShowMessage(open => !open)} sx={{ color: 'text.secondary' }}>
                    Have the request as a message? Paste it
                </Button>
            </Stack>

            <Collapse in={showMessage} unmountOnExit>
                <Stack spacing={1.5}>
                    <TextField
                        multiline
                        minRows={3}
                        fullWidth
                        value={voice?.listening && voice.transcript ? voice.transcript : message}
                        onChange={event => setMessage(event.target.value)}
                        placeholder='e.g. “2 nights Shimla and 3 nights Manali from Delhi, we are a couple, want Rohtang and Sissu”'
                        inputProps={{ 'aria-label': 'Trip request message' }}
                    />
                    <Stack direction='row' spacing={1} alignItems='center'>
                        <CustomButton
                            variant='outlined'
                            onClick={readMessage}
                            loading={reading}
                            disabled={!message.trim()}
                        >
                            Fill it in for me
                        </CustomButton>
                        {voice?.supported ? (
                            <IconButton
                                aria-label={voice.listening ? 'Stop listening' : 'Speak the request'}
                                color={voice.listening ? 'error' : 'default'}
                                onClick={() => {
                                    // ? stopping keeps what was heard as the message
                                    if (voice.listening && voice.transcript) setMessage(voice.transcript)
                                    voice.onToggle()
                                }}
                            >
                                <MicNone />
                            </IconButton>
                        ) : null}
                    </Stack>
                </Stack>
            </Collapse>
        </Stack>
    )
}

StepTrip.propTypes = {
    input: plannerInputShape.isRequired,
    onChange: PropTypes.func.isRequired,
    onContinue: PropTypes.func.isRequired,
    error: PropTypes.string,
    onReadMessage: PropTypes.func.isRequired,
    reading: PropTypes.bool,
    voice: voiceShape
}

export default StepTrip
