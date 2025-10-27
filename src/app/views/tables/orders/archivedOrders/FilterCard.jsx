import { Card, CardContent, Typography, Box, IconButton, Collapse } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useState } from 'react'
import CustomSearchTextField from '@/core/components/extended/CustomSearchTextField'
import CustomSearchDateField from '@/core/components/extended/CustomSearchDateField'
import CustomButton from '@/core/components/extended/CustomButton'
import { FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material'
import PropTypes from 'prop-types'

function FilterCard({ search, setSearch, filters, setFilters }) {
    const [expanded, setExpanded] = useState(true)

    const handleExpandClick = () => {
        setExpanded(!expanded)
    }

    const handleClearFilters = () => {
        setSearch('')
        setFilters({
            from: null,
            to: null
        })
    }

    const handleApplyFilters = () => {
        // eslint-disable-next-line no-console
        console.log('Applying filters:', { search, filters })
    }

    return (
        <Card
            sx={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.88)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)', // More prominent shadow
                marginTop: 0.5,
                marginBottom: 1,
                border: '1px solid rgba(0,0,0,0.12)', // More visible border
                borderColor: 'grey.borderLight'
            }}
        >
            {/* Clickable header section */}
            <Box
                onClick={handleExpandClick}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1,
                    py: 0.2,
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                    width: '100%',
                    cursor: 'pointer', // Added pointer cursor
                    backgroundColor: expanded ? 'rgba(0,0,0,0.02)' : 'grey.bgLight', // Background when collapsed
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.04)' // Hover effect
                    }
                }}
            >
                <Typography variant='h4' sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                    <FilterAltOutlined />
                    Filters
                </Typography>
                <IconButton
                    size='small'
                    sx={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        pointerEvents: 'none' // Prevents icon from capturing click
                    }}
                >
                    <ExpandMoreIcon fontSize='small' />
                </IconButton>
            </Box>

            <Collapse in={expanded}>
                <CardContent
                    sx={{
                        p: 1.5,
                        paddingBottom: '0px !important',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                        marginBottom: 1,
                        flexDirection: { xs: 'column', sm: 'row' }
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: 'center',
                            gap: 1.5,
                            width: '100%',
                            flex: 5
                        }}
                    >
                        <CustomSearchTextField
                            search={search}
                            setSearch={setSearch}
                            placeholder='Search for order no'
                            customSx={{
                                width: '100%'
                            }}
                            label='Order No.'
                        />
                        <CustomSearchTextField
                            search={search}
                            setSearch={setSearch}
                            placeholder='Search for invoice no'
                            customSx={{
                                width: '100%'
                            }}
                            label='Invoice No.'
                        />
                        <CustomSearchTextField
                            search={search}
                            setSearch={setSearch}
                            placeholder='Search AWB no'
                            customSx={{
                                width: '100%'
                            }}
                            label='AWB No.'
                        />
                        <CustomSearchDateField
                            type='from'
                            filters={filters}
                            setFilters={setFilters}
                            placeholder='From date'
                            label='From'
                            sx={{
                                '& .MuiInputBase-root': {
                                    height: '36px',
                                    width: '100%'
                                }
                            }}
                        />
                        <CustomSearchDateField
                            type='to'
                            filters={filters}
                            setFilters={setFilters}
                            placeholder='To date'
                            label='To'
                            sx={{
                                '& .MuiInputBase-root': {
                                    height: '36px',
                                    width: '100%'
                                }
                            }}
                        />
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 1,
                            flex: 1.2
                        }}
                    >
                        <CustomButton
                            variant='outlined'
                            color='primary'
                            onClick={handleClearFilters}
                            customStyles={{
                                px: 2,
                                height: '32px',
                                minWidth: '64px'
                            }}
                            endIcon={<FilterAltOffOutlined fontSize='small' />}
                        >
                            Clear Filters
                        </CustomButton>
                        <CustomButton
                            variant='clickable'
                            color='primary'
                            onClick={handleApplyFilters}
                            customStyles={{
                                px: 2,
                                height: '32px',
                                minWidth: '64px'
                            }}
                        >
                            Apply
                        </CustomButton>
                    </Box>
                </CardContent>
            </Collapse>
        </Card>
    )
}

export default FilterCard

FilterCard.propTypes = {
    search: PropTypes.string,
    setSearch: PropTypes.func,
    // eslint-disable-next-line react/forbid-prop-types
    filters: PropTypes.object,
    setFilters: PropTypes.func
}
