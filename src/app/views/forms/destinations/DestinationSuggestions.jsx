import PropTypes from 'prop-types'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { HOTELS_PER_CATEGORY } from './hotelSuggestions'

/** @description what the hotel look-up is doing, in a sentence the agent can act on */
export const suggestionMessage = (state, place, editing = false) =>
    ({
        idle: editing
            ? `Your hotel lists stay as they are. Use "Suggest hotels" to fill the empty ones with the top ${HOTELS_PER_CATEGORY} in each category.`
            : `Type the destination name and we'll suggest its top ${HOTELS_PER_CATEGORY} hotels in each category.`,
        loading: `Finding the top hotels in ${place}…`,
        done: `Suggested the top hotels in ${place}. Check them before quoting — you can edit any of them.`,
        empty: `We couldn't find hotels we're sure of for "${place}". Add them yourself, or check the spelling.`,
        error: `Couldn't get hotel suggestions right now.`
    })[state]

/**
 * The strip above the hotel lists: what the suggestion look-up is doing, and a button to ask again.
 */
export default function DestinationSuggestions({ state, place, editing = false, showButton, buttonLabel, onSuggest }) {
    return (
        <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent='space-between'
            role='status'
            aria-live='polite'
            sx={{ mb: 2, p: 1.5, borderRadius: 1.5, bgcolor: 'action.hover', minHeight: 52 }}
        >
            <Stack direction='row' spacing={1} alignItems='center'>
                {state === 'loading' ? <CircularProgress size={16} /> : <Box sx={{ width: 0 }} />}
                <Typography variant='body2' color='text.secondary'>
                    {suggestionMessage(state, place, editing)}
                </Typography>
            </Stack>
            {showButton && state !== 'loading' ? (
                <Button size='small' variant='outlined' onClick={onSuggest} sx={{ flexShrink: 0 }}>
                    {buttonLabel}
                </Button>
            ) : null}
        </Stack>
    )
}

DestinationSuggestions.propTypes = {
    state: PropTypes.oneOf(['idle', 'loading', 'done', 'empty', 'error']).isRequired,
    place: PropTypes.string.isRequired,
    editing: PropTypes.bool,
    showButton: PropTypes.bool.isRequired,
    buttonLabel: PropTypes.string.isRequired,
    onSuggest: PropTypes.func.isRequired
}
