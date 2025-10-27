import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
    Box,
    Button,
    Card,
    CardMedia,
    Chip,
    CircularProgress,
    IconButton,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material'
import { Cancel, InfoOutlined, LocationSearching, Search } from '@mui/icons-material'
import { motion } from 'framer-motion'
// eslint-disable-next-line import/no-extraneous-dependencies
import InfiniteScroll from 'react-infinite-scroll-component'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'

// Shared style objects
const tabStyles = {
    minWidth: '150px',
    textTransform: 'none',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    '&:not(:last-child)': {
        marginRight: '16px'
    }
}

const getChipStyles = isActive => ({
    marginLeft: '8px',
    backgroundColor: isActive ? 'primary.main' : '#e0e0e0',
    color: isActive ? '#fff' : '#555',
    fontWeight: 'bold',
    padding: '0 4px',
    height: '20px'
})

function TabsComponent({
    // eslint-disable-next-line react/prop-types
    selectedView,
    // eslint-disable-next-line react/prop-types
    setSelectedView,
    // eslint-disable-next-line react/prop-types
    GRNBinId,
    // eslint-disable-next-line react/prop-types
    formValues,
    // eslint-disable-next-line react/prop-types
    activeTab,
    // eslint-disable-next-line react/prop-types
    techniques,
    // eslint-disable-next-line react/prop-types
    mode,
    // eslint-disable-next-line react/prop-types
    isModalOpen
}) {
    const pendingPutAwayData = useSelector(state => state.putAway.pendingPutAwayData)

    // Calculate which tabs should be available
    const availableTabs = useMemo(() => {
        const tabs = []
        // Product view condition
        const showProductView =
            activeTab === 0 ||
            (mode === 'Job' && activeTab === 1 && techniques !== 'Suggested' && techniques !== 'Directed')
        if (showProductView) tabs.push(0)
        // Location view condition
        if (techniques !== 'Manual') tabs.push(1)
        return tabs
    }, [activeTab, mode, techniques])

    const dispatch = useDispatch()

    const [inputVal, setInputVal] = useState('')

    const handleClearInput = () => {
        setInputVal('')
    }

    const handleInputChange = e => {
        setInputVal(e.target.value)
    }

    // If current selectedView is not available, default to first valid tab
    useEffect(() => {
        if (!availableTabs.includes(selectedView)) {
            setSelectedView(availableTabs[0] || 0)
        }
    }, [availableTabs, selectedView, setSelectedView])

    const handleTabChange = (event, newValue) => {
        if (availableTabs.includes(newValue)) {
            setSelectedView(newValue)
        }
    }

    const validSelectedValue = availableTabs.includes(selectedView) ? selectedView : availableTabs[0] || 0

    const [products, setProducts] = useState([])
    const [displayedProducts, setDisplayedProducts] = useState([])

    useEffect(() => {
        if (pendingPutAwayData?.length) {
            setProducts(pendingPutAwayData)
            setDisplayedProducts(pendingPutAwayData.slice(0, 12))
        } else {
            setProducts([])
            setDisplayedProducts([])
        }
    }, [pendingPutAwayData])

    // Handler to load more products
    const loadMoreProducts = useCallback(() => {
        const currentLength = displayedProducts.length
        const moreProducts = products.slice(currentLength, currentLength + 12)
        setDisplayedProducts(prev => [...prev, ...moreProducts])
    }, [displayedProducts, products])

    // Locations data is static
    const locations = useMemo(
        () => [
            {
                locationCode: 'LOC-12345',
                noOfProducts: 25,
                totalQuantity: 100,
                pendingQuantity: 10,
                tag: 'New tag'
            },
            {
                locationCode: 'LOC-67890',
                noOfProducts: 30,
                totalQuantity: 150,
                pendingQuantity: 15,
                tag: 'Urgent'
            },
            {
                locationCode: 'LOC-54321',
                noOfProducts: 20,
                totalQuantity: 80,
                pendingQuantity: 5,
                tag: 'Normal'
            },
            {
                locationCode: 'LOC-98765',
                noOfProducts: 40,
                totalQuantity: 200,
                pendingQuantity: 20,
                tag: 'High Priority'
            }
        ],
        []
    )

    // --- Condition Flags ---
    // Flag for showing product view data
    const showProductData =
        !isModalOpen &&
        (GRNBinId || mode === 'Job' || true) &&
        (activeTab === 0 ||
            (activeTab === 1 && mode === 'Job' && techniques !== 'Suggested' && techniques !== 'Directed'))

    // Flag for showing the fallback (no product data)
    // eslint-disable-next-line no-unused-vars
    const showFallback =
        // eslint-disable-next-line react/prop-types
        selectedView !== 1 && activeTab === 0 && (!GRNBinId || (!formValues?.storageLocation && mode !== 'Job'))

    // Flag for showing the refresh button and location cards
    const showLocationData = selectedView === 1 && techniques !== 'Manual' && !isModalOpen

    // --- Render functions for each block ---
    const renderProductAlert = () => (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <Box
                sx={{
                    padding: '2px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    animation: 'pulse 0.6s infinite'
                }}
            >
                <InfoOutlined
                    fontSize='small'
                    sx={{
                        color: '#FF9800',
                        animation: 'pulse 0.6s infinite'
                    }}
                />
                <Typography
                    variant='h6'
                    sx={{
                        color: '#FF6F00',
                        fontWeight: 500,
                        fontFamily: 'Roboto, sans-serif'
                    }}
                >
                    {techniques !== 'Manual' ? 'Suggested Items for Scanned Location -' : 'All GRN completed Items'}
                </Typography>
            </Box>
        </motion.div>
    )

    const renderProductView = () => (
        <Box
            sx={{
                height: '20rem', // Fixed height for scrolling
                overflowY: 'auto', // Enables vertical scrolling
                display: 'flex',
                flexDirection: 'column',
                '&::-webkit-scrollbar': {
                    display: 'none' // Hide scrollbar for Chrome, Safari, and newer Edge
                },
                msOverflowStyle: 'none', // Hide scrollbar for IE and Edge
                scrollbarWidth: 'none' // Hide scrollbar for Firefox
            }}
            id='scrollableDiv'
        >
            <InfiniteScroll
                dataLength={displayedProducts.length}
                next={loadMoreProducts}
                hasMore={displayedProducts.length < products.length}
                loader={
                    <Box
                        display='flex'
                        justifyContent='center'
                        alignItems='center'
                        py={2}
                        sx={{ marginTop: 'auto' }} // Pushes loader to the bottom
                    >
                        <CircularProgress color='primary' size={24} />
                    </Box>
                }
                endMessage={
                    <Box
                        display='flex'
                        flexDirection='column'
                        alignItems='center'
                        py={2}
                        sx={{ marginTop: 'auto' }} // Pushes end message to the bottom
                    >
                        <Typography variant='body1' color='textSecondary' fontWeight='bold'>
                            🎉 You have seen all products!
                        </Typography>
                        <Typography variant='body2' color='textSecondary'>
                            No more items to load.
                        </Typography>
                    </Box>
                }
                scrollableTarget='scrollableDiv' // Targets the scrollable div
            >
                <Box
                    display='flex'
                    flexWrap='wrap'
                    justifyContent='center'
                    gap={1.5}
                    padding={1}
                    sx={{ marginTop: 'auto' }} // Pushes end message to the bottom
                >
                    {displayedProducts.map((product, index) => {
                        const imageUrls = JSON.parse(product.image)
                        const keyImage = imageUrls.length > 0 ? imageUrls[0] : ''

                        return (
                            <Card
                                // eslint-disable-next-line react/no-array-index-key
                                key={index}
                                sx={{
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    boxShadow: 'none',
                                    background: '#f8f8f8',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    width: '280px',
                                    flexGrow: 1,
                                    maxWidth: '330px'
                                }}
                            >
                                <Box>
                                    <Typography variant='body1' sx={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                        {product.product_name}{' '}
                                        <Typography
                                            variant='caption'
                                            component='span'
                                            sx={{ fontWeight: 'normal', color: '#777' }}
                                        >
                                            ({product.uid})
                                        </Typography>
                                    </Typography>
                                    <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography variant='h6'>
                                                <b>EAN:</b> {product.ean}
                                            </Typography>
                                            {/* <Typography variant='h6'>
                                            <b>Style Code:</b> {product.styleCodeValue}
                                        </Typography> */}
                                            <Typography variant='h6'>
                                                <b>QTY/Colour:</b> {product.quantity}
                                                {product?.mapped_properties?.colour &&
                                                    `/${product.mapped_properties.colour}`}
                                            </Typography>
                                            {activeTab === 1 && mode === 'Job' && (
                                                <Typography variant='h6'>
                                                    <b>Bin Id:</b> {product?.bin_id}
                                                </Typography>
                                            )}
                                        </Box>
                                        <CardMedia
                                            component='img'
                                            src={keyImage}
                                            alt='Product'
                                            sx={{
                                                width: '80px',
                                                height: '60px',
                                                borderRadius: '8px',
                                                alignSelf: 'center'
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Card>
                        )
                    })}
                </Box>
            </InfiniteScroll>
        </Box>
    )

    const renderFallback = () => (
        <Box sx={{ position: 'relative', top: '200px' }}>
            <Typography sx={{ fontSize: '1rem', color: 'grey.500', marginLeft: 1 }}>...</Typography>
        </Box>
    )

    // eslint-disable-next-line arrow-body-style
    const renderLocationView = () => {
        return (
            <>
                <Box sx={{ display: 'flex', width: '100%', position: 'relative' }}>
                    <Button
                        variant='text'
                        color='primary'
                        sx={{
                            ml: 'auto',
                            textTransform: 'none',
                            px: 2,
                            py: 0,
                            alignSelf: 'flex-end',
                            position: { sm: 'absolute' },
                            top: { xs: 'unset', sm: '-2.75rem' },
                            right: 1
                        }}
                        startIcon={<LocationSearching />}
                        onClick={() => {
                            dispatch(
                                openSnackbar({
                                    open: true,
                                    message: 'Refreshed suggested location!',
                                    variant: 'alert',
                                    alert: { color: 'info', icon: 'info' },
                                    anchorOrigin: { vertical: 'top', horizontal: 'right' },
                                    autoHideDuration: 3000
                                })
                            )
                        }}
                    >
                        Refresh Suggested Locations
                    </Button>
                </Box>
                <Box display='flex' flexWrap='wrap' gap={2} padding={1}>
                    {locations.map((location, index) => (
                        <Card
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                            sx={{
                                padding: '6px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                boxShadow: '0px 0px 1px #171a1f12, 0px 0px 2px #171a1f1F',
                                background: 'linear-gradient(180deg, #FAFAFBFF 0%,rgba(222, 225, 230, 0.61) 100%)',
                                flexGrow: { sm: 'unset', xs: 1 },
                                minWidth: 220
                            }}
                        >
                            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                                Location Code:
                                <Chip
                                    label={location?.locationCode}
                                    size='small'
                                    sx={{
                                        marginLeft: '8px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                />
                            </Typography>
                            <Box display='flex' flexDirection='column' gap={0}>
                                <Box display='flex' justifyContent='space-between'>
                                    <Typography variant='h6' color='textSecondary'>
                                        No. of Products:
                                    </Typography>
                                    <Typography variant='h6'>{location.noOfProducts}</Typography>
                                </Box>
                                <Box display='flex' justifyContent='space-between'>
                                    <Typography variant='h6' color='textSecondary'>
                                        Total Quantity:
                                    </Typography>
                                    <Typography variant='h6'>{location.totalQuantity}</Typography>
                                </Box>
                                <Box display='flex' justifyContent='space-between'>
                                    <Typography variant='h6' color='textSecondary'>
                                        Pending Quantity:
                                    </Typography>
                                    <Typography variant='h6'>{location.pendingQuantity}</Typography>
                                </Box>
                            </Box>
                        </Card>
                    ))}
                </Box>
            </>
        )
    }

    return (
        <Box
            sx={{
                minHeight: '300px',
                border: '1px solid',
                borderColor: 'grey.borderLight',
                borderRadius: '8px',
                paddingBottom: 1,
                boxShadow: 'rgba(17, 17, 26, 0.05) 0px 1px 0px, rgba(17, 17, 26, 0.1) 0px 0px 8px'
            }}
        >
            {/* Tabs Header */}
            <Tabs
                value={validSelectedValue}
                onChange={handleTabChange}
                sx={{
                    marginBottom: '8px',
                    '& .MuiTab-root': tabStyles,
                    '& .MuiTab-textColorPrimary': {
                        color: '#555'
                    },
                    '& .Mui-selected': {
                        color: '#000',
                        fontWeight: 'bold'
                    },
                    backgroundColor: 'grey.bgLight',
                    borderTopRightRadius: '8px',
                    borderTopLeftRadius: '8px',
                    borderBottom: '1px solid',
                    borderColor: 'grey.borderLight'
                }}
            >
                {availableTabs.includes(0) && (
                    <Tab
                        label={
                            <Box display='flex' alignItems='center'>
                                {activeTab === 1 && mode === 'Job' ? 'Bin View' : 'Product View'}
                                <Chip
                                    label={!isModalOpen ? displayedProducts?.length : 0}
                                    size='small'
                                    sx={getChipStyles(selectedView === 0)}
                                />
                            </Box>
                        }
                    />
                )}
                {availableTabs.includes(1) && (
                    <Tab
                        label={
                            <Box display='flex' alignItems='center'>
                                Location View
                                <Chip
                                    label={!isModalOpen ? locations.length : 0}
                                    size='small'
                                    sx={getChipStyles(selectedView === 1)}
                                />
                            </Box>
                        }
                    />
                )}
            </Tabs>

            {/* Render content based on selected view and conditions */}
            {selectedView === 0 && (
                <>
                    {showProductData && (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: { sm: 'space-between' },
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'unset', sm: 'center' }
                            }}
                        >
                            {renderProductAlert()}
                            <TextField
                                value={inputVal}
                                onChange={handleInputChange}
                                placeholder='Search here...'
                                fullWidth
                                sx={{
                                    '& input': {
                                        backgroundColor: '#fff',
                                        padding: '2px 8px',
                                        borderRadius: '4px !important',
                                        borderColor: '#2c2c2c !important'
                                    },
                                    width: '180px',
                                    backgroundColor: '#fff',
                                    '& .MuiInputBase-root.MuiOutlinedInput-root': {
                                        borderRadius: '4px !important',
                                        borderColor: '#2c2c2c !important',
                                        backgroundColor: 'white' // Apply the white background to the root element
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderRadius: '4px !important',
                                        borderColor: '#2c2c2c !important'
                                    },
                                    paddingRight: '8px',
                                    alignSelf: 'end'
                                }}
                                InputProps={{
                                    sx: { height: 30 },
                                    endAdornment: inputVal ? (
                                        <IconButton onClick={handleClearInput} edge='end'>
                                            <Cancel sx={{ color: 'primary.main' }} fontSize='small' />
                                        </IconButton>
                                    ) : (
                                        <Search fontSize='small' />
                                    )
                                }}
                            />
                        </Box>
                    )}
                    {showProductData ? renderProductView() : renderFallback()}
                </>
            )}

            {showLocationData && renderLocationView()}
        </Box>
    )
}

export default TabsComponent
