import React from 'react'
import { Modal, Box, Typography, Divider, Tooltip } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { closeModal } from '@app/store/slices/modalSlice'
import { ArrowCircleLeft, Cancel } from '@mui/icons-material'
import CustomButton from './CustomButton'

export default function CustomModal() {
    const dispatch = useDispatch()
    const {
        open,
        title,
        content,
        footer,
        closeOnBackdropClick,
        customStyles = {},
        isBackButton = false,
        backButtonTxt = '',
        backButtonFunc,
        disableEscapeKeyDown = false
    } = useSelector(state => state.modal)

    const defaultStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90wh',
        maxHeight: '70vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 1,
        borderRadius: '8px',
        outline: 'none',
        overflowY: { sm: 'hidden', xs: 'auto' },
        overflowX: 'hidden',
        ...customStyles
    }

    return (
        <Modal
            open={open}
            onClose={(event, reason) => {
                if (reason === 'backdropClick' && !closeOnBackdropClick) return // Prevent closing on backdrop click
                dispatch(closeModal()) // Close only if triggered by other means (like pressing 'Escape')
            }}
            disableEscapeKeyDown={disableEscapeKeyDown}
        >
            <Box sx={defaultStyle}>
                {title && (
                    <Typography variant='h6' component='h2'>
                        {title}
                        <Divider sx={{ borderColor: 'primary.main', marginTop: '4px' }} />
                    </Typography>
                )}
                <Box sx={{ mt: title ? 1 : 'unset' }}>{content}</Box>
                {footer && <Box sx={{ mt: 4 }}>{footer}</Box>}
                {isBackButton && (
                    <CustomButton
                        onClick={() => {
                            if (backButtonFunc) {
                                backButtonFunc()
                            } else {
                                dispatch(closeModal())
                            }
                        }}
                        customStyles={{
                            mt: 2,
                            position: 'absolute',
                            top: '-15px',
                            left: '-14px',
                            '&:hover': {
                                backgroundColor: 'transparent', // Keep the background color the same on hover
                                boxShadow: 'none' // Remove any shadow effect
                            },
                            '&:focus': {
                                backgroundColor: 'transparent', // Keep the background color the same on hover
                                boxShadow: 'none' // Remove any shadow effect
                            }
                            // textDecoration: 'underline'
                        }}
                        variant='text'
                        disableRipple
                    >
                        {/* eslint-disable  */}
                        <Tooltip title='Go back'>{backButtonTxt ? backButtonTxt : <ArrowCircleLeft />}</Tooltip>
                    </CustomButton>
                )}
                {/* Hiding it temporarily */}
                <CustomButton
                    onClick={() => {
                        dispatch(closeModal())
                    }}
                    customStyles={{
                        mt: 2,
                        position: 'absolute',
                        top: '-15px',
                        right: '-14px',
                        '&:hover': {
                            backgroundColor: 'transparent', // Keep the background color the same on hover
                            boxShadow: 'none' // Remove any shadow effect
                        },
                        '&:focus': {
                            backgroundColor: 'transparent', // Keep the background color the same on hover
                            boxShadow: 'none' // Remove any shadow effect
                        }
                    }}
                    variant='text'
                    disableRipple
                    tooltip='Close'
                    showTooltip
                >
                    <Cancel />
                </CustomButton>
            </Box>
        </Modal>
    )
}
