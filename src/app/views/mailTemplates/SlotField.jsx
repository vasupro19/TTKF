import PropTypes from 'prop-types'
import { Box, Button, FormHelperText, Stack, TextField, Typography } from '@mui/material'
import { lengthLabel } from './mailTemplateFacts'

/**
 * One editable text of an email: its label, what it is for, the box, how long it is against the most allowed, and a "Reset"
 * that puts the default text back (nothing is saved until "Save changes").
 */
function SlotField({ id, slot, value, error, disabled, inputRef, onChange, onFocus, onReset }) {
    const over = Boolean(slot.maxLength) && value.length > slot.maxLength
    const describedBy = `${id}-note`
    return (
        <Box>
            <Stack direction='row' justifyContent='space-between' alignItems='baseline' spacing={1}>
                <Box>
                    <Typography component='label' htmlFor={id} sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                        {slot.label}
                    </Typography>
                    {slot.optional ? (
                        <Typography component='span' color='text.secondary' sx={{ fontSize: '0.8125rem', ml: 1 }}>
                            optional
                        </Typography>
                    ) : null}
                </Box>
                {value !== (slot.default ?? '') ? (
                    <Button
                        size='small'
                        color='inherit'
                        disabled={disabled}
                        onClick={onReset}
                        aria-label={`Reset ${slot.label} to the default`}
                        sx={{ minWidth: 0, py: 0, textDecoration: 'underline', fontSize: '0.8125rem' }}
                    >
                        Reset
                    </Button>
                ) : null}
            </Stack>
            {slot.help ? (
                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mb: 0.75 }}>
                    {slot.help}
                </Typography>
            ) : null}
            <TextField
                id={id}
                fullWidth
                size='small'
                multiline={slot.multiline}
                minRows={slot.multiline ? 3 : undefined}
                value={value}
                disabled={disabled}
                error={Boolean(error)}
                inputRef={inputRef}
                onChange={event => onChange(event.target.value)}
                onFocus={onFocus}
                inputProps={{ 'aria-describedby': describedBy, autoComplete: 'off' }}
            />
            <Stack
                id={describedBy}
                direction='row'
                justifyContent='space-between'
                alignItems='flex-start'
                spacing={1}
                sx={{ mt: 0.5 }}
            >
                <FormHelperText error role={error ? 'alert' : undefined} sx={{ m: 0 }}>
                    {error || ' '}
                </FormHelperText>
                <FormHelperText error={over} sx={{ m: 0, whiteSpace: 'nowrap' }}>
                    {lengthLabel(value, slot.maxLength)}
                </FormHelperText>
            </Stack>
        </Box>
    )
}

SlotField.propTypes = {
    id: PropTypes.string.isRequired,
    slot: PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        help: PropTypes.string,
        multiline: PropTypes.bool,
        optional: PropTypes.bool,
        maxLength: PropTypes.number,
        default: PropTypes.string
    }).isRequired,
    value: PropTypes.string.isRequired,
    error: PropTypes.string,
    disabled: PropTypes.bool,
    inputRef: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    onFocus: PropTypes.func,
    onReset: PropTypes.func.isRequired
}

export default SlotField
