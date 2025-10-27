import { useState, useEffect } from 'react'
import { Box, TextField } from '@mui/material'
import PropTypes from 'prop-types'

function TableCellSearchInput({ column, handleSearch, removeFilters }) {
    const [value, setValue] = useState('')
    useEffect(() => {
        if (removeFilters) setValue('')
    }, [removeFilters])
    return column.key !== 'id' ? (
        <TextField
            placeholder={`Enter ${column.label}...`}
            type='search'
            size='small'
            fullWidth
            value={value}
            sx={{
                '& .MuiInputBase-input': {
                    fontSize: 12
                },
                '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                        borderColor: 'primary.800',
                        borderWidth: '1.2px'
                    },
                    '&:hover fieldset': {
                        borderColor: 'primary.main'
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: 'primary.main'
                    }
                    // padding: '0px 4px'
                },
                '& .MuiInputBase-inputSizeSmall': {
                    padding: '2px 4px !important',
                    textIndent: '6px'
                },
                // Targeting placeholder text
                '& .MuiInputBase-input::placeholder': {
                    fontSize: '12px' // Change this to your desired font size
                }
            }}
            onChange={e => {
                setValue(e.target.value)
                if (!e.target.value.trim()) handleSearch(column.id, column.key, e.target.value)
            }}
            onKeyDown={e => {
                if (e.key === 'Enter') handleSearch(column.id, column.key, e.target.value)
            }}
        />
    ) : (
        <Box> </Box>
    )
}
// Define PropTypes
TableCellSearchInput.propTypes = {
    column: PropTypes.shape({
        label: PropTypes.string.isRequired,
        id: PropTypes.number.isRequired,
        key: PropTypes.string.isRequired
    }).isRequired,
    handleSearch: PropTypes.func.isRequired,
    removeFilters: PropTypes.bool
}

export default TableCellSearchInput
