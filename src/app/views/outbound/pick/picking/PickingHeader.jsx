/* eslint-disable react/prop-types */
import React from 'react'
import { Box, Typography } from '@mui/material'
import { Cached } from '@mui/icons-material'
import StatusBadge from '@/core/components/StatusBadge'
import { useLocation } from 'react-router-dom'

function PickingHeader({ items, pickListId, onChangeClick, location, pickBinId }) {
    const { pathname } = useLocation()
    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 1,
                    alignItems: 'center',
                    marginY: 1
                }}
            >
                <Box
                    sx={{
                        backgroundColor: 'primary.main',
                        borderRadius: 3,
                        border: '1px solid #ddd',
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingY: '2px',
                        paddingX: '14px',
                        gap: 1.5,
                        minWidth: '120px'
                    }}
                >
                    <Typography variant='subtitle1' sx={{ fontWeight: 'bold', color: '#fff' }}>
                        Picked Qty
                    </Typography>
                    <Typography variant='h4' sx={{ fontWeight: 'bold', color: '#fff' }}>
                        {items.totalPickedQuantity}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        backgroundColor: 'primary.main',
                        borderRadius: 3,
                        border: '1px solid #ddd',
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingY: '2px',
                        paddingX: '14px',
                        gap: 1.5,
                        minWidth: '120px'
                    }}
                >
                    <Typography variant='subtitle1' sx={{ fontWeight: 'bold', color: '#fff' }}>
                        Pending Qty
                    </Typography>
                    <Typography variant='h4' sx={{ fontWeight: 'bold', color: '#fff' }}>
                        {items.pendingQuantity}
                    </Typography>
                </Box>
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    paddingY: 1
                }}
            >
                {pathname?.includes('zones') && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            flexDirection: { xs: 'column', sm: 'row' }
                        }}
                    >
                        <Typography>Picklist No: &nbsp;</Typography>
                        <Typography variant={location ? 'h5' : 'h4'} sx={{ color: 'secondary.main' }}>
                            {pickListId}
                        </Typography>
                    </Box>
                )}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        flexDirection: pathname?.includes('zones') ? { xs: 'column', sm: 'row' } : 'row'
                    }}
                >
                    {pathname?.includes('zones') && <Typography>Pick Bin:</Typography>}
                    <Typography
                        variant={location ? 'h5' : 'h4'}
                        sx={{
                            color: 'secondary.main',
                            marginLeft: 0.5,
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center'
                        }}
                    >
                        {pickBinId}
                        <StatusBadge
                            type='cyan'
                            label='Bin'
                            icon={<Cached />}
                            customSx={{ height: '1.5rem', ml: 1, cursor: 'pointer' }}
                            onClick={() => {
                                onChangeClick?.()
                            }}
                        />
                    </Typography>
                </Box>
                {location && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap', // Allows wrapping
                            alignItems: 'center'
                        }}
                    >
                        <Typography>Storage Loc:</Typography>
                        <Typography
                            variant='h5'
                            sx={{
                                color: 'secondary.main',
                                marginLeft: 0.5,
                                wordBreak: 'break-word', // Ensures long words break properly
                                display: 'block' // Forces it to be on a new line if necessary
                            }}
                        >
                            {location}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    )
}

export default PickingHeader
