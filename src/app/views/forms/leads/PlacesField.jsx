import React from 'react'
import PropTypes from 'prop-types'
import { Autocomplete, Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material'
import { Add, Close } from '@mui/icons-material'
import { MAX_PLACES } from './places'

/**
 * The places the guest wants to see, in order, with the nights in each when known: one row a place. Names are
 * suggested from the agency's saved places (the trip's first), and any other place can be typed.
 */
function PlacesField({ value, onChange, options = [], disabled = false, helperText = '' }) {
    const rows = Array.isArray(value) && value.length ? value : [{ name: '', nights: '' }]

    const change = (index, patch) => onChange(rows.map((row, at) => (at === index ? { ...row, ...patch } : row)))
    const remove = index => onChange(rows.filter((row, at) => at !== index))
    const add = () => onChange([...rows, { name: '', nights: '' }])

    return (
        <Box>
            <Stack spacing={1.5}>
                {rows.map((row, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Stack key={index} direction='row' spacing={1} alignItems='flex-start'>
                        <Autocomplete
                            freeSolo
                            fullWidth
                            disabled={disabled}
                            options={options}
                            groupBy={option => option.group}
                            getOptionLabel={option => (typeof option === 'string' ? option : option.name)}
                            inputValue={row.name || ''}
                            onInputChange={(event, text) => change(index, { name: text })}
                            onChange={(event, picked) =>
                                change(index, { name: typeof picked === 'string' ? picked : picked?.name || '' })
                            }
                            renderInput={params => (
                                <TextField
                                    // eslint-disable-next-line react/jsx-props-no-spreading -- the picker hands these over as props
                                    {...params}
                                    label={index === 0 ? 'Place' : `Place ${index + 1}`}
                                    placeholder={index === 0 ? 'e.g. Shimla' : 'e.g. Manali'}
                                />
                            )}
                        />
                        <TextField
                            label='Nights'
                            type='number'
                            disabled={disabled}
                            value={row.nights ?? ''}
                            onChange={event => change(index, { nights: event.target.value })}
                            inputProps={{
                                min: 1,
                                max: 30,
                                'aria-label': `Nights in ${row.name || `place ${index + 1}`}`
                            }}
                            sx={{ width: 104, flexShrink: 0 }}
                        />
                        <IconButton
                            aria-label={`Remove ${row.name || `place ${index + 1}`}`}
                            onClick={() => remove(index)}
                            disabled={disabled || (rows.length === 1 && !row.name && !row.nights)}
                            sx={{ mt: 1 }}
                        >
                            <Close fontSize='small' />
                        </IconButton>
                    </Stack>
                ))}
            </Stack>
            <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mt: 1 }}>
                <Button
                    startIcon={<Add />}
                    onClick={add}
                    disabled={disabled || rows.length >= MAX_PLACES}
                    sx={{ textTransform: 'none' }}
                >
                    Add a place
                </Button>
                {helperText ? (
                    <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                        {helperText}
                    </Typography>
                ) : null}
            </Stack>
        </Box>
    )
}

PlacesField.propTypes = {
    value: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string,
            nights: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
        })
    ).isRequired,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string, group: PropTypes.string })),
    disabled: PropTypes.bool,
    helperText: PropTypes.string
}

export default PlacesField
