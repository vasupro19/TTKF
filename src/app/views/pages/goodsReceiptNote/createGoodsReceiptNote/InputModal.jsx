import React, { useEffect, useRef, useState } from 'react'
import Modal from '@mui/material/Modal'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { Divider, Typography } from '@mui/material'
import PropTypes from 'prop-types' // Import PropTypes

function InputModal({ open, onClose, value, onValueChange, onConfirm }) {
    const inputRef = useRef(null)
    const [error, setError] = useState(false)

    const handleValueChange = event => {
        const newValue = event.target.value
        if (newValue.length <= 6) {
            setError(false)
            onValueChange(event) // Update the value if it's within the limit
        } else {
            setError(true) // Set error if value exceeds 6 characters
        }
    }

    useEffect(() => {
        const handleEscape = event => {
            if (event.key === 'Escape' && value === '') {
                event.stopPropagation() // Prevent the Modal from closing on Escape if value is empty
            }
        }

        if (open) {
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
        }
    }, [open, value])

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus()
        }
    }, [open])

    const handleEnterKeyPress = event => {
        if (event.key === 'Enter' && value !== '') {
            onConfirm()
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            disableEscapeKeyDown
            onFocus={() => {
                if (inputRef?.current) {
                    inputRef?.current?.focus()
                }
            }}
            BackdropProps={{ onClick: event => event.stopPropagation() }} // Prevent closing on backdrop click
        >
            <Box
                sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    margin: 'auto',
                    maxWidth: { xs: 300 },
                    mt: '30vh',
                    outline: 'none',
                    borderRadius: '8px'
                }}
            >
                <Typography variant='h4'>Enter Table ID</Typography>
                <Divider sx={{ borderColor: 'primary.main', marginBottom: 2 }} />
                <TextField
                    label='Table Id'
                    inputRef={inputRef}
                    value={value}
                    onChange={handleValueChange}
                    onKeyDown={handleEnterKeyPress}
                    variant='outlined'
                    fullWidth
                    required
                    error={error}
                    helperText={error ? "You can't enter more than 6 characters." : ''}
                    inputProps={{ maxLength: 6 }}
                    /* eslint-disable */
                    autoFocus
                    /* eslint-enable */
                />
                <Divider sx={{ borderColor: 'primary.main', marginBottom: 0.5, mt: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant='contained'
                        color='primary'
                        onClick={onConfirm}
                        disabled={value === ''}
                        sx={{
                            alignSelf: 'end'
                        }}
                    >
                        Confirm
                    </Button>
                </Box>
            </Box>
        </Modal>
    )
}

// Define prop types
InputModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    onValueChange: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
}

export default InputModal
