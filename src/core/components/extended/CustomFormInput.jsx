/* eslint-disable react/forbid-prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, FormControl, TextField, InputAdornment, CircularProgress } from '@mui/material'
import { motion } from 'framer-motion'

function CustomFormInput({
    name,
    label,
    placeholder = '',
    formik,
    inputProps = {},
    sx = {},
    handleCustomChange = e => formik.handleChange(e),
    disabled = false,
    customSx = {},
    color,
    className = '',
    autoComplete = 'on',
    outerLabelSx = {},
    loading = false,
    animateGlow = false
}) {
    const error = formik.touched[name] && formik.errors[name]

    // Create TextField without helper text when using animation
    const textFieldBase = (
        <TextField
            name={name}
            value={formik.values[name]}
            placeholder={placeholder}
            onChange={e => handleCustomChange(e, formik)}
            onBlur={formik.handleBlur}
            error={Boolean(error)}
            disabled={disabled}
            sx={{
                '& input': {
                    backgroundColor: '#fff',
                    padding: '12px 8px',
                    height: '12px'
                },
                '& .MuiInputBase-root.MuiOutlinedInput-root': {
                    backgroundColor: 'white'
                },
                flexGrow: 1,
                width: '100%',
                ...(customSx || {})
            }}
            // Only show helper text when not using animation
            // eslint-disable-next-line no-nested-ternary
            helperText={animateGlow ? '' : error ? formik.errors[name] : ''}
            InputProps={{
                sx: {
                    height: 40,
                    ...inputProps?.sx
                },
                ...inputProps
            }}
            fullWidth
            color={color}
            className={className}
            autoComplete={autoComplete}
        />
    )

    return (
        <Box sx={{ alignSelf: 'baseline', ...sx }}>
            {label && (
                <Typography
                    variant='body1'
                    sx={{
                        mb: 1,
                        color: error ? 'error.main' : 'text.primary',
                        ...outerLabelSx
                    }}
                >
                    {label}
                </Typography>
            )}
            <FormControl fullWidth variant='outlined'>
                {animateGlow ? (
                    <>
                        <motion.div
                            initial={{ boxShadow: '0px 0px 8px 2px rgba(0, 123, 255, 0.53)' }}
                            animate={{ boxShadow: '0px 0px 0px 0px rgba(0, 123, 255, 0)' }}
                            transition={{ duration: 5, ease: 'easeOut' }}
                            style={{ borderRadius: 8, width: 'auto' }}
                        >
                            {textFieldBase}
                        </motion.div>
                        {/* Error message outside the glowing container */}
                        {error && (
                            <Typography
                                variant='caption'
                                color='error'
                                sx={{
                                    mt: 0.5,
                                    ml: 1.75, // Match MUI's default helper text padding
                                    display: 'block'
                                }}
                            >
                                {formik.errors[name]}
                            </Typography>
                        )}
                    </>
                ) : (
                    textFieldBase
                )}
            </FormControl>
        </Box>
    )
}

CustomFormInput.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    handleCustomChange: PropTypes.func,
    formik: PropTypes.object.isRequired,
    inputProps: PropTypes.object,
    sx: PropTypes.object,
    customSx: PropTypes.object,
    color: PropTypes.string,
    className: PropTypes.string,
    autoComplete: PropTypes.string,
    disabled: PropTypes.bool,
    outerLabelSx: PropTypes.object,
    animateGlow: PropTypes.bool,
    loading: PropTypes.bool
}

// CustomFormInput.defaultProps = {
//      handleCustomChange: (e, formik) => formik.handleChange(e),
// }

export default CustomFormInput
