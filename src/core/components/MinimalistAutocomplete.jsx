/* eslint-disable */
import React from 'react'
import { Autocomplete, TextField, Box, Typography, CircularProgress } from '@mui/material'

// Custom chevron down icon
const ChevronDownIcon = ({ size = 16, color = '#64748B' }) => (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M6 9L12 15L18 9' stroke={color} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
)

function MinimalistAutocomplete({
    name,
    label = '',
    options = [],
    value = null,
    onChange = null,
    onBlur = null,
    touched = false,
    setFieldValue = null,
    setFieldTouched = null,
    getOptionLabel = option => (option?.label ? option.label : option),
    isOptionEqualToValue = (option, currentValue) =>
        (option?.value ? option.value : option) === (currentValue?.value ? currentValue.value : currentValue),
    placeholder = 'Select...',
    isDisabled = false,
    loading = false,
    maxWidth = 260,
    minWidth = 120,
    sx = {},
    customSx = {},
    size = 'medium',
    showLabel = true,
    labelSeparator = ': ',
    showAdornment = true,
    clearValFunc = null,
    showClearButton = false
}) {
    const sizeConfig = {
        small: { height: '32px', fontSize: '12px', padding: '0 0.75rem' },
        medium: { height: '32px', fontSize: '12px', padding: '0 0.75rem' },
        large: { height: '32px', fontSize: '12px', padding: '0 1rem' }
    }

    const calculateLabelWidth = text => {
        // Smarter width estimation using character groups
        const charGroups = text.match(/[il1]/g)?.length || 0 // Narrow characters
        const wideChars = text.match(/[mw]/g)?.length || 0 // Wide characters

        // Calculate base width using average character width
        const avgCharWidth = 7
        let widthEstimate = text.length * avgCharWidth

        // Adjust for character width variations
        widthEstimate =
            widthEstimate -
            charGroups * 2 + // Narrow chars are ~5px
            wideChars * 3 // Wide chars are ~10px

        // Fixed space for padding and elements
        return Math.max(100, Math.min(500, widthEstimate + 24 + 32))
    }
    const currentSizeConfig = sizeConfig[size] || sizeConfig.medium

    const handleChange = (event, newValue) => {
        setFieldValue && setFieldValue(name, newValue || null)
        onChange && onChange(event, newValue)
        if (!newValue && clearValFunc) {
            clearValFunc()
        }
    }

    const handleBlur = event => {
        setFieldTouched && setFieldTouched(name, true)
        onBlur && onBlur(event)
    }

    const getDisplayValue = option => {
        if (!option) return ''
        const valueLabel = getOptionLabel(option)
        if (!showLabel || !label) return valueLabel
        return `${label}${labelSeparator}${valueLabel}`
    }

    const displayText = value ? getDisplayValue(value) : showLabel && label ? label : placeholder
    const calculatedWidth = calculateLabelWidth(displayText)

    const combinedSx = { ...sx, ...customSx }

    return (
        <Box sx={{ display: 'inline-block', ...combinedSx }}>
            <Autocomplete
                options={options}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                getOptionLabel={getOptionLabel}
                isOptionEqualToValue={isOptionEqualToValue}
                disabled={isDisabled}
                loading={loading}
                disableClearable={true}
                openOnFocus={true}
                selectOnFocus={false}
                clearOnBlur={false}
                handleHomeEndKeys={false}
                freeSolo={false}
                size={size === 'large' ? 'medium' : 'small'}
                sx={{
                    width: `${calculatedWidth}px`,
                    maxWidth: `${maxWidth}px`,
                    minWidth: `${minWidth}px`,
                    height: '32px',
                    // Override MUI's default padding
                    '& .MuiAutocomplete-inputRoot': {
                        paddingRight: '20px !important', // Increased to accommodate chevron
                        width: `${calculatedWidth}px`,
                        maxWidth: `${maxWidth}px`,
                        minWidth: `${minWidth}px`,
                        height: '32px !important', // Force height
                        minHeight: '32px !important'
                    },
                    '& .MuiAutocomplete-endAdornment': {
                        right: '8px !important',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }
                }}
                renderInput={params => (
                    <TextField
                        {...params}
                        variant='outlined'
                        sx={{
                            '& .MuiInputLabel-root': {
                                display: 'none' // Hide label completely
                            },
                            height: '32px',
                            '& .MuiOutlinedInput-root': {
                                height: '32px !important',
                                minHeight: '32px !important'
                            }
                        }}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)'
                                    }}
                                >
                                    {loading && <CircularProgress color='inherit' size={14} />}
                                    <ChevronDownIcon size={16} color='#64748B' />
                                </Box>
                            ),
                            sx: {
                                height: '32px !important',
                                minHeight: '32px !important',
                                fontSize: '12px',
                                width: `${calculatedWidth}px`,
                                maxWidth: `${maxWidth}px`,
                                minWidth: `${minWidth}px`,
                                paddingRight: '40px !important', // Consistent padding for chevron space
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#E2E8F0'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#94A3B8'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'primary.800'
                                },
                                '&.Mui-disabled': {
                                    backgroundColor: 'action.hover',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'action.disabledBackground'
                                    }
                                },
                                borderRadius: '0.375rem',
                                transition: 'all 0.2s ease'
                            }
                        }}
                        InputLabelProps={{
                            shrink: false, // Keep label in place
                            sx: {
                                display: 'none' // Hide the MUI label completely since we're showing it inline
                            }
                        }}
                        inputProps={{
                            ...params.inputProps,
                            readOnly: true,
                            value: displayText, // Show the formatted text with label: value
                            style: {
                                padding: currentSizeConfig.padding,
                                fontSize: '12px',
                                fontWeight: 500,
                                color: '#364152',
                                height: '30px', // Slightly less to account for borders
                                lineHeight: '30px', // Center text vertically
                                cursor: 'pointer',
                                width: `${calculatedWidth - 48}px`, // Adjusted for chevron space
                                maxWidth: `${maxWidth - 48}px`,
                                minWidth: `${minWidth - 48}px`,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                boxSizing: 'border-box'
                            }
                        }}
                    />
                )}
                renderOption={(props, option) => (
                    <Box
                        component='li'
                        {...props}
                        sx={{
                            fontSize: '12px',
                            minHeight: '2rem',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: 'background.paper',
                            '&[aria-selected="true"]': {
                                backgroundColor: 'primary.light',
                                '&:hover': {
                                    backgroundColor: 'primary.light'
                                }
                            },
                            '&:hover': {
                                backgroundColor: 'action.hover'
                            }
                        }}
                    >
                        <Typography
                            variant='body2'
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                width: '100%',
                                fontSize: '12px',
                                fontWeight: 400
                            }}
                        >
                            {getOptionLabel(option)}
                        </Typography>
                    </Box>
                )}
                PaperComponent={({ children, ...other }) => (
                    <Box
                        {...other}
                        sx={{
                            ...other.sx,
                            mt: '0.25rem',
                            maxHeight: '200px',
                            borderRadius: '0.375rem',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            overflow: 'hidden',
                            '& .MuiAutocomplete-listbox': {
                                backgroundColor: '#ffffff',
                                padding: 0,
                                maxHeight: '200px',
                                overflow: 'auto'
                            }
                        }}
                    >
                        {children}
                    </Box>
                )}
                PopperProps={{
                    placement: 'bottom-start',
                    container: document.body, // Portal to body to avoid container issues
                    modifiers: [
                        {
                            name: 'offset',
                            options: {
                                offset: [0, 4]
                            }
                        },
                        {
                            name: 'preventOverflow',
                            options: {
                                boundary: 'viewport'
                            }
                        }
                    ]
                }}
            />
        </Box>
    )
}

export default MinimalistAutocomplete