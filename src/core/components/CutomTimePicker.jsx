/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/forbid-prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import { DesktopTimePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { IconButton, TextField } from '@mui/material'
import { motion } from 'framer-motion'
import { getCustomSx } from '@/utilities'
import { AccessTime, Cancel } from '@mui/icons-material'

const customSx = getCustomSx()

function CustomTimePicker({
    label,
    value,
    onChange,
    animateGlow = false,
    ampm = true,
    views = ['hours', 'minutes'],
    format = 'hh:mm a'
}) {
    const pickerContent = (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DesktopTimePicker
                label={label}
                value={value}
                onChange={onChange}
                ampm={ampm}
                timeSteps={{ minutes: 30 }}
                disableIgnoringDatePartForTimeValidation
                slots={{
                    // eslint-disable-next-line react/no-unstable-nested-components
                    openPickerIcon: props =>
                        value ? (
                            <Cancel
                                fontSize='medium'
                                {...props}
                                onClick={e => {
                                    e.stopPropagation()
                                    onChange(null)
                                }}
                                sx={{ color: 'rgba(0, 0, 0, 0.54)' }}
                            />
                        ) : (
                            <AccessTime fontSize='medium' {...props} />
                        )
                }}
                sx={{
                    ...customSx,
                    '& .MuiInputBase-root': {
                        height: 40,
                        fontSize: '0.875rem',
                        '& .MuiSvgIcon-root': {
                            fontSize: '1.5rem',
                            color: 'action.active',
                            // Add hover effect
                            '&:hover': {
                                color: 'action.active'
                            }
                        }
                    },
                    '& .MuiOutlinedInput-input': {
                        padding: '8.5px 14px'
                    },
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
                    }
                    // width: '100%'
                }}
                renderInput={params => (
                    <TextField
                        {...params}
                        size='small'
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {value && (
                                        <IconButton
                                            onClick={e => {
                                                e.stopPropagation()
                                                onChange(null)
                                            }}
                                            size='small'
                                            sx={{
                                                padding: '4px',
                                                color: 'rgba(0, 0, 0, 0.54)'
                                            }}
                                        >
                                            <Cancel fontSize='small' />
                                        </IconButton>
                                    )}
                                    {params.InputProps?.endAdornment}
                                </>
                            )
                        }}
                        fullWidth
                    />
                )}
                views={views}
                format={format}
            />
        </LocalizationProvider>
    )

    return animateGlow ? (
        <motion.div
            initial={{ boxShadow: '0px 0px 8px 2px rgba(0, 123, 255, 0.53)' }}
            animate={{ boxShadow: '0px 0px 0px 0px rgba(0, 123, 255, 0)' }}
            transition={{ duration: 5.5, ease: 'easeOut' }}
            style={{ borderRadius: 8 }}
        >
            {pickerContent}
        </motion.div>
    ) : (
        pickerContent
    )
}

CustomTimePicker.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func.isRequired,
    animateGlow: PropTypes.bool,
    ampm: PropTypes.bool,
    views: PropTypes.array,
    format: PropTypes.string
}

export default CustomTimePicker
