import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, InputLabel, Select, OutlinedInput, MenuItem, Checkbox, ListItemText } from '@mui/material'
import { getCustomSx } from '@/utilities'

// Default custom styles if none are provided externally
const customSx = getCustomSx()

/**
 * MultiSelectCheckmarks component renders a multi-select dropdown with checkboxes using MUI
 *
 * @component
 * @param {object} props - Component props
 * @param {string} props.label - The label to display for the input field
 * @param {Array} props.options - An array of options. Each option is an object with 'id' and 'label'
 * @param {Array} [props.value=[]] - Array of selected option ids
 * @param {function} props.onChange - Callback function triggered when the selection changes
 *
 * @returns {JSX.Element} A FormControl containing a multi-select input with checkboxes
 */
function MultiSelectCheckmarks({ label, options, value = [], onChange }) {
    return (
        <FormControl
            fullWidth
            sx={{
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
            }}
        >
            <InputLabel>{label}</InputLabel>
            <Select
                multiple
                value={value}
                onChange={onChange}
                input={<OutlinedInput label={label} sx={{ backgroundColor: 'white' }} />}
                renderValue={selected => selected.join(', ')}
                sx={{
                    backgroundColor: 'white',
                    ...customSx
                }}
                size='small'
                placeholder='Select one or more option'
                MenuProps={{
                    PaperProps: {
                        sx: {
                            minWidth: 150,
                            '& .MuiMenuItem-root': {
                                py: 0.5,
                                px: 1
                            }
                        }
                    }
                }}
            >
                {options.map(option => (
                    <MenuItem key={option.id} value={option.id}>
                        <Checkbox checked={value.includes(option.id)} sx={{ padding: '4px' }} size='small' />
                        <ListItemText primary={option.label} sx={{ m: 0 }} />
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}

MultiSelectCheckmarks.propTypes = {
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            label: PropTypes.string.isRequired
        })
    ).isRequired,
    value: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    onChange: PropTypes.func.isRequired
}

export default MultiSelectCheckmarks
