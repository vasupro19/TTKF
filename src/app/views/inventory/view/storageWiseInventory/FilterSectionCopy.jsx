import React, { useState, useEffect } from 'react'
import { Box, Button, Typography, Grid, IconButton, Collapse, Chip, useMediaQuery } from '@mui/material'
import {
    Tune as TuneIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Add,
    FilterAltOutlined,
    FilterList,
    FilterAltOff
} from '@mui/icons-material'
import CustomAutocomplete from '@/core/components/extended/CustomAutocomplete'
import { getCustomSx } from '@/utilities'
import CustomButton from '@/core/components/extended/CustomButton'
import { useSelector, useDispatch } from 'react-redux'
import {
    selectCurrentTab,
    selectCurrentTabFilterConfig,
    selectActiveFilters,
    selectHasActiveFilters,
    selectHasAppliedFilters,
    setFilterValue,
    applyFilters,
    clearFilters,
    clearSingleFilter,
    loadAppliedFiltersToActive,
    selectHasUnappliedChanges,
    selectCurrentTabAppliedFilters
} from '@/app/store/slices/inventoryStorageWiseSlice' // Update with your actual path

const customSx = getCustomSx()

export default function FiltersSection() {
    const dispatch = useDispatch()

    // Redux selectors
    const currentTab = useSelector(selectCurrentTab)
    const filterConfig = useSelector(selectCurrentTabFilterConfig)
    const activeFilters = useSelector(selectActiveFilters)
    const hasActiveFilters = useSelector(selectHasActiveFilters)
    const hasAppliedFilters = useSelector(selectHasAppliedFilters)
    const hasUnappliedChanges = useSelector(selectHasUnappliedChanges) // Use the new selector
    const appliedFilters = useSelector(selectCurrentTabAppliedFilters)

    // Local state
    const isMobile = useMediaQuery('(max-width:600px)') // Adjust breakpoint as needed
    const [collapsed, setCollapsed] = useState(isMobile)
    const [showMoreFilters, setShowMoreFilters] = useState(false)
    const [touched, setTouched] = useState({})

    // Split filters into initial and more filters (first 4 as initial, rest as more filters)
    const initialFilters = filterConfig.slice(0, 4)
    const moreFilters = filterConfig.slice(4)

    // Load applied filters when tab changes
    useEffect(() => {
        dispatch(loadAppliedFiltersToActive())
        setTouched({})
        setShowMoreFilters(false) // Reset more filters visibility when tab changes
    }, [currentTab, dispatch])

    const handleFilterChange = (name, value) => {
        dispatch(setFilterValue({ filterName: name, value }))
    }

    const handleFilterBlur = name => {
        setTouched(prevTouched => ({
            ...prevTouched,
            [name]: true
        }))
    }

    const handleApplyFilters = () => {
        dispatch(applyFilters())
    }

    const handleClearAllFilters = e => {
        e.stopPropagation()
        dispatch(clearFilters())
        setTouched({})
    }

    const getFilterValue = filterName => activeFilters[filterName] || null

    // Determine the button label
    const buttonLabel = hasAppliedFilters ? 'Update Filters' : 'Apply Filters'

    // Determine if the button should be disabled
    // It should be disabled if:
    // 1. There are no active filters selected AND no filters were previously applied.
    // 2. There are active filters but no unapplied changes (meaning filters are already applied).
    const isButtonDisabled = (!hasActiveFilters && !hasAppliedFilters) || (!hasUnappliedChanges && hasAppliedFilters)

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
                    {hasAppliedFilters && (
                        <Chip
                            label={`${Object.keys(appliedFilters)?.length} active`}
                            size='small'
                            sx={{
                                height: '20px',
                                fontSize: '0.75rem',
                                backgroundColor: 'success.main',
                                color: 'success.contrastText'
                            }}
                        />
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Clear Filters Button */}
                        {hasActiveFilters && (
                            <Button
                                variant='outlined'
                                sx={{
                                    height: '32px',
                                    color: 'error.main',
                                    borderColor: 'error.main',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                        borderColor: 'error.main'
                                    }
                                }}
                                startIcon={<FilterAltOff />}
                                onClick={handleClearAllFilters}
                            >
                                Clear All
                            </Button>
                        )}

                        {/* Apply / Update Filters Button */}
                        <CustomButton
                            variant='clickable'
                            startIcon={<FilterList />}
                            onClick={e => {
                                e.stopPropagation()
                                handleApplyFilters()
                            }}
                            showTooltip={!hasActiveFilters}
                            tooltip='Please select at least one filter'
                            disabled={isButtonDisabled} // Use the calculated disabled state
                            customStyles={{
                                height: '32px'
                            }}
                        >
                            {buttonLabel} {/* Dynamic button label */}
                        </CustomButton>
                    </Box>
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
                    {/* Initial Filters */}
                    <Grid container spacing={2}>
                        {initialFilters.map(filter => (
                            <Grid item xs={12} sm={6} md={3} key={filter.name}>
                                <CustomAutocomplete
                                    name={filter.name}
                                    label={filter.label}
                                    options={filter.options}
                                    value={getFilterValue(filter.name)}
                                    onChange={(event, newValue) => handleFilterChange(filter.name, newValue)}
                                    onBlur={() => handleFilterBlur(filter.name)}
                                    touched={touched[filter.name]}
                                    setFieldValue={(name, value) => handleFilterChange(name, value)}
                                    setFieldTouched={name => handleFilterBlur(name)}
                                    showAdornment
                                    clearValFunc={() => {
                                        dispatch(clearSingleFilter({ filterName: filter?.name }))
                                    }}
                                    placeholder='Search here...'
                                    customSx={customSx}
                                />
                            </Grid>
                        ))}
                    </Grid>

                    {/* More Filters */}
                    {moreFilters.length > 0 && showMoreFilters && (
                        <Grid container spacing={2} sx={{ mt: 0.2 }}>
                            {moreFilters.map(filter => (
                                <Grid item xs={12} sm={6} md={3} key={filter.name}>
                                    <CustomAutocomplete
                                        name={filter.name}
                                        label={filter.label}
                                        options={filter.options}
                                        value={getFilterValue(filter.name)}
                                        onChange={(event, newValue) => handleFilterChange(filter.name, newValue)}
                                        onBlur={() => handleFilterBlur(filter.name)}
                                        touched={touched[filter.name]}
                                        setFieldValue={(name, value) => handleFilterChange(name, value)}
                                        setFieldTouched={name => handleFilterBlur(name)}
                                        showAdornment={false}
                                        // clearValFunc={() => handleFilterChange(filter.name, null)}
                                        clearValFunc={() => {
                                            dispatch(clearSingleFilter({ filterName: filter?.name }))
                                        }}
                                        placeholder='Search here...'
                                        customSx={customSx}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* More/Less Filters Toggle */}
                    {moreFilters.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Chip
                                label={showMoreFilters ? 'Less Filters' : `More Filters (${moreFilters.length})`}
                                onClick={() => setShowMoreFilters(!showMoreFilters)}
                                sx={{
                                    backgroundColor: 'grey.300',
                                    color: 'grey.800',
                                    '&:hover': {
                                        backgroundColor: 'grey.400',
                                        color: 'grey.900'
                                    },
                                    borderRadius: '16px',
                                    height: 'auto',
                                    padding: '4px 8px',
                                    fontSize: '0.9rem',
                                    fontWeight: 'medium',
                                    '& .MuiChip-label': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        paddingLeft: '4px'
                                    },
                                    '& .MuiChip-icon': {
                                        marginLeft: '0px',
                                        marginRight: '0px',
                                        color: 'grey.800'
                                    }
                                }}
                                icon={
                                    showMoreFilters ? (
                                        <KeyboardArrowUpIcon sx={{ fontSize: '1.2rem' }} />
                                    ) : (
                                        <Add sx={{ fontSize: '1.2rem' }} />
                                    )
                                }
                                deleteIcon={<FilterAltOutlined sx={{ fontSize: '1.2rem', color: 'grey.800' }} />}
                                onDelete={() => setShowMoreFilters(!showMoreFilters)}
                            />
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    )
}
