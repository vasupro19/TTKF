/* eslint-disable no-nested-ternary */
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Box, Divider, Grid, IconButton, Typography } from '@mui/material'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import CustomButton from '@/core/components/extended/CustomButton'
import TitleModalWrapper from '@/core/components/TitleModalWrapper'
import ScannableInputForm from '@/core/components/ScannableInputForm'
import KeyboardButton from '@/core/components/keyboardButton'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import CustomTabsGroupedBtns from '@/core/components/extended/CustomTabsGroupedBtns'
import StatusBadge from '@/core/components/StatusBadge'
import B2BPackItemTable from '@/app/views/tables/pack/b2bPackItems'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { maskItemId, handleQRGeneration } from '@/utilities'
import PackIcon from '@/assets/icons/PackIcon'
import { z } from 'zod'
import { Cached, Print, RemoveCircleOutline, Shortcut } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { openModal } from '@/app/store/slices/modalSlice'
import { resetPacking, setBoxId } from '@/app/store/slices/b2bPackingSlice'
import {
    scanPackItem,
    useClosePackBoxMutation,
    useClosePackMutation,
    useRemovePackItemMutation,
    getConfig
} from '@/app/store/slices/api/packSlice'
import BoxSpecificationModal from './BoxSpecificationModal'
import WeightDimensionModal from './WeightDimensionModal'

