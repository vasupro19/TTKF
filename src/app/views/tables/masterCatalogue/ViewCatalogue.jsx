import React, { useEffect, useState } from 'react'
import { Box, Button, Divider, Grid, Typography, useTheme } from '@mui/material'
import placeholderImg from '@assets/images/placeholder-image.webp'
import PropTypes from 'prop-types'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { getSkuById } from '@/app/store/slices/api/catalogueSlice'
import { useDispatch } from 'react-redux'
import { getObjectKeys, objectLength } from '@/utilities'
import { headers } from './helper'

function ViewCatalogue({ currentId }) {
    const theme = useTheme()
    const dispatch = useDispatch()
    const [currentData, setCurrentData] = useState(null)
    const [logs, setLogs] = useState([])
    const [showMore, setShowMore] = useState(false)
    const [labels, setLabels] = useState([])

    const excludedKeys = ['image', 'id', 'description', 'modified_by', 'modified_at'] // Keys to exclude
    const BoolKeys = ['lot_reqd', 'manufacturing_reqd', 'expiry_reqd', 'dual_mrp', 'is_multi_uom', 'piece_level_qc']

    useEffect(() => {
        const getData = async id => {
            const { data: response } = await dispatch(getSkuById.initiate(id))
            if (!response?.data?.item) return
            const propKeys = getObjectKeys(response.data.properties)
            const UserDefinedData = {}
            const UserDefinedHeaders = propKeys.flatMap(key =>
                response.data.properties[key].map(item => {
                    UserDefinedData[item.propertyname] = item.propertymappingvalue

                    return {
                        label: item.propertyname,
                        key: item.propertyname
                    }
                })
            )
            setLabels([...headers, ...UserDefinedHeaders])
            if (response.data.item?.remarks && typeof response.data.item?.remarks === 'string') {
                setLogs(response.data.item?.remarks.split(', '))
            }
            setCurrentData({
                ...response.data.item,
                ...UserDefinedData,
                created_at: response.data.item.created_at,
                created_by: response.data.item.created_by
            })
            setShowMore(false)
        }

        if (parseInt(currentId, 10)) getData(currentId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentId])

    const handleToggle = () => {
        setShowMore(!showMore)
    }
    return (
        <Box
            sx={{
                overflowX: 'auto',
                maxHeight: '100vh'
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'primary.main',
                    color: 'text.paper',
                    p: 2,
                    position: 'fixed',
                    width: '100%',
                    zIndex: 2,
                    boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px'
                }}
            >
                <Typography
                    variant='subtitle1'
                    sx={{ fontWeight: 'bold', textTransform: 'capitalize', color: 'text.paper' }}
                >
                    Product Name:
                </Typography>

                <Typography variant='body2' sx={{ ml: 2, color: 'text.paper' }}>
                    {currentData?.description ?? 'N/A'}
                </Typography>
            </Box>

            <Box
                sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    position: 'relative',
                    p: 2,
                    paddingTop: '64px',
                    backgroundColor: 'grey.bgLight'
                }}
            >
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
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.grey.bgLight})`, // Gradient background
                        position: 'relative'
                    }}
                >
                    {/* eslint-disable */}
                    {currentData?.image?.map((src, index) => (
                        <SwiperSlide key={index}>
                            <img
                                src={src ?? placeholderImg}
                                alt={`Image ${index + 1}`}
                                onError={e => {
                                    e.target.onerror = null
                                    e.target.src = { placeholderImg } // Provide your placeholder image path here
                                }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    transition: 'transform 0.3s ease-in-out' // Smooth scaling effect
                                }}
                                onMouseEnter={
                                    e => (e.target.style.transform = 'scale(1.05)') // Scale up on hover
                                }
                                onMouseLeave={e => (e.target.style.transform = 'scale(1)')} // Reset scale on hover out
                            />
                        </SwiperSlide>
                    ))}
                    {/* eslint-enable */}
                </Swiper>
                <Box
                    p={2}
                    sx={{
                        border: '1px solid',
                        marginTop: '4px',
                        borderColor: 'grey.borderLight',
                        borderRadius: '8px',
                        backgroundColor: '#fff'
                    }}
                >
                    {/* Iterate Over Product Fields */}
                    <Box>
                        {currentData &&
                            typeof currentData === 'object' &&
                            objectLength(currentData) > 0 &&
                            labels?.map(item => {
                                if (excludedKeys.includes(item.key)) return null
                                // Handle arrays (e.g., image URLs)
                                if (Array.isArray(currentData[item.key])) {
                                    return (
                                        <Box key={item.key} mb={1}>
                                            <Grid container spacing={0}>
                                                <Grid item xs={4}>
                                                    <Typography
                                                        variant='subtitle1'
                                                        sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                                                    >
                                                        {item.label}:
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={8}>
                                                    {/* eslint-disable */}
                                                    {currentData[item.key].map((item, index) => (
                                                        <Typography variant='body2' key={index}>
                                                            {item}
                                                        </Typography>
                                                    ))}
                                                    {/* eslint-enable */}
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )
                                }

                                // Handle boolean values
                                if (BoolKeys.includes(item.key)) {
                                    return (
                                        <Box key={item.key} mb={1}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={4}>
                                                    <Typography
                                                        variant='subtitle1'
                                                        sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                                                    >
                                                        {item.label}:
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={8}>
                                                    <Typography variant='body2'>
                                                        {currentData[item.key] ? 'Yes' : 'No'}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )
                                }

                                // Default handling for other data types
                                return (
                                    <Box key={item.key} mb={1}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={4}>
                                                <Typography
                                                    variant='subtitle1'
                                                    sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                                                >
                                                    {item.label}:
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={8}>
                                                <Typography variant='body2'>{currentData[item.key]}</Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )
                            })}
                    </Box>
                    <Divider sx={{ flexGrow: 1, borderColor: '#d0d0d0', my: 1 }} />

                    <Box
                        sx={{
                            width: '100%',
                            mb: 2,
                            border: '1px solid',
                            borderColor: 'grey.borderLight',
                            borderRadius: '8px',
                            padding: 1,
                            backgroundColor: 'grey.100',
                            boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px'
                        }}
                    >
                        <Typography variant='subtitle1' sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                            Recent Activity
                        </Typography>
                        {/* eslint-disable */}

                        {logs &&
                            logs.slice(0, showMore ? logs.length : 2).map((line, index) => (
                                <Typography key={index} variant='body2'>
                                    {line}
                                </Typography>
                            ))}
                        {/* eslint-enable */}

                        {logs?.remark && logs.length > 2 && (
                            <Button onClick={handleToggle}>{showMore ? 'Show Less' : 'Show More'}</Button>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

ViewCatalogue.propTypes = {
    currentId: PropTypes.number
}

export default ViewCatalogue
