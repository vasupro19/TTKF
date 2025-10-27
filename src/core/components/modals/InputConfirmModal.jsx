import React from 'react'
import PropTypes from 'prop-types'
import { Modal, Box, Typography } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { closeModal } from '@app/store/slices/modalSlice'
import { Cancel, Warning, Info, CheckCircle } from '@mui/icons-material'
import CustomButton from '@core/components/extended/CustomButton'

/**
 * InputConfirmModal Component
 * A reusable confirmation modal that accepts a title, message, icon, and customizable buttons.
 *
 * @component
 * @param {Object} props - The component props
 * @param {string} props.title - Title displayed at the top of the modal
 * @param {string} props.message - Message displayed inside the modal body
 * @param {string} [props.icon="info"] - Type of icon to display (e.g., "warning", "info", "success")
 * @param {function} [props.onConfirm] - Optional custom handler for the confirm button
 * @param {function} [props.onCancel] - Optional custom handler for the cancel button
 * @param {string} [props.confirmText="Confirm"] - Text for the confirm button
 * @param {string} [props.cancelText="Cancel"] - Text for the cancel button
 * @param {boolean} [props.closeOnBackdropClick=true] - Whether the modal should close on backdrop click
 * @param {Object} [props.customStyle={}] - Additional styles for the modal container
 * @param {node} [props.childComponent] - Optional element/JSX to display above the action buttons
 * @returns {JSX.Element} The rendered InputConfirmModal component
 */
function InputConfirmModal({
    title,
    message,
    icon = 'info',
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    closeOnBackdropClick = true,
    customStyle = {},
    childComponent = null
}) {
    const dispatch = useDispatch()
    const { open, type } = useSelector(state => state.modal)

    const defaultStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90vw',
        maxHeight: '70vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 2,
        borderRadius: '8px',
        outline: 'none',
        overflowY: { sm: 'hidden', xs: 'auto' },
        overflowX: 'hidden',
        width: '300px',
        ...customStyle
    }

    const renderIcon = () => {
        switch (icon) {
            case 'warning':
                return <Warning color='error' fontSize='large' />
            case 'alert':
                return <Warning color='warning' fontSize='large' />
            case 'success':
                return <CheckCircle color='success' fontSize='large' />
            case 'info':
            default:
                return <Info color='info' fontSize='large' />
        }
    }

    return (
        <Modal
            open={open && type === 'confirm_modal'}
            onClose={(event, reason) => {
                if (reason === 'backdropClick' && !closeOnBackdropClick) return
                dispatch(closeModal())
            }}
        >
            <Box sx={defaultStyle}>
                {/* Close Icon Button */}
                <CustomButton
                    onClick={() => dispatch(closeModal())}
                    customStyles={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-16px',
                        '&:hover': { backgroundColor: 'transparent', boxShadow: 'none' },
                        '&:focus': { backgroundColor: 'transparent', boxShadow: 'none' }
                    }}
                    variant='text'
                    disableRipple
                    tooltip='Close'
                    showTooltip
                >
                    <Cancel />
                </CustomButton>

                {/* Header: Icon and Title (Top-to-Bottom) */}
                <Box display='flex' flexDirection='column' alignItems='center' mb={2}>
                    <Box mb={1}>{renderIcon()}</Box>
                    {title && (
                        <Typography variant='h4' textAlign='center'>
                            {title}
                        </Typography>
                    )}
                </Box>

                {/* Message Content */}
                <Box sx={{ mt: 2 }}>
                    <Typography variant='body1' textAlign='center'>
                        {message}
                    </Typography>
                </Box>

                {/* Optional Additional Element / JSX */}
                {childComponent && <Box sx={{ mt: 2 }}>{childComponent}</Box>}
                {/* <Divider sx={{ width: '100%', borderColor: 'primary.main', mt: 1 }} /> */}

                {/* Action Buttons */}
                <Box display='flex' justifyContent='space-between' mt={1}>
                    {cancelText && (
                        <CustomButton
                            onClick={() => (onCancel ? onCancel() : dispatch(closeModal()))}
                            variant='outlined'
                        >
                            {cancelText}
                        </CustomButton>
                    )}
                    {confirmText && (
                        <CustomButton
                            onClick={() => (onConfirm ? onConfirm() : dispatch(closeModal()))}
                            variant='contained'
                        >
                            {confirmText}
                        </CustomButton>
                    )}
                </Box>
            </Box>
        </Modal>
    )
}

InputConfirmModal.propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    icon: PropTypes.oneOf(['info', 'warning', 'success']),
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    closeOnBackdropClick: PropTypes.bool,
    // eslint-disable-next-line react/forbid-prop-types
    customStyle: PropTypes.object,
    childComponent: PropTypes.node
}

export default InputConfirmModal
