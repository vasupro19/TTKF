import React from 'react'
import PropTypes from 'prop-types'
import { Popover, Checkbox, FormControlLabel, Typography, Box } from '@mui/material'
import CustomButton from '@core/components/extended/CustomButton'
import ListIcon from '@assets/icons/ListIcon'
import { TOGGLE_ALL } from '@/constants'

function ToggleColumns({ columns, handler }) {
    const [anchorEl, setAnchorEl] = React.useState(null)

    const handleClick = event => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const open = Boolean(anchorEl)

    // Memoize the derived state for performance
    const selectedColumns = React.useMemo(() => columns.map(item => item.visible), [columns])

    // Standard logic for the "Select All" checkbox state
    const allSelected = selectedColumns.length > 0 && selectedColumns.every(Boolean)
    const indeterminate = selectedColumns.some(Boolean) && !allSelected

    return (
        <>
            <CustomButton
                variant='contained'
                customStyles={{
                    paddingX: '6px',
                    minWidth: 'max-content'
                }}
                onClick={handleClick}
            >
                <ListIcon />
            </CustomButton>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                }}
                // Apply styling to the Popover paper itself for consistent look
                PaperProps={{
                    sx: {
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        borderRadius: '8px'
                    }
                }}
            >
                <Box
                    sx={{
                        width: '250px',
                        maxHeight: '320px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto',
                        // Custom scrollbar styling to match the image
                        '&::-webkit-scrollbar': {
                            width: '6px'
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: 'transparent'
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#d1d1d1',
                            borderRadius: '3px'
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: '#b1b1b1'
                        }
                    }}
                >
                    {/* "Select All" Checkbox */}
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={allSelected}
                                indeterminate={indeterminate}
                                onChange={() => handler(TOGGLE_ALL)}
                                size='small'
                                sx={{ padding: '4px 12px 4px 16px' }} // Remove default padding for better alignment
                            />
                        }
                        label={<Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>Select All</Typography>}
                        sx={{ pl: '8px', mb: '4px', pb: '6px', borderBottom: '1px solid #DEE1E6', marginRight: '-8px' }} // Add padding to align with items below
                    />

                    {/* List of Columns */}
                    {columns.map(
                        (col, index) =>
                            col.label !== 'Sr.No.' && (
                                <FormControlLabel
                                    key={col.id}
                                    control={
                                        <Checkbox
                                            name={col.key}
                                            checked={selectedColumns[index] || false}
                                            onChange={() => handler(col.key)}
                                            size='small'
                                            sx={{ padding: '4px 12px 4px 4px' }} // Remove default padding for better alignment
                                        />
                                    }
                                    label={<Typography sx={{ fontSize: '0.9rem' }}>{col.label}</Typography>}
                                    sx={{
                                        width: '100%',
                                        pl: '8px', // Left padding for alignment
                                        margin: 0, // Reset default margin
                                        borderRadius: '4px',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                        }
                                    }}
                                />
                            )
                    )}
                </Box>
            </Popover>
        </>
    )
}

// Define prop types
ToggleColumns.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    columns: PropTypes.arrayOf(PropTypes.object).isRequired,
    handler: PropTypes.func.isRequired
}

export default ToggleColumns
