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
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', color: 'text.dark' }}>
                <Typography sx={{ fontWeight: '500', fontSize: '0.9', textAlign: 'center' }} noWrap>
                    {column.label}
                </Typography>
                {searchTerms?.[column.id] && (
                    <FilterAltOutlined
                        sx={{
                            color: 'white',
                            filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))',
                            transition: 'filter 0.3s ease-in-out',
                            '&:hover': { filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 1))' }
                        }}
                    />
                )}
                {/* show individual filter icon */}
                {column?.colFilter && column?.colFilter}
                {column?.sort && (
                    <IconButton
                        sx={{ color: 'text.dark', p: 0, m: 0 }}
                        size='small'
                        aria-label='sort column'
                        onClick={() => handleSort(column.id)}
                    >
                        <SwapVertIcon fontSize='small' />
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
