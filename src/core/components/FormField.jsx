import PropTypes from 'prop-types'
import { TextField } from '@mui/material'

/**
 * One field of a form (leads, users): its value, change handler and error come from the form, so every field looks
 * and reports a problem the same way.
 */
export default function FormField({
    formik,
    name,
    label,
    helperText = '',
    placeholder = '',
    type = 'text',
    required = false,
    select = false,
    multiline = false,
    wide = false,
    disabled = false,
    minRows = 2,
    endAdornment = null,
    children = null
}) {
    const problem = formik.touched[name] && formik.errors[name]
    return (
        <TextField
            name={name}
            label={label}
            type={type}
            value={formik.values[name]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(problem)}
            // ? a space keeps the row's height steady whether or not there is a hint or an error
            helperText={problem || helperText || ' '}
            placeholder={placeholder}
            required={required}
            select={select}
            multiline={multiline}
            minRows={multiline ? minRows : undefined}
            disabled={disabled}
            fullWidth
            size='small'
            autoComplete='off'
            InputLabelProps={type === 'datetime-local' ? { shrink: true } : undefined}
            InputProps={endAdornment ? { endAdornment } : undefined}
            sx={wide ? { gridColumn: { sm: '1 / -1' } } : undefined}
        >
            {children}
        </TextField>
    )
}

FormField.propTypes = {
    formik: PropTypes.shape({
        values: PropTypes.objectOf(PropTypes.string).isRequired,
        errors: PropTypes.objectOf(PropTypes.string).isRequired,
        touched: PropTypes.objectOf(PropTypes.bool).isRequired,
        handleChange: PropTypes.func.isRequired,
        handleBlur: PropTypes.func.isRequired
    }).isRequired,
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    helperText: PropTypes.string,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    required: PropTypes.bool,
    select: PropTypes.bool,
    multiline: PropTypes.bool,
    wide: PropTypes.bool,
    disabled: PropTypes.bool,
    minRows: PropTypes.number,
    endAdornment: PropTypes.node,
    children: PropTypes.node
}
