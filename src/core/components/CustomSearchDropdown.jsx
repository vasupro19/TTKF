/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-unstable-nested-components */
import React, { useState, useCallback } from 'react'
import { Autocomplete, Popper, styled, TextField } from '@mui/material'
import CustomButton from './extended/CustomButton'

const CustomPopper = styled(Popper)({
    minWidth: '250px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    borderRadius: '4px',
    backgroundColor: 'white'
})

const OptionsContainer = styled('div')({
    maxHeight: '200px',
    overflowY: 'auto'
})

const FooterContainer = styled('div')({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '4px 8px',
    borderTop: '1px solid #e0e0e0'
})

function CustomPopperComponent({ header, footer, defaultFooter, children, ...popperProps }) {
    return (
        <CustomPopper {...popperProps}>
            <div>
                {header}
                <OptionsContainer>{children}</OptionsContainer>
                {footer ?? defaultFooter}
            </div>
        </CustomPopper>
    )
}

const customSx = {
    '& input': {
        backgroundColor: '#fff',
        height: '20px'
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        backgroundColor: 'white'
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'gray'
    },
    '& fieldset': { borderRadius: 1.5 }
}

function CustomSearchDropdown({
    options,
    onChange,
    label = 'Select option',
    header,
    footer,
    onOk,
    onCancel,
    size = 'small',
    ...props
}) {
    const [value, setValue] = useState(null)
    const [open, setOpen] = useState(false)

    const handleOk = useCallback(
        event => {
            event.stopPropagation()
            // Pass the selected value to onOk and then clear the selection
            onOk?.(value)
            setValue(null)
            setOpen(false)
        },
        [onOk, value]
    )

    const handleCancel = useCallback(
        event => {
            event.stopPropagation()
            onCancel?.()
            setValue(null)
            setOpen(false)
        },
        [onCancel]
    )

    const defaultFooter = (
        <FooterContainer>
            <CustomButton
                variant='text'
                onClick={handleCancel}
                customStyles={{
                    padding: '4px',
                    height: '1.5rem'
                }}
            >
                Cancel
            </CustomButton>
            <CustomButton
                variant='clickable'
                onClick={handleOk}
                customStyles={{
                    padding: '4px',
                    height: '1.5rem'
                }}
            >
                OK
            </CustomButton>
        </FooterContainer>
    )

    const MemoizedPopper = useCallback(
        popperProps => (
            <CustomPopperComponent {...popperProps} header={header} footer={footer} defaultFooter={defaultFooter} />
        ),
        [header, footer, defaultFooter]
    )

    return (
        <Autocomplete
            {...props}
            open={open}
            onOpen={() => setOpen(true)}
            onClose={(event, reason) => {
                if (reason !== 'selectOption') {
                    setOpen(false)
                }
            }}
            options={options}
            value={value}
            onChange={(_, newValue) => {
                setValue(newValue)
                onChange(newValue)
            }}
            renderInput={params => <TextField {...params} label={label} fullWidth />}
            PopperComponent={MemoizedPopper}
            size={size}
            sx={{ ...customSx }}
        />
    )
}

export default CustomSearchDropdown
