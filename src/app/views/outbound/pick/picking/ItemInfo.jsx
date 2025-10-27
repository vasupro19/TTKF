/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState, useCallback } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
// eslint-disable-next-line import/no-extraneous-dependencies
import InfiniteScroll from 'react-infinite-scroll-component'
import { useDispatch, useSelector } from 'react-redux'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import { useMarkPnaMutation } from '@/app/store/slices/api/pickListSlice'
import { setRefetchList } from '@/app/store/slices/pickDataSlice'
import { useNavigate } from 'react-router-dom'
import ProductInfoCard from './ProductInfoCard'

// eslint-disable-next-line react/prop-types
function ItemInfo({ items = [], loading = false }) {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const modalType = useSelector(state => state.modal.type)
    const { currentPick, lastScannedItem } = useSelector(state => state.pickData)
    const [markPnaReq] = useMarkPnaMutation()
    const { markPnaReqLKey } = useSelector(state => state.loading)
    const [products, setProducts] = useState([])
    const [displayedProducts, setDisplayedProducts] = useState([])
    const [activeModal, setActiveModal] = useState(null)
    const [pnaSku, setPnaSku] = useState(null)

    const markPna = async () => {
        let isError = false
        let message
        try {
            const {
                data: response,
                error: reqError,
                message: resMessage
            } = await markPnaReq({
                item_id: pnaSku.item_id,
                pick_detail_id: currentPick.pickId,
                storage_bin_id: pnaSku.bin_id,
                lot_no: pnaSku.lot === 'N/A' ? null : pnaSku.lot,
                mfd_date: pnaSku.mfg === 'N/A' ? null : pnaSku.mfg,
                expiry_date: pnaSku.exp === 'N/A' ? null : pnaSku.exp,
                mrp: pnaSku.mrp === 'N/A' ? null : pnaSku.mrp
            }).unwrap()
            if (reqError) throw new Error(reqError?.response?.message || 'unable to mark item pna')
            message = resMessage || response?.message || response?.data?.message || 'Item marked as PNA'
            dispatch(setRefetchList(true))
            setTimeout(() => dispatch(setRefetchList(false)), 300) // change it back to default
            dispatch(closeModal())
        } catch (error) {
            isError = true
            message = error?.data?.message || error?.message || 'unable to mark item pna'
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'info', icon: isError ? 'error' : 'info' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    // Load dummy products on mount
    useEffect(() => {
        // You might place this in the same file or import from a separate file
        // const dummyData = [
        //     {
        //         product_name: 'Apple Watch',
        //         uid: 'UID123',
        //         ean: '12345',
        //         pending_quantity: 2,
        //         mapped_properties: { color: 'Black' },
        //         bin_id: 'BIN1',
        //         image: JSON.stringify([
        //             'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEw2ce40BkWdXvgMffW8BefaU8jogoAzSNDA&s'
        //         ]),
        //         // Back-side fields:
        //         description: 'Stay connected and track your fitness on the go',
        //         styleCodeValue: 'APW123',
        //         exp: 'N/A',
        //         mfg: '01/2023'
        //     },
        //     {
        //         product_name: 'Samsung Galaxy Buds',
        //         uid: 'UID456',
        //         ean: '67890',
        //         pending_quantity: 5,
        //         mapped_properties: { color: 'White' },
        //         bin_id: 'BIN2',
        //         image: JSON.stringify([
        //             'https://d2v5dzhdg4zhx3.cloudfront.net/web-assets/images/storypages/primary/ProductShowcasesampleimages/JPEG/Product+Showcase-1.jpg'
        //         ]),
        //         description:
        //             'High-quality sound with a comfortable, secure fit for all-day wear and use on the go or at home lorem ipsum dolor sit amet consectetur adipiscing elit',
        //         styleCodeValue: 'SGB456',
        //         exp: 'N/A',
        //         mfg: '02/2023'
        //     },
        //     {
        //         product_name: 'Dell Laptop',
        //         uid: 'UID789',
        //         ean: '24680',
        //         pending_quantity: 3,
        //         mapped_properties: { color: 'Silver' },
        //         bin_id: 'BIN3',
        //         image: JSON.stringify([
        //             'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIIsJinPnNkl4kxJzB1JcyN7YFs3HEPephow&s'
        //         ]),
        //         description: 'Reliable performance and sleek design for everyday tasks',
        //         styleCodeValue: 'DELL789',
        //         exp: 'N/A',
        //         mfg: '05/2023'
        //     },
        //     {
        //         product_name: 'Logitech Mouse',
        //         uid: 'UID987',
        //         ean: '13579',
        //         pending_quantity: 10,
        //         mapped_properties: { color: 'Black' },
        //         bin_id: 'BIN4',
        //         image: JSON.stringify([
        //             'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrGzgTUa2PIb659GKcGioXL4k5FGKeQi3gwA&s'
        //         ]),
        //         description: 'Wireless mouse with ergonomic design for comfort',
        //         styleCodeValue: 'LOGI987',
        //         exp: 'N/A',
        //         mfg: '03/2023'
        //     },
        //     {
        //         product_name: 'Sony Headphones',
        //         uid: 'UID654',
        //         ean: '112233',
        //         pending_quantity: 4,
        //         mapped_properties: { color: 'Blue' },
        //         bin_id: 'BIN5',
        //         image: JSON.stringify([
        //             'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRp1Ig4zLvzlL4R7cFkXz-RY8Su0qg8MHe7A&s'
        //         ]),
        //         description: 'Noise-cancelling headphones for immersive audio',
        //         styleCodeValue: 'SONY654',
        //         exp: 'N/A',
        //         mfg: '04/2023'
        //     },
        //     {
        //         product_name: 'Kindle Paperwhite',
        //         uid: 'UID321',
        //         ean: '445566',
        //         pending_quantity: 1,
        //         mapped_properties: { color: 'Black' },
        //         bin_id: 'BIN6',
        //         image: JSON.stringify([
        //             'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpHcMyKryMtImb4aivMQO0NIHkjKZGaghLgg&s'
        //         ]),
        //         description: 'Read your favorite books on the go with an e-ink display',
        //         styleCodeValue: 'KIND321',
        //         exp: 'N/A',
        //         mfg: '06/2023'
        //     }
        // ]
        const tempItems = items.map(item => ({
            product_name: item.description || '-',
            uid: item?.uid || '-',
            ean: item?.item_no || '-',
            pending_quantity: item?.pending_qty || 0,
            mapped_properties: { color: 'Black' },
            bin_no: item?.bin_no || '-',
            bin_id: item?.bin_id || '-',
            image: item?.image || '["https://placehold.co/600x400"]',
            // Back-side fields:
            description: item?.description_2,
            styleCodeValue: 'APW123',
            exp: item?.expiry_date || 'N/A',
            mfg: item?.mfd_date || 'N/A',
            lot: item?.lot_no || 'N/A',
            item_id: item?.item_id || 'N/A',
            mrp: item?.mrp || 'N/A'
        }))
        if (tempItems && tempItems.length) {
            setProducts(tempItems)
        }
        // Set all products and display first 2 initially
        // setProducts(dummyData)
        setDisplayedProducts(tempItems.slice(0, 12))
    }, [items])

    // Handler for loading more products (Infinite Scroll)
    const loadMoreProducts = useCallback(() => {
        const currentLength = displayedProducts.length
        const moreProducts = products.slice(currentLength, currentLength + 2)
        // remove SetTimeout after api integration
        setTimeout(() => {
            setDisplayedProducts(prev => [...prev, ...moreProducts])
        }, 1000)
    }, [displayedProducts, products])

    useEffect(() => {
        // TODO: try to find an optimal solution if possible
        if (products && products.length) {
            const tempItems = [...products]
            let foundIndex
            let foundQuantity
            for (let i = 0; i < products.length; i += 1) {
                if (
                    tempItems[i].mrp === lastScannedItem.mrp &&
                    tempItems[i].lot === lastScannedItem.lot &&
                    tempItems[i].mfg === lastScannedItem.mfd &&
                    tempItems[i].ean === lastScannedItem.ean
                ) {
                    const qty = parseInt(tempItems[i].pending_quantity, 10)
                    foundQuantity = qty > 0 ? qty - 1 : 0
                    tempItems[i].pending_quantity = foundQuantity
                    foundIndex = i
                    break
                }
            }
            setProducts(
                foundIndex >= 0 && foundQuantity < 1
                    ? [...tempItems.slice(0, foundIndex), ...tempItems.slice(foundIndex + 1)]
                    : [...tempItems]
            )
            if (foundIndex >= 0 && foundQuantity < 1 && tempItems.length === 1)
                navigate(`/outbound/pickList/pick/zones/${currentPick.pickId}`)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastScannedItem])

    useEffect(() => {
        if (currentPick.pendingQuantity < 1) navigate(`/outbound/pickList/pick`)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPick])

    // Render the list of products
    const renderProductView = () => (
        <Box
            sx={{
                height: { xs: '60vh', sm: '20rem' }, // Fixed height for scrolling
                overflowY: 'auto', // Enables vertical scrolling
                display: 'flex',
                flexDirection: 'column',
                '&::-webkit-scrollbar': {
                    display: 'none' // Hide scrollbar for Chrome, Safari, and newer Edge
                },
                msOverflowStyle: 'none', // Hide scrollbar for IE and Edge
                scrollbarWidth: 'none', // Hide scrollbar for Firefox
                ...(loading && {
                    justifyContent: 'center',
                    alignItems: 'center'
                })
            }}
            id='scrollableDiv'
        >
            {loading && <CircularProgress color='success' size={25} />}
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
                            You have seen all products!
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
                    {displayedProducts.map((product, index) => (
                        <ProductInfoCard
                            product={product}
                            key={index}
                            handleMarkAsPNA={selectedProduct => {
                                setPnaSku({ ...selectedProduct })
                                setActiveModal('markAsPNA')
                                dispatch(
                                    openModal({
                                        type: 'confirm_modal'
                                    })
                                )
                            }}
                        />
                    ))}
                </Box>
            </InfiniteScroll>
        </Box>
    )

    return (
        <Box
            sx={{
                minHeight: '300px',
                border: '1px solid',
                borderColor: 'grey.borderLight',
                borderRadius: '8px',
                boxShadow: 'rgba(17, 17, 26, 0.05) 0px 1px 0px, rgba(17, 17, 26, 0.1) 0px 0px 8px',
                backgroundColor: 'grey.bgLighter',
                flexGrow: 1,
                padding: 0.5
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 'bold',
                    p: 1,
                    borderBottom: '1px solid',
                    borderColor: 'grey.300'
                }}
            >
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    Item Info
                </Typography>
            </Box>
            {renderProductView()}
            {modalType === 'confirm_modal' &&
                (activeModal === 'markAsPNA' ? (
                    <ConfirmModal
                        title='Mark As PNA'
                        message={
                            markPnaReqLKey
                                ? 'Marking items PNA. Please Wait'
                                : 'Mark as PNA? All bin items will be affected.'
                        }
                        icon={markPnaReqLKey ? 'info' : 'warning'}
                        confirmText='Confirm'
                        cancelText='Cancel'
                        customStyle={{ width: { xs: '320px', sm: '480px' } }}
                        onCancel={() => {
                            // Your confirm logic here
                            if (!markPnaReqLKey) dispatch(closeModal())
                        }}
                        onConfirm={markPna}
                        btnContainerSx={{
                            flexDirection: 'row-reverse',
                            gap: 1,
                            justifyContent: 'end'
                        }}
                        isLoading={markPnaReqLKey}
                        closeOnBackdropClick={!markPnaReqLKey}
                    />
                ) : null)}
        </Box>
    )
}

export default ItemInfo
