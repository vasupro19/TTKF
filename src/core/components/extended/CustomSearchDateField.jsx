import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, InputLabel, TextField } from '@mui/material'

/**
 * CustomSearchDateField Component
 *
 * A reusable date input field with styling and flexible default value support.
 *
 * @param {Object} props - Component properties
 * @param {string} props.type - Specifies if the field is for 'from' or 'to'
 * @param {Object} props.filters - Filters state object
 * @param {function} props.setFilters - Function to update the filters state
 * @param {string} props.placeholder - Placeholder text for the date field
 */
function CustomSearchDateField({ type, filters, setFilters, placeholder = 'Select date', label }) {
    /**
     * Handles changes to the date input field.
     * Updates the filters state depending on the type ('from' or 'to').
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - The change event
     */
    const handleChange = e => {
        const timeSuffix = type === 'from' ? '00:00:00' : '23:59:59'
        setFilters({
            ...filters,
            created_at: { ...filters.created_at, [type]: `${e.target.value} ${timeSuffix}` }
        })
    }
    const [focused, setFocused] = useState(false)

    // Event handlers for focus and blur
    const handleFocus = () => setFocused(true)
    const handleBlur = () => {
        setFocused(false)
    }

    return (
        <Box sx={{ position: 'relative', width: { xs: '100%', sm: 'unset' } }}>
            <InputLabel
                sx={{
                    position: 'absolute',
                    left: '8px',
                    top: '-32%',
                    transition: 'all 0.2s ease-in-out',
                    color: focused ? '#000 !important' : '#697586 !important',
                    fontSize: '0.675rem !important',
                    background: '#fff',
                    padding: '0 4px',
                    zIndex: 1
                }}
            >
                {label}
            </InputLabel>
            <TextField
                placeholder={placeholder}
                size='small'
                type='date'
                sx={{
                    '& input': {
                        backgroundColor: '#fff',
                        padding: '2px 8px',
                        borderRadius: '4px !important',
                        borderColor: '#2c2c2c !important'
                    },
                    // width: '160px',
                    backgroundColor: '#fff',
                    '& .MuiInputBase-root.MuiOutlinedInput-root': {
                        borderRadius: '4px !important',
                        borderColor: '#2c2c2c !important',
                        backgroundColor: 'white'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderRadius: '4px !important',
                        borderColor: '#2c2c2c !important'
                    },
                    width: { xs: '100%', sm: '10rem' }
                }}
                InputProps={{
                    sx: { height: 34 }
                }}
                defaultValue={type === 'from' ? filters?.created_at?.from : filters?.created_at?.to}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
        </Box>
    )
}

CustomSearchDateField.propTypes = {
    type: PropTypes.oneOf(['from', 'to']).isRequired, // Specifies if the field is for 'from' or 'to'
    filters: PropTypes.shape({
        created_at: PropTypes.shape({
            from: PropTypes.string,
            to: PropTypes.string
        })
    }).isRequired,
    setFilters: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    label: PropTypes.string
}

export default CustomSearchDateField
