import React from 'react'
import PropTypes from 'prop-types'
import { useField } from 'formik'
import { Box, Typography } from '@mui/material'
import PhoneInput from 'react-phone-input-2' // Ensure this package is installed
import 'react-phone-input-2/lib/style.css' // Default styles for PhoneInput

/**
 * PhoneField Component
 * A reusable phone input component with validation and error handling for Formik.
 *
 * @param {Object} props - Component properties
 * @param {string} props.name - The name of the Formik field
 * @param {string} props.label - The label for the phone input
 * @param {string} props.defaultCountry - The default country code for the phone input
 * @param {Object} props.inputStyle - Custom styles for the phone input
 * @param {Object} props.containerStyle - Custom styles for the container
 * @param {Object} props.labelSx - Custom styles for the label
 * @param {Object} props.buttonStyle - Custom styles for the country selector button
 * @param {string} props.className - Custom class name for the phone input
 * @param {string} props.disabled - disable input
 * @returns {JSX.Element} The PhoneField component
 */
function PhoneField({
    name,
    label,
    defaultCountry = 'in',
    inputStyle = {},
    containerStyle = {},
    buttonStyle = {},
    className = 'custom-phone-input',
    labelSx = {},
    disabled = false
}) {
    const [field, meta, helpers] = useField(name)
    const { setValue } = helpers
    const { error, touched } = meta

    return (
        <Box sx={{ width: '100%' }}>
            {/* eslint-disable  */}
            <Typography sx={{ textAlign: 'left', mb: 1, ...labelSx, color: disabled ? 'text.secondary' : 'unset' }}>
                {/* eslint-enable  */}
                {label}*
            </Typography>
            <PhoneInput
                country={defaultCountry}
                value={field.value}
                onChange={value => setValue(value)}
                disabled={disabled}
                placeholder='+91 83374- 92382'
                inputStyle={{
                    width: '100%',
                    height: '36px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    ...inputStyle
                }}
                containerStyle={{
                    width: '100%',
                    borderRadius: '8px',
                    ...containerStyle
                }}
                buttonStyle={{
                    backgroundColor: '#f8fafc',
                    borderTopLeftRadius: '8px',
                    borderBottomLeftRadius: '8px',
                    ...buttonStyle
                }}
                inputProps={{
                    name,
                    required: true
                }}
                isValid={!error || !touched}
                className={className}
            />
            {touched && error && (
                <Typography
                    sx={{ marginLeft: 1.5, marginTop: '4px' }}
                    className='error-label'
                    color='error'
                    variant='caption'
                >
                    {error}
                </Typography>
            )}
        </Box>
    )
}

PhoneField.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    defaultCountry: PropTypes.string,
    /* eslint-disable */
    inputStyle: PropTypes.object,
    containerStyle: PropTypes.object,
    buttonStyle: PropTypes.object,
    labelSx: PropTypes.object,
    /* eslint-enable */
    className: PropTypes.string,
    disabled: PropTypes.string
}

export default PhoneField
