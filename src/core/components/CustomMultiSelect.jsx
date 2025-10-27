/* eslint-disable */
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Autocomplete, TextField, Box, Typography, Checkbox, IconButton, CircularProgress } from '@mui/material'
import Cancel from '@mui/icons-material/Cancel'
import SearchIcon from '@mui/icons-material/Search'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'

const icon = <CheckBoxOutlineBlankIcon fontSize='small' />
const checkedIcon = <CheckBoxIcon fontSize='small' />

function CustomMultiSelect({
    name,
    label,
    options,
    value = [],
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
        (option?.id ? option.id : option) === (currentValue?.id ? currentValue.id : currentValue),
    placeholder,
    customInputSx = {},
    customTextSx = {},
    innerLabel = true,
    tempUi,
    showErrors = true, // it should be false when formik is not used
    clearValFunc,
    labelSx = {},
    loading = false,
    helperText = '',
    isDisabled = false,
    onInputChange = undefined,
    inputRef = null,
    header = 'Select Customer', // custom header prop
    showHeader = false, // boolean to show header in the menu
    maxTagsToShow = 1
}) {
    const [inputVal, setInputVal] = useState('')

    const handleClear = () => {
        setFieldValue?.(name, [])
        onChange?.(null, [])
        setInputVal('')
        clearValFunc?.()
    }

    const handleRemoveTag = optionToRemove => e => {
        e.stopPropagation()
        const newValue = value.filter(option => isOptionEqualToValue(option, optionToRemove) === false)

        // Formik integration
        if (setFieldValue) {
            setFieldValue(name, newValue)
        }

        // Regular state integration
        if (onChange) {
            onChange(null, newValue)
        }
    }

    return (
        <Box sx={{ alignSelf: 'baseline', ...customSx }}>
            {!innerLabel && (
                <Typography variant='body1' sx={{ mb: 1, ...labelSx }}>
                    {label}
                </Typography>
            )}
            <Autocomplete
                multiple
                options={options}
                value={value}
                inputValue={inputVal}
                disabled={isDisabled}
                loading={loading}
                disableCloseOnSelect
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
                                padding: '4px',
                                '&:last-child': { borderBottom: 'none' }
                            }
                        }
                    }
                }}
                sx={{
                    ...customInputSx,
                    '& .MuiAutocomplete-inputRoot': {
                        padding: '2px 9px !important'
                    },
                    '& .MuiAutocomplete-hasPopupIcon': {
                        paddingRight: '10px !important'
                    },
                    '& .MuiAutocomplete-root': {
                        paddingRight: '10px !important'
                    },
                    '& .MuiOutlinedInput-root': {
                        paddingRight: '10px !important',
                        minHeight: 40
                    }
                }}
                onInputChange={(event, newInputValue) => {
                    setInputVal(newInputValue)
                    if (onInputChange) onInputChange({ name, value: newInputValue })
                }}
                onChange={(event, newValue) => {
                    setInputVal('')
                    !tempUi && setFieldValue?.(name, newValue || null)
                    if (onChange) {
                        if (tempUi) {
                            onChange(event, newValue?.value, newValue?.label)
                        } else {
                            onChange(event, newValue)
                        }
                    }
                }}
                onBlur={() => {
                    setFieldTouched?.(name, true)
                    onBlur?.()
                }}
                groupBy={option => {
                    // If you want to show a header only once at the top of the list
                    if (showHeader) {
                        return header
                    }
                    return ''
                }}
                renderGroup={params => (
                    <div>
                        {params.group && (
                            <Typography variant='subtitle2' sx={{ pl: 2, pt: 1 }}>
                                {params.group}
                            </Typography>
                        )}
                        {params.children}
                    </div>
                )}
                renderOption={(props, option, { selected }) => (
                    <li {...props}>
                        <Checkbox
                            icon={icon}
                            checkedIcon={checkedIcon}
                            sx={{ padding: '2px' }}
                            size='small'
                            checked={selected}
                        />
                        {getOptionLabel(option)}
                    </li>
                )}
               renderTags={selected => {
    if (selected.length === 0) return null

    const itemsToShow = selected.slice(0, maxTagsToShow)
    const remainingCount = selected.length - maxTagsToShow

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                paddingLeft: '4px'
            }}
        >
            {itemsToShow.map(option => (
                <div
                    key={option?.id || getOptionLabel(option)}
                    style={{
                        maxWidth: 100,
                        maxHeight: 24,
                        overflow: 'hidden',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '16px',
                        padding: '2px 6px',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <span
                        style={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block'
                        }}
                    >
                        {getOptionLabel(option)}
                    </span>
                    <IconButton
                        size='small'
                        onClick={handleRemoveTag(option)}
                        sx={{
                            ml: 0.5,
                            padding: '2px',
                            color: 'inherit',
                            '&:hover': { backgroundColor: 'transparent' }
                        }}
                    >
                        <Cancel fontSize='small' />
                    </IconButton>
                </div>
            ))}

            {remainingCount > 0 && (
                <span
                    style={{
                        color: '#666',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    +{remainingCount}
                </span>
            )}
        </div>
    )
}}
                renderInput={params => (
                    <TextField
                        {...params}
                        label={innerLabel ? label : null}
                        placeholder={placeholder}
                        error={touched && Boolean(error)}
                        helperText={(showErrors && touched && error) || helperText || ''}
                        sx={{
                            ...customTextSx,
                            '& .MuiInputLabel-root': {
                                top: '-5px',
                                '&.MuiInputLabel-shrink': { top: '0px !important' },
                                '&.MuiFormLabel-filled': { top: '0px !important' },
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
                            inputRef,
                            ...params.InputProps,
                            sx: {
                                height: 40,
                                alignItems: 'center',
                                flexWrap: 'nowrap',
                                ...customInputProp
                            },
                            endAdornment: (
                                <>
                                    {loading && <CircularProgress color='inherit' size={20} sx={{ mr: 3 }} />}
                                    {showAdornment && (
                                        <IconButton
                                            size='small'
                                            onClick={handleClear}
                                            sx={{
                                                visibility: value?.length > 0 || inputVal ? 'visible' : 'hidden',
                                                color: 'primary.main',
                                                '&:hover': { backgroundColor: 'transparent' }
                                            }}
                                        >
                                            <Cancel />
                                        </IconButton>
                                    )}
                                    {params.InputProps.endAdornment}
                                </>
                            )
                        }}
                    />
                )}
                getOptionLabel={getOptionLabel}
                isOptionEqualToValue={isOptionEqualToValue}
            />
        </Box>
    )
}

CustomMultiSelect.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    options: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    customSx: PropTypes.object,
    customInputProp: PropTypes.object,
    value: PropTypes.array,
    customInputSx: PropTypes.object,
    customTextSx: PropTypes.object,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    touched: PropTypes.bool,
    showAdornment: PropTypes.bool,
    error: PropTypes.string,
    setFieldValue: PropTypes.func,
    setFieldTouched: PropTypes.func,
    getOptionLabel: PropTypes.func,
    clearValFunc: PropTypes.func,
    isOptionEqualToValue: PropTypes.func,
    innerLabel: PropTypes.bool,
    helperText: PropTypes.string,
    loading: PropTypes.bool,
    inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.instanceOf(Element) })]),
    maxTagsToShow: PropTypes.number 
}

export default CustomMultiSelect
