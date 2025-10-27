/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useEffect, useState } from 'react'
import { Typography, Box, Paper, IconButton, Tooltip } from '@mui/material'
import { Cached } from '@mui/icons-material'
import FlipCard from '@/core/components/FlipCard'
import CustomButton from '@/core/components/extended/CustomButton'

import Viewer from 'react-viewer'
import PropTypes from 'prop-types'

export default function ProductInfoCard({ product, handleMarkAsPNA }) {
    // Safely parse the image array
    const imageUrls = JSON.parse(product.image || '[]')
    const keyImage = imageUrls.length > 0 ? imageUrls[0] : ''
    const [visible, setVisible] = useState(false)
    const [forceNoFlip, setForceNoFlip] = useState(false)
    useEffect(() => {
        setForceNoFlip(visible)
    }, [visible])

    return (
        <FlipCard
            front={
                <Paper
                    variant='outlined'
                    sx={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        p: 1.5,
                        background: 'linear-gradient(180deg, #FAFAFB 0%, #DEE1E6 100%)',
                        borderRadius: '8px',
                        borderWidth: '1px',
                        borderColor: '#BCC1CA',
                        borderStyle: 'solid',
                        boxShadow: '0px 0px 1px #171a1f12, 0px 0px 2px #171a1f1F',
                        width: '100%',
                        height: '100%'
                    }}
                >
                    {/* Top Row: Product Name + Flip Icon */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
                            {product.product_name}
                        </Typography>
                        <Tooltip title='Flip' arrow>
                            <IconButton sx={{ padding: '4px' }}>
                                <Typography variant='caption' sx={{ display: { xs: 'block', sm: 'none' } }}>
                                    Flip
                                </Typography>
                                <Cached fontSize='small' />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {/* EAN + Large Number Row */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                                <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                                    EAN: {product.ean ? product.ean.slice(0, 3) : ''}
                                </Typography>
                                <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                                    {product.ean ? product.ean.slice(3) : ''}
                                </Typography>
                            </Box>
                            {/* Pending QTY, Size, Color */}
                            <Typography variant='body2' display='flex' alignItems='center'>
                                <b>Pending QTY:</b> &nbsp;{' '}
                                <Typography variant='h4'>{product.pending_quantity || 'N/A'}</Typography>
                            </Typography>
                            <Typography variant='body2'>
                                <b>Size:</b> {product?.size || 'N/A'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant='body2'>
                                    <b>Color:</b> {product?.mapped_properties?.color || 'N/A'}
                                </Typography>
                                {product?.mapped_properties?.color && (
                                    <Box
                                        sx={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            backgroundColor: product?.mapped_properties?.color
                                        }}
                                    />
                                )}
                            </Box>
                            <Typography variant='body2'>
                                <b>Bin No:</b> {product.bin_no || 'N/A'}
                            </Typography>
                        </Box>
                        {/* Image + Mark as PNA Button (Right-Aligned) */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                flexDirection: 'column',
                                gap: '2px'
                            }}
                        >
                            <>
                                {/* Thumbnail Image */}
                                <img
                                    src={keyImage}
                                    alt='Product'
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={e => {
                                        e.stopPropagation()
                                        setVisible(true)
                                    }}
                                />
                                <Viewer
                                    visible={visible}
                                    onClose={() => {
                                        setVisible(false)
                                        setForceNoFlip(false)
                                    }}
                                    images={[{ src: keyImage, alt: 'Product' }]}
                                    noToolbar
                                    noNavbar
                                    clickToClose
                                    onMaskClick={e => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setVisible(false)
                                        setForceNoFlip(true)
                                        // setTimeout(() => {
                                        //     setForceNoFlip(false)
                                        // }, 500)
                                    }}
                                    zIndex={9999} // ensure overlay is above all other content
                                />
                            </>
                            <CustomButton
                                variant='outlined'
                                color='error'
                                customStyles={{ height: '24px', padding: '2px 4px', fontSize: '12px', mt: '4px' }}
                                onClick={e => {
                                    e.stopPropagation()
                                    handleMarkAsPNA(product)
                                }}
                            >
                                Mark as PNA
                            </CustomButton>
                        </Box>
                    </Box>
                </Paper>
            }
            back={
                <Paper
                    variant='outlined'
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        p: 1.5,
                        background: 'linear-gradient(180deg, #FAFAFB 0%, #DEE1E6 100%)',
                        borderRadius: '8px',
                        borderWidth: '1px',
                        borderColor: '#BCC1CA',
                        borderStyle: 'solid',
                        boxShadow: '0px 0px 1px #171a1f12, 0px 0px 2px #171a1f1F',
                        width: '100%',
                        height: '100%'
                    }}
                >
                    {/* Top Row: Product Name + Flip Icon */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
                            {product.product_name}
                        </Typography>
                        <Tooltip title='Flip' arrow>
                            <IconButton sx={{ padding: '4px' }}>
                                <Typography variant='caption' sx={{ display: { xs: 'block', sm: 'none' } }}>
                                    Flip
                                </Typography>
                                <Cached fontSize='small' />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Description */}
                    <Tooltip title={product.description}>
                        <Typography
                            variant='body2'
                            sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                paddingBottom: '8px'
                            }}
                        >
                            <b>Description:</b> {product.description}
                        </Typography>
                    </Tooltip>

                    {/* Style Code */}
                    <Typography variant='body2'>
                        <b>Style Code:</b> {product.styleCodeValue || 'N/A'}
                    </Typography>

                    {/* EXP */}
                    <Typography variant='body2'>
                        <b>EXP:</b> {product.exp || 'N/A'}
                    </Typography>

                    {/* MFG */}
                    <Typography variant='body2'>
                        <b>MFG:</b> {product.mfg || 'N/A'}
                    </Typography>
                </Paper>
            }
            isFlip={visible}
            forceNoFlip={forceNoFlip}
        />
    )
}

ProductInfoCard.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    product: PropTypes.object,
    handleMarkAsPNA: PropTypes.func
}
