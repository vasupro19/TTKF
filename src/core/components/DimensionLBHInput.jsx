/* eslint-disable no-unused-expressions */
/* eslint-disable no-nested-ternary */
import { useState, useRef, useEffect } from 'react'
import {
    FormControl,
    OutlinedInput,
    Select,
    MenuItem,
    Box,
    Typography,
    FormHelperText,
    ClickAwayListener,
    CircularProgress,
    InputAdornment
} from '@mui/material'
import { ExpandMore } from '@mui/icons-material'
import PropTypes from 'prop-types'

const customSx = {
    '& input': {
        backgroundColor: '#fff',
        '&::placeholder': {
            fontWeight: 'bold',
            color: '#666'
        }
    },
    '& .MuiInputBase-input': {
        backgroundColor: 'transparent'
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        backgroundColor: 'white'
    }
}

export default function DimensionLBHInput({
    name,
    value = { length: '', breadth: '', height: '', unit: 'cm' },
    onChange,
    onBlur,
    error,
    helperText,
    touched,
    label,
    inputRef,
    outerLabel = true,
    size = 'regular',
    onEnterKeyPress,
    disabled,
    loading
}) {
    const [focusCount, setFocusCount] = useState(0)
    const [internalValue, setInternalValue] = useState(value)
    const [hasCompleted, setHasCompleted] = useState(false)

    const breadthRef = useRef(null)
    const heightRef = useRef(null)

    useEffect(() => {
        setInternalValue(value)
    }, [value])

    const handleChange = (type, newValue) => {
        // For length, breadth, and height fields, only allow numbers with up to 2 decimal places
        if (type !== 'unit') {
            // Allow empty strings or valid positive numbers with up to 2 decimal places
            if (newValue === '' || /^\d*\.?\d{0,2}$/.test(newValue)) {
                const updatedValue = { ...internalValue, [type]: newValue }
                setInternalValue(updatedValue)
                onChange &&
                    onChange({
                        target: {
                            name,
                            value: updatedValue
                        }
                    })
            }
            // If input is invalid, don't update state
            return
        }

        // For unit field, allow any change
        const updatedValue = { ...internalValue, [type]: newValue }
        setInternalValue(updatedValue)
        onChange &&
            onChange({
                target: {
                    name,
                    value: updatedValue
                }
            })
    }

    const handleKeyDown = (e, nextInputRef, isLastInput = false) => {
        if (e.key === 'Enter') {
            if (isLastInput) {
                if (onEnterKeyPress) {
                    e.preventDefault()
                    onEnterKeyPress()
                    return
                }
                // Only set hasCompleted when pressing Enter in the height field
                setHasCompleted(true)
                // Trigger validation only on the last input if not it will get auto submit
                onBlur &&
                    onBlur({
                        target: {
                            name
                        }
                    })
            } else {
                e.preventDefault()
                nextInputRef?.current?.focus()
            }
        }
    }

    const handleBlur = () => {
        // Only trigger validation if the user has completed all inputs
        if (hasCompleted) {
            onBlur &&
                onBlur({
                    target: {
                        name
                    }
                })
        }
    }

    const inputStyles = {
        '& input::placeholder': {
            fontWeight: 'bold',
            color: '#666'
        },
        '& input': {
            textAlign: 'center',
            padding: size === 'small' ? '8px 4px !important' : '8px 14px'
        },
        height: '40px'
    }

    const isError = error && touched
    const isFocused = focusCount > 0

    return (
        <Box sx={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
            {outerLabel ? (
                <Typography
                    variant='body2'
                    sx={{
                        backgroundColor: 'white',
                        color: isError ? 'error.main' : isFocused ? 'primary.main' : 'text.primary',
                        transition: 'color 0.2s ease-out',
                        fontSize: '0.75rem',
                        lineHeight: 1.2,
                        mb: 1
                    }}
                >
                    {label}
                </Typography>
            ) : (
                <Typography
                    variant='body2'
                    sx={{
                        position: 'absolute',
                        top: '-8px',
                        left: '10px',
                        zIndex: 1,
                        backgroundColor: 'white',
                        color: isError ? 'error.main' : isFocused ? 'primary.main' : 'text.secondary',
                        transition: 'color 0.2s ease-out',
                        fontSize: '0.75rem',
                        lineHeight: 1.2,
                        fontWeight: 400,
                        pointerEvents: 'none'
                    }}
                >
                    {label}
                </Typography>
            )}

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'stretch',
                    border: isError ? '2px solid' : isFocused ? '2px solid' : '1px solid',
                    borderColor: isError ? 'error.main' : isFocused ? 'primary.main' : 'rgba(0, 0, 0, 0.23)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    transition: 'border-color 0.01s ease-out, border-width 0.01s ease-out'
                }}
            >
                {/* Length Input */}
                <FormControl
                    variant='outlined'
                    sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        ...customSx
                    }}
                >
                    <OutlinedInput
                        id={`${name}-length`}
                        inputRef={inputRef}
                        value={internalValue?.length}
                        onChange={e => handleChange('length', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, breadthRef)}
                        placeholder='L'
                        onFocus={() => setFocusCount(c => c + 1)}
                        onBlur={() => {
                            setFocusCount(c => c - 1)
                            handleBlur()
                        }}
                        sx={inputStyles}
                        size='small'
                        autoComplete='off'
                        inputProps={{
                            inputMode: 'decimal',
                            pattern: '^[0-9]*\\.?[0-9]{0,2}$'
                        }}
                        disabled={disabled}
                    />
                </FormControl>

                {/* X divider */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#e7e7e7',
                        px: size === 'small' ? 1 : 2
                    }}
                >
                    <Typography fontWeight='bold' sx={disabled ? { color: 'primary.200' } : {}}>
                        X
                    </Typography>
                </Box>

                {/* Breadth Input */}
                <FormControl
                    variant='outlined'
                    sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        ...customSx
                    }}
                >
                    <OutlinedInput
                        id={`${name}-breadth`}
                        inputRef={breadthRef}
                        value={internalValue?.breadth}
                        onChange={e => handleChange('breadth', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, heightRef)}
                        placeholder='B'
                        onFocus={() => setFocusCount(c => c + 1)}
                        onBlur={() => {
                            setFocusCount(c => c - 1)
                            handleBlur()
                        }}
                        sx={inputStyles}
                        size='small'
                        autoComplete='off'
                        inputProps={{
                            inputMode: 'decimal',
                            pattern: '^[0-9]*\\.?[0-9]{0,2}$'
                        }}
                        disabled={disabled}
                        endAdornment={
                            <InputAdornment position='end'>
                                {loading && <CircularProgress size='18px' color='success' />}
                            </InputAdornment>
                        }
                    />
                </FormControl>

                {/* X divider */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#e7e7e7',
                        px: size === 'small' ? 1 : 2
                    }}
                >
                    <Typography fontWeight='bold' sx={disabled ? { color: 'primary.200' } : {}}>
                        X
                    </Typography>
                </Box>

                {/* Height Input */}
                <FormControl
                    variant='outlined'
                    sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        ...customSx
                    }}
                >
                    <OutlinedInput
                        id={`${name}-height`}
                        inputRef={heightRef}
                        value={internalValue?.height}
                        onChange={e => handleChange('height', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, null, true)} // Mark as last input
                        placeholder='H'
                        onFocus={() => setFocusCount(c => c + 1)}
                        onBlur={() => {
                            setFocusCount(c => c - 1)
                            handleBlur()
                        }}
                        sx={inputStyles}
                        size='small'
                        autoComplete='off'
                        inputProps={{
                            inputMode: 'decimal',
                            pattern: '^[0-9]*\\.?[0-9]{0,2}$'
                        }}
                        disabled={disabled}
                    />
                </FormControl>
                <ClickAwayListener
                    onClickAway={() => {
                        // Only trigger if there's an open popup (menu)
                        if (document.querySelector('.MuiPopover-root')) {
                            // Manually decrement the focus count if needed
                            if (focusCount > 0) {
                                setFocusCount(c => c - 2)
                            }
                            handleBlur()
                        }
                    }}
                >
                    {/* Unit selector */}
                    <FormControl
                        variant='outlined'
                        sx={{
                            width: size === 'small' ? '4rem' : '5rem',
                            borderLeft: '1px solid rgba(0, 0, 0, 0.23)',
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            backgroundColor: '#e7e7e7'
                        }}
                    >
                        <Select
                            value={internalValue?.unit}
                            onChange={e => handleChange('unit', e.target.value)}
                            IconComponent={ExpandMore}
                            onFocus={() => setFocusCount(c => c + 1)}
                            onBlur={() => {
                                setFocusCount(c => c - 1)
                                handleBlur()
                            }}
                            size='small'
                            sx={{
                                height: '100%',
                                '& .MuiSelect-select': {
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#e7e7e7 !important',
                                    padding: '8px 14px'
                                }
                            }}
                            disabled={disabled}
                        >
                            <MenuItem value='cm'>cm</MenuItem>
                            <MenuItem value='m'>m</MenuItem>
                            <MenuItem value='in'>in</MenuItem>
                            <MenuItem value='ft'>ft</MenuItem>
                        </Select>
                    </FormControl>
                </ClickAwayListener>
            </Box>

            {isError && (
                <FormHelperText error sx={{ mx: 1.75 }}>
                    {helperText}
                </FormHelperText>
            )}
        </Box>
    )
}

DimensionLBHInput.propTypes = {
    name: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    value: PropTypes.object,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    error: PropTypes.bool,
    helperText: PropTypes.string,
    touched: PropTypes.bool,
    label: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    outerLabel: PropTypes.string,
    size: PropTypes.string,
    onEnterKeyPress: PropTypes.func,
    disabled: PropTypes.bool,
    loading: PropTypes.bool
}
