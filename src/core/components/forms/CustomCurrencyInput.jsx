/* eslint-disable */
import React, { useState } from 'react'
import { Box, TextField, MenuItem, Select, Divider } from '@mui/material'

export default function CustomCurrencyInput({ field, formik }) {
    const [currency, setCurrency] = useState({
        code: 'INR',
        symbol: '₹',
        flag: 'https://flagcdn.com/w40/in.png'
    })

    const currencies = [
        { code: 'INR', symbol: '₹', flag: 'https://flagcdn.com/w40/in.png' },
        { code: 'AED', symbol: 'د.إ', flag: 'https://flagcdn.com/w40/ae.png' },
        { code: 'USD', symbol: '$', flag: 'https://flagcdn.com/w40/us.png' }
    ]

    const handleCurrencyChange = event => {
        const selectedCurrency = currencies.find(c => c.code === event.target.value)
        setCurrency(selectedCurrency)
        formik.setFieldValue(field.name + '_currency', selectedCurrency.code, false)
    }

    return (
        <Box>
            <TextField
                fullWidth
                label={field.label}
                disabled={field?.isDisabled}
                size={field.size || 'medium'}
                sx={{
                    '& .MuiInputBase-root': {
                        padding: 0 // Removes padding so the Select aligns flush
                    },
                    '& .MuiOutlinedInput-input.MuiInputBase-inputAdornedStart': {
                        paddingLeft: '24px !important' // ← shift the text right of your adornment
                    },
                    ...(field.customSx || {})
                }}
                error={formik.touched[field.name] && Boolean(formik.errors[field.name])} // Error handling for the input
                helperText={
                    formik.touched[field.name] && formik.errors[field.name] // Displays error message
                }
                InputProps={{
                    startAdornment: (
                        <>
                            <Select
                                disabled={field?.isDisabled}
                                value={formik.values[field.name + '_currency'] || currency.code}
                                onChange={handleCurrencyChange}
                                disableUnderline
                                MenuProps={{
                                    PaperProps: { style: { maxHeight: 200 } }
                                }}
                                sx={{
                                    // Removes all borders and backgrounds from the Select component itself
                                    background: 'transparent',
                                    border: 'none',
                                    '&.Mui-disabled': {
                                        backgroundColor: 'transparent'
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        border: 'none'
                                    },
                                    // Crucially, targets the inner element for precise padding control
                                    '& .MuiSelect-select': {
                                        paddingLeft: '14px', // Space from the left edge
                                        paddingRight: '32px !important', // Space for the divider
                                        display: 'flex',
                                        alignItems: 'center'
                                    }
                                }}
                            >
                                {currencies.map(option => (
                                    <MenuItem key={option.code} value={option.code}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <img
                                                src={option.flag}
                                                alt={`${option.code} flag`}
                                                style={{ width: 24, height: 16 }}
                                            />
                                            <span>{option.symbol}</span>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                            <Divider
                                sx={{
                                    height: 28,
                                    // Pulls the divider into the Select's padding area for a seamless look
                                    marginLeft: '-20px'
                                }}
                                orientation='vertical'
                            />
                        </>
                    )
                }}
                value={formik.values[field.name]}
                onChange={e => {
                    let input = e.target.value

                    // Remove invalid characters (keep numbers, periods, and commas)
                    input = input.replace(/[^0-9.,]/g, '')

                    // Avoid multiple periods in the input
                    const parts = input.split('.')
                    if (parts.length > 2) {
                        return
                    }

                    // Retain raw input for backspace and manual input
                    formik.setFieldValue(field.name, input)

                    // Avoid formatting if the input ends with a period or empty
                    if (input === '' || input.endsWith('.')) {
                        return
                    }

                    // Format the number for display (excluding decimals for now)
                    const numericValue = input.replace(/,/g, '') // Remove commas for numeric processing
                    const [integerPart, decimalPart] = numericValue.split('.')
                    const formattedIntegerPart = new Intl.NumberFormat('en-US').format(Number(integerPart) || 0)

                    // Reconstruct formatted value including the decimal part (if any)
                    const formattedValue =
                        decimalPart !== undefined ? `${formattedIntegerPart}.${decimalPart}` : formattedIntegerPart

                    formik.setFieldValue(field.name, formattedValue)
                }}
            />
        </Box>
    )
}
