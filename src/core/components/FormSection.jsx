import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'

/** @description the two-column grid a section's fields sit in (one column on a phone) */
export const formColumns = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
    columnGap: 2,
    rowGap: 0.75
}

/**
 * One card of a form: a title, a line saying what it is for, and its fields.
 */
export default function FormSection({ title, hint = '', children }) {
    return (
        <Box
            component='section'
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: { xs: 2, sm: 2.5 }, mb: 2.5 }}
        >
            <Typography component='h2' sx={{ fontSize: '1.0625rem', fontWeight: 600 }}>
                {title}
            </Typography>
            {hint ? (
                <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 2 }}>
                    {hint}
                </Typography>
            ) : (
                <Box sx={{ mb: 2 }} />
            )}
            {children}
        </Box>
    )
}

FormSection.propTypes = {
    title: PropTypes.string.isRequired,
    hint: PropTypes.string,
    children: PropTypes.node.isRequired
}
