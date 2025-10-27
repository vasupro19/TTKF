import React, { useState } from 'react'
import { Box, Typography, Grid, IconButton, Collapse, useMediaQuery } from '@mui/material'
import {
    Tune as TuneIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material'
import CustomSearchTextField from '@/core/components/extended/CustomSearchTextField' // Updated import

// Custom styling for search inputs
const customSearchInputSx = {
    '& input': {
        backgroundColor: '#fff',
        padding: '2px 8px',
        borderRadius: '8px !important',
        borderColor: '#2c2c2c !important'
    },
    borderRadius: '8px !important',
    width: '100%',
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        borderRadius: '8px !important',
        borderColor: '#bdbdbd',
        backgroundColor: 'white'
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderRadius: '8px !important',
        borderColor: '#bdbdbd'
    }
}

export default function FiltersSection() {
    const isMobile = useMediaQuery('(max-width:600px)')
    const [collapsed, setCollapsed] = useState(isMobile)

    // Updated filter data for search fields
    const initialFilters = [
        { name: 'searchUid', label: 'Search UID' },
        { name: 'searchItemId', label: 'Search Item ID' },
        { name: 'searchBinId', label: 'Search Bin ID' }
    ]

    const [filters, setFilters] = useState({
        searchUid: null,
        searchItemId: null,
        searchBinId: null,
        activeFilter: null // Track which filter is currently active
    })

    const [touched, setTouched] = useState({})
    const [resetTokens, setResetTokens] = useState({
        searchUid: 0,
        searchItemId: 0,
        searchBinId: 0
    })

    const handleFilterChange = (name, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value,
            activeFilter: value ? name : null // Set active filter when value is provided
        }))
    }

    const handleFilterBlur = name => {
        setTouched(prevTouched => ({
            ...prevTouched,
            [name]: true
        }))
    }

    const handleKeyDown = name => event => {
        if (event.key === 'Enter') {
            const value = event.target.value.trim()
            if (value) {
                handleFilterChange(name, value)
            }
        }
    }

    const handleClear = name => {
        handleFilterChange(name, null)
        // Increment reset token to force re-render of the input
        setResetTokens(prev => ({
            ...prev,
            [name]: prev[name] + 1
        }))
    }

    return (
        <Box
            sx={{
                width: '100%',
                borderRadius: '8px',
                backgroundColor: 'grey.bgLight',
                border: '1px solid',
                borderColor: 'grey.borderLight',
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderBottom: collapsed ? 'none' : '1px solid',
                    borderColor: 'grey.300',
                    cursor: 'pointer'
                }}
                onClick={() => setCollapsed(!collapsed)}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TuneIcon sx={{ color: 'grey.600' }} />
                    <Typography variant='subtitle1' fontWeight='medium'>
                        Select Filters
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                        size='small'
                        sx={{ color: 'grey.600' }}
                        onClick={e => {
                            e.stopPropagation()
                            setCollapsed(!collapsed)
                        }}
                    >
                        {collapsed ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </Box>
            </Box>

            <Collapse in={!collapsed}>
                <Box sx={{ padding: '12px' }}>
                    <Grid container spacing={2}>
                        {initialFilters.map(filter => (
                            <Grid item xs={12} sm={6} md={4} key={filter.name}>
                                <CustomSearchTextField
                                    customSx={customSearchInputSx}
                                    placeholder='Scan or type & hit enter...'
                                    label={filter.label}
                                    searchIconSx={{
                                        fontSize: 24
                                    }}
                                    search={filters[filter.name]}
                                    onKeyDownCustom={handleKeyDown(filter.name)}
                                    onBlur={() => handleFilterBlur(filter.name)}
                                    isDisabled={filters.activeFilter && filters.activeFilter !== filter.name}
                                    key={`${filter.name}Input-${resetTokens[filter.name]}`}
                                    onClear={() => handleClear(filter.name)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Collapse>
        </Box>
    )
}
