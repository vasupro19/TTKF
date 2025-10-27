/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useRef } from 'react'
import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import PropTypes from 'prop-types'

/**
 * NoCloseModal - A Modal component that prevents closing when clicking outside or pressing Escape
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal close is requested
 * @param {React.ReactNode} props.children - Content to render inside the modal
 * @param {Object} [props.boxProps] - Props to pass to the inner Box component
 * @param {string} [props.disableEscapeKey=true] - Whether to disable closing on Escape key
 * @param {React.RefObject} [props.initialFocusRef] - Ref of element to focus when modal opens
 * @param {Function} [props.onEscapeAttempt] - Callback when user tries to escape with empty required fields
 * @param {Function} [props.validator] - Function that returns whether escape should be allowed
 * @param {Object} [props.modalProps] - Additional props to pass to MUI Modal
 * @returns {React.ReactElement} The NoCloseModal component
 */
function NoCloseModal({
    open,
    onClose,
    children,
    boxProps = {},
    disableEscapeKey = true,
    initialFocusRef,
    onEscapeAttempt,
    validator = () => true,
    modalProps = {}
}) {
    const contentRef = useRef(null)

    // Handle Escape key - prevent closing if validator returns false
    useEffect(() => {
        const handleEscape = event => {
            if (event.key === 'Escape' && !validator()) {
                event.stopPropagation() // Prevent the Modal from closing
                onEscapeAttempt?.()
            }
        }

        if (open && disableEscapeKey) {
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
        }
    }, [open, disableEscapeKey, validator, onEscapeAttempt])

    // Focus the initial element when modal opens
    useEffect(() => {
        if (open && initialFocusRef?.current) {
            initialFocusRef.current.focus()
        }
    }, [open, initialFocusRef])

    // Default box styling
    const defaultBoxStyles = {
        bgcolor: 'background.paper',
        margin: 'auto',
        maxWidth: { xs: 300, sm: 400 },
        mt: '30vh',
        outline: 'none',
        borderRadius: '8px',
        ...boxProps.sx
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            disableEscapeKeyDown={disableEscapeKey}
            BackdropProps={{ onClick: event => event.stopPropagation() }} // Prevent closing on backdrop click
            {...modalProps}
        >
            <Box
                ref={contentRef}
                sx={defaultBoxStyles}
                {...boxProps}
                onFocus={() => {
                    if (initialFocusRef?.current) {
                        initialFocusRef.current.focus()
                    }
                }}
            >
                {children}
            </Box>
        </Modal>
    )
}

// Define prop types
NoCloseModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    boxProps: PropTypes.object,
    disableEscapeKey: PropTypes.bool,
    initialFocusRef: PropTypes.shape({ current: PropTypes.any }),
    onEscapeAttempt: PropTypes.func,
    validator: PropTypes.func,
    modalProps: PropTypes.object
}

export default NoCloseModal
