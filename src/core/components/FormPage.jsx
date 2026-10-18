import PropTypes from 'prop-types'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import MainCard from '@core/components/extended/MainCard'

/**
 * The frame every add / edit form shares: a small label ("NEW USER"), the heading, one line of help, the cards,
 * and Cancel / Save at the bottom. Put the cards (FormSection) in `children`; give `onSubmit` the form's submit handler.
 */
export default function FormPage({
    eyebrow,
    title,
    subtitle = '',
    onSubmit,
    onCancel,
    submitLabel,
    saving = false,
    maxWidth = 780,
    children
}) {
    return (
        <MainCard sx={{ py: 2 }} contentSX={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <Box sx={{ maxWidth, '& .MuiButton-root': { textTransform: 'none' } }}>
                <Typography
                    color='text.secondary'
                    sx={{ fontSize: '0.8125rem', letterSpacing: '0.08em', fontWeight: 600 }}
                >
                    {eyebrow}
                </Typography>
                <Typography component='h1' sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 600, mt: 0.5 }}>
                    {title}
                </Typography>
                {subtitle ? (
                    <Typography color='text.secondary' sx={{ fontSize: '0.9375rem', mt: 0.5, mb: 3 }}>
                        {subtitle}
                    </Typography>
                ) : (
                    <Box sx={{ mb: 3 }} />
                )}

                <Box component='form' noValidate onSubmit={onSubmit}>
                    {children}
                    <Stack direction='row' spacing={1.5} justifyContent='flex-end'>
                        <Button onClick={onCancel} disabled={saving}>
                            Cancel
                        </Button>
                        <Button
                            type='submit'
                            variant='contained'
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                        >
                            {submitLabel}
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </MainCard>
    )
}

FormPage.propTypes = {
    eyebrow: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    submitLabel: PropTypes.string.isRequired,
    saving: PropTypes.bool,
    maxWidth: PropTypes.number,
    children: PropTypes.node.isRequired
}
