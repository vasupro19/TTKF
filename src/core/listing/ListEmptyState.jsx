import PropTypes from 'prop-types'
import { Box, Button, Typography } from '@mui/material'

/**
 * What a list says when it has nothing to show: "first" (nothing has been added yet, with a way to add one) or
 * "filtered" (the search or filters match nothing, with a way to clear them).
 */
function ListEmptyState({ kind, noun, title, text, canAdd, addLabel, onAdd, onClear }) {
    if (kind === 'filtered') {
        return (
            <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                    No {noun} match these filters.
                </Typography>
                <Button onClick={onClear} sx={{ mt: 1, textTransform: 'none' }}>
                    Clear filters
                </Button>
            </Box>
        )
    }
    return (
        <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>{title || `No ${noun} yet`}</Typography>
            {text && (
                <Typography
                    color='text.secondary'
                    sx={{ fontSize: '0.875rem', mt: 0.5, mb: 2, maxWidth: 520, mx: 'auto' }}
                >
                    {text}
                </Typography>
            )}
            {canAdd && onAdd && (
                <Button
                    variant='contained'
                    onClick={onAdd}
                    sx={{ mt: text ? 0 : 2, textTransform: 'none', boxShadow: 'none' }}
                >
                    {addLabel || 'Add'}
                </Button>
            )}
        </Box>
    )
}

ListEmptyState.propTypes = {
    kind: PropTypes.oneOf(['first', 'filtered']).isRequired,
    noun: PropTypes.string.isRequired,
    title: PropTypes.string,
    text: PropTypes.string,
    canAdd: PropTypes.bool,
    addLabel: PropTypes.string,
    onAdd: PropTypes.func,
    onClear: PropTypes.func
}

export default ListEmptyState
