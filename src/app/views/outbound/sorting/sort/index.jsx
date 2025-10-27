/* eslint-disable no-nested-ternary */
import { Box, Divider, Grid, Typography } from '@mui/material'
import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { QrCode } from '@mui/icons-material'
import { z } from 'zod'

// Components
import CustomButton from '@/core/components/extended/CustomButton'
import TitleModalWrapper from '@/core/components/TitleModalWrapper'
import ScannableInputForm from '@/core/components/ScannableInputForm'
import ItemDetailsHCard from '@/core/components/ItemDetailsHCard'
import MainCard from '@/core/components/extended/MainCard'

// Icons
import AmazonColorIcon from '@/assets/icons/channel/AmazonColorIcon'
import MyntraColorIcon from '@/assets/icons/channel/MyntraColorIcon'
import ShopifyColorIcon from '@/assets/icons/channel/ShopifyColorIcon'
import flipkartColorIcon from '@/assets/icons/channel/flipkartColorIcon.svg'

// Redux actions
import { openSnackbar } from '@/app/store/slices/snackbar'
import PigeonholeIcon from '@/assets/icons/PigeonholeIcon'
import NotesInstructions from '@/core/components/NotesInstructions'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { openModal } from '@/app/store/slices/modalSlice'
import { validateUID, useScanAndValidatePutwallMutation } from '@/app/store/slices/api/sortingSlice'

const notes = [
    {
        id: 'n1',
        text: 'Scan the UID (barcode) of the item to begin processing.'
    },
    {
        id: 'n2',
        text: 'For single-item orders: No sorting required - proceed directly to packing after scanning.'
    },
    {
        id: 'n3',
        text: 'For multi-item orders: After scanning an item, scan the putwall ID. The system will show a suggested putwall ID only when an item from the same order is already assigned to a putwall.'
    },
    {
        id: 'n4',
        text: 'Monitor order information: Order No, Channel, Order Qty, Sorted Qty, and Pending Qty.'
    },
    {
        id: 'n5',
        text: 'Review item details displayed on the right side of the screen.'
    },
    {
        id: 'n6',
        text: 'Check "Last Sorted" information to verify your most recent action.'
    },
    {
        id: 'n7',
        text: 'Continue scanning items until all items in the order are processed.'
    }
]

// Constants
const CHANNEL_ICONS = {
    Amazon: <AmazonColorIcon />,
    Myntra: <MyntraColorIcon />,
    Shopify: <ShopifyColorIcon />,
    Flipkart: <img src={flipkartColorIcon} alt='Flipkart' style={{ height: 18, width: 18 }} />
}

const UID_VALIDATION_SCHEMA = z.object({
    uid: z.string().trim().min(1, 'UID is required').max(20, { message: 'UID must be at most 20 characters' })
})

const PUTWALL_VALIDATION_SCHEMA = z.object({
    putwallId: z
        .string()
        .trim()
        .min(1, 'Putwall ID is required')
        .max(20, { message: 'Putwall ID must be at most 20 characters' })
})

