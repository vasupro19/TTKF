import { useState } from 'react'
import PropTypes from 'prop-types'
import { Alert, AlertTitle, Box, Button, Chip, Divider, Grid, Stack, TextField, Typography } from '@mui/material'
import { ArrowDownward, Add, EditNote } from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import CustomButton from '@core/components/extended/CustomButton'
import { legShape, questionShape, stopShape, tripShape } from './shapes'
import { describeTravellers, totalNightsOf } from '../tripEngine/requirements'

const capital = value => (value ? value[0].toUpperCase() + value.slice(1) : value)

/**
 * The whole journey at a glance: origin → stays with nights → final destination.
 */
export function JourneyOverview({ stops, legs }) {
    return (
        <Stack spacing={0.5} alignItems='flex-start' aria-label='Journey overview'>
            {stops.map((stop, index) => {
                const leg = legs[index]
                return (
                    // eslint-disable-next-line react/no-array-index-key
                    <Box key={`${stop.name}-${index}`} sx={{ width: '100%' }}>
                        <Box
                            sx={{
                                px: 1.5,
                                py: 1,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: stop.kind === 'stay' ? 'primary.main' : 'divider',
                                bgcolor: theme =>
                                    stop.kind === 'stay' ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
                                display: 'inline-flex',
                                alignItems: 'baseline',
                                gap: 1,
                                maxWidth: '100%'
                            }}
                        >
                            <Typography variant='subtitle1' sx={{ fontWeight: 700, letterSpacing: 0.5 }} noWrap>
                                {stop.name.toUpperCase()}
                            </Typography>
                            {stop.nights ? (
                                <Typography variant='caption' color='text.secondary'>
                                    {stop.nights} {stop.nights === 1 ? 'NIGHT' : 'NIGHTS'}
                                </Typography>
                            ) : (
                                <Typography variant='caption' color='text.secondary'>
                                    {stop.kind === 'origin' ? 'START' : 'END'}
                                </Typography>
                            )}
                        </Box>
                        {index < stops.length - 1 && (
                            <Stack direction='row' spacing={1} alignItems='center' sx={{ pl: 2, py: 0.5 }}>
                                <ArrowDownward fontSize='small' color='action' />
                                {leg?.estimate ? (
                                    <Typography variant='caption' color='text.secondary'>
                                        {leg.mode} · about {leg.estimate.durationHours.join('–')} h driving (estimate)
                                    </Typography>
                                ) : null}
                            </Stack>
                        )}
                    </Box>
                )
            })}
        </Stack>
    )
}

JourneyOverview.propTypes = {
    stops: PropTypes.arrayOf(stopShape).isRequired,
    legs: PropTypes.arrayOf(legShape).isRequired
}

function QuestionField({ question, onAnswer, busy }) {
    const [answer, setAnswer] = useState('')
    const isDate = question.field === 'startDate'
    return (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <TextField
                size='small'
                fullWidth
                type={isDate ? 'date' : 'text'}
                value={answer}
                onChange={event => setAnswer(event.target.value)}
                InputLabelProps={isDate ? { shrink: true } : undefined}
                inputProps={{ 'aria-label': question.text }}
            />
            <Button
                variant='contained'
                disabled={!answer || busy}
                onClick={() => onAnswer(question, answer)}
                sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
                Update plan
            </Button>
        </Stack>
    )
}

QuestionField.propTypes = {
    question: questionShape.isRequired,
    onAnswer: PropTypes.func.isRequired,
    busy: PropTypes.bool
}
QuestionField.defaultProps = { busy: false }

/**
 * Everything around the day plan: the journey, the facts, the questions that matter, the assumptions made,
 * conflicts to resolve, access notes and optional AI suggestions — plus a box for plain-language changes.
 */
