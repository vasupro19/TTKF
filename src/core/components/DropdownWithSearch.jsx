import React, { useState } from 'react'
import { Autocomplete, TextField, Checkbox, Popper, InputAdornment, Button, Popover, Box } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import FilterListIcon from '@mui/icons-material/FilterList'
import { styled } from '@mui/material/styles'

// Sample options for the dropdown
const options = ['INR', 'USD', 'JPY', 'AUD', 'EUR']

// Custom Popper to control dropdown position
const CustomPopper = styled(Popper)({
    '& .MuiAutocomplete-paper': {
        margin: 0,
        padding: 0,
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        minWidth: 200
    }
})

function DropdownWithSearch() {
    const [selectedOptions, setSelectedOptions] = useState([])
    const [anchorEl, setAnchorEl] = useState(null)

    const handleClick = event => {
        setAnchorEl(anchorEl ? null : event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const open = Boolean(anchorEl)
    const id = open ? 'dropdown-with-search' : undefined

    return (
        <Box sx={{ display: 'flex' }}>
            <FilterListIcon onClick={handleClick} sx={{ cursor: 'pointer' }} fontSize='small' />
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left'
                }}
            >
                <Box style={{ padding: '16px', width: '250px' }}>
                    <Autocomplete
                        multiple
                        options={options}
                        disableCloseOnSelect
                        PopperComponent={CustomPopper}
                        getOptionLabel={option => option}
                        renderOption={(props, option, { selected }) => (
                            /*eslint-disable*/
                            <li {...props}>
                                {/* eslint-enable */}

                                <Checkbox
                                    icon={<CheckBoxOutlineBlankIcon fontSize='small' />}
                                    checkedIcon={<CheckBoxIcon fontSize='small' />}
                                    checked={selected}
                                    sx={{ marginRight: 1 }}
                                />
                                {option}
                            </li>
                        )}
                        value={selectedOptions}
                        onChange={(event, newValue) => setSelectedOptions(newValue)}
                        renderInput={params => (
                            <TextField
                                /*eslint-disable*/
                                {...params}
                                /* eslint-enable */
                                placeholder='Search'
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <InputAdornment position='start'>
                                            <SearchIcon />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        )}
                    />
                    <Button variant='contained' fullWidth sx={{ marginTop: 2 }} onClick={handleClose}>
                        Apply
                    </Button>
                </Box>
            </Popover>
        </Box>
    )
}

export default DropdownWithSearch
