/* eslint-disable react/prop-types */
/* eslint-disable no-nested-ternary */
import { Fragment, useState, useEffect } from 'react'
import { Typography, Box, Grid, Tooltip, useTheme } from '@mui/material'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const initialSku = {
    Name: '-',
    EAN: '-',
    'Style Code': '-',
    Colour: '-',
    Brand: '-',
    Size: '-',
    Description: '-',
    image: []
}

function PackItemDetails({ sku }) {
    const theme = useTheme()
    const [item, setItem] = useState(structuredClone(initialSku))

    useEffect(() => {
        if (sku) {
            setItem({
                Name: sku?.description || '-',
                EAN: sku?.item_no || '-',
                Description: sku?.description_2 || '-',
                image: sku?.image || [],
                ...(sku?.item_properties ? { ...sku.item_properties } : {})
            })
        } else if (item && item.Name !== '-') setItem(structuredClone(initialSku))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sku])

    return (
        <Box
            sx={{
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                p: 1,
                background: 'linear-gradient(145deg, #e6e8ed, #ffffff)',
                border: '1px solid',
                borderColor: 'grey.borderLight',
                mt: { xs: 1, sm: '0px' },
                display: 'flex',
                flexDirection: { xs: 'column-reverse', sm: 'row' },
                '&:hover': {
                    boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px'
                }
            }}
        >
            <Box sx={{ p: 1, borderRadius: '8px', minHeight: { sm: '10rem', xs: 'unset' }, flex: 1.2 }}>
                <Grid container>
                    {item?.Name &&
                        Object.keys(item).map(key => (
                            <Fragment key={key}>
                                {key === 'image' ? null : (
                                    <Grid item xs={4}>
                                        <Typography variant='subtitle1' fontWeight='bold'>
                                            {key}:
                                        </Typography>
                                    </Grid>
                                )}
                                <Grid item xs={8}>
                                    {key === 'Description' ? (
                                        <Tooltip title={item[key]}>
                                            <Typography
                                                variant='body2'
                                                sx={{
                                                    overflow: 'hidden',
                                                    display: '-webkit-box',
                                                    WebkitBoxOrient: 'vertical',
                                                    WebkitLineClamp: 2,
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {item[key]}
                                            </Typography>
                                        </Tooltip>
                                    ) : key === 'EAN' ? (
                                        <Typography variant='body2'>
                                            {item[key].slice(0, -5)}
                                            <Typography component='span' sx={{ fontWeight: '700', fontSize: '1rem' }}>
                                                {item[key].slice(-5)}
                                            </Typography>
                                        </Typography>
                                    ) : key === 'Colour' ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant='body2' sx={{ mr: 1 }}>
                                                {item[key]}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    width: '16px',
                                                    height: '16px',
                                                    backgroundColor: 'purple',
                                                    borderRadius: '50%'
                                                }}
                                            />
                                        </Box>
                                    ) : key === 'image' ? null : (
                                        <Typography variant='body2'>{item[key]}</Typography>
                                    )}
                                </Grid>
                            </Fragment>
                        ))}
                </Grid>
            </Box>

            <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                spaceBetween={10}
                slidesPerView={1}
                style={{
                    width: '300px',
                    height: '200px',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: theme.palette.grey.borderLight,
                    marginLeft: 'auto',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.grey.bgLight})` // Gradient background
                }}
            >
                {item?.image &&
                    item.image.map((src, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <SwiperSlide key={index}>
                            {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                            <img
                                src={src}
                                alt={`Image ${index + 1}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    borderRadius: '8px'
                                }}
                            />
                        </SwiperSlide>
                    ))}
            </Swiper>
        </Box>
    )
}

export default PackItemDetails
