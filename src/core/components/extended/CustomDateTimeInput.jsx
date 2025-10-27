import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, FormControl, InputLabel, TextField, Typography, FormHelperText } from '@mui/material'
import { formatDateTime } from '@/constants'

function CustomDateTimeInput({
    name,
    label,
    placeholder,
    size = 'small',
    customSx,
    isDisabled,
    outsideLabel = false,
    handleChange,
    defaultValue = '',
    minDate,
    maxDate
}) {
    const [focused, setFocused] = useState(false)
    const [value, setValue] = useState(formatDateTime(new Date()))
    const [error, setError] = useState('')

    const handleFocus = () => setFocused(true)
    const handleBlur = () => setFocused(false)

    const getBufferedMaxDate = () => {
        if (!maxDate) return null
        const date = new Date(maxDate)
        date.setMinutes(date.getMinutes() + 2) // Add 5-minute buffer
        return date.toISOString() // Format to 'YYYY-MM-DDTHH:MM' (for datetime-local)
    }

    const validateDate = dateString => {
        if (!dateString) return ''
        const selectedDate = new Date(dateString)
        const min = minDate ? new Date(minDate) : null
        const max = maxDate ? new Date(getBufferedMaxDate()) : null

        if (min && selectedDate < min) {
            return `Date must be after ${min.toLocaleString()}`
        }
        if (max && selectedDate > max) {
            return `Date must be before ${max.toLocaleString()}`
        }
        return ''
    }

    const onChange = e => {
        const selectedDate = e.target.value
        setValue(selectedDate)

        const validationError = validateDate(selectedDate)
        setError(validationError)

        if (handleChange) handleChange(selectedDate, validationError)
    }

    useEffect(() => {
        if (defaultValue) {
            setValue(defaultValue)
            setError(validateDate(defaultValue))
        }
        if (value) handleChange(value)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultValue, minDate, maxDate])

    return (
        <Box>
            <FormControl sx={{ width: '100%', position: 'relative' }} error={!!error}>
                {outsideLabel && label && (
                    <Typography variant='body1' sx={{ mb: 1 }}>
                        {label}
                    </Typography>
                )}
                <InputLabel
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: focused || value ? '-74%' : '-18%',
                        transition: 'all 0.2s ease-in-out',
                        color: focused ? '#000 !important' : '#697586 !important',
                        fontSize: '0.675rem !important',
                        background: '#fff',
                        padding: '4px'
                    }}
                >
                    {label}
                </InputLabel>
                <TextField
                    fullWidth
                    name={name}
                    type='datetime-local'
                    value={value}
                    placeholder={placeholder || ''}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onChange={onChange}
                    size={size}
                    sx={customSx}
                    InputLabelProps={{ shrink: true }}
                    disabled={isDisabled}
                    inputProps={{ min: minDate, max: maxDate }}
                    format='YYYY-MM-DD hh:mm:ss'
                    error={!!error}
                />
            </FormControl>
            {error && <FormHelperText sx={{ color: 'error.main' }}>{error}</FormHelperText>}
        </Box>
    )
}

CustomDateTimeInput.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    placeholder: PropTypes.string,
    size: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    customSx: PropTypes.object,
    isDisabled: PropTypes.bool,
    outsideLabel: PropTypes.bool,
    handleChange: PropTypes.func,
    defaultValue: PropTypes.string,
    minDate: PropTypes.string,
    maxDate: PropTypes.string
}

export default CustomDateTimeInput
