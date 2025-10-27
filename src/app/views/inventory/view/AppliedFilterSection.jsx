import React from 'react'
import { Chip, Stack, Typography, Tooltip, Box } from '@mui/material'
import { Clear } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import {
    selectHasAppliedFilters,
    selectCurrentTabAppliedFilters,
    clearSingleFilter
} from '@/app/store/slices/inventoryStorageWiseSlice'

function AppliedFilterSection() {
    const dispatch = useDispatch()
    const hasAppliedFilters = useSelector(selectHasAppliedFilters)
    const appliedFilters = useSelector(selectCurrentTabAppliedFilters)

    return hasAppliedFilters ? (
        <Box
            sx={{
                borderBottom: '1px solid',
                borderTop: '1px solid',
                borderColor: '#eeeeee',
                py: 0.5,
                px: 2
            }}
        >
            <Stack
                direction='row'
                alignItems='flex-start'
                spacing={2}
                sx={{
                    flexWrap: 'wrap',
                    gap: 1
                }}
            >
                {hasAppliedFilters && (
                    // UI when filters are applied
                    <>
                        <Typography
                            sx={{
                                color: '#666666',
                                fontSize: '0.875rem',
                                fontWeight: 400,
                                whiteSpace: 'nowrap',
                                alignSelf: 'flex-start',
                                mt: 0.5
                            }}
                        >
                            Active filters:
                        </Typography>

                        {/* Chips container with flex wrap */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                flex: 1,
                                alignItems: 'flex-start'
                            }}
                        >
                            {/* Dynamically render chips based on appliedFilters */}
                            {appliedFilters &&
                                Object.entries(appliedFilters).map(([key, value]) => {
                                    const displayValue = String(value)

                                    return (
                                        <Tooltip key={key} title={displayValue} arrow placement='top' enterDelay={300}>
                                            <Box>
                                                <Chip
                                                    label={` ${displayValue}`}
                                                    onDelete={() => {
                                                        dispatch(clearSingleFilter({ filterName: key }))
                                                    }}
                                                    sx={{
                                                        borderRadius: '8px',
                                                        backgroundColor: '#EFF6FF',
                                                        maxWidth: '220px',
                                                        '& .MuiChip-label': {
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: '100%'
                                                        }
                                                    }}
                                                    deleteIcon={<Clear sx={{ fontSize: '12px' }} />}
                                                />
                                            </Box>
                                        </Tooltip>
                                    )
                                })}
                        </Box>
                    </>
                )}
            </Stack>
        </Box>
    ) : null
}

export default AppliedFilterSection
