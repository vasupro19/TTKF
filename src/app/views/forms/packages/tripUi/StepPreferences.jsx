import { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Collapse, Stack, TextField, Typography } from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import CustomButton from '@core/components/extended/CustomButton'
import { ChoicePills, Pill, TagPills } from './Choice'
import { FieldLabel } from './StepTrip'
import { BUDGETS, INTERESTS, PACE, TRANSPORT, WHO } from './plannerInput'
import { plannerInputShape } from './shapes'

const count = value =>
    value === '' || value == null ? null : Math.max(0, Math.min(99, Math.round(Number(value)) || 0))

/**
 * Step 2 — how the trip should feel. Everything here is optional: skipping it still makes a good plan,
 * because the engine fills gaps with sensible, visible defaults.
 */
function StepPreferences({ input, onChange, onCreate, busy = false, hasTrip = false }) {
    const [showMore, setShowMore] = useState(Boolean(input.adults || input.children || input.budget || input.vehicle))
    const set = (field, value) => onChange({ ...input, [field]: value })

    return (
        <Stack spacing={4}>
            <Box>
                <FieldLabel>Who’s travelling?</FieldLabel>
                <ChoicePills
                    name='Who is travelling'
                    options={WHO}
                    value={input.who}
                    onChange={value => set('who', value)}
                />
            </Box>

            <Box>
                <FieldLabel>Pace</FieldLabel>
                <ChoicePills name='Pace' options={PACE} value={input.pace} onChange={value => set('pace', value)} />
            </Box>

            <Box>
                <FieldLabel>Getting around</FieldLabel>
                <ChoicePills
                    name='Getting around'
                    options={TRANSPORT}
                    value={input.transport}
                    onChange={value => set('transport', value)}
                />
            </Box>

            <Box>
                <FieldLabel>What do you enjoy?</FieldLabel>
                <TagPills
                    name='Interests'
                    options={INTERESTS}
                    values={input.interests}
                    onChange={value => set('interests', value)}
                />
            </Box>

            <Box>
                <FieldLabel>Anything you don’t want to miss?</FieldLabel>
                <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    value={input.mustSee}
                    onChange={event => set('mustSee', event.target.value)}
                    placeholder='e.g. Rohtang, Atal Tunnel, Sissu, good cafés, no long treks'
                    inputProps={{ 'aria-label': 'Anything you don’t want to miss' }}
                />
            </Box>

            <Box>
                <Button
                    onClick={() => setShowMore(open => !open)}
                    endIcon={showMore ? <ExpandLess /> : <ExpandMore />}
                    sx={{ px: 0.5, color: 'text.secondary' }}
                >
                    More options
                </Button>
                <Collapse in={showMore} unmountOnExit>
                    <Stack spacing={3} sx={{ pt: 2 }}>
                        <Box>
                            <FieldLabel optional>Travellers</FieldLabel>
                            <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap alignItems='center'>
                                <TextField
                                    type='number'
                                    label='Adults'
                                    value={input.adults ?? ''}
                                    onChange={event => set('adults', count(event.target.value))}
                                    inputProps={{ min: 1, max: 99 }}
                                    sx={{ width: 110 }}
                                />
                                <TextField
                                    type='number'
                                    label='Children'
                                    value={input.children ?? ''}
                                    onChange={event => set('children', count(event.target.value))}
                                    inputProps={{ min: 0, max: 99 }}
                                    sx={{ width: 110 }}
                                />
                                <Pill
                                    label='With parents'
                                    selected={input.withParents}
                                    onClick={() => set('withParents', !input.withParents)}
                                />
                            </Stack>
                        </Box>
                        <Box>
                            <FieldLabel optional>Budget</FieldLabel>
                            <ChoicePills
                                name='Budget'
                                options={BUDGETS.map(label => ({ value: label, label }))}
                                value={input.budget}
                                onChange={value => set('budget', value)}
                            />
                        </Box>
                        <Box>
                            <FieldLabel optional>Preferred vehicle</FieldLabel>
                            <TextField
                                fullWidth
                                value={input.vehicle}
                                onChange={event => set('vehicle', event.target.value)}
                                placeholder='e.g. Innova, Tempo Traveller'
                                inputProps={{ 'aria-label': 'Preferred vehicle' }}
                            />
                        </Box>
                    </Stack>
                </Collapse>
            </Box>

            <Box>
                <CustomButton size='large' onClick={onCreate} loading={busy} sx={{ px: 5 }}>
                    {hasTrip ? 'Update itinerary' : 'Create itinerary'}
                </CustomButton>
                <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mt: 1.5 }}>
                    Skip anything you like — we’ll choose sensible defaults and show you what we assumed.
                </Typography>
            </Box>
        </Stack>
    )
}

StepPreferences.propTypes = {
    input: plannerInputShape.isRequired,
    onChange: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
    busy: PropTypes.bool,
    hasTrip: PropTypes.bool
}

export default StepPreferences