function TripPlanView({ trip, onAnswer, onApplyOption, onAcceptRecommendation, onChangeRequest, busy }) {
    const [change, setChange] = useState('')
    const { requirements } = trip
    const nights = totalNightsOf(requirements)

    return (
        <Stack spacing={2}>
            {trip.status !== 'needs-input' && (
                <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                        <Typography variant='overline' color='text.secondary'>
                            Journey
                        </Typography>
                        <JourneyOverview stops={trip.route.stops} legs={trip.legs} />
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <Typography variant='overline' color='text.secondary'>
                            Trip overview
                        </Typography>
                        <Stack spacing={1}>
                            {[
                                ['Duration', `${nights + 1} days / ${nights} nights`],
                                [
                                    'Transport',
                                    [requirements.transport.mode, requirements.transport.vehicle]
                                        .filter(Boolean)
                                        .join(' · ')
                                ],
                                ['Travellers', describeTravellers(requirements.travellers)],
                                [
                                    'Style',
                                    [capital(requirements.pace), ...requirements.styles.map(capital)]
                                        .filter(Boolean)
                                        .join(', ')
                                ],
                                [
                                    'Must visit',
                                    requirements.requiredAttractions.map(item => item.name).join(', ') || '—'
                                ]
                            ].map(([label, text]) => (
                                <Stack key={label} direction='row' spacing={1}>
                                    <Typography variant='body2' color='text.secondary' sx={{ minWidth: 92 }}>
                                        {label}
                                    </Typography>
                                    <Typography variant='body2' sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                                        {text}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Grid>
                </Grid>
            )}

            {trip.conflicts?.map(conflict => (
                <Alert key={conflict.id} severity='error'>
                    <AlertTitle>This cannot fit as asked</AlertTitle>
                    <Typography variant='body2' sx={{ mb: 1 }}>
                        {conflict.text}
                    </Typography>
                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                        {conflict.options.map(option => (
                            <Button
                                key={option.id}
                                size='small'
                                variant='outlined'
                                disabled={busy}
                                onClick={() => onApplyOption(option)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Stack>
                </Alert>
            ))}

            {trip.questions?.map(question => (
                <Alert key={question.id} severity='info' icon={false}>
                    <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>
                        {question.text}
                    </Typography>
                    <QuestionField question={question} onAnswer={onAnswer} busy={busy} />
                </Alert>
            ))}

            {trip.assumptions?.length ? (
                <Box>
                    <Typography variant='overline' color='text.secondary'>
                        Assumptions — change them in Trip details
                    </Typography>
                    <Stack component='ul' spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
                        {trip.assumptions.map(item => (
                            <Typography key={item.id} component='li' variant='body2'>
                                {item.text}
                            </Typography>
                        ))}
                    </Stack>
                </Box>
            ) : null}

            {trip.notes?.length ? (
                <Alert severity='warning'>
                    <AlertTitle>Check before travel</AlertTitle>
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                        General guidance, not live status — confirm permits, closures and road conditions for your
                        dates.
                    </Typography>
                    <Stack component='ul' spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
                        {trip.notes.map(note => (
                            <Typography key={note.note} component='li' variant='body2'>
                                {note.place ? <strong>{note.place}: </strong> : null}
                                {note.note}
                            </Typography>
                        ))}
                    </Stack>
                </Alert>
            ) : null}

            {trip.recommendations?.length ? (
                <Box>
                    <Typography variant='overline' color='text.secondary'>
                        Optional AI suggestions — not in the plan unless you add them
                    </Typography>
                    <Stack spacing={1}>
                        {trip.recommendations.map(item => (
                            <Stack
                                key={item.name}
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={1}
                                alignItems={{ sm: 'center' }}
                                sx={{ p: 1.25, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction='row' spacing={1} alignItems='center'>
                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                            {item.name}
                                        </Typography>
                                        <Chip size='small' label={capital(item.kind)} variant='outlined' />
                                    </Stack>
                                    <Typography variant='caption' color='text.secondary'>
                                        {[item.reason, item.impact].filter(Boolean).join(' · ')}
                                    </Typography>
                                </Box>
                                <Button
                                    size='small'
                                    startIcon={<Add />}
                                    disabled={busy}
                                    onClick={() => onAcceptRecommendation(item)}
                                >
                                    {item.kind === 'destination' ? 'Add to route' : 'Add to plan'}
                                </Button>
                            </Stack>
                        ))}
                    </Stack>
                </Box>
            ) : null}

            {trip.status !== 'needs-input' && (
                <>
                    <Divider />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                        <TextField
                            size='small'
                            fullWidth
                            value={change}
                            onChange={event => setChange(event.target.value)}
                            placeholder='Ask for a change — "add one night in Manali", "make it more relaxed", "start from Chandigarh"'
                            inputProps={{ 'aria-label': 'Change request' }}
                        />
                        <CustomButton
                            sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                            startIcon={<EditNote />}
                            disabled={!change.trim()}
                            loading={busy}
                            onClick={() => {
                                onChangeRequest(change.trim())
                                setChange('')
                            }}
                        >
                            Apply change
                        </CustomButton>
                    </Stack>
                </>
            )}
        </Stack>
    )
}

TripPlanView.propTypes = {
    trip: tripShape.isRequired,
    onAnswer: PropTypes.func.isRequired,
    onApplyOption: PropTypes.func.isRequired,
    onAcceptRecommendation: PropTypes.func.isRequired,
    onChangeRequest: PropTypes.func.isRequired,
    busy: PropTypes.bool
}

TripPlanView.defaultProps = { busy: false }

export default TripPlanView