export default function Sort() {
    const dispatch = useDispatch()

    // Refs
    const uidInputRef = useRef(null)
    const putwallIdInputRef = useRef(null)
    const suggestedPutwallIdInputRef = useRef(null)

    const [scanAndValidatePutwall] = useScanAndValidatePutwallMutation()

    // State
    const { validateSortingUIDLKey, scanPutwallLKEY } = useSelector(state => state.loading)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeModal, setActiveModal] = useState(null)
    const [isAllVerified, setIsAllVerified] = useState(false)
    const [updateUIDInput, setUpdateUIDInput] = useState(false)
    const [lastSortedData, setLastSortedData] = useState({
        orderNo: '',
        peigonholeId: ''
    })
    const [suggestedPutwall, setSuggestedPutwall] = useState('')
    const [scannedUID, setScannedUID] = useState(null)
    const [orderData, setOrderData] = useState({
        orderNo: '',
        channel: '',
        orderQty: 0,
        sortedQty: 0,
        pendingQty: 0
    })
    const [skuData, setSkuData] = useState(null)

    // Memoized values
    const infoItems = useMemo(
        () => [
            {
                label: 'Order No:',
                value: orderData.orderNo,
                valueVariant: 'h5',
                valueColor: 'primary.800'
            },
            {
                label: 'Channel:',
                value: orderData.channel,
                valueVariant: 'h5',
                valueColor: 'primary.800',
                icon: CHANNEL_ICONS[orderData.channel]
            },
            {
                label: 'Order Qty:',
                value: orderData.orderQty,
                valueVariant: 'h3',
                valueColor: 'primary.800'
            },
            {
                label: 'Sorted Qty:',
                value: orderData.sortedQty,
                valueVariant: 'h3',
                valueColor: 'secondary.main'
            },
            {
                label: 'Pending Qty:',
                value: orderData.pendingQty,
                valueVariant: 'h3',
                valueColor: 'error.main'
            }
        ],
        [orderData]
    )

    // Focus UID input on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            uidInputRef.current?.focus()
        }, 100)
        return () => clearTimeout(timer)
    }, [])

    // Focus putwall input when modal opens
    // eslint-disable-next-line consistent-return
    useEffect(() => {
        if (activeModal === 'showPutwall' && isModalOpen) {
            const timer = setTimeout(() => {
                putwallIdInputRef.current?.focus()
            }, 100)
            return () => clearTimeout(timer)
        }
        if (activeModal === 'showSuggestedPutwall' && isModalOpen) {
            const timer = setTimeout(() => {
                suggestedPutwallIdInputRef.current?.focus()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [activeModal, isModalOpen])

    // Callbacks
    const handleUIDSubmit = useCallback(
        // eslint-disable-next-line no-unused-vars
        async (values, { resetForm }) => {
            try {
                if (!values?.uid) throw new Error('invalid uid scanned!')
                setScannedUID(values?.uid)
                const { data, error: reqError } = await dispatch(validateUID.initiate(values?.uid))

                if (reqError) throw new Error(reqError?.data?.message || reqError?.message || 'invalid uid scanned')
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Item Scanned',
                        variant: 'alert',
                        alert: { color: 'info', icon: 'info' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' },
                        autoHideDuration: 1000
                    })
                )
                const { pickItem, putwall } = data.data

                if (pickItem) {
                    setOrderData({
                        orderNo: pickItem?.order_no,
                        channel: pickItem?.channel,
                        orderQty: pickItem?.picked_order_quantity || putwall?.expected_quantity,
                        sortedQty: putwall?.sorted_quantity || 0,
                        pendingQty: (putwall?.expected_quantity || 0) - (putwall?.sorted_quantity || 0)
                    })

                    setSkuData({
                        item_properties: {
                            'SKU Name': pickItem?.description,
                            EAN: pickItem?.item_no,
                            // 'Style Code': 'UC1128',
                            // Colour: 'Purple',
                            // Brand: 'UC',
                            // Size: 'XL',
                            Description: pickItem?.description_2
                        },
                        image: pickItem?.image || []
                    })
                }

                if (pickItem?.picked_order_quantity && parseInt(pickItem?.picked_order_quantity, 10) > 1) {
                    setIsModalOpen(true)
                    if (putwall && putwall.id) {
                        setSuggestedPutwall(putwall?.code)
                        setActiveModal('showSuggestedPutwall')
                    } else {
                        setSuggestedPutwall('')
                        setActiveModal('showPutwall') // show this conditionally
                    }

                    setIsAllVerified(true)
                } else {
                    setIsAllVerified(true)
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: 'This is a single Item order! start Packing',
                            variant: 'alert',
                            alert: { color: 'info', icon: 'info' },
                            anchorOrigin: { vertical: 'top', horizontal: 'center' },
                            autoHideDuration: 3000
                        })
                    )
                }
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: error?.data?.message || error?.message || 'something went wrong!',
                        variant: 'alert',
                        alert: { color: 'error', icon: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' },
                        autoHideDuration: 3000
                    })
                )
                setUpdateUIDInput(prev => !prev)
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const handlePutwallSubmit = useCallback(
        async (values, { resetForm }) => {
            try {
                await scanAndValidatePutwall({
                    uid: scannedUID,
                    putwall: values.putwallId
                }).unwrap()

                resetForm()
                setUpdateUIDInput(prev => !prev)
                setIsModalOpen(false)
                setActiveModal(null)
                setIsAllVerified(false)

                dispatch(
                    openSnackbar({
                        open: true,
                        message: `Successfully assigned to putwall # ${values.putwallId}`,
                        variant: 'alert',
                        alert: { color: 'success', icon: 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' },
                        autoHideDuration: 3000
                    })
                )
                setScannedUID(null)
                setLastSortedData({
                    orderNo: orderData.orderNo,
                    peigonholeId: values.putwallId
                })

                setTimeout(() => {
                    uidInputRef.current?.focus()
                }, 100)
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: error?.data.message || error?.message || 'unable to verify putwall id',
                        variant: 'alert',
                        alert: { color: 'error', icon: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' },
                        autoHideDuration: 3000
                    })
                )
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        [scannedUID]
    )

    const openPutwallModal = useCallback(() => {
        setIsModalOpen(true)
        // setActiveModal('showPutwall')
        setActiveModal('showSuggestedPutwall')
    }, [])

    // Render helper functions
    const renderLastSortedInfo = () => {
        if (!lastSortedData.orderNo || !lastSortedData.peigonholeId) return null

        return (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant='body2' color='text.secondary'>
                    Last Sorted:
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Order: #{lastSortedData.orderNo}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Peigonhole: {lastSortedData.peigonholeId}
                </Typography>
            </Box>
        )
    }

    useEffect(() => {
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
    })

    return (
        <MainCard content={false} sx={{ marginTop: 1, borderRadius: 1 }}>
            <Box
                sx={{
                    borderRadius: 2,
                    padding: 1,
                    height: 'auto',
                    border: '1.5px solid #e3e3e3',
                    minHeight: '88vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header section with last sorted info and putwall button */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent:
                            lastSortedData.orderNo && lastSortedData.peigonholeId ? 'space-between' : 'flex-end',
                        alignItems: { xs: 'flex-end', sm: 'center' },
                        mb: 1,
                        flexDirection: { xs: 'column', sm: 'row' }
                    }}
                >
                    {renderLastSortedInfo()}
                    {isAllVerified && orderData?.orderQty > 1 && (
                        <CustomButton
                            variant='outlined'
                            clickable
                            customStyles={{ height: '30px' }}
                            startIcon={<QrCode />}
                            onClick={openPutwallModal}
                        >
                            Scan Putwall ID
                        </CustomButton>
                    )}
                </Box>

                {/* Main content grid */}
                <Grid container spacing={2}>
                    {/* Left column - UID input and order info */}
                    <Grid item xs={12} md={5.5} sx={{ display: 'flex', flexDirection: 'column', height: 'auto' }}>
                        <ScannableInputForm
                            initialValues={{ uid: '' }}
                            validationSchema={UID_VALIDATION_SCHEMA}
                            handleSubmit={handleUIDSubmit}
                            fields={[
                                {
                                    name: 'uid',
                                    label: 'Scan UID*',
                                    placeholder: 'Scan or type & hit enter',
                                    ref: uidInputRef,
                                    outerLabelSx: { fontWeight: 'bold' },
                                    animateGlow: true,
                                    isVerified: isAllVerified,
                                    isDisabled: isAllVerified
                                }
                            ]}
                            scannerEnabled
                            showSubmitButton={false}
                            gridProps={{ container: true }}
                            animateGlow
                            key={updateUIDInput}
                            loading={validateSortingUIDLKey}
                        />

                        {/* Order information box */}
                        <Box
                            sx={{
                                p: 1,
                                flex: 1,
                                height: '100%',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'grey.borderLight',
                                display: 'flex',
                                gap: 0.5,
                                flexDirection: 'column',
                                flexGrow: 1
                            }}
                        >
                            {infoItems.map(item => (
                                <Typography
                                    key={`info-item-${item.label}`}
                                    variant='body1'
                                    fontWeight={500}
                                    sx={{ color: 'primary.800', display: 'flex', alignItems: 'center' }}
                                >
                                    {item.label}
                                    <Typography
                                        component='span'
                                        variant={item.valueVariant}
                                        sx={{
                                            fontWeight: 700,
                                            ml: 1,
                                            color: item.valueColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: item.icon ? 0.5 : 0
                                        }}
                                    >
                                        {item.icon}
                                        {item.value}
                                    </Typography>
                                </Typography>
                            ))}
                        </Box>
                    </Grid>

                    {/* Right column - Item details */}
                    <Grid item xs={12} md={6.5}>
                        <ItemDetailsHCard skuData={skuData} />
                    </Grid>
                    <Grid item xs={12} md={6} lg={12}>
                        <Divider
                            sx={{
                                borderColor: '#BCC1CA',
                                marginBottom: '1rem',
                                boxShadow: '1px 1px 4px #00000054'
                            }}
                        />
                        <NotesInstructions notes={notes} customFontSize='14px' />
                    </Grid>
                </Grid>

                {/* Putwall Modal */}
                {activeModal === 'showPutwall' ? (
                    <TitleModalWrapper
                        title='Scan Any Putwall ID'
                        isOpen={isModalOpen}
                        setIsOpen={setIsModalOpen}
                        boxContainerSx={{
                            width: { xs: '340px', sm: '400px' }
                        }}
                    >
                        <ScannableInputForm
                            initialValues={{ putwallId: '' }}
                            validationSchema={PUTWALL_VALIDATION_SCHEMA}
                            handleSubmit={handlePutwallSubmit}
                            fields={[
                                {
                                    name: 'putwallId',
                                    label: 'Putwall ID*',
                                    placeholder: 'scan or enter',
                                    ref: putwallIdInputRef
                                }
                            ]}
                            scannerEnabled={false}
                            submitButtonText='Assign'
                            gridProps={{ container: true }}
                            loading={scanPutwallLKEY}
                        />
                    </TitleModalWrapper>
                ) : activeModal === 'showSuggestedPutwall' ? (
                    <TitleModalWrapper
                        title={
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    mr: '6%',
                                    mb: 0.5
                                }}
                            >
                                <Typography variant='h4'>Scan Putwall</Typography>
                                <Box>
                                    <Typography
                                        variant='h4'
                                        sx={{
                                            color: 'secondary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        <PigeonholeIcon />
                                        {suggestedPutwall}
                                    </Typography>
                                </Box>
                            </Box>
                        }
                        isOpen={isModalOpen}
                        setIsOpen={setIsModalOpen}
                        boxContainerSx={{
                            width: { xs: '340px', sm: '480px' }
                        }}
                    >
                        <ScannableInputForm
                            initialValues={{ putwallId: '' }}
                            validationSchema={PUTWALL_VALIDATION_SCHEMA}
                            handleSubmit={handlePutwallSubmit}
                            fields={[
                                {
                                    name: 'putwallId',
                                    label: 'Putwall ID*',
                                    placeholder: 'scan or enter',
                                    ref: suggestedPutwallIdInputRef
                                }
                            ]}
                            scannerEnabled={false}
                            submitButtonText='Submit'
                            gridProps={{ container: true }}
                            footerMessage='Scan the suggested putwall ID'
                        />
                    </TitleModalWrapper>
                ) : activeModal === 'goToPackingTable' ? (
                    <ConfirmModal
                        message='Please go to Table "TBL-103" and start packing for Order "ORD-54231".'
                        title='Go to Packing Table'
                        showConfirmButton={false}
                        cancelText='Close'
                    />
                ) : null}
            </Box>
        </MainCard>
    )
}
