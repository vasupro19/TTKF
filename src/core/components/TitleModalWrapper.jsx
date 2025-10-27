import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Cancel } from '@mui/icons-material'
import { Box, Divider, Typography } from '@mui/material'
import GlobalModal from './modals/GlobalModal'
import CustomButton from './extended/CustomButton'

export default function TitleModalWrapper({
    closeOnBackdropClick = false,
    setIsOpen,
    isOpen,
    disableEscapeKeyDown = false,
    boxContainerSx = {},
    showCancelButton = true,
    children,
    title = '',
    onClose
}) {
    // Use useMemo to optimize the box styling
    const boxStyles = useMemo(
        () => ({
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90wh',
            maxHeight: '70vh',
            backgroundColor: '#fff',
            boxShadow: 24,
            p: 1,
            borderRadius: '8px',
            outline: 'none',
            overflowY: { sm: 'hidden', xs: 'auto' },
            overflowX: 'hidden',
            ...boxContainerSx
        }),
        [boxContainerSx]
    )

    // Use useMemo for cancel button styles
    const cancelButtonStyles = useMemo(
        () => ({
            mt: 2,
            position: 'absolute',
            top: '-20px',
            right: '-14px',
            '&:hover': {
                backgroundColor: 'transparent',
                boxShadow: 'none'
            },
            '&:focus': {
                backgroundColor: 'transparent',
                boxShadow: 'none'
            }
        }),
        []
    )

    return (
        <GlobalModal
            closeOnBackdropClick={closeOnBackdropClick}
            setIsOpen={setIsOpen}
            isOpen={isOpen}
            disableEscapeKeyDown={disableEscapeKeyDown}
            onClose={onClose}
        >
            <Box sx={boxStyles}>
                {title &&
                    (typeof title === 'string' ? (
                        <>
                            <Typography variant='h4'>{title}</Typography>
                            <Divider sx={{ borderColor: 'primary.main', marginBottom: 2 }} />
                        </>
                    ) : (
                        <>
                            {title}
                            <Divider sx={{ borderColor: 'primary.main', marginBottom: 2 }} />
                        </>
                    ))}

                {showCancelButton && (
                    <CustomButton
                        onClick={() => {
                            setIsOpen(false)
                            onClose?.()
                        }}
                        customStyles={cancelButtonStyles}
                        variant='text'
                        disableRipple
                        tooltip='Close'
                        showTooltip
                        type='button'
                    >
                        <Cancel />
                    </CustomButton>
                )}
                {children}
            </Box>
        </GlobalModal>
    )
}

// Define PropTypes for type checking
TitleModalWrapper.propTypes = {
    closeOnBackdropClick: PropTypes.bool,
    setIsOpen: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    disableEscapeKeyDown: PropTypes.bool,
    // eslint-disable-next-line react/forbid-prop-types
    boxContainerSx: PropTypes.object,
    showCancelButton: PropTypes.bool,
    children: PropTypes.node.isRequired,
    title: PropTypes.string,
    onClose: PropTypes.func
}
