/* eslint-disable */
import React from 'react'
import { Autocomplete, TextField, InputAdornment, Box, IconButton } from '@mui/material'
import { z } from 'zod'
import { ArrowDropDown } from '@mui/icons-material'

// Utility function for comparing options
const defaultIsOptionEqualToValue = () => true

// FlexibleAutoComplete Component let user enter a custom value or select from the dropdown
const FlexibleAutoComplete = ({
    name, // uniquely identifies the field in the form
    label,
    options = [],
    value,
    touched,
    error,
    onChange,
    onBlur,
    setFieldValue,
    setFieldTouched,
    customSx = {},
    showAdornment = false,
    customInputSx = {},
    customTextSx = {},
    placeholder = '',
    getOptionLabel,
    isOptionEqualToValue = defaultIsOptionEqualToValue,
    innerLabel,
    isDisabled = false,
    helperText,
    onInputChange,
    showErrors = true
}) => {
    // Handler for selection changes (dropdown selection or free text committed)
    const handleChange = (event, newValue) => {
        // Log for debugging
        if (onChange) {
            onChange(event, newValue, label)
        }
        if (setFieldValue && name) {
            setFieldValue(name, newValue)
        }
    }

    // Handler for text input changes when user types in free text mode.
    // The third parameter "reason" indicates the cause of the input change.
    const handleInputChange = (event, newInputValue, reason) => {
        // Only update value for free typing
        if (reason === 'input' && setFieldValue && name) {
            setFieldValue(name, newInputValue)
        }
        if (onInputChange) {
            onInputChange(event, newInputValue, reason)
        }
    }

    // Combined onBlur handler including Formik's setFieldTouched if provided.
    const handleBlur = event => {
        if (onBlur) {
            onBlur(event)
        }
        if (setFieldTouched && name) {
            setFieldTouched(name, true)
        }
    }

    return (
        <Box sx={{ alignSelf: 'baseline', ...customSx }}>
            {innerLabel && (
                <label
                    htmlFor={name}
                    style={{
                        marginBottom: '0.5rem',
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        ...customTextSx
                    }}
                >
                    {innerLabel}
                </label>
            )}
            <Autocomplete
                freeSolo
                disabled={isDisabled}
                options={options}
                value={value}
                onChange={handleChange}
                onBlur={() => {
                    if (setFieldTouched && name) {
                        setFieldTouched(name, true)
                    }
                    if (onBlur) {
                        onBlur()
                    }
                }}
                onInputChange={handleInputChange}
                // Use provided getOptionLabel if available, else check if option is a string or an object.
                getOptionLabel={
                    getOptionLabel
                        ? getOptionLabel
                        : option => (typeof option === 'string' ? option : option.label || '')
                }
                isOptionEqualToValue={isOptionEqualToValue}
                renderInput={params => (
                    <TextField
                        {...params}
                        id={name}
                        name={name}
                        label={label}
                        placeholder={placeholder}
                        onBlur={handleBlur}
                        error={touched && Boolean(error)}
                        helperText={(showErrors && touched && error) || helperText || ''}
                        sx={{
                            ...customTextSx,
                            '& .MuiInputLabel-root': {
                                top: '-5px',
                                '&.MuiInputLabel-shrink': {
                                    top: '0px !important'
                                },
                                '&.MuiFormLabel-filled': {
                                    top: '0px !important'
                                },
                                '&:not(.MuiInputLabel-shrink):not(.MuiFormLabel-filled)': {
                                    top: '-5px !important'
                                }
                            },
                            '& .Mui-disabled': {
                                backgroundColor: '#f0f0f0bf !important',
                                color: '#888'
                            },
                            '& .MuiFormHelperText-root.Mui-error': {
                                backgroundColor: '#fff !important',
                                top: '-5px'
                            }
                        }}
                        InputProps={{
                            ...params.InputProps,
                            sx: { height: 40, ...customInputSx }
                            //   endAdornment: showAdornment ? (
                            //     <InputAdornment position='end'>
                            //       <IconButton size='small' sx={{ padding: 0 }}>
                            //         <ArrowDropDown />
                            //       </IconButton>
                            //     </InputAdornment>
                            //   ) : (
                            //     params.InputProps.endAdornment
                            //   )
                        }}
                    />
                )}
            />
        </Box>
    )
}

export default FlexibleAutoComplete
