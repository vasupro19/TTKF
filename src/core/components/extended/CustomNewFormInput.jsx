/* eslint-disable */
import React from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, FormControl, TextField, styled, Grid, InputAdornment, CircularProgress } from '@mui/material'
import { QrCodeScanner } from '@mui/icons-material'

function CustomNewFormInput({
    name,
    label,
    placeholder = '',
    formik,
    inputProps = {},
    sx = {},
    handleCustomChange,
    disabled = false,
    customSx = {},
    color,
    className = '',
    loading = false,
    autoComplete = 'on'
}) {
    const error = formik.touched[name] && formik.errors[name]
    const Label = styled(Typography)({
        // labelWidth: '100px',
        textAlign: 'right',
        marginRight: '8px',
        whiteSpace: 'nowrap',
        fontWeight: 'bold'
    })
    return (
        <Grid container>
            {label && (
                <Grid item md={3} xs={3}>
                    <Label
                        sx={{
                            textAlign: 'left',
                            verticalAlign: 'center'
                        }}
                    >
                        {label}
                    </Label>
                </Grid>
            )}
            <Grid item md={label ? 9 : 12} xs={label ? 9 : 12}>
                <FormControl variant='outlined' fullWidth>
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
                                padding: '6px 8px'
                            },
                            '& .MuiInputBase-root.MuiOutlinedInput-root': {
                                backgroundColor: 'white' // Apply the white background to the root element
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'gray' // Optional: change border color if needed
                            },
                            flexGrow: 1,
                            width: 'auto',
                            ...(customSx || {})
                        }}
                        helperText={error ? formik.errors[name] : ''}
                        InputProps={{
                            sx: {
                                height: 24,
                                '&.Mui-focused .MuiInputAdornment-root svg': {
                                    color: 'primary.main' // Change color when focused
                                },
                                ...inputProps?.sx
                            },
                            endAdornment: (
                                <InputAdornment position='end'>
                                    {loading ? (
                                        <CircularProgress color='inherit' size={20} />
                                    ) : (
                                        <QrCodeScanner fontSize='small' />
                                    )}
                                </InputAdornment>
                            ),
                            ...inputProps
                        }}
                        fullWidth
                        color={color}
                        className={className}
                        autoComplete={autoComplete}
                    />
                </FormControl>
            </Grid>
        </Grid>
    )
}

CustomNewFormInput.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    handleCustomChange: PropTypes.func,
    /* eslint-disable react/forbid-prop-types */
    formik: PropTypes.object.isRequired,
    inputProps: PropTypes.object,
    sx: PropTypes.object,
    customSx: PropTypes.object,
    /* eslint-enable react/forbid-prop-types */
    color: PropTypes.string,
    className: PropTypes.string,
    autoComplete: PropTypes.string,
    disabled: PropTypes.bool,
    loading: PropTypes.bool
}

export default CustomNewFormInput
