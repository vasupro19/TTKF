/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import IconButton from '@mui/material/IconButton'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import { styled, useTheme } from '@mui/material/styles'
import StorefrontIcon from '@mui/icons-material/Storefront'
import BusinessIcon from '@mui/icons-material/Business'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import ReceiptIcon from '@mui/icons-material/Receipt'
import ReplayIcon from '@mui/icons-material/Replay'
import BuildIcon from '@mui/icons-material/Build'
import { useNavigate } from 'react-router-dom'
import {
    Box,
    Divider,
    Typography,
    useMediaQuery,
    FormControl,
    FormControlLabel,
    RadioGroup,
    Radio
} from '@mui/material'
import CustomButton from './extended/CustomButton'
import { useDispatch } from 'react-redux'
import { closeModal } from '@/app/store/slices/modalSlice'
import { RightArrowAnimIcon } from '@/assets/icons/RightArrowAnimIcon'

// Outer container clips overall view
const OuterContainer = styled('div')(({ theme }) => ({
    overflow: 'hidden',
    width: '88%',
    margin: '0 auto'
}))

// Carousel container allows overflow so adjacent slides remain partially visible
const CarouselContainer = styled('div')(({ theme }) => ({
    position: 'relative',
    overflow: 'visible',
    width: '100%',
    height: '15rem',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    touchAction: 'none',
    outline: 'none',
    '&::before, &::after': {
        content: '""',
        position: 'absolute',
        top: '12%', // Adjust as needed to control how much shadow appears
        bottom: '12%',
        width: '1.2rem', // Width of the shadow
        pointerEvents: 'none'
    },

    '&::before': {
        left: 0,
        background: 'linear-gradient(to right, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.01), transparent)'
    },

    '&::after': {
        right: 0,
        background: 'linear-gradient(to left, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.01), transparent)'
    }
}))

const SlideWrapper = styled(motion.div)(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'grab'
}))

const Slide = styled(motion.div)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    flexShrink: 0,
    padding: '8px',
    userSelect: 'none',
    // Remove default focus outline
    '&:focus': {
        outline: 'none'
    }
}))

// Navigation wrapper that does not block slide clicks.
const NavigationWrapper = styled('div')(() => ({
    position: 'absolute',
    top: '50%',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    transform: 'translateY(-50%)',
    zIndex: 10,
    pointerEvents: 'none'
}))

const NavIconButton = styled(IconButton)(() => ({
    pointerEvents: 'auto'
}))

const CarouselWrapper = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%'
}))

