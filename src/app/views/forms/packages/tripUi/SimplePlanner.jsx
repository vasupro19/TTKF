import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, ButtonBase, LinearProgress, Stack, Typography } from '@mui/material'
import StepTrip from './StepTrip'
import StepPreferences from './StepPreferences'
import TripResult from './TripResult'
import { dateRangeLabel, missingBasics, totalNights } from './plannerInput'
import { plannerInputShape, tripShape, voiceShape } from './shapes'

const STEPS = [
    { id: 'trip', label: 'Trip' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'result', label: 'Itinerary' }
]

const PLANNING_MESSAGES = [
    'Working out the drives',
    'Placing the places you asked for',
    'Choosing what to see each day',
    'Checking the timings'
]

function Progress({ step, reachable, onGo }) {
    const current = STEPS.findIndex(item => item.id === step)
    return (
        <Stack direction='row' spacing={1} alignItems='center' aria-label='Progress' component='nav'>
            {STEPS.map((item, index) => {
                const active = index === current
                const canGo = reachable.includes(item.id) && !active
                return (
                    <Stack key={item.id} direction='row' spacing={1} alignItems='center'>
                        {index > 0 ? <Box sx={{ width: 20, borderTop: '1px solid', borderColor: 'divider' }} /> : null}
                        <ButtonBase
                            disabled={!canGo}
                            onClick={() => onGo(item.id)}
                            aria-current={active ? 'step' : undefined}
                            sx={{
                                fontSize: '0.875rem',
                                fontWeight: active ? 600 : 400,
                                color: active ? 'text.primary' : 'text.secondary',
                                borderRadius: 1,
                                px: 0.25,
                                '&:hover': canGo ? { color: 'primary.main' } : undefined
                            }}
                        >
                            {item.label}
                        </ButtonBase>
                    </Stack>
                )
            })}
        </Stack>
    )
}

Progress.propTypes = {
    step: PropTypes.string.isRequired,
    reachable: PropTypes.arrayOf(PropTypes.string).isRequired,
    onGo: PropTypes.func.isRequired
}

function Planning() {
    const [message, setMessage] = useState(0)
    useEffect(() => {
        const timer = setInterval(() => setMessage(value => (value + 1) % PLANNING_MESSAGES.length), 2600)
        return () => clearInterval(timer)
    }, [])
    return (
        <Box sx={{ py: { xs: 6, md: 10 } }} role='status' aria-live='polite'>
            <Typography component='h2' sx={{ fontSize: { xs: '1.625rem', md: '2rem' }, fontWeight: 600, mb: 1 }}>
                Planning your trip…
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: '1rem', mb: 3 }}>
                {PLANNING_MESSAGES[message]}. This usually takes 10–30 seconds.
            </Typography>
            <LinearProgress sx={{ height: 2, borderRadius: 1, maxWidth: 320 }} />
        </Box>
    )
}

const routeLine = input => [input.origin, ...input.destinations.map(item => item.name)].filter(Boolean).join(' → ')

/**
 * The package planner: three short steps — the trip, how it should feel, the itinerary. The engine does the
 * planning; this only asks what a traveller can answer.
 */
