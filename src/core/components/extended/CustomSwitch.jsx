import React from 'react'
import { styled, Switch } from '@mui/material'
import PropTypes from 'prop-types'

/* eslint-disable */
const IOSSwitch = styled(props => <Switch focusVisibleClassName='.Mui-focusVisible' disableRipple {...props} />)(
    /* eslint-enable */

    ({ theme }) => ({
        width: '34px',
        height: '16px',
        padding: 0,
        '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: 2,
            transitionDuration: '300ms',
            '&.Mui-checked': {
                transform: 'translateX(16px)',
                '& .MuiSwitch-thumb:before': {
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="10" width="10" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
                        '#fff'
                    )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`
                },
                color: '#fff',
                '& + .MuiSwitch-track': {
                    backgroundColor: '#65C466',
                    opacity: 1,
                    border: 0,
                    ...theme.applyStyles('dark', {
                        backgroundColor: '#2ECA45'
                    })
                },
                '&.Mui-disabled + .MuiSwitch-track': {
                    opacity: 0.5
                }
            },
            '&.Mui-focusVisible .MuiSwitch-thumb': {
                color: '#33cf4d',
                border: '6px solid #fff'
            },
            '&.Mui-disabled .MuiSwitch-thumb': {
                color: theme.palette.grey[100],
                ...theme.applyStyles('dark', {
                    color: theme.palette.grey[600]
                })
            },
            '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.7,
                ...theme.applyStyles('dark', {
                    opacity: 0.3
                })
            }
        },
        '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width: '14px',
            height: '12px'
        },
        '& .MuiSwitch-track': {
            borderRadius: 26 / 2,
            backgroundColor: '#E9E9EA',
            opacity: 1,
            transition: theme.transitions.create(['background-color'], {
                duration: 500
            }),
            ...theme.applyStyles('dark', {
                backgroundColor: '#39393D'
            })
        }
    })
)

function CustomSwitch({ isChecked, handleChange, disabled = false, ...otherProps }) {
    /* eslint-disable */
    return <IOSSwitch checked={!!isChecked} onChange={handleChange} disabled={disabled}
    {...otherProps} />
    /* eslint-enable */
}

CustomSwitch.propTypes = {
    isChecked: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]).isRequired, // Boolean to determine if the switch is checked
    handleChange: PropTypes.func.isRequired, // Function to handle the onChange event
    disabled: PropTypes.bool // Optional Boolean to disable the switch
}

export default CustomSwitch
