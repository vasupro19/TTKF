/* eslint-disable no-nested-ternary */
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, FormControl, InputLabel, TextField, Typography } from '@mui/material'

/**
 * CustomDateInput is a form field for selecting a date with a floating label.
 * It supports both inline and outside label rendering.
 *
 * @param {Object} props - The props for the component
 * @param {Object} props.field - The field object from Formik (contains name, label, etc.)
 * @param {Object} props.formik - The Formik object containing values, errors, touched, and other form-related methods
 * @param {boolean} [props.outsideLabel=false] - Whether the label should be rendered outside the input or floating above it
 */
function CustomDateInput({ field, formik, outsideLabel = false, handleCustomChange }) {
    const [focused, setFocused] = useState(false)

    // Event handlers for focus and blur
    const handleFocus = () => setFocused(true)
    const handleBlur = e => {
        setFocused(false)
        formik.handleBlur(e)
    }

    return (
        <Box>
            <FormControl sx={{ width: '100%', position: 'relative' }}>
                {/* Outside label rendering */}
                {outsideLabel && field?.label && (
                    <Typography variant='body1' sx={{ mb: 1 }}>
                        {field?.label}
                    </Typography>
                )}

                {/* Inline floating label */}
                <InputLabel
                    sx={{
                        position: 'absolute',
                        left: 12,
                        top: formik.touched[field.name] && Boolean(formik.errors[field.name]) ? '-38%' : '-62%',
                        transition: 'all 0.2s ease-in-out',
                        fontSize: '0.675rem !important',
                        padding: '0 4px',
                        background: field?.isDisabled ? 'transparent' : '#fff',
                        color:
                            // eslint-disable-next-line no-nested-ternary
                            field?.isDisabled
                                ? '#888 !important'
                                : formik.touched[field.name] && Boolean(formik.errors[field.name])
                                  ? 'error.main'
                                  : focused
                                    ? '#000 !important'
                                    : '#697586 !important',
                        zIndex: field?.isDisabled ? 2 : 1,
                        ...(field?.isDisabled && {
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: -4,
                                right: -4,
                                top: '61%',
                                transform: 'translateY(-50%)',
                                height: '1px',
                                backgroundColor: '#f5f5f5',
                                zIndex: -1
                            }
                        })
                    }}
                >
                    {field?.label}
                </InputLabel>

                {/* Date Input Field */}
                <TextField
                    fullWidth
                    name={field.name}
                    // eslint-disable-next-line react/prop-types
                    type={field?.type === 'dateTime' ? 'datetime-local' : 'date'}
                    value={formik.values[field.name]}
                    placeholder={field.placeholder || ''}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onChange={e => handleCustomChange(e, formik)}
                    error={formik.touched[field.name] && Boolean(formik.errors[field.name])}
                    helperText={formik.touched[field.name] && formik.errors[field.name]}
                    size={field.size || 'small'}
                    sx={{
                        '& input': {
                            backgroundColor: '#fff',
                            padding: '12px 8px'
                        },
                        '& .MuiInputBase-root.MuiOutlinedInput-root': {
                            backgroundColor: 'white'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'gray'
                        },
                        flexGrow: 1,
                        ...field.customSx
                    }}
                    InputLabelProps={{ shrink: true }} // Ensures label does not overlap input content
                    // eslint-disable-next-line react/prop-types
                    disabled={field?.isDisabled}
                    // eslint-disable-next-line react/prop-types
                    inputProps={field.inputProps || {}}
                />
            </FormControl>
        </Box>
    )
}
/* eslint-disable */
// Prop types for type safety and validation
CustomDateInput.propTypes = {
    field: PropTypes.shape({
        name: PropTypes.string.isRequired,
        label: PropTypes.string,
        placeholder: PropTypes.string,
        size: PropTypes.string,
        customSx: PropTypes.object,
        isDisabled: PropTypes.bool,
        type: PropTypes.string,
    }).isRequired,
    formik: PropTypes.shape({
        values: PropTypes.object.isRequired,
        touched: PropTypes.object.isRequired,
        errors: PropTypes.object.isRequired,
        handleBlur: PropTypes.func.isRequired,
        handleChange: PropTypes.func.isRequired
    }).isRequired,
    outsideLabel: PropTypes.bool,
    handleCustomChange: PropTypes.func
}

export default CustomDateInput
