import PropTypes from 'prop-types'
import { Box, Chip, Tooltip, Typography } from '@mui/material'
import { placeholderToken } from './mailTemplateFacts'

/**
 * The words in curly brackets that the email fills in (the guest's name, the amount…). Clicking one puts it into the text field
 * you were last in, at the cursor.
 */
function PlaceholderChips({ placeholders, targetLabel, disabled, onInsert }) {
    if (!placeholders.length) return null
    return (
        <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>Fill-ins</Typography>
            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mb: 1 }}>
                Click one to add it where your cursor is{targetLabel ? ` in “${targetLabel}”` : ''}. The email replaces
                it with the real details.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {placeholders.map(placeholder => {
                    const token = placeholderToken(placeholder.name)
                    const tip = [
                        placeholder.description,
                        placeholder.sample ? `For example: ${placeholder.sample}` : ''
                    ]
                        .filter(Boolean)
                        .join(' — ')
                    return (
                        <Tooltip key={placeholder.name} title={tip} describeChild arrow>
                            <span>
                                <Chip
                                    size='small'
                                    variant='outlined'
                                    label={token}
                                    disabled={disabled}
                                    // ? a click must not take the cursor out of the text field it is going into
                                    onMouseDown={event => event.preventDefault()}
                                    onClick={() => onInsert(placeholder.name)}
                                />
                            </span>
                        </Tooltip>
                    )
                })}
            </Box>
        </Box>
    )
}

PlaceholderChips.propTypes = {
    placeholders: PropTypes.arrayOf(
        PropTypes.shape({ name: PropTypes.string.isRequired, description: PropTypes.string, sample: PropTypes.string })
    ).isRequired,
    targetLabel: PropTypes.string,
    disabled: PropTypes.bool,
    onInsert: PropTypes.func.isRequired
}

export default PlaceholderChips
