/* eslint-disable */
import React from 'react'
import {
    Box,
    Radio,
    FormControlLabel,
    RadioGroup,
    useMediaQuery,
    Select,
    MenuItem,
    FormControl
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import PropTypes from 'prop-types'

/**
 * Custom Tab Component with sliding indicator. Becomes a dropdown on xs screens.
 * @param {string[]} props.labels - Array of tab labels.
 * @param {number} props.tabIndex - Index of the active tab.
 * @param {function} props.onTabChange - Callback function triggered on tab change.
 * @param {Object} [props.customSx={}] - Custom styles applied to the container.
 */
function TabsWithSlide({ labels = [], tabIndex = 0, onTabChange, customSx = {} }) {
    const theme = useTheme()
    // Check if the screen size is small (down from 'sm')
    const isXsScreen = useMediaQuery(theme.breakpoints.down('sm'))

    const handleChange = event => {
        const newIndex = parseInt(event.target.value, 10)
        onTabChange(event, newIndex)
    }

    // Render a Dropdown for small screens
    if (isXsScreen) {
        return (
            <FormControl fullWidth sx={customSx}>
                <Select
                    value={tabIndex}
                    onChange={handleChange}
                    sx={{
                        backgroundColor: 'grey.200',
                        borderRadius: '9px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                        },
                        '& .MuiSelect-select': {
                            padding: '4px 28px 4px 8px !important' , // <-- your custom padding
                        },
                    }}
                >
                    {labels.map((label, index) => (
                        <MenuItem
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                            value={index}
                            sx={{ fontSize: '0.85rem', fontWeight: 500 }}
                        >
                            {label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        )
    }

    // Render the original Tabs with slide for larger screens
    return (
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                padding: '4px',
                backgroundColor: 'grey.200',
                borderRadius: '9px',
                ...customSx
            }}
        >
            {/* Sliding Indicator */}
            <Box
                sx={{
                    width: '130px',
                    height: '28px',
                    background: '#ffffff',
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    border: '0.5px solid rgba(0, 0, 0, 0.04)',
                    boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.12), 0px 3px 1px rgba(0, 0, 0, 0.04)',
                    borderRadius: '7px',
                    transition: 'transform 0.1s ease-out',
                    transform: `translateX(${tabIndex * 130}px)`
                }}
            />

            <RadioGroup
                row
                value={tabIndex}
                onChange={handleChange}
                sx={{
                    margin: 0,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'row'
                }}
            >
                {labels.map((label, index) => (
                    <FormControlLabel
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        value={index}
                        control={
                            <Radio
                                sx={{
                                    width: '130px',
                                    height: '28px',
                                    position: 'absolute',
                                    opacity: 0,
                                    margin: 0,
                                    padding: 0,
                                    '&:focus': {
                                        outline: 'none'
                                    }
                                }}
                            />
                        }
                        label={label}
                        sx={{
                            width: '130px',
                            height: '28px',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 0,
                            cursor: 'pointer',
                            margin: 0,
                            '& .MuiFormControlLabel-label': {
                                zIndex: 1, // Ensure label is above the sliding indicator
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: tabIndex === index ? 'text.dark' : 'text.primary',
                                opacity: tabIndex === index ? 1 : 0.6,
                                cursor: 'pointer',
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'color 0.2s ease-out, opacity 0.2s ease-out'
                            },
                            '&:hover .MuiFormControlLabel-label': {
                               backgroundColor: tabIndex !== index ? 'grey.300' : 'transparent',
                               borderRadius: '7px'
                            }
                        }}
                    />
                ))}
            </RadioGroup>
        </Box>
    )
}

TabsWithSlide.propTypes = {
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    tabIndex: PropTypes.number.isRequired,
    onTabChange: PropTypes.func.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    customSx: PropTypes.object
}

export default TabsWithSlide