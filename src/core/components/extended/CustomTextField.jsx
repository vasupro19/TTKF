/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/forbid-prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import { TextField, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { getCustomSx } from '@/utilities'

const customSx = getCustomSx()

/**
 * CustomTextField Component
 *
 * A styled input field with optional glow animation and error handling.
 *
 * @param {Object} props - Component props
 * @param {string} props.label - The label for the input field
 * @param {string|number} props.value - The current value of the input field
 * @param {Function} props.onChange - Callback function to handle input value changes
 * @param {boolean} [props.animateGlow=false] - Whether to apply a glowing animation effect
 * @param {string} [props.placeholder=''] - Placeholder text for the input field
 * @param {string} [props.name] - Name attribute for the input field
 * @param {string} [props.type='text'] - Type attribute for the input field
 * @param {string} [props.size='small'] - Size of the input field
 * @param {Object} [props.sx={}] - Custom styling for the input field
 * @param {boolean} [props.error=false] - Whether the field is in an error state
 * @param {string} [props.errorText=''] - The error message to display
 */
function CustomTextField({
    label,
    value,
    onChange,
    animateGlow = false,
    placeholder = '',
    name,
    type = 'text',
    size = 'small',
    sx = {},
    error = false,
    errorText = ''
}) {
    const inputField = (
        <TextField
            label={label}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            type={type}
            size={size}
            name={name}
            sx={{ ...customSx, ...sx }}
            placeholder={placeholder}
            error={error}
            fullWidth
        />
    )

    return (
        <div>
            {animateGlow ? (
                <motion.div
                    initial={{ boxShadow: '0px 0px 8px 2px rgba(0, 123, 255, 0.53)' }}
                    animate={{ boxShadow: '0px 0px 0px 0px rgba(0, 123, 255, 0)' }}
                    transition={{ duration: 5.5, ease: 'easeOut' }}
                    style={{ borderRadius: 8 }}
                >
                    {inputField}
                </motion.div>
            ) : (
                inputField
            )}
            {error && (
                <Typography variant='caption' color='error' sx={{ marginTop: '4px', marginLeft: 1, display: 'block' }}>
                    {errorText}
                </Typography>
            )}
        </div>
    )
}

CustomTextField.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    animateGlow: PropTypes.bool,
    placeholder: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    size: PropTypes.string,
    sx: PropTypes.object,
    error: PropTypes.bool,
    errorText: PropTypes.string
}

export default CustomTextField
