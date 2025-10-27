/* eslint-disable */
import React from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { styled } from '@mui/material/styles'
import { TextField } from '@mui/material'

const CustomDateTimePicker = ({ field, formik, ...props }) => {
    // Extract values and error states from formik
    const fieldValue = formik.values[field.name]
    const error = formik.touched[field?.name] && formik.errors[field?.name]

    // Handle date/time change
    const handleChange = newValue => {
        const isoString = newValue ? newValue.toISOString() : null
        formik.setFieldValue(field.name, isoString)
        formik.setFieldTouched(field.name, true, false)
    }

    // Common props for both picker types
    const commonProps = {
        value: fieldValue ? dayjs(fieldValue) : null,
        onChange: handleChange,
        slotProps: {
            textField: {
                size: field.size || 'medium',
                error: Boolean(error),
                helperText: error || '',
                fullWidth: true,
                sx: {
                    '& .MuiInputBase-root': {
                        backgroundColor: 'background.paper'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: error ? 'error.main' : 'divider'
                    }
                }
            },
            popper: {
                sx: {
                    '& .MuiPaper-root': {
                        boxShadow: 24,
                        borderRadius: 2
                    },
                    '& .MuiPickersLayout-root': {
                        borderRadius: 2
                    },
                    '& .MuiPickersLayout-contentWrapper': {
                        backgroundColor: 'background.paper'
                    },
                    '& .MuiPickersDay-root:not(.Mui-selected)': {
                        borderRadius: 1,
                        '&:hover': {
                            backgroundColor: 'action.hover'
                        }
                    },
                    '& .MuiPickersDay-root.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                            backgroundColor: 'primary.dark'
                        }
                    }
                }
            }
        },
        componentsProps: {
            actionBar: {
                sx: {
                    backgroundColor: 'background.paper',
                    borderTop: 1,
                    borderColor: 'divider'
                }
            }
        }
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            {field.type === 'customDate' ? (
                <DatePicker
                    {...commonProps}
                    label={field.label}
                    views={['year', 'month', 'day']}
                    format='MM/DD/YYYY'
                    mask='__/__/____'
                />
            ) : (
                <DateTimePicker
                    {...commonProps}
                    label={field.label}
                    format='MM/DD/YYYY hh:mm A'
                    mask='__/__/____ __:__ _M'
                    ampm
                    minutesStep={5}
                    minDate={field.minDate ? dayjs(field.minDate) : undefined}
                    maxDate={field.maxDate ? dayjs(field.maxDate) : undefined}
                    views={['year', 'month', 'day', 'hours', 'minutes']}
                    timeSteps={{ minutes: 5 }}
                />
            )}
        </LocalizationProvider>
    )
}

export default CustomDateTimePicker