function SimplePlanner({
    input,
    onInputChange,
    trip = null,
    busy = false,
    error = '',
    onCreate,
    onReadMessage,
    reading = false,
    voice = null,
    result
}) {
    const [step, setStep] = useState(trip ? 'result' : 'trip')
    const [basicsError, setBasicsError] = useState('')

    const goToPreferences = nextInput => {
        const missing = missingBasics(nextInput)
        setBasicsError(missing)
        if (!missing) setStep('preferences')
    }

    const create = async () => {
        setStep('planning')
        const nextTrip = await onCreate(input)
        setStep(nextTrip ? 'result' : 'preferences')
    }

    const readMessage = async text => {
        const filled = await onReadMessage(text)
        setBasicsError('')
        return filled
    }

    const reachable = trip
        ? ['trip', 'preferences', 'result']
        : ['trip', ...(missingBasics(input) ? [] : ['preferences'])]
    const nights = totalNights(input)

    return (
        <Box
            sx={{
                maxWidth: 680,
                mx: 'auto',
                px: { xs: 2.5, sm: 4 },
                py: { xs: 4, md: 7 },
                // ? sentence-case links read as text, not shouted buttons
                '& .MuiButton-root': { textTransform: 'none' },
                // ? 16px inputs: easier to read, and iOS does not zoom the page when a field is tapped
                '& .MuiInputBase-input': { fontSize: '1rem' }
            }}
        >
            {step !== 'planning' ? (
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent='space-between'
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={{ xs: 1.5, sm: 2 }}
                    sx={{ mb: { xs: 4, md: 5 } }}
                >
                    <Typography
                        color='text.secondary'
                        sx={{ fontSize: '0.8125rem', letterSpacing: '0.08em', fontWeight: 600 }}
                    >
                        PLAN A PACKAGE
                    </Typography>
                    <Progress step={step} reachable={reachable} onGo={setStep} />
                </Stack>
            ) : null}

            {step === 'trip' ? (
                <>
                    <Typography
                        component='h2'
                        sx={{ fontSize: { xs: '1.625rem', md: '2rem' }, fontWeight: 600, lineHeight: 1.2 }}
                    >
                        Where’s the trip?
                    </Typography>
                    <Typography color='text.secondary' sx={{ fontSize: '1rem', mt: 1, mb: 4 }}>
                        Tell us the route. We’ll work out the drives, the days and what to see.
                    </Typography>
                    <StepTrip
                        input={input}
                        onChange={onInputChange}
                        onContinue={goToPreferences}
                        error={basicsError}
                        onReadMessage={readMessage}
                        reading={reading}
                        voice={voice}
                    />
                </>
            ) : null}

            {step === 'preferences' ? (
                <>
                    <Typography
                        component='h2'
                        sx={{ fontSize: { xs: '1.625rem', md: '2rem' }, fontWeight: 600, lineHeight: 1.2 }}
                    >
                        Make it yours
                    </Typography>
                    <Stack
                        direction='row'
                        spacing={1}
                        alignItems='baseline'
                        flexWrap='wrap'
                        useFlexGap
                        sx={{ mt: 1, mb: 4 }}
                    >
                        <Typography color='text.secondary' sx={{ fontSize: '1rem' }}>
                            {[routeLine(input), `${nights} ${nights === 1 ? 'night' : 'nights'}`, dateRangeLabel(input)]
                                .filter(Boolean)
                                .join(' · ')}
                        </Typography>
                        <Button size='small' onClick={() => setStep('trip')} sx={{ minWidth: 0, p: 0 }}>
                            Edit
                        </Button>
                    </Stack>
                    {error ? (
                        <Typography color='error' sx={{ fontSize: '0.9375rem', mb: 3 }} role='alert'>
                            {error}
                        </Typography>
                    ) : null}
                    <StepPreferences
                        input={input}
                        onChange={onInputChange}
                        onCreate={create}
                        busy={busy}
                        hasTrip={Boolean(trip)}
                    />
                </>
            ) : null}

            {step === 'planning' ? <Planning /> : null}

            {step === 'result' && trip ? (
                <>
                    {busy ? (
                        <LinearProgress sx={{ height: 2, mb: 3, borderRadius: 1 }} aria-label='Updating the trip' />
                    ) : null}
                    {error ? (
                        <Typography color='error' sx={{ fontSize: '0.9375rem', mb: 3 }} role='alert'>
                            {error}
                        </Typography>
                    ) : null}
                    <TripResult
                        rows={result.rows}
                        onAnswer={result.onAnswer}
                        onApplyOption={result.onApplyOption}
                        onExclude={result.onExclude}
                        onAddIdea={result.onAddIdea}
                        onChangeRequest={result.onChangeRequest}
                        onEditRow={result.onEditRow}
                        imageOptionsByRow={result.imageOptionsByRow}
                        onFindImages={result.onFindImages}
                        hotelsFor={result.hotelsFor}
                        onEditHotel={result.onEditHotel}
                        save={result.save}
                        onOpenDetailed={result.onOpenDetailed}
                        trip={trip}
                        input={input}
                        busy={busy}
                        onEditTrip={() => setStep('trip')}
                        onEditPreferences={() => setStep('preferences')}
                        onStartOver={() => {
                            result.onStartOver()
                            setStep('trip')
                        }}
                    />
                </>
            ) : null}
        </Box>
    )
}

SimplePlanner.propTypes = {
    input: plannerInputShape.isRequired,
    onInputChange: PropTypes.func.isRequired,
    trip: tripShape,
    busy: PropTypes.bool,
    error: PropTypes.string,
    onCreate: PropTypes.func.isRequired,
    onReadMessage: PropTypes.func.isRequired,
    reading: PropTypes.bool,
    voice: voiceShape,
    result: PropTypes.shape({
        rows: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string })),
        onAnswer: PropTypes.func,
        onApplyOption: PropTypes.func,
        onExclude: PropTypes.func,
        onAddIdea: PropTypes.func,
        onChangeRequest: PropTypes.func,
        onEditRow: PropTypes.func,
        imageOptionsByRow: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string }))),
        onFindImages: PropTypes.func,
        hotelsFor: PropTypes.func,
        onEditHotel: PropTypes.func,
        save: PropTypes.shape({ name: PropTypes.string }),
        onOpenDetailed: PropTypes.func,
        onStartOver: PropTypes.func
    }).isRequired
}

export default SimplePlanner
