/* eslint-disable react/forbid-prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import { Modal, Box, Typography, Divider, CircularProgress } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { closeModal } from '@app/store/slices/modalSlice'
import { Cancel, Warning, Info, CheckCircle } from '@mui/icons-material'
import CustomButton from '@core/components/extended/CustomButton'

/**
 * ConfirmModal Component
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
 * @returns {JSX.Element} The rendered ConfirmModal component
 */
function ConfirmModal({
    title,
    message,
    icon = 'info',
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    closeOnBackdropClick = true,
    customStyle = {},
    childComponent = null,
    btnContainerSx = {},
    showCancelButton = true,
    showConfirmButton = true,
    isLoading = false
}) {
    const dispatch = useDispatch()
    const { open, type } = useSelector(state => state.modal)

    const defaultStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90wh',
        maxHeight: '70vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 2,
        borderRadius: '8px',
        outline: 'none',
        overflowY: { sm: 'hidden', xs: 'auto' },
        overflowX: 'hidden',
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
                {/* Icon and Title */}
                <Box display='flex' alignItems='center' mb={2}>
                    {renderIcon()}
                    {title && (
                        <Typography variant='h4' ml={1} sx={{ width: '100%' }}>
                            {title}
                            <Divider sx={{ borderColor: 'primary.main' }} />
                        </Typography>
                    )}
                </Box>
                {/* Message Content */}
                <Box sx={{ mt: 2 }}>
                    <Typography variant='body1'>{message}</Typography>
                </Box>
                {childComponent && <Box sx={{ mt: 2 }}>{childComponent}</Box>}

                {/* Action Buttons */}
                <Box display='flex' justifyContent='flex-end' mt={4} sx={{ ...btnContainerSx }}>
                    {cancelText && showCancelButton && (
                        <CustomButton
                            onClick={() => (onCancel ? onCancel() : dispatch(closeModal()))}
                            variant='outlined'
                            customStyles={showConfirmButton ? { mr: 2 } : {}}
                        >
                            {cancelText}
                        </CustomButton>
                    )}
                    {confirmText && showConfirmButton && (
                        <CustomButton
                            onClick={() => (onConfirm ? onConfirm() : dispatch(closeModal()))}
                            variant='contained'
                            disabled={isLoading}
                        >
                            {confirmText} {isLoading && <CircularProgress size='20px' color='success' sx={{ ml: 1 }} />}
                        </CustomButton>
                    )}
                </Box>

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
                    type='button'
                >
                    <Cancel />
                </CustomButton>
            </Box>
        </Modal>
    )
}

ConfirmModal.propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node // `node` includes strings, numbers, JSX, elements, and arrays of them
    ]).isRequired,
    icon: PropTypes.oneOf(['info', 'warning', 'success']),
    onConfirm: PropTypes.func, // pass custom functions make sure to close the modal at the end
    onCancel: PropTypes.func,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    closeOnBackdropClick: PropTypes.bool,
    customStyle: PropTypes.object,
    btnContainerSx: PropTypes.object,
    showCancelButton: PropTypes.bool,
    showConfirmButton: PropTypes.bool,
    childComponent: PropTypes.node,
    isLoading: PropTypes.bool
}

export default ConfirmModal
