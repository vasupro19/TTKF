import PropTypes from 'prop-types'
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Box, CircularProgress, Link, Paper, Stack, Typography } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import CustomButton from '@core/components/extended/CustomButton'

/** @description a page's top: a back link, its title, and who or what is being edited */
export function PageHeader({ backTo, backLabel = 'Back', title, subtitle = null, extra = null }) {
    return (
        <Box sx={{ mb: 3 }}>
            {backTo ? (
                <Link
                    component={RouterLink}
                    to={backTo}
                    underline='hover'
                    color='text.secondary'
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 1, fontSize: 13 }}
                >
                    <ArrowBack sx={{ fontSize: 16 }} />
                    {backLabel}
                </Link>
            ) : null}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent='space-between'>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant='h3'>{title}</Typography>
                    {subtitle ? (
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }} component='div'>
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>
                {extra}
            </Stack>
        </Box>
    )
}

PageHeader.propTypes = {
    backTo: PropTypes.string,
    backLabel: PropTypes.string,
    title: PropTypes.node.isRequired,
    subtitle: PropTypes.node,
    extra: PropTypes.node
}

/** @description loading, or the server's own message when it refused */
export function LoadState({ loading, error, fallback = 'Couldn’t load this page.', onRetry = null }) {
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, py: 6 }}>
                <CircularProgress size={26} />
                <Typography color='text.secondary'>Loading…</Typography>
            </Box>
        )
    }
    if (error) {
        return (
            <Alert
                severity='error'
                action={
                    onRetry ? (
                        <CustomButton variant='text' color='error' onClick={onRetry}>
                            Try again
                        </CustomButton>
                    ) : null
                }
            >
                {error?.data?.message || error?.message || fallback}
            </Alert>
        )
    }
    return null
}

LoadState.propTypes = {
    loading: PropTypes.bool,
    error: PropTypes.oneOfType([
        PropTypes.shape({ message: PropTypes.string, data: PropTypes.shape({ message: PropTypes.string }) }),
        PropTypes.string
    ]),
    fallback: PropTypes.string,
    onRetry: PropTypes.func
}

/** @description stays at the bottom of the page: how many changes are unsaved, Discard and Save */
export function UnsavedBar({ count, onDiscard, onSave, saving = false, saveLabel = 'Save', canSave = true }) {
    const dirty = count > 0
    return (
        <Paper
            elevation={dirty ? 6 : 1}
            sx={{
                position: 'sticky',
                bottom: 0,
                zIndex: 5,
                mt: 3,
                px: 2,
                py: 1.5,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: 2,
                borderColor: dirty ? 'warning.main' : 'divider'
            }}
        >
            <Typography
                variant='body2'
                color={dirty ? 'warning.dark' : 'text.secondary'}
                sx={{ fontWeight: dirty ? 600 : 400 }}
            >
                {dirty ? `${count} unsaved change${count === 1 ? '' : 's'}` : 'All changes saved'}
            </Typography>
            <Stack direction='row' spacing={1.5}>
                <CustomButton variant='outlined' color='secondary' onClick={onDiscard} disabled={!dirty || saving}>
                    Discard
                </CustomButton>
                <CustomButton
                    variant='clickable'
                    color='primary'
                    onClick={onSave}
                    disabled={!dirty || saving || !canSave}
                    loading={saving}
                >
                    {saving ? 'Saving…' : saveLabel}
                </CustomButton>
            </Stack>
        </Paper>
    )
}

UnsavedBar.propTypes = {
    count: PropTypes.number.isRequired,
    onDiscard: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    saving: PropTypes.bool,
    saveLabel: PropTypes.string,
    canSave: PropTypes.bool
}
