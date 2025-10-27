/* eslint-disable react/forbid-prop-types */
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Autocomplete, TextField, Box, Typography, CircularProgress } from '@mui/material'
import Cancel from '@mui/icons-material/Cancel'
import SearchIcon from '@mui/icons-material/Search'

function CustomAutocomplete({
    name,
    label,
    options,
    value = '',
    onChange = null,
    onBlur = null,
    touched = false,
    error = '',
    setFieldValue,
    setFieldTouched,
    customSx,
    customInputProp = {},
    showAdornment = true,
    getOptionLabel = option => (option?.label ? option.label : option),
    isOptionEqualToValue = (option, currentValue) =>
        (option?.value ? option.value : option) === (currentValue?.value ? currentValue.value : currentValue),
    placeholder = '',
    customInputSx = {},
    customTextSx = {},
    innerLabel = true,
    tempUi = false, // just for display purpose until integrating APIs
    showErrors = true,
    clearValFunc,
    labelSx = {},
    helperText = '',
    isDisabled = false,
    onInputChange = false,
    inputRef = null,
    inputProps = {},
    loading = false
}) {
    // State to control what displays in the input field
    const [inputVal, setInputVal] = useState('')
    return (
        <Box sx={{ alignSelf: 'baseline', ...customSx }}>
            {!innerLabel && (
                <Typography
                    variant='body1'
                    sx={{ mb: 1, ...(showErrors && touched && error ? { color: 'error.main' } : {}), ...labelSx }}
                >
                    {label}
                </Typography>
            )}
            <Autocomplete
                options={options}
                value={value}
                inputValue={inputVal}
                disabled={isDisabled}
                loading={loading}
                slotProps={{
                    popper: {
                        modifiers: [
                            {
                                name: 'preventOverflow',
                                options: { boundary: 'window' }
                            }
                        ]
                    }
                }}
                componentsProps={{
                    paper: {
                        sx: {
                            '& .MuiAutocomplete-option': {
                                borderBottom: '1px solid #ddd',
                                '&:last-child': { borderBottom: 'none' }
                            }
                        }
                    }
                }}
                sx={{
                    ...customInputSx,
                    '& .MuiAutocomplete-hasPopupIcon': {
                        paddingRight: '10px !important'
                    },
                    '& .MuiAutocomplete-root': {
                        paddingRight: '10px !important'
                    },
                    '& .MuiOutlinedInput-root': {
                        paddingRight: '10px !important',
                        '&.Mui-disabled': {
                            backgroundColor: '#f0f0f0bf' // Keep only the outer container background
                        }
                    }
                }}
                onInputChange={(event, newInputValue) => {
                    setInputVal(newInputValue)
                    if (onInputChange) onInputChange({ name, value: newInputValue })
                }}
                // Ensure the actual value to show in the display input is controlled
                onChange={(event, newValue) => {
                    setInputVal('')
                    // eslint-disable-next-line no-unused-expressions
                    !tempUi && setFieldValue(name, newValue || null) // Use `name` dynamically
                    if (onChange) {
                        // onChange(event, newValue?.value, newValue?.label)
                        if (tempUi) {
                            onChange(event, newValue?.value, newValue?.label)
                        } else {
                            onChange(event, newValue)
                        }
                    }
                }}
                onBlur={() => {
                    setFieldTouched(name, true)
                    if (onBlur) {
                        onBlur()
                    }
                }}
                renderInput={params => (
                    <TextField
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...params}
                        label={innerLabel ? label : null}
                        placeholder={placeholder}
                        error={touched && Boolean(error)}
                        helperText={(showErrors && touched && error) || helperText || ''}
                        sx={{
                            ...customTextSx,
                            '& .MuiInputLabel-root': {
                                // top: '-6px !important'
                                top: '-5px',
                                // When label is shrunk
                                '&.MuiInputLabel-shrink': {
                                    top: '0px !important' // Shrunk state (when there is input or focus)
                                },
                                // When label is filled
                                '&.MuiFormLabel-filled': {
                                    top: '0px !important' // Adjust top when filled
                                },
                                // When label is neither shrunk nor filled (default state)
                                '&:not(.MuiInputLabel-shrink):not(.MuiFormLabel-filled)': {
                                    top: '-5px !important' // Default position
                                }
                            },
                            '& .Mui-disabled': {
                                backgroundColor: '#f0f0f0bf',
                                color: '#888'
                            },
                            '& .MuiOutlinedInput-root.Mui-disabled': {
                                backgroundColor: '#f0f0f0bf' // Very light background for the input
                            },
                            '& .MuiInputLabel-root.Mui-disabled': {
                                color: '#888 !important', // Light gray label color
                                backgroundColor: 'transparent !important' // Remove label background
                            },
                            '& .MuiFormHelperText-root.Mui-error': {
                                backgroundColor: '#fff !important',
                                // top: '-6px !important'
                                top: '-5px'
                            }
                        }}
                        InputProps={{
                            inputRef,
                            ...params.InputProps,
                            sx: { height: 40, ...customInputProp },
                            ...inputProps,
                            ...(showAdornment
                                ? {
                                      endAdornment: (
                                          <>
                                              {loading && <CircularProgress color='inherit' size={20} />}
                                              {inputVal ? (
                                                  <Cancel
                                                      onClick={() => {
                                                          if (isDisabled) {
                                                              return
                                                          }
                                                          setFieldValue(name, '')
                                                          setInputVal('')
                                                          if (clearValFunc) {
                                                              clearValFunc()
                                                          }
                                                      }}
                                                      sx={
                                                          isDisabled
                                                              ? { color: 'primary.200' }
                                                              : { color: 'primary.main', cursor: 'pointer' }
                                                      }
                                                  />
                                              ) : (
                                                  <SearchIcon />
                                              )}
                                          </>
                                      )
                                  }
                                : {})
                        }}
                    />
                )}
                getOptionLabel={getOptionLabel}
                isOptionEqualToValue={isOptionEqualToValue}
            />
        </Box>
    )
}

CustomAutocomplete.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    options: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    customSx: PropTypes.object,
    customInputProp: PropTypes.object,
    value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    customInputSx: PropTypes.object,
    customTextSx: PropTypes.object,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    touched: PropTypes.bool,
    showAdornment: PropTypes.bool,
    error: PropTypes.string,
    setFieldValue: PropTypes.func.isRequired,
    setFieldTouched: PropTypes.func.isRequired,
    getOptionLabel: PropTypes.func,
    clearValFunc: PropTypes.func,
    isOptionEqualToValue: PropTypes.func,
    innerLabel: PropTypes.bool,
    helperText: PropTypes.string,
    inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.instanceOf(Element) })]),
    placeholder: PropTypes.string,
    tempUi: PropTypes.bool,
    showErrors: PropTypes.bool,
    labelSx: PropTypes.object,
    isDisabled: PropTypes.bool,
    onInputChange: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
    inputProps: PropTypes.object,
    loading: PropTypes.bool
}

export default CustomAutocomplete
