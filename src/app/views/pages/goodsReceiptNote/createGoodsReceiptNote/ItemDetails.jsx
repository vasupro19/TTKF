/* eslint-disable */
import { useEffect, Fragment } from 'react'
import { Typography, Box, Grid, Tooltip, useTheme } from '@mui/material'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import placeholderImg from '@assets/images/placeholder-image.webp'
import { useSelector } from 'react-redux'
import { getObjectKeys } from '@/utilities'


function ItemDetails() {
    const theme = useTheme()
    const {skuData} = useSelector(state => state.grn)

    return (
        <Box
            sx={{
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                p: 1,
                backgroundColor: 'grey.bgLight',
                border: '1px solid',
                borderColor: 'grey.borderLight',
                boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
                mt:{xs:1,sm:'0px'}
            }}
        >
            <Typography variant='h6' sx={{ fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>
                Item Details
            </Typography>

            <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                spaceBetween={10}
                slidesPerView={1}
                style={{
                    width: '100%',
                    height: '240px',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: theme.palette.grey.borderLight,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.grey.bgLight})`,
                    position: 'relative'
                }}
            >
                {skuData && skuData.image?.length > 0 ? (
                    skuData.image.map((src, index) => (
                        <SwiperSlide key={index}>
                            <img
                                src={src || placeholderImg}
                                alt={`Image ${index + 1}`}
                                onError={e => {
                                    e.target.onerror = null
                                    e.target.src = placeholderImg
                                }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    transition: 'transform 0.3s ease-in-out'
                                }}
                                onMouseEnter={e => (e.target.style.transform = 'scale(1.05)')}
                                onMouseLeave={e => (e.target.style.transform = 'scale(1)')}
                            />
                        </SwiperSlide>
                    ))
                ) : (
                    <SwiperSlide>
                        <img
                            src={placeholderImg}
                            alt='Placeholder'
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    </SwiperSlide>
                )}
            </Swiper>

            <Box sx={{ p: 1, backgroundColor: '#fff', borderRadius: '8px', marginTop: 1, minHeight:{sm:'10rem', xs:'unset'} }}>
                <Grid container spacing={0.2}>
                    {skuData?.item_properties && getObjectKeys(skuData?.item_properties).map(key => (
                        <Fragment key={key}>
                            <Grid item xs={4}>
                                <Typography
                                    variant='subtitle1'
                                    sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                                >
                                    {key}:
                                </Typography>
                            </Grid>
                            <Grid item xs={8}>
                                {key === 'Description' ? (
                                    <Tooltip title={key.value}>
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
                                            {skuData?.item_properties[key]}
                                        </Typography>
                                    </Tooltip>
                                ) : (
                                    <Typography variant='body2'>{skuData?.item_properties[key]}</Typography>
                                )}
                            </Grid>
                        </Fragment>
                    ))}
                </Grid>
            </Box>
        </Box>
    )
}

export default ItemDetails
