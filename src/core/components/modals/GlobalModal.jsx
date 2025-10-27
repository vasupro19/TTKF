/**
 * GlobalModal Component
 *
 * A reusable modal component using Material-UI's Modal.
 * Provides flexibility with a backdrop click behavior and allows customization via children.
 *
 * @component
 * @example
 * // Example usage:
 * <GlobalModal isOpen={isOpen} setIsOpen={setIsOpen} closeOnBackdropClick={false}>
 *   <div>Your content here</div>
 * </GlobalModal>
 *
 * @param {Object} props - The component props.
 * @param {boolean} props.isOpen - Determines whether the modal is open or closed.
 * @param {Function} props.setIsOpen - Callback function to set the modal's open/close state.
 * @param {boolean} [props.closeOnBackdropClick=true] - Whether to close the modal when the backdrop is clicked.
 * @param {React.ReactNode} props.children - Content to display inside the modal.
 * @returns {React.Element} The rendered GlobalModal component.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { Box, Modal } from '@mui/material'

function GlobalModal({
    isOpen,
    setIsOpen,
    closeOnBackdropClick = true,
    children,
    BackdropProps = false,
    disableEscapeKeyDown = false,
    onClose
}) {
    return (
        <Modal
            open={isOpen}
            onClose={(event, reason) => {
                if (reason === 'backdropClick' && !closeOnBackdropClick) return
                setIsOpen(false)
                onClose?.()
            }}
            BackdropProps={BackdropProps}
            disableEscapeKeyDown={disableEscapeKeyDown}
        >
            <Box style={{ outline: 'none' }}>
                {/* Prevents default modal outline */}
                {children}
            </Box>
        </Modal>
    )
}

GlobalModal.propTypes = {
    /**
     * Determines whether the modal is open or closed.
     */
    isOpen: PropTypes.bool.isRequired,

    /**
     * Callback function to set the modal's open/close state.
     */
    setIsOpen: PropTypes.func.isRequired,

    /**
     * Whether to close the modal when the backdrop is clicked.
     * @default true
     */
    closeOnBackdropClick: PropTypes.bool,

    /**
     * Content to display inside the modal.
     */
    children: PropTypes.node.isRequired,
    BackdropProps: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
    disableEscapeKeyDown: PropTypes.bool,
    onClose: PropTypes.func
}

export default GlobalModal
