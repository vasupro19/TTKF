/* eslint-disable react/destructuring-assignment */
import React from 'react'
import PropTypes from 'prop-types'
import DatePicker from 'react-multi-date-picker'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import CalendarToday from '@mui/icons-material/CalendarToday'
import { getCustomSx } from '@/utilities'
import '@/assets/styles/datePickerTheme.css'
import { IconButton } from '@mui/material'
import { Cancel } from '@mui/icons-material'

// Default custom styles if none are provided externally
const customSx = getCustomSx()

/**
 * CustomInput component used as a custom render for the DatePicker
 *
 * @param {object} props - Component props
 * @param {function} props.openCalendar - Callback to open the calendar when input is clicked
 * @param {string} props.value - The current value of the input
 * @returns {JSX.Element} A TextField configured as a custom date range input
 */
function CustomInput(props) {
    return (
        <TextField
            onClick={props.openCalendar}
            value={props.value}
            label='Order Date range'
            placeholder='Select Date Range'
            fullWidth
            variant='outlined'
            size='small'
            InputProps={{
                endAdornment: (
                    <InputAdornment position='end'>
                        {props?.value?.length > 1 ? (
                            <IconButton
                                size='small'
                                onClick={e => {
                                    e.stopPropagation()
                                    props?.onChange([])
                                }}
                                sx={{ padding: '4px' }}
                            >
                                <Cancel fontSize='small' />
                            </IconButton>
                        ) : (
                            <CalendarToday fontSize='small' />
                        )}
                    </InputAdornment>
                )
            }}
            sx={{
                fontSize: '0.875rem',
                cursor: 'pointer',
                ...customSx,
                '& .MuiInputBase-root': {
                    height: 40,
                    paddingRight: '8px'
                }
            }}
        />
    )
}

CustomInput.propTypes = {
    openCalendar: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func
}

/**
 * CustomDateRangePicker component renders a date range picker using react-multi-date-picker
 * with a custom input component
 *
 * @component
 * @param {object} props - Component props
 * @param {(Array|Object|string|null)} props.dateRange - The selected date range value
 * @param {function} props.onDateRangeChange - Callback function triggered when the date range changes
 * @returns {JSX.Element} A date range picker component
 */
function CustomDateRangePicker(props) {
    const { dateRange, onDateRangeChange } = props

    return (
        <DatePicker
            range
            rangeHover
            value={dateRange || null}
            onChange={onDateRangeChange}
            inputClass='custom-input'
            placeholder='Select Date Range'
            showOtherDays
            format='DD/MM/YYYY'
            className='black'
            style={{
                width: '100%',
                fontSize: '0.875rem',
                padding: '10px 14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#fff',
                color: '#333',
                outline: 'none',
                cursor: 'pointer',
                transition: 'border-color 0.3s'
            }}
            containerStyle={{
                width: '100%'
            }}
            calendarPosition='bottom-center'
            hideOnScroll
            render={(value, openCalendar) => (
                <CustomInput
                    value={value}
                    openCalendar={openCalendar}
                    onChange={newValue => onDateRangeChange(newValue)}
                />
            )}
            maxDate={new Date()}
        />
    )
}

CustomDateRangePicker.propTypes = {
    dateRange: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.string]),
    onDateRangeChange: PropTypes.func.isRequired
}

export default CustomDateRangePicker
