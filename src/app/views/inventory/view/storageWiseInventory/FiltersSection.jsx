import React, { useState, useEffect } from 'react'
import { Box, Button, Typography, IconButton, Collapse, Chip, useMediaQuery } from '@mui/material'
import {
    Tune as TuneIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    FilterList,
    FilterAltOff,
    FilterListOff
} from '@mui/icons-material'
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
    loadAppliedFiltersToActive,
    selectHasUnappliedChanges,
    selectCurrentTabAppliedFilters
} from '@/app/store/slices/inventoryStorageWiseSlice' // Update with your actual path
import MinimalistAutocomplete from '@/core/components/MinimalistAutocomplete'
import AppliedFilterSection from '../AppliedFilterSection'

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
        setCollapsed(false) // Collapse the filter section after clearing
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
                overflow: 'hidden',
                ...(collapsed
                    ? {
                          backgroundColor: 'grey.bgLight',
                          border: '1px solid',
                          borderColor: 'grey.borderLight',
                          cursor: 'pointer'
                      }
                    : {})
            }}
            onClick={() => {
                if (!collapsed) return
                setCollapsed(!collapsed)
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderColor: 'grey.300',
                    padding: collapsed ? '4px' : '0px',
                    transition: 'padding 0.3s ease'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TuneIcon sx={{ color: 'grey.600' }} size='small' />
                    <Typography variant='subtitle1' fontWeight='medium'>
                        Select Filters
                    </Typography>
                    {hasAppliedFilters && collapsed && (
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
                                height: '30px'
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
                <Box sx={{ paddingTop: 1, paddingBottom: 0.5 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, marginBottom: 1 }}>
                        {initialFilters.map(filter => (
                            <MinimalistAutocomplete
                                name={filter.name}
                                label={filter.label}
                                options={filter.options}
                                value={getFilterValue(filter.name)}
                                onChange={(event, newValue) => handleFilterChange(filter.name, newValue)}
                                onBlur={() => handleFilterBlur(filter.name)}
                                touched={touched[filter.name]}
                                setFieldValue={(name, value) => handleFilterChange(name, value)}
                                setFieldTouched={name => handleFilterBlur(name)}
                                placeholder='Search here...'
                                showAdornment
                                showClearButton={false}
                                customSx={customSx}
                                key={filter.name}
                            />
                        ))}
                        {showMoreFilters &&
                            moreFilters.length > 0 &&
                            moreFilters.map(filter => {
                                const filterName = filter.name

                                return (
                                    <MinimalistAutocomplete
                                        key={filterName}
                                        name={filterName}
                                        label={filter.label}
                                        options={filter.options}
                                        value={getFilterValue(filterName)}
                                        onChange={(event, newValue) => handleFilterChange(filterName, newValue)}
                                        onBlur={() => handleFilterBlur(filterName)}
                                        touched={touched[filterName]}
                                        setFieldValue={handleFilterChange}
                                        setFieldTouched={handleFilterBlur}
                                        placeholder='Search here...'
                                        showAdornment
                                        showClearButton={false}
                                        customSx={customSx}
                                    />
                                )
                            })}

                        {/* More/Less Filters Toggle */}
                        {moreFilters.length > 0 && (
                            <Button
                                onClick={() => setShowMoreFilters(!showMoreFilters)}
                                sx={{
                                    borderRadius: '8px',
                                    height: '32px',
                                    borderColor: '#E2E8F0',
                                    color: 'text.primary'
                                }}
                                startIcon={
                                    showMoreFilters ? (
                                        <FilterListOff sx={{ fontSize: '1.2rem' }} />
                                    ) : (
                                        <FilterList sx={{ fontSize: '1.2rem' }} />
                                    )
                                }
                                variant='outlined'
                            >
                                {showMoreFilters ? 'Less Filters' : `More (${moreFilters.length})`}
                            </Button>
                        )}
                    </Box>
                </Box>
                <AppliedFilterSection />
            </Collapse>
        </Box>
    )
}
