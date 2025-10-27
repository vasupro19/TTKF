/* eslint-disable react/forbid-prop-types */
import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import { TextField } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import Cancel from '@mui/icons-material/Cancel'

/**
 * CustomSearchTextField Component
 *
 * A reusable search input field with styling and placeholder.
 *
 * @param {Object} props - Component properties
 * @param {Object} props.search - Search state object
 * @param {function} props.setSearch - Function to update the search state
 * @param {string} props.placeholder - Placeholder text for the search field
 * @param {Object} props.customSx - Custom styling object for the TextField
 * @param {string} props.label - Label text for the search field
 * @param {Object} props.searchIconSx - Custom styling object for the search icon
 * @param {boolean} props.isDisabled - Whether the input field is disabled
 * @param {function} props.onBlur - Function called when the input loses focus
 * @param {function} props.onKeyDownCustom - Custom keydown handler function
 * @param {boolean} props.showAdornment - Whether to show the search/cancel icon adornment
 * @param {Object} props.cancelIconSx - Custom styling object for the cancel icon
 * @param {function} props.onClear - Function called when the clear/cancel button is clicked
 * @param {Object} props.inputPropsSx - Custom styling object for the TextField inputProps
 *
 */
function CustomSearchTextField({
    search,
    setSearch,
    placeholder = 'search data...',
    customSx = {},
    label = '',
    searchIconSx = {},
    isDisabled = false,
    onBlur = () => {},
    onKeyDownCustom = null,
    showAdornment = true,
    cancelIconSx = {},
    onClear = () => {},
    inputPropsSx = {}
}) {
    const searchInputRef = useRef(null)

    /**
     * Handles keydown events on the input field.
     * Updates the search state when Enter is pressed.
     *
     * @param {React.KeyboardEvent<HTMLInputElement>} e - The keyboard event
     */
    const handleKeyDown = e => {
        if (e.key === 'Enter' && onKeyDownCustom) {
            onKeyDownCustom?.(e)
            return
        }
        if (e.key === 'Enter') {
            setSearch({ ...search, value: e.target.value })
        }
    }

    /**
     * Handles clearing the search input
     */
    const handleClear = () => {
        if (isDisabled) {
            return
        }
        if (searchInputRef?.current) {
            searchInputRef.current.value = ''
        }
        // eslint-disable-next-line no-unused-expressions
        !onKeyDownCustom && setSearch({ ...search, value: '' })
        if (onClear) {
            onClear()
        }
    }

    return (
        <TextField
            placeholder={placeholder}
            size='small'
            type='search'
            label={label}
            disabled={isDisabled}
            sx={{
                '& input': {
                    backgroundColor: '#fff',
                    padding: '2px 8px',
                    borderRadius: '4px !important',
                    borderColor: '#2c2c2c !important'
                },
                '& input[type="search"]::-webkit-search-cancel-button': {
                    display: 'none'
                },
                width: '180px',
                backgroundColor: '#fff',
                '& .MuiInputBase-root.MuiOutlinedInput-root': {
                    borderRadius: '4px !important',
                    borderColor: '#2c2c2c !important',
                    backgroundColor: 'white'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                    borderRadius: '4px !important',
                    borderColor: '#2c2c2c !important'
                },
                '& .Mui-disabled': {
                    backgroundColor: '#f0f0f0bf !important',
                    color: '#888'
                },
                ...customSx
            }}
            InputProps={{
                inputRef: searchInputRef,
                sx: { height: 40, ...inputPropsSx },
                // eslint-disable-next-line react/jsx-props-no-spreading
                ...(showAdornment
                    ? {
                          endAdornment:
                              (onKeyDownCustom && search) || search?.value ? (
                                  <Cancel
                                      onClick={handleClear}
                                      sx={
                                          isDisabled
                                              ? { color: 'primary.200', ...cancelIconSx }
                                              : { color: 'primary.main', cursor: 'pointer', ...cancelIconSx }
                                      }
                                  />
                              ) : (
                                  <SearchIcon fontSize='small' sx={{ ...(searchIconSx || {}) }} />
                              )
                      }
                    : {})
            }}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            autoComplete='off'
        />
    )
}

CustomSearchTextField.propTypes = {
    // Required search state object with value property
    search: PropTypes.shape({
        value: PropTypes.string
    }).isRequired,

    // Function to update the search state
    setSearch: PropTypes.func,

    // Placeholder text for the search field
    placeholder: PropTypes.string,

    // Custom styling object for the TextField
    customSx: PropTypes.object,

    // Label text for the search field
    label: PropTypes.string,

    // Custom styling object for the search icon
    searchIconSx: PropTypes.object,

    // Whether the input field is disabled
    isDisabled: PropTypes.bool,

    // Function called when the input loses focus
    onBlur: PropTypes.func,

    // Custom keydown handler function
    onKeyDownCustom: PropTypes.func,

    // Whether to show the search/cancel icon adornment
    showAdornment: PropTypes.bool,

    // Custom styling object for the cancel icon
    cancelIconSx: PropTypes.object,

    // Function called when the clear/cancel button is clicked
    onClear: PropTypes.func,

    inputPropsSx: PropTypes.object
}

export default CustomSearchTextField