export default function B2BPackingMain() {
    const dispatch = useDispatch()

    const { packId, boxId: boxid } = useParams()
    const [searchParams] = useSearchParams()
    const orderDetailId = searchParams.get('order_detail_id')
    const { pathname } = useLocation()
    const isEditPage = pathname.includes('/edit/')
    const navigate = useNavigate()

    const [closePackBox] = useClosePackBoxMutation()
    const [closePack] = useClosePackMutation()
    const [removePackItem] = useRemovePackItemMutation()

    const { tableId, scannedOrderId, boxId } = useSelector(state => state.b2bPacking)
    const { scanPackItemLKey, closePackBoxLKey, removePackItemLKey } = useSelector(state => state.loading)
    const { user } = useSelector(state => state.auth)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeModal, setActiveModal] = useState(null)
    const [scannedUIDs, setScannedUIDs] = useState([])
    const [removedItemId, setRemoveItemId] = useState(null)
    const [orderData, setOrderData] = useState({})
    const [config, setConfig] = useState(null)

    // using states for just conditionally rendering UI later could be replaced with api response
    const [isAllVerified, setIsAllVerified] = useState(false)

    const [updateUIDInput, setUpdateUIDInput] = useState(false) // to rerender UID input
    const [tabVal, setTabVal] = useState(0)
    const [boxCloseLoading, setBoxCloseLoading] = useState(false)
    const [boxCloseData, setBoxCloseData] = useState({})
    const [refetchItems, setRefetchItems] = useState(false)

    const itemIdRef = useRef(null)
    const pickBoxIdRef = useRef(null)
    const removeItemIdRef = useRef(null)
    const confirmBoxIdRef = useRef(null)
    const boxIdRef = useRef(null)

    const handleStartPackOpen = () => {
        setIsModalOpen(true)
        setActiveModal('weightDimension')
    }

    // Handler for switching between tabs
    const handleTypeChange = newType => {
        if (newType !== null) {
            setTabVal(newType)
        }
    }

    const handleScan = async data => {
        let isError = false
        let message

        try {
            const { data: response } = await dispatch(scanPackItem.initiate(data))

            if (!response || !response?.data) throw new Error('invalid aur already packed item scanned!')

            const { packDetail } = response.data
            setOrderData(packDetail || {})
            itemIdRef.current?.focus()
            message = 'Item Scanned'
            setRefetchItems(true)
            setTimeout(() => setRefetchItems(false), 600)

            if (packDetail.total_quantity > 1) {
                setScannedUIDs(prev => [...prev, data?.uid])
            } else if (packDetail.total_quantity === 1) {
                setScannedUIDs([data?.uid])
                setIsAllVerified(true)
                setIsModalOpen(true)
                setActiveModal('weightDimension')
            }
        } catch (error) {
            isError = true
            message = error.message
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: {
                        color: isError ? 'error' : 'info',
                        icon: isError ? 'error' : 'info'
                    },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' },
                    autoHideDuration: 1000
                })
            )
            console.log(' <----> finally block <----> ', itemIdRef)
            if (itemIdRef.current) itemIdRef.current.value = ''
        }
    }

    const handleBoxClose = async resetForm => {
        let isError = false
        let message
        try {
            await closePackBox({
                ...structuredClone(boxCloseData),
                pack_detail_id: orderData?.id,
                order_detail_id: orderData?.order_detail_id,
                box_no: boxId
            }).unwrap()

            const boxIdArray = boxId ? boxId.split('-') : boxId
            let revisedBoxId = ''

            boxIdArray.forEach((item, index) => {
                if (index === boxIdArray.length - 1) revisedBoxId += `${parseInt(item, 10) + 1}`
                else if (index === boxIdArray.length - 2) revisedBoxId += `${user?.id || item}-`
                else revisedBoxId += `${item}-`
            })
            dispatch(setBoxId(revisedBoxId))
            // generate box label
            await handleQRGeneration([revisedBoxId], `box_${revisedBoxId}_label`)

            // setActiveModal(null)
            // setIsModalOpen(false)
            resetForm()

            if (!isEditPage) {
                setBoxCloseLoading(false)
                setIsModalOpen(true)
                setActiveModal('scanBoxID')
            } else {
                // dispatch(
                //     openSnackbar({
                //         open: true,
                //         message: 'Updated Successfully',
                //         variant: 'alert',
                //         alert: { color: 'success' },
                //         anchorOrigin: { vertical: 'top', horizontal: 'center' }
                //     })
                // )
                message = 'Updated Successfully'
                navigate(`/outbound/pack/B2B/view/${packId}`)
            }
        } catch (error) {
            isError = true
            message = error?.message || 'unable to close the box'
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: {
                        color: isError ? 'error' : 'info',
                        icon: isError ? 'error' : 'info'
                    },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' },
                    autoHideDuration: 1000
                })
            )
        }
    }

    const handlePackClose = async (data, resetForm) => {
        let isError = false
        let message
        try {
            if (!data.awbNo) throw new Error('invalid awb')
            // eslint-disable-next-line no-console
            console.log('handle close pack : ', data)

            const response = await closePack({
                ...data,
                pack_id: orderData.id,
                packaging_material: ''
            }).unwrap()
            message = response?.message || 'pack closed successfully!'

            resetForm()
            setIsModalOpen(false)
            setActiveModal(null)
            setBoxCloseData({})
            setOrderData({})
            setScannedUIDs([])
            dispatch(setBoxId(''))

            if (!isEditPage) {
                // dispatch(
                //     openSnackbar({
                //         open: true,
                //         message: 'Packed Successfully',
                //         variant: 'alert',
                //         alert: { color: 'success' },
                //         anchorOrigin: { vertical: 'top', horizontal: 'center' }
                //     })
                // )
                message = 'Packed Successfully'
                dispatch(
                    resetPacking({
                        currentStep: 'SCAN_ORDER',
                        tableId
                    })
                )
            } else {
                // dispatch(
                //     openSnackbar({
                //         open: true,
                //         message: 'Updated Successfully',
                //         variant: 'alert',
                //         alert: { color: 'success' },
                //         anchorOrigin: { vertical: 'top', horizontal: 'center' },
                //         autoHideDuration: 1000
                //     })
                // )
                message = 'Updated Successfully'
                navigate(`/outbound/pack/B2B/view/${packId}`)
            }
            return true
        } catch (error) {
            isError = true
            return false
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success', icon: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' },
                    autoHideDuration: 3000
                })
            )
        }
    }

    const handleRemove = async uid => {
        let isError = false
        let message
        try {
            await removePackItem({ uid, packDetailId: orderData.id, type: 'b2b' }).unwrap()

            message = 'Item removed successfully'
            setRefetchItems(true)
            setTimeout(() => setRefetchItems(false), 600)

            setRemoveItemId(uid) // if no Item in items table this button will be disabled
            setActiveModal(null)
            setIsModalOpen(false)
            // Perform any additional actions with the scanned UID here
        } catch (error) {
            isError = true
            message = error?.data?.data?.message || error?.data?.message || error?.message || 'unable to remove item'
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success', icon: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' },
                    autoHideDuration: 3000
                })
            )
        }
    }

    const handleRePrint = async () => {
        await handleQRGeneration([boxId], `box_${boxId}_label`)
        dispatch(
            openSnackbar({
                open: true,
                message: (
                    <Typography display='flex' alignItems='center'>
                        <Print /> &nbsp;&nbsp; Reprinted successfully
                    </Typography>
                ),
                variant: 'alert',
                alert: { color: 'info', icon: 'info' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' },
                autoHideDuration: 3000
            })
        )
    }

    // this will stop rerendering of RenderToolBarElement
    const RenderToolBarElement = useCallback(
        () => (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                    gap: 1
                }}
            >
                {/* this button should be hidden when no data in table */}
                <CustomButton
                    variant='outlined'
                    customStyles={{
                        color: 'error.main',
                        border: 'error.main',
                        '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' },
                        height: 30
                    }}
                    startIcon={<RemoveCircleOutline />}
                    onClick={() => {
                        setIsModalOpen(true)
                        setActiveModal('removeItem')
                    }}
                    disabled={!config?.allowRemoveItems}
                >
                    Scan To Remove
                </CustomButton>
            </Box>
        ),
        [config]
    )

    useEffect(() => {
        ;(async () => {
            try {
                const { data } = await dispatch(getConfig.initiate())
                const requiredKeys = {
                    askPackagingMaterialFor: '',
                    selectedChannels: '',
                    askForWeight: false,
                    useWeighingMachineFor: '',
                    autoWeightMode: '',
                    allowRemoveItems: false,
                    courierMandatoryForB2B: false,
                    askBoxSpecificationsB2B: false,
                    allowPartialPacking: false,
                    length: '',
                    breadth: '',
                    height: '',
                    unit: ''
                }

                // eslint-disable-next-line prefer-const
                let newConfig = {}

                if (data?.data && data?.data?.length) {
                    data.data.map(item => {
                        if (['length', 'breadth', 'height', 'unit'].includes(item.key)) {
                            newConfig.packageDimensions = {
                                ...(newConfig.packageDimensions ? newConfig.packageDimensions : {})
                            }
                            // eslint-disable-next-line dot-notation
                            newConfig.packageDimensions[item.key] = item.value
                        } else if (item.key === 'selectedChannels')
                            newConfig[item.key] = item.value
                                ? item.value
                                      .split(', ')
                                      .map(str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase())
                                : []
                        else
                            newConfig[item.key] =
                                typeof requiredKeys[item.key] === 'boolean' ? !!item.value : item.value
                        return item.key
                    })
                }
                setConfig(Object.keys(newConfig).length ? newConfig : null)
            } catch (error) {
                console.log('config fetch error pack ', error)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        setUpdateUIDInput(prev => !prev)

        if (activeModal === 'removeItem') {
            setTimeout(() => {
                removeItemIdRef.current?.focus()
            }, 100)
            return
        }
        if (activeModal === 'scanBoxID') {
            setTimeout(() => {
                boxIdRef.current?.focus()
            }, 100)
            return
        }
        if (activeModal === 'confirmBoxID') {
            setTimeout(() => {
                confirmBoxIdRef.current?.focus()
            }, 100)
            return
        }
        if (tabVal === 0) {
            setTimeout(() => {
                itemIdRef?.current?.focus()
            }, 100)
        } else if (tabVal === 1) {
            setTimeout(() => {
                pickBoxIdRef?.current?.focus()
            }, 100)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeModal, isModalOpen, tabVal])

    // use keyboard shortcut
    useKeyboardShortcut('Alt+P', () => {
        if (boxCloseLoading || isModalOpen || isEditPage) return
        if (!scannedUIDs || scannedUIDs?.length <= 0) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Nothing to pack yet',
                    variant: 'alert',
                    alert: { color: 'warning', icon: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' },
                    autoHideDuration: 1000
                })
            )
            return
        }
        handleStartPackOpen()
    })

    useKeyboardShortcut('Alt+B', () => {
        if (boxCloseLoading || isModalOpen) return
        if (!scannedUIDs || scannedUIDs?.length <= 0) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Nothing to pack yet',
                    variant: 'alert',
                    alert: { color: 'warning', icon: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' },
                    autoHideDuration: 1000
                })
            )
            return
        }
        setIsModalOpen(true)
        setActiveModal('boxSpecificationModal')
    })

    useEffect(() => {
        setTimeout(() => {
            itemIdRef.current?.focus()
        }, 100)
    }, [])

    useEffect(() => {
        if (
            parseInt(orderData.total_quantity, 10) > 1 &&
            parseInt(orderData.total_quantity, 10) - parseInt(orderData.picked_quantity, 10) < 1
        ) {
            setIsModalOpen(true)
            setActiveModal('weightDimension')
            setIsAllVerified(true)
        }
    }, [orderData])

    return (
        <Box sx={{ width: '100%', height: '100%', padding: { xs: 0.5, sm: 0 } }}>
            <Grid container>
                <Box
                    sx={{
                        display: { xs: 'flex', md: 'none' },
                        justifyContent: 'flex-start',
                        alignItems: 'baseline',
                        width: '100%',
                        flexDirection: 'column'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        {orderData?.total_quantity > 1 && scannedOrderId?.length > 1 && (
                            <Typography
                                variant='body1'
                                sx={{ display: 'flex', alignItems: 'center', color: 'primary.800' }}
                            >
                                Order:{' '}
                                <Typography variant='subtitle1' component='span' sx={{ color: 'primary.main', ml: 1 }}>
                                    {scannedOrderId}
                                </Typography>
                            </Typography>
                        )}

                        <Typography
                            variant='body1'
                            sx={{ display: 'flex', alignItems: 'center', color: 'primary.800' }}
                        >
                            Box:{' '}
                            <Typography variant='subtitle1' component='span' sx={{ color: 'primary.main', ml: 1 }}>
                                {boxId}
                            </Typography>
                            <IconButton sx={{ color: 'blue.main' }} onClick={handleRePrint}>
                                <Cached />
                            </IconButton>
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant='h4' sx={{ display: 'flex', alignItems: 'center', color: 'primary.800' }}>
                            Order QTY:{' '}
                            <Typography
                                variant='h3'
                                component='span'
                                sx={{ display: 'block', color: 'primary.main', ml: 1 }}
                            >
                                {orderData?.total_quantity}
                            </Typography>
                        </Typography>

                        <Typography variant='h4' sx={{ display: 'flex', alignItems: 'center', color: 'primary.800' }}>
                            Pending QTY:{' '}
                            <Typography
                                variant='h3'
                                component='span'
                                sx={{ display: 'block', color: 'error.main', ml: 1 }}
                            >
                                {orderData && orderData.total_quantity
                                    ? parseInt(orderData.total_quantity, 10) - parseInt(orderData.picked_quantity, 10)
                                    : ''}
                            </Typography>
                        </Typography>
                    </Box>
                </Box>
                <Grid
                    item
                    xs={12}
                    md={12}
                    sx={{
                        display: 'flex',
                        position: 'relative',
                        justifyContent: 'space-between',
                        height: '14rem',
                        flexDirection: { xs: 'column', md: 'row' },
                        paddingTop: 1
                    }}
                >
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            justifyContent: 'flex-start',
                            gap: 1,
                            alignItems: 'baseline',
                            flexDirection: 'column',
                            paddingTop: 1
                        }}
                    >
                        {orderData?.total_quantity > 1 && scannedOrderId?.length > 1 && (
                            <Typography
                                variant='body1'
                                sx={{ display: 'flex', alignItems: 'center', color: 'primary.800' }}
                            >
                                Scanned Order ID:{' '}
                                <Typography variant='subtitle1' component='span' sx={{ color: 'primary.main', ml: 1 }}>
                                    {scannedOrderId}
                                </Typography>
                            </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography
                                variant='body1'
                                sx={{ display: 'flex', alignItems: 'center', color: 'primary.800' }}
                            >
                                Active Box ID:{' '}
                                <Typography variant='subtitle1' component='span' sx={{ color: 'primary.main', ml: 1 }}>
                                    {boxId}
                                </Typography>
                            </Typography>
                            <StatusBadge
                                type='cyan'
                                label='Reprint'
                                icon={<Cached />}
                                customSx={{ height: '1.5rem', ml: 1, cursor: 'pointer' }}
                                onClick={handleRePrint}
                            />
                        </Box>
                        <Box
                            sx={{ display: { md: 'flex' }, justifyContent: 'flex-start', gap: 1, alignItems: 'center' }}
                        >
                            {orderData?.total_quantity > 1 && scannedUIDs?.length > 0 && (
                                <>
                                    <Typography variant='body1' sx={{ display: 'block', color: 'primary.800' }}>
                                        Last Scanned Item ID:{' '}
                                    </Typography>
                                    <Typography variant='subtitle1' sx={{ display: 'block', color: 'primary.main' }}>
                                        {maskItemId(scannedUIDs?.length ? scannedUIDs[scannedUIDs.length - 1] : '')}
                                    </Typography>
                                </>
                            )}
                        </Box>
                        <Typography variant='h4' sx={{ display: 'flex', alignItems: 'center', color: 'primary.800' }}>
                            Order QTY:{' '}
                            <Typography
                                variant='h3'
                                component='span'
                                sx={{ display: 'block', color: 'primary.main', ml: 1 }}
                            >
                                {orderData?.total_quantity}
                            </Typography>
                        </Typography>

                        <Typography variant='h4' sx={{ display: 'flex', alignItems: 'center', color: 'primary.800' }}>
                            Pending QTY:{' '}
                            <Typography
                                variant='h3'
                                component='span'
                                sx={{ display: 'block', color: 'error.main', ml: 1 }}
                            >
                                {orderData && orderData.total_quantity
                                    ? parseInt(orderData.total_quantity, 10) - parseInt(orderData.picked_quantity, 10)
                                    : ''}
                            </Typography>
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            position: { xs: 'static', sm: 'absolute' },
                            left: '50%',
                            transform: { xs: 'none', sm: 'translateX(-50%)' },
                            width: {
                                xs: '100%',
                                sm: '28rem'
                            },
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            height: '100%',
                            paddingTop: {
                                xs: 1,
                                sm: 0
                            },
                            right: { xs: 0, md: '12px' }
                        }}
                    >
                        <CustomTabsGroupedBtns
                            labels={['Scan Item ID', 'Scan Pick Box ID']}
                            onChange={value => {
                                handleTypeChange(value)
                            }}
                            tabValue={tabVal}
                        />
                        {tabVal === 0 ? (
                            <ScannableInputForm
                                initialValues={{ itemId: '' }}
                                validationSchema={z.object({
                                    itemId: z
                                        .string()
                                        .trim() // This removes whitespace from both ends
                                        .min(1, 'Item ID is required')
                                })}
                                handleSubmit={async (values, { resetForm }) => {
                                    await handleScan({
                                        uid: values.itemId,
                                        orderDetailId,
                                        type: 'b2b',
                                        boxId: boxid,
                                        tableNo: tableId
                                    })
                                    resetForm()
                                    // const response = await dispatch(scanPackItem.initiate())
                                }}
                                fields={[
                                    {
                                        name: 'itemId',
                                        label: 'Scan Item Id*',
                                        placeholder: 'Scan or type & hit enter',
                                        ref: itemIdRef,
                                        outerLabelSx: {
                                            fontWeight: 'bold'
                                        },
                                        animateGlow: !isAllVerified,
                                        isVerified: isAllVerified,
                                        isDisabled:
                                            isAllVerified ||
                                            boxCloseLoading ||
                                            (!removedItemId && orderData?.pendingQty === 0 && isEditPage),
                                        loading: scanPackItemLKey
                                    }
                                ]}
                                scannerEnabled
                                showSubmitButton={false}
                                gridProps={{ container: true }}
                                key={updateUIDInput}
                            />
                        ) : (
                            <ScannableInputForm
                                initialValues={{ pickBoxId: '' }}
                                validationSchema={z.object({
                                    pickBoxId: z
                                        .string()
                                        .trim() // This removes whitespace from both ends
                                        .min(1, 'Pick Box ID is required')
                                })}
                                handleSubmit={(values, { resetForm }) => {
                                    pickBoxIdRef.current?.focus()
                                    dispatch(
                                        openSnackbar({
                                            open: true,
                                            message: 'Pick Box ID Scanned',
                                            variant: 'alert',
                                            alert: { color: 'info', icon: 'info' },
                                            anchorOrigin: { vertical: 'top', horizontal: 'center' },
                                            autoHideDuration: 1000
                                        })
                                    )
                                    if (orderData?.orderQty > 1) {
                                        setScannedUIDs(prev => [...prev, values?.pickBoxId])
                                        resetForm()
                                    }
                                    setActiveModal('pickBoxQty')
                                    dispatch(openModal({ type: 'confirm_modal' }))
                                }}
                                fields={[
                                    {
                                        name: 'pickBoxId',
                                        label: 'Scan Pick Box Id*',
                                        placeholder: 'Scan or type & hit enter',
                                        ref: pickBoxIdRef,
                                        outerLabelSx: {
                                            fontWeight: 'bold'
                                        },
                                        animateGlow: !isAllVerified,
                                        isVerified: isAllVerified,
                                        isDisabled:
                                            isAllVerified ||
                                            boxCloseLoading ||
                                            (!removedItemId && orderData?.pendingQty === 0)
                                    }
                                ]}
                                scannerEnabled
                                showSubmitButton={false}
                                gridProps={{ container: true }}
                                key={updateUIDInput}
                            />
                        )}
                        <Box
                            sx={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}
                        >
                            {!(isEditPage && scannedUIDs?.length <= 0) && (
                                <Typography variant='h3' sx={{ color: 'primary.800' }}>
                                    Total Scanned Items:
                                    <Typography variant='h2' component='span' sx={{ color: 'secondary.main', ml: 1 }}>
                                        {scannedUIDs?.length}
                                    </Typography>
                                </Typography>
                            )}
                            <Box
                                sx={{
                                    display: 'flex',
                                    ...(isEditPage && scannedUIDs?.length <= 0
                                        ? { justifyContent: 'flex-end', width: '100%' }
                                        : {})
                                }}
                            >
                                <CustomButton
                                    customStyles={{
                                        height: 'max-content',
                                        alignSelf: 'end',
                                        paddingX: 1
                                    }}
                                    variant='clickable'
                                    disabled={!scannedUIDs?.length > 0}
                                    onClick={() => {
                                        setIsModalOpen(true)
                                        setActiveModal('boxSpecificationModal')
                                    }}
                                    showTooltip={!scannedUIDs?.length > 0}
                                    tooltip='Please scan an item first!'
                                    loading={boxCloseLoading}
                                >
                                    <Box
                                        sx={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 1
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'flex-start',
                                                alignItems: 'center',
                                                gap: 0.5
                                            }}
                                        >
                                            <PackIcon />
                                            Close Box
                                        </Typography>
                                        <Typography
                                            component='span'
                                            sx={{
                                                display: { xs: 'none', sm: 'flex' },
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Shortcut sx={{ fontSize: '14px', marginLeft: 'auto' }} />
                                            <KeyboardButton text='Alt' />
                                            &nbsp;+&nbsp;
                                            <KeyboardButton text='B' />
                                        </Typography>
                                    </Box>
                                </CustomButton>
                            </Box>
                        </Box>
                    </Box>
                    {!isEditPage && (
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            <CustomButton
                                customStyles={{
                                    height: 'max-content',
                                    paddingX: 1,
                                    width: { xs: 'max-content', sm: '13rem' },
                                    alignSelf: 'flex-start'
                                }}
                                variant='outlined'
                                clickable
                                disabled={
                                    scannedUIDs?.length <= 0 ||
                                    (!config?.allowPartialPacking &&
                                        parseInt(orderData.picked_quantity, 10) <
                                            parseInt(orderData.total_quantity, 10))
                                }
                                onClick={() => {
                                    setIsModalOpen(true)
                                    setActiveModal('weightDimension')
                                }}
                                showTooltip={
                                    scannedUIDs?.length <= 0 ||
                                    (!config?.allowPartialPacking &&
                                        parseInt(orderData.picked_quantity, 10) <
                                            parseInt(orderData.total_quantity, 10))
                                }
                                tooltip={
                                    scannedUIDs?.length <= 0
                                        ? 'Please scan an item first!'
                                        : !config?.allowPartialPacking &&
                                            parseInt(orderData.picked_quantity, 10) <
                                                parseInt(orderData.total_quantity, 10)
                                          ? 'Partial packing is not allowed!'
                                          : ''
                                }
                            >
                                <Box
                                    sx={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'flex-start',
                                            alignItems: 'center',
                                            gap: 0.5
                                        }}
                                    >
                                        <Print fontSize='small' />
                                        Close Pack
                                    </Typography>
                                    <Typography
                                        component='span'
                                        sx={{
                                            display: { xs: 'none', sm: 'flex' },
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Shortcut sx={{ fontSize: '14px', marginLeft: 'auto' }} />
                                        <KeyboardButton text='Alt' />
                                        &nbsp;+&nbsp;
                                        <KeyboardButton text='p' />
                                    </Typography>
                                </Box>
                            </CustomButton>
                        </Box>
                    )}
                </Grid>
                {!isEditPage && (
                    <Divider
                        sx={{
                            width: '100%',
                            borderWidth: '1px',
                            mb: 0.5,
                            display: { xs: 'block', md: 'none' }
                        }}
                    />
                )}
                {!isEditPage && (
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'flex-end', width: '100%' }}>
                        <CustomButton
                            customStyles={{
                                height: 'max-content',
                                paddingX: 1,
                                width: { xs: 'max-content', sm: '13rem' },
                                alignSelf: 'flex-start'
                            }}
                            variant='outlined'
                            clickable
                            disabled={!scannedUIDs?.length > 0}
                            onClick={() => {
                                setIsModalOpen(true)
                                setActiveModal('weightDimension')
                            }}
                            showTooltip={!scannedUIDs?.length > 0}
                            tooltip='Please scan an item first!'
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Typography
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                        gap: 0.5
                                    }}
                                >
                                    <Print fontSize='small' />
                                    Close Pack
                                </Typography>
                            </Box>
                        </CustomButton>
                    </Box>
                )}
                <Grid item xs={12} md={12}>
                    <Divider
                        sx={{
                            marginY: '1rem',
                            borderColor: '#BCC1CA',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                    <B2BPackItemTable
                        refetchItems={refetchItems}
                        orderId={orderData?.id}
                        RenderToolBarElement={RenderToolBarElement}
                    />
                </Grid>
            </Grid>

            {activeModal === 'weightDimension' ? (
                <WeightDimensionModal
                    isOpen={activeModal === 'weightDimension'}
                    onClose={() => {
                        setActiveModal(null)
                        setIsModalOpen(false)
                    }}
                    isWeightRequired={config?.askForWeight}
                    isCourierRequired={config?.courierMandatoryForB2B}
                    onSubmit={async (values, { resetForm }) => {
                        try {
                            await handlePackClose(
                                {
                                    awbNo: values.awb_no,
                                    courier: values.courier.value,
                                    weight: values.weight,
                                    ...structuredClone(values.dimensions)
                                },
                                resetForm
                            )
                        } catch (error) {
                            // Error handling
                        }
                    }}
                />
            ) : activeModal === 'pickBoxQty' ? (
                <ConfirmModal
                    title='Confirm & Add Pick Box Quantity'
                    message={
                        <Typography variant='h5' sx={{ color: 'primary.800' }}>
                            Total Quantity:
                            <Typography variant='h4' component='span' sx={{ ml: 1 }}>
                                10
                            </Typography>
                        </Typography>
                    }
                    icon='info'
                    confirmText='Yes, Add'
                    customStyle={{ width: { xs: '300px', sm: '456px' } }}
                    onConfirm={() => {
                        dispatch(
                            openSnackbar({
                                open: true,
                                message: '10 Items Added',
                                variant: 'alert',
                                alert: { color: 'info', icon: 'info' },
                                anchorOrigin: { vertical: 'top', horizontal: 'center' },
                                autoHideDuration: 1000
                            })
                        )
                        setActiveModal(null)
                    }}
                    onCancel={() => {
                        setActiveModal(null)
                    }}
                />
            ) : activeModal === 'removeItem' ? (
                <TitleModalWrapper
                    title='Scan Item ID To Remove From the Pack'
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    boxContainerSx={{
                        width: { xs: '340px', sm: '400px' }
                    }}
                    onClose={() => {
                        setActiveModal(null)
                        setIsModalOpen(false)
                    }}
                >
                    <ScannableInputForm
                        initialValues={{ itemId: '' }}
                        validationSchema={z.object({
                            itemId: z.string().optional()
                        })}
                        handleSubmit={async (values, { resetForm }) => {
                            await handleRemove(values.itemId)
                            console.log('Form submitted:', values)
                            resetForm()
                        }}
                        fields={[
                            {
                                name: 'itemId',
                                label: 'Item ID*',
                                placeholder: 'scan or enter',
                                ref: removeItemIdRef
                            }
                        ]}
                        scannerEnabled={false}
                        submitButtonText='Confirm'
                        gridProps={{ container: true }}
                        loading={removePackItemLKey}
                    />
                </TitleModalWrapper>
            ) : activeModal === 'confirmBoxID' ? (
                <TitleModalWrapper
                    title='Confirm Box Label To Close'
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    boxContainerSx={{
                        width: { xs: '340px', sm: '400px' }
                    }}
                    onClose={() => {
                        setActiveModal(null)
                        setIsModalOpen(false)
                    }}
                >
                    <ScannableInputForm
                        initialValues={{ boxID: '' }}
                        validationSchema={z.object({
                            boxID: z.string().min(1, 'Box ID is required')
                        })}
                        handleSubmit={async (values, { resetForm }) => {
                            const { boxID } = values
                            if (boxID !== boxId) {
                                dispatch(
                                    openSnackbar({
                                        open: true,
                                        message: 'Invalid Box ID scanned!',
                                        variant: 'alert',
                                        alert: { color: 'error', icon: 'error' },
                                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                    })
                                )
                                resetForm()
                                return
                            }

                            await handleBoxClose(resetForm)
                        }}
                        fields={[
                            {
                                name: 'boxID',
                                label: 'Box ID*',
                                placeholder: 'scan or enter',
                                ref: confirmBoxIdRef
                            }
                        ]}
                        scannerEnabled={false}
                        submitButtonText='Confirm'
                        gridProps={{ container: true }}
                        loading={closePackBoxLKey}
                    />
                </TitleModalWrapper>
            ) : activeModal === 'scanBoxID' ? (
                <TitleModalWrapper
                    title={
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                py: 0.5
                            }}
                        >
                            <Typography variant='h4' component='span'>
                                Scan Newly Printed Box Label
                            </Typography>

                            <StatusBadge
                                type='cyan'
                                label='Reprint'
                                icon={<Cached />}
                                customSx={{ height: '1.5rem', ml: 1, cursor: 'pointer' }}
                                onClick={handleRePrint}
                            />
                        </Box>
                    }
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    boxContainerSx={{
                        width: { xs: '340px', sm: '400px' }
                    }}
                    onClose={() => {
                        setActiveModal(null)
                        setIsModalOpen(false)
                    }}
                    disableEscapeKeyDown
                    showCancelButton={false}
                >
                    <ScannableInputForm
                        initialValues={{ boxID: '' }}
                        validationSchema={z.object({
                            boxID: z.string().min(1, 'Box ID is required')
                        })}
                        handleSubmit={(values, { resetForm }) => {
                            setActiveModal(null)
                            setIsModalOpen(false)
                            // Perform any additional actions with the scanned UID here
                            resetForm()
                            dispatch(
                                openSnackbar({
                                    open: true,
                                    message: 'Box updated',
                                    variant: 'alert',
                                    alert: { color: 'info', icon: 'info' },
                                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                })
                            )
                        }}
                        fields={[
                            {
                                name: 'boxID',
                                label: 'Box ID*',
                                placeholder: 'scan or enter',
                                ref: boxIdRef
                            }
                        ]}
                        scannerEnabled={false}
                        submitButtonText='Update'
                        gridProps={{ container: true }}
                    />
                </TitleModalWrapper>
            ) : activeModal === 'boxSpecificationModal' ? (
                <BoxSpecificationModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setActiveModal(null)
                        setIsModalOpen(false)
                    }}
                    isWeightRequired={config?.askForWeight}
                    isBoxSpecAllowed={config?.askBoxSpecificationsB2B}
                    defaultDimensions={config?.packageDimensions}
                    onSubmit={async (values, { resetForm }) => {
                        setBoxCloseData({
                            weight: values.weight,
                            ...structuredClone(values.dimensions)
                        })

                        setIsModalOpen(true)
                        setActiveModal('confirmBoxID')
                        resetForm()
                    }}
                />
            ) : null}
        </Box>
    )
}