const ZoomInCarousel = ({ slides = [], setIsOpen, method, handleBulkImport, onMethodChange }) => {
    const dispatch = useDispatch()

    const baseSlides = slides.length ? slides : []

    // Create an extended array by repeating baseSlides (3 copies)
    const copiesCount = 3
    const extendedSlides = []
    for (let i = 0; i < copiesCount; i++) {
        extendedSlides.push(...baseSlides)
    }
    // Set initial index to the start of the middle copy
    const initialIndex = baseSlides.length * Math.floor(copiesCount / 2)
    const [activeIndex, setActiveIndex] = useState(initialIndex)
    const [disableAnimation, setDisableAnimation] = useState(false)
    const [containerWidth, setContainerWidth] = useState(0)
    const containerRef = useRef(null)
    const theme = useTheme()
    const navigate = useNavigate()
    const isMobile = useMediaQuery('(max-width:500px)')
    const baseSlideWidth = isMobile ? 120 : 150
    const gap = isMobile ? 8 : 12

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth)
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // useEffect(() => {
    //     const handleKeyDown = e => {
    //         if (e.key === 'ArrowLeft') handlePrev()
    //         if (e.key === 'ArrowRight') handleNext()
    //     }
    //     window.addEventListener('keydown', handleKeyDown)
    //     return () => window.removeEventListener('keydown', handleKeyDown)
    // }, [])

    useEffect(() => {
        const handleKeyDown = e => {
            if (e.key === 'ArrowLeft') handlePrev()
            if (e.key === 'ArrowRight') handleNext()
            if (e.key === 'Enter') {
                const activeSlide = extendedSlides[activeIndex]
                if (method === 'form') {
                    if (activeSlide?.path) {
                        dispatch(closeModal()) // Close modal on selection
                        navigate(`/outbound/order/create`, {
                            state: { selectedOrderType: activeSlide.path.replace('/', '') }
                        })
                    }
                } else if (method === 'upload') {
                    dispatch(closeModal()) // Close modal on selection
                    handleBulkImport(activeSlide?.path?.replace('/', ''))
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [activeIndex, baseSlides.length, copiesCount, navigate, dispatch, setIsOpen, method, handleBulkImport]) // Added method and handleBulkImport to dependencies

    const handleNext = () => {
        setActiveIndex(prev => prev + 1)
    }

    const handlePrev = () => {
        setActiveIndex(prev => prev - 1)
    }

    const onDragEnd = (_, info) => {
        const threshold = 30
        if (info.offset.x < -threshold) handleNext()
        else if (info.offset.x > threshold) handlePrev()
    }

    // When near either edge of the extendedSlides array, reset to the middle copy.
    useEffect(() => {
        const lowerBound = baseSlides.length * 0.5
        const upperBound = baseSlides.length * (copiesCount - 0.5)
        if (activeIndex < lowerBound) {
            setDisableAnimation(true)
            setActiveIndex(activeIndex + baseSlides.length)
            setTimeout(() => setDisableAnimation(false), 50)
        } else if (activeIndex >= upperBound) {
            setDisableAnimation(true)
            setActiveIndex(activeIndex - baseSlides.length)
            setTimeout(() => setDisableAnimation(false), 50)
        }
    }, [activeIndex, baseSlides.length, copiesCount])

    const xOffset = containerWidth ? containerWidth / 2 - baseSlideWidth / 2 - activeIndex * (baseSlideWidth + gap) : 0

    return (
        <Box>
            <CarouselWrapper>
                <NavigationWrapper>
                    <NavIconButton onClick={handlePrev} sx={{ marginLeft: '4px' }} aria-label='previous slide'>
                        <ArrowBackIosNewIcon color='primary' />
                    </NavIconButton>
                    <NavIconButton onClick={handleNext} sx={{ marginRight: '4px' }} aria-label='next slide'>
                        <ArrowForwardIosIcon color='primary' />
                    </NavIconButton>
                </NavigationWrapper>
                <OuterContainer>
                    <CarouselContainer
                        ref={containerRef}
                        tabIndex={0}
                        sx={{
                            maxWidth: isMobile ? '340px' : '62vw',
                            height: isMobile ? '12rem' : '12rem'
                        }}
                    >
                        <SlideWrapper
                            animate={{ x: xOffset }}
                            transition={
                                disableAnimation ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 40 }
                            }
                            drag='x'
                            onDragEnd={onDragEnd}
                        >
                            {extendedSlides.map((slide, index) => {
                                const isActive = index === activeIndex
                                return (
                                    <Slide
                                        key={index}
                                        tabIndex={0}
                                        role='button'
                                        onClick={() => {
                                            setActiveIndex(index)
                                            if (containerRef.current) {
                                                containerRef.current.focus()
                                            }
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                console.log('Enter key pressed')
                                                slide?.path &&
                                                    navigate(`/outbound/order/create`, {
                                                        state: { selectedOrderType: slide?.path.replace('/', '') }
                                                    })
                                                if (containerRef.current) {
                                                    containerRef.current.focus()
                                                }
                                            }
                                        }}
                                        onDoubleClick={() => {
                                            setIsOpen(false)
                                            slide?.path &&
                                                navigate(`/outbound/order/create`, {
                                                    state: { selectedOrderType: slide?.path.replace('/', '') }
                                                })
                                        }}
                                        style={{
                                            width: baseSlideWidth,
                                            height: isMobile ? '132px' : '150px',
                                            zIndex: isActive ? 2 : 1,
                                            border: isActive ? '2px solid #000' : '1px solid #ddd',
                                            padding: isActive ? '6px' : '4px'
                                        }}
                                        whileHover={{ scale: isActive ? 1.15 : 1.05 }}
                                        animate={{
                                            scale: isActive ? 1.15 : 1,
                                            opacity: isActive ? 1 : 0.75
                                        }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {slide.icon}
                                        <Typography
                                            style={{
                                                marginTop: '4px',
                                                cursor: 'pointer',
                                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                                fontWeight: isActive ? 'bolder' : 'normal'
                                            }}
                                        >
                                            {slide.title}
                                        </Typography>
                                    </Slide>
                                )
                            })}
                        </SlideWrapper>
                    </CarouselContainer>
                </OuterContainer>
            </CarouselWrapper>
            <Divider sx={{ borderColor: 'primary.main', marginY: '4px' }} />
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', minHeight: '40px' }}>
                <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: { xs: '200px' } }}>
                    <FormControl component='fieldset' sx={{ padding: '0px' }}>
                        <RadioGroup
                            row
                            aria-label='method-type'
                            name='method-type'
                            value={method}
                            onChange={onMethodChange}
                            sx={{ padding: '0px' }}
                        >
                            <FormControlLabel
                                sx={{ padding: '0px' }}
                                value='form'
                                control={<Radio size='small' sx={{ paddingY: '0px' }} />}
                                label='Form'
                            />
                            <FormControlLabel
                                sx={{ padding: '0px' }}
                                value='upload'
                                control={<Radio size='small' sx={{ paddingY: '4px' }} />}
                                label='Upload'
                            />
                        </RadioGroup>
                    </FormControl>
                </Box>
                <Box sx={{ marginLeft: 'auto' }}>
                    <CustomButton
                        onClick={() => {
                            setIsOpen(false)
                            if (method === 'form') {
                                extendedSlides[activeIndex].path &&
                                    navigate(`/outbound/order/create`, {
                                        state: {
                                            selectedOrderType: extendedSlides?.[activeIndex].path.replace('/', '')
                                        }
                                    })
                            } else if (method === 'upload') {
                                setIsOpen(false)
                                handleBulkImport(extendedSlides?.[activeIndex]?.path?.replace('/', ''))
                            }
                        }}
                        variant='contained'
                        shouldAnimate
                        endIcon={<RightArrowAnimIcon />}
                        clickable
                    >
                        Next
                    </CustomButton>
                </Box>
            </Box>
        </Box>
    )
}

export default ZoomInCarousel
