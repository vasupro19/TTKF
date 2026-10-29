import { useId } from 'react'
import PropTypes from 'prop-types'
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

/**
 * A yes/no question in a dialog, for the things that can't be undone or would throw away what was typed.
 */
function ConfirmDialog({
    open,
    title,
    children,
    confirmLabel,
    cancelLabel = 'Cancel',
    danger = false,
    busy = false,
    onConfirm,
    onCancel
}) {
    const titleId = useId()
    return (
        <Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth='xs' fullWidth aria-labelledby={titleId}>
            <DialogTitle id={titleId}>{title}</DialogTitle>
            <DialogContent>
                <Typography sx={{ fontSize: '0.9375rem' }}>{children}</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, '& .MuiButton-root': { textTransform: 'none' } }}>
                <Button color='inherit' onClick={onCancel} disabled={busy}>
                    {cancelLabel}
                </Button>
                <Button
                    variant='contained'
                    color={danger ? 'error' : 'primary'}
                    onClick={onConfirm}
                    disabled={busy}
                    startIcon={busy ? <CircularProgress size={16} color='inherit' /> : null}
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

ConfirmDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    confirmLabel: PropTypes.string.isRequired,
    cancelLabel: PropTypes.string,
    danger: PropTypes.bool,
    busy: PropTypes.bool,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
}

export default ConfirmDialog
