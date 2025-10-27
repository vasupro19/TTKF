/* eslint-disable react/prop-types */
/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
// import PropTypes from 'prop-types'
import { TextField, Checkbox, Popover, Box, InputAdornment, styled } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CustomButton from '@core/components/extended/CustomButton'
import { FilterAltOutlined, KeyboardArrowDown } from '@mui/icons-material'

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
    padding: 0,
    color: theme.palette.primary.main,
    '&.Mui-checked': {
        color: theme.palette.primary.main
    }
}))

const CustomAutocompleteWrapper = styled(Box)(() => ({
    position: 'relative'
}))

const CustomDropdown = styled(Box)(() => ({
    position: 'relative',
    width: '100%',
    backgroundColor: '#fff',
    border: '1px solid rgba(0, 0, 0, 0.2)',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    borderRadius: '8px',
    zIndex: 1300,
    maxHeight: '220px',
    overflowY: 'auto',
    padding: '4px 0px',
    margin: '6px 0px 34px 0px'
}))

function SearchFilterDropdown(
    {
        buttonText = 'Select Options',
        apiEndpoint,
        optionsProp = [],
        onApply = () => {},
        buttonSx,
        dropdownSx,
        textFieldSx,
        customButtonSx,
        isSearchable = true,
        variant,
        isClearButton = true,
        isApplyButton = true,
        singleSelect = false,
        // New props for button texts
        applyButtonText = 'Apply',
        clearButtonText = 'Clear',
        endIcon = <KeyboardArrowDown />,
        startIcon = <FilterAltOutlined />,
        column,
        removeFilters,
        handleFilters
    },
    ref
) {
    const [selectedOptions, setSelectedOptions] = useState([])
    const [tempSelectedOptions, setTempSelectedOptions] = useState([])
    const [anchorEl, setAnchorEl] = useState(null)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [options, setOptions] = useState([])
    const [searchedVal, setSearchedVal] = useState('')

    useImperativeHandle(ref, () => ({
        clearSelectedOptions() {
            setTempSelectedOptions([])
            setSelectedOptions([])
        }
    }))

    const handleClick = event => {
        setAnchorEl(anchorEl ? null : event.currentTarget)
        setDropdownOpen(!dropdownOpen)
    }

    const handleClose = () => {
        setAnchorEl(null)
        setDropdownOpen(false)
    }

    const fetchOptions = async () => {
        if (apiEndpoint) {
            try {
                const response = await fetch(apiEndpoint)
                const data = await response.json()
                setOptions(data)
            } catch (error) {
                // console.error('Error fetching options:', error)
            }
        } else {
            const filteredOptions = optionsProp.filter(option =>
                JSON.stringify(option).toLowerCase().includes(searchedVal.toLowerCase())
            )
            setOptions(filteredOptions)
        }
    }

    useEffect(() => {
        if (dropdownOpen) {
            setTempSelectedOptions([...selectedOptions])
            fetchOptions()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dropdownOpen])

    // useEffect(() => {
    //     if (dropdownOpen) {
    //         setTempSelectedOptions([...selectedOptions])
    //         fetchOptions()
    //     }
    // }, [dropdownOpen])

    const handleApply = () => {
        setSelectedOptions(tempSelectedOptions)
        onApply(tempSelectedOptions)
        handleClose()
        handleFilters(column.id, column.key, tempSelectedOptions)
    }

    const handleClear = () => {
        setTempSelectedOptions([])
        setSelectedOptions([])
        onApply('')
        handleFilters(column.id, column.key, [])
    }

    useEffect(() => {
        if (removeFilters) setSelectedOptions([])
    }, [removeFilters])

    return (
        <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <CustomButton
                variant={variant ?? 'outlined'}
                color='primary'
                onClick={handleClick}
                customStyles={{
                    textTransform: 'none',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    ...buttonSx
                }}
                endIcon={endIcon}
                startIcon={startIcon}
            >
                {buttonText}
            </CustomButton>
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{
                    sx: { overflow: 'hidden', width: 250, padding: 0.5, paddingBottom: '0px', ...dropdownSx }
                }}
            >
                <CustomAutocompleteWrapper>
                    {isSearchable && (
                        <TextField
                            placeholder='Search'
                            InputProps={{
                                sx: { height: 32 },
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <SearchIcon fontSize='small' />
                                    </InputAdornment>
                                )
                            }}
                            sx={textFieldSx}
                            onChange={e => setSearchedVal(e.target.value)}
                        />
                    )}
                    {dropdownOpen && (
                        <>
                            <CustomDropdown>
                                {options.map(option => (
                                    <Box
                                        key={option?.value || option}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '4px 16px',
                                            cursor: 'pointer',
                                            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.05)' }
                                        }}
                                        onClick={() =>
                                            setTempSelectedOptions(prev => {
                                                if (singleSelect) {
                                                    return JSON.stringify(prev).includes(JSON.stringify(option))
                                                        ? []
                                                        : [option]
                                                }
                                                return JSON.stringify(prev).includes(JSON.stringify(option))
                                                    ? prev.filter(
                                                          item => JSON.stringify(item) !== JSON.stringify(option)
                                                      )
                                                    : [...prev, option]
                                            })
                                        }
                                    >
                                        <StyledCheckbox
                                            checked={JSON.stringify(tempSelectedOptions).includes(
                                                JSON.stringify(option)
                                            )}
                                            icon={<CheckBoxOutlineBlankIcon fontSize='small' />}
                                            checkedIcon={<CheckBoxIcon fontSize='small' />}
                                        />
                                        {option?.label || option}
                                    </Box>
                                ))}
                            </CustomDropdown>

                            <Box
                                sx={{
                                    position: 'relative',
                                    marginTop: '-36px',
                                    textAlign: 'center',
                                    borderRadius: '4px',
                                    padding: '4px',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '4px'
                                }}
                            >
                                {isClearButton && (
                                    <CustomButton
                                        variant='outlined'
                                        color='primary'
                                        onClick={handleClear}
                                        customStyles={customButtonSx}
                                        disabled={tempSelectedOptions.length <= 0}
                                    >
                                        {clearButtonText}
                                    </CustomButton>
                                )}
                                {isApplyButton && (
                                    <CustomButton
                                        variant='clickable'
                                        color='primary'
                                        onClick={handleApply}
                                        customStyles={customButtonSx}
                                        disabled={tempSelectedOptions.length <= 0}
                                    >
                                        {applyButtonText}
                                    </CustomButton>
                                )}
                            </Box>
                        </>
                    )}
                </CustomAutocompleteWrapper>
            </Popover>
        </Box>
    )
}

// SearchFilterDropdown.propTypes = {
//     buttonText: PropTypes.string,
//     apiEndpoint: PropTypes.string,
//     optionsProp: PropTypes.arrayOf(PropTypes.string),
//     onApply: PropTypes.func,
//     buttonSx: PropTypes.object,
//     dropdownSx: PropTypes.object,
//     textFieldSx: PropTypes.object,
//     customButtonSx: PropTypes.object,
//     isClearButton: PropTypes.bool,
//     isApplyButton: PropTypes.bool,
//     isSearchable: PropTypes.bool,
//     variant: PropTypes.string,
//     singleSelect: PropTypes.bool,
//     applyButtonText: PropTypes.string,
//     clearButtonText: PropTypes.string,
//     endIcon: PropTypes.node,
//     startIcon: PropTypes.node,
//     column: PropTypes.object,
//     removeFilters: PropTypes.bool,
//     handleFilters: PropTypes.func
// }

const WarpedWithForwardRef = forwardRef(SearchFilterDropdown)
export default WarpedWithForwardRef
