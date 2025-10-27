/* eslint-disable react/jsx-props-no-spreading */
import React from 'react'
import { Tooltip, tooltipClasses } from '@mui/material'
import { styled } from '@mui/material/styles'

const StyledTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)(
    ({ theme }) => ({
        [`& .${tooltipClasses.tooltip}`]: {
            backgroundColor: '#fff',
            color: '#333',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: theme.shadows[2],
            padding: '10px'
        },
        [`& .${tooltipClasses.arrow}`]: {
            color: '#fff'
        }
    })
)

function CustomTooltip({ children, title, placement = 'top', arrow = true, ...props }) {
    return (
        <StyledTooltip title={title} placement={placement} arrow={arrow} {...props}>
            {children}
        </StyledTooltip>
    )
}

export default CustomTooltip
