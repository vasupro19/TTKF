import PropTypes from 'prop-types'
import { FilterAltOutlined } from '@mui/icons-material'
import { Box, IconButton, Typography } from '@mui/material'
import SwapVertIcon from '@mui/icons-material/SwapVert'

function PrimaryHeaderCellContent({ column, handleSort, searchTerms }) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '2px 4px'
            }}
            className='regular-height'
        >
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', justifyContent: 'center', color: 'text.primary' }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.primary', textAlign: 'center' }} noWrap>
                    {column.label}
                </Typography>
                {searchTerms?.[column.id] && (
                    <FilterAltOutlined
                        sx={{
                            color: 'primary.main',
                            fontSize: '16px'
                        }}
                    />
                )}
                {/* show individual filter icon */}
                {column?.colFilter && column?.colFilter}
                {column?.sort && (
                    <IconButton
                        sx={{ color: 'text.secondary', p: 0, m: 0, '&:hover': { color: 'text.primary' } }}
                        size='small'
                        aria-label='sort column'
                        onClick={() => handleSort(column.id)}
                    >
                        <SwapVertIcon sx={{ fontSize: '16px' }} />
                    </IconButton>
                )}
            </Box>
        </Box>
    )
}

// Define PropTypes
PrimaryHeaderCellContent.propTypes = {
    column: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    handleSort: PropTypes.func.isRequired,
    searchTerms: PropTypes.objectOf(PropTypes.string)
}

export default PrimaryHeaderCellContent
