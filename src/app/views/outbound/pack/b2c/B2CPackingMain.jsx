/* eslint-disable no-nested-ternary */
/* eslint-disable no-unsafe-optional-chaining */
import { Box, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import CustomButton from '@/core/components/extended/CustomButton'
import AmazonColorIcon from '@/assets/icons/channel/AmazonColorIcon'
import MyntraColorIcon from '@/assets/icons/channel/MyntraColorIcon'
import ShopifyColorIcon from '@/assets/icons/channel/ShopifyColorIcon'
import flipkartColorIcon from '@/assets/icons/channel/flipkartColorIcon.svg'
import PackItemTable from '@/app/views/tables/pack/b2cPackItems'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import TitleModalWrapper from '@/core/components/TitleModalWrapper'
import { z } from 'zod'
import ScannableInputForm from '@/core/components/ScannableInputForm'
import { QrCodeScanner, Shortcut, Description, Receipt } from '@mui/icons-material'
import KeyboardButton from '@/core/components/keyboardButton'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import PackIcon from '@/assets/icons/PackIcon'
import FlagIssueIcon from '@/assets/icons/FlagIssueIcon'
import { openModal } from '@/app/store/slices/modalSlice'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { maskItemId } from '@/utilities'
import { scanPackItem, useClosePackMutation, getConfig } from '@/app/store/slices/api/packSlice'
import PackItemDetails from './PackItemDetails'
import WeightCourierModal from './WeightCourierModal'
import MarkQCFailureModal from './MarkQCFailureModal'

const getChannelIcon = {
    Amazon: <AmazonColorIcon />,
    Myntra: <MyntraColorIcon />,
    Shopify: <ShopifyColorIcon />,
    Flipkart: <img src={flipkartColorIcon} alt='Flipkart' style={{ height: 18, width: 18 }} />
}

// const orderData = {
//     orderNo: 'VYPO438830',
//     orderQty: 3,
//     pendingQty: 2,
//     channel: 'Amazon'
// }

// Array of items to map over to render each info line
const initialInfoItems = [
    {
        label: 'Order No:',
        key: 'order_no',
        value: 'N/A',
        valueVariant: 'h5',
        valueColor: 'primary.800'
    },
    {
        label: 'Order Qty:',
        key: 'total_quantity',
        value: 0,
        valueVariant: 'h3',
        valueColor: 'primary.800'
    },
    {
        label: 'Pending Qty:',
        key: 'pending_quantity',
        value: 0,
        valueVariant: 'h3',
        valueColor: 'error.main'
    },
    {
        label: 'Channel:',
        key: 'channel',
        // For channel, value will be rendered along with an icon
        value: 'N/A',
        valueVariant: 'h5',
        valueColor: 'primary.800',
        // icon: getChannelIcon?.Amazon
        icon: ''
    }
]

const initialPackConfig = {
    pack_id: null,
    packaging_material: null,
    weight: 0,
    courier: '',
    awb_no: ''
}

// eslint-disable-next-line react/prop-types
export default function B2CPackingMain({ table }) {
    const dispatch = useDispatch()
    const [closePack] = useClosePackMutation()

    const isOpen = useSelector(state => state.modal.open)
    const { scanPackItemLKey, closePackLKey } = useSelector(state => state.loading)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeModal, setActiveModal] = useState(null)
    const [scannedItemIds, setScannedItemIds] = useState([])
    const [orderData, setOrderData] = useState({})

    // using these two states for just conditionally rendering UI later could be replaced with api response
    const [isPacked, setIsPacked] = useState(false)
    const [isAllVerified, setIsAllVerified] = useState(false)
    const [updateItemIdInput, setUpdateItemIdInput] = useState(false) // to rerender itemId input
    const [infoItems, setInfoItems] = useState([...structuredClone(initialInfoItems)])
    const [packCloseConfig, setPackCloseConfig] = useState(structuredClone(initialPackConfig))
    const [refetchItems, setRefetchItems] = useState(false)
    const [config, setConfig] = useState(null)

    const packagingMaterialInputRef = useRef(null)
    const awbConfirmationNumberInputRef = useRef(null)
    const itemIdInputRef = useRef(null)
    const removeItemIdRef = useRef(null)

    const handlePackItemScan = async values => {
        let isError = false
        let message
        try {
            const { data } = await dispatch(scanPackItem.initiate({ uid: values?.itemId, tableNo: table }))

            itemIdInputRef.current?.focus()
            message = 'Item Scanned'
            if (!data || !data?.data) throw new Error('invalid aur already packed item scanned!')
            const { packDetail, packItem } = data.data
            setOrderData(packDetail || {})
            setRefetchItems(true)
            setTimeout(() => setRefetchItems(false), 600)

            if (packDetail.total_quantity > 1) {
                setScannedItemIds(prev => [...prev, { ...packItem }])
            } else if (packDetail.total_quantity === 1) {
                setScannedItemIds([{ ...packItem }])
                setIsAllVerified(packDetail.total_quantity === 1)
                setIsModalOpen(true)
                setActiveModal('packagingMaterial')
            }
        } catch (error) {
            isError = true
            message = error?.data?.data?.message || error?.data?.message || error?.message || 'unable to scan item!'
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
            if (itemIdInputRef.current) itemIdInputRef.current.value = ''
        }
    }

    const handleClosePack = async confirmAwb => {
        let isError = false
        let message
        try {
            if ((!confirmAwb.trim() || !packCloseConfig.awb_no.trim()) && packCloseConfig.awb_no === confirmAwb)
                throw new Error('awb mismatch')
            // eslint-disable-next-line no-console
            console.log('handle close pack :', confirmAwb, packCloseConfig)

            const response = await closePack({
                ...packCloseConfig,
                pack_id: orderData.id
            }).unwrap()
            message = response?.message || 'pack closed successfully!'
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

    const handleStartPackOpen = () => {
        if (!isAllVerified) {
            setActiveModal('forceClose')
            dispatch(openModal({ type: 'confirm_modal' }))
            return
        }
        setIsModalOpen(true)
        setActiveModal('packagingMaterial')
    }

    const handleMarkQCFailureSubmission = values => {
        console.log('submitted Values🟢', values)
        setActiveModal(null)
        setIsModalOpen(false)
        dispatch(
            openSnackbar({
                open: true,
                message: 'Marked QC failure for #89****1633 successfully',
                variant: 'alert',
                alert: { color: 'success', icon: 'success' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' },
                autoHideDuration: 3000
            })
        )
    }

    const handleWeightCourierSuccess = values => {
        setPackCloseConfig(prev => ({
            ...prev,
            awb_no: values.awbNo,
            courier: values?.courier?.value || values.courier,
            weight: values.weight
        }))
        setIsPacked(true)
    }

    useEffect(() => {
        if (activeModal === 'packagingMaterial') {
            setTimeout(() => {
                packagingMaterialInputRef.current?.focus()
            }, 100)
        }
        if (activeModal === 'awbNumber') {
            setTimeout(() => {
                awbConfirmationNumberInputRef.current?.focus()
            }, 100)
        }
        if (activeModal === 'removeItem') {
            setTimeout(() => {
                removeItemIdRef.current?.focus()
            }, 100)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeModal, isModalOpen])

    // use keyboard shortcut
    useKeyboardShortcut('Alt+P', () => {
        if (scannedItemIds?.length <= 0) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please scan an item first!',
                    variant: 'alert',
                    alert: { color: 'warning', icon: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' },
                    autoHideDuration: 1000
                })
            )
            return
        }
        if (isPacked) {
            setActiveModal('awbNumber')
            setIsModalOpen(true)
            return
        }
        handleStartPackOpen()
    })

    useEffect(() => {
        setTimeout(() => {
            itemIdInputRef.current?.focus()
        }, 100)
    }, [])

    useEffect(() => {
        if (!isOpen) {
            setActiveModal(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    useEffect(() => {
        if (Object.keys(orderData).length) {
            setInfoItems(
                infoItems.map(item => ({
                    ...item,
                    value:
                        item.key === 'pending_quantity'
                            ? parseInt(orderData.total_quantity, 10) - parseInt(orderData.picked_quantity, 10)
                            : orderData[item?.key] || '-',
                    ...(item.key === 'channel' ? { icon: getChannelIcon[orderData[item.key]] || '' } : { icon: '' })
                }))
            )

            // ? open close pack model
            if (
                parseInt(orderData.total_quantity, 10) > 1 &&
                parseInt(orderData.total_quantity, 10) - parseInt(orderData.picked_quantity, 10) < 1
            ) {
                setIsAllVerified(true)
                setIsModalOpen(true)
                setActiveModal('packagingMaterial')
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData])

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

    return (
        <Box sx={{ width: '100%', height: '100%', p: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: { md: 'flex' }, justifyContent: 'flex-start', gap: 1, alignItems: 'center' }}>
                    {orderData?.order_quantity > 1 && scannedItemIds?.length > 0 && (
                        <>
                            <Typography variant='body1' sx={{ display: 'block', color: 'primary.800' }}>
                                Last Scanned Item ID:{' '}
                            </Typography>
                            <Typography variant='subtitle1' sx={{ display: 'block', color: 'primary.main' }}>
                                {maskItemId(scannedItemIds?.[scannedItemIds?.length - 1].uid ?? '')}
                            </Typography>
                        </>
                    )}
                </Box>
                {!isPacked ? (
                    <CustomButton
                        variant='clickable'
                        customStyles={{
                            height: '2rem',
                            paddingX: 1,
                            width: { xs: 'max-content', sm: '13rem' }
                        }}
                        onClick={handleStartPackOpen}
                        disabled={
                            scannedItemIds?.length <= 0 ||
                            (!config.allowPartialPacking &&
                                parseInt(orderData.picked_quantity, 10) < parseInt(orderData.total_quantity, 10))
                        }
                        showTooltip={
                            scannedItemIds?.length <= 0 ||
                            (!config?.allowPartialPacking &&
                                parseInt(orderData.picked_quantity, 10) < parseInt(orderData.total_quantity, 10))
                        }
                        tooltip={
                            scannedItemIds?.length <= 0
                                ? 'Please scan an item first!'
                                : !config?.allowPartialPacking &&
                                    parseInt(orderData.picked_quantity, 10) < parseInt(orderData.total_quantity, 10)
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
                                sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 0.5 }}
                            >
                                <PackIcon />
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
                ) : (
                    <CustomButton
                        variant='clickable'
                        customStyles={{
                            height: '2rem',
                            paddingX: 1,
                            width: '10rem'
                        }}
                        startIcon={<QrCodeScanner />}
                        onClick={() => {
                            setActiveModal('awbNumber')
                            setIsModalOpen(true)
                        }}
                    >
                        Scan AWB No.
                    </CustomButton>
                )}
            </Box>
            <Grid container spacing={1}>
                <Grid item xs={12} md={5.5} sx={{ display: 'flex', flexDirection: 'column', height: 'auto' }}>
                    <ScannableInputForm
                        initialValues={{ itemId: '' }}
                        validationSchema={z.object({
                            itemId: z
                                .string()
                                .trim() // This removes whitespace from both ends
                                .min(1, 'Item ID is required')
                        })}
                        handleSubmit={async (values, { resetForm }) => {
                            await handlePackItemScan(values)
                            resetForm()
                        }}
                        fields={[
                            {
                                name: 'itemId',
                                label: 'Scan Item ID*',
                                placeholder: 'Scan or type & hit enter',
                                ref: itemIdInputRef,
                                outerLabelSx: {
                                    fontWeight: 'bold'
                                },
                                animateGlow: true,
                                isVerified: isAllVerified,
                                isDisabled: isAllVerified,
                                loading: scanPackItemLKey
                            }
                        ]}
                        scannerEnabled
                        showSubmitButton={false}
                        gridProps={{ container: true }}
                        animateGlow
                        key={updateItemIdInput}
                        loading={scanPackItemLKey}
                    />
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
                            flexGrow: 1 // This line makes the Box fill the remaining height
                        }}
                    >
                        {infoItems.map((item, index) => (
                            <Typography
                                // eslint-disable-next-line react/no-array-index-key
                                key={index}
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
                <Grid
                    item
                    xs={12}
                    md={6.5}
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        gap: 1,
                        flexDirection: { xs: 'column', sm: 'row' }
                    }}
                >
                    <PackItemDetails sku={scannedItemIds.length ? scannedItemIds[scannedItemIds.length - 1] : null} />
                    {/* TODO::this would be hidden if no data in table */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'row', sm: 'column-reverse' },
                            alignItems: 'center',
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            boxShadow: 1,
                            p: 0.5,
                            gap: 0.5,
                            height: { xs: 'max-content', sm: '100%' }
                        }}
                    >
                        <Tooltip title='Reprint Invoice'>
                            <span>
                                <IconButton
                                    disabled={!isPacked}
                                    color='primary'
                                    size='medium'
                                    sx={{
                                        transition: 'transform 0.2s',
                                        '&:hover:not(.Mui-disabled)': {
                                            transform: 'scale(1.1)'
                                        }
                                    }}
                                >
                                    <Description />
                                </IconButton>
                            </span>
                        </Tooltip>

                        <Tooltip title='Reprint Ship Label'>
                            <span>
                                <IconButton
                                    disabled={!isPacked}
                                    color='primary'
                                    size='medium'
                                    sx={{
                                        transition: 'transform 0.2s',
                                        '&:hover:not(.Mui-disabled)': {
                                            transform: 'scale(1.1)'
                                        }
                                    }}
                                >
                                    <Receipt />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title='Mark QC Failure'>
                            <IconButton
                                color='error'
                                onClick={() => {
                                    setIsModalOpen(true)
                                    setActiveModal('markQCFailure')
                                }}
                                size='medium'
                                sx={{
                                    transition: 'transform 0.2s',
                                    '&:hover:not(.Mui-disabled)': {
                                        transform: 'scale(1.05)'
                                    }
                                }}
                                disabled={isPacked}
                            >
                                <FlagIssueIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Grid>
                <Grid item xs={12} md={12}>
                    <PackItemTable refetchItems={refetchItems} packId={orderData?.id || null} />
                </Grid>
            </Grid>

            {activeModal === 'packagingMaterial' ? (
                <TitleModalWrapper
                    title='Scan Packaging Material'
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    boxContainerSx={{
                        width: { xs: '340px', sm: '400px' }
                    }}
                >
                    <ScannableInputForm
                        initialValues={{ packagingMaterial: '' }}
                        validationSchema={z.object({
                            packagingMaterial:
                                config && ['b2c', 'both'].includes(config.askPackagingMaterialFor)
                                    ? z.string().trim().nonempty('Packaging material is required')
                                    : z.string().trim().optional().nullable()
                        })}
                        handleSubmit={(values, { resetForm }) => {
                            setPackCloseConfig(prev => ({
                                ...prev,
                                packaging_material: values.packagingMaterial
                            }))

                            // Perform any additional actions with the scanned itemID here
                            resetForm()
                            setActiveModal('weightCourier')
                        }}
                        fields={[
                            {
                                name: 'packagingMaterial',
                                label: 'Packaging Material*',
                                placeholder: 'scan or enter',
                                ref: packagingMaterialInputRef
                            }
                        ]}
                        scannerEnabled={false}
                        submitButtonText='Next'
                        gridProps={{ container: true }}
                    />
                </TitleModalWrapper>
            ) : activeModal === 'weightCourier' ? (
                <WeightCourierModal
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    onSuccess={handleWeightCourierSuccess}
                    setActiveModal={setActiveModal}
                />
            ) : activeModal === 'awbNumber' ? (
                <TitleModalWrapper
                    title='Scan AWB No.'
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    boxContainerSx={{
                        width: { xs: '340px', sm: '400px' }
                    }}
                >
                    <ScannableInputForm
                        initialValues={{ awbNo: '' }}
                        validationSchema={z.object({
                            awbNo: z.string().optional()
                        })}
                        handleSubmit={async (values, { resetForm }) => {
                            // Perform any additional actions with the scanned itemID here
                            const isCloseOk = await handleClosePack(values.awbNo)
                            if (isCloseOk) {
                                setActiveModal(null)
                                setIsModalOpen(false)
                                setIsPacked(false)
                                setIsAllVerified(false)
                                setScannedItemIds([])
                                setUpdateItemIdInput(prev => !prev) // to rerender itemID input
                                setTimeout(() => {
                                    itemIdInputRef.current?.focus()
                                }, 100)
                                setPackCloseConfig(structuredClone(initialPackConfig))
                                setOrderData({})
                                setInfoItems(structuredClone(initialInfoItems))
                            }
                            resetForm()
                        }}
                        fields={[
                            {
                                name: 'awbNo',
                                label: 'Confirm AWB Number',
                                placeholder: 'scan or enter',
                                ref: awbConfirmationNumberInputRef,
                                loading: closePackLKey
                            }
                        ]}
                        scannerEnabled={false}
                        submitButtonText='Next'
                        gridProps={{ container: true }}
                        loading={closePackLKey}
                    />
                </TitleModalWrapper>
            ) : activeModal === 'forceClose' ? (
                <ConfirmModal
                    title='Force Close & Pack'
                    message='Are you sure you want to close pack still 2 items pending?'
                    icon='warning'
                    confirmText='Yes'
                    customStyle={{ width: { xs: '300px', sm: '456px' } }}
                    onConfirm={() => {
                        setIsModalOpen(true)
                        setActiveModal('packagingMaterial')
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
                        handleSubmit={(values, { resetForm }) => {
                            console.log('Form submitted:', values)
                            setActiveModal(null)
                            setIsModalOpen(false)
                            // Perform any additional actions with the scanned itemID here
                            resetForm()
                            dispatch(
                                openSnackbar({
                                    open: true,
                                    message: 'Item removed successfully',
                                    variant: 'alert',
                                    alert: { color: 'info', icon: 'info' },
                                    anchorOrigin: { vertical: 'top', horizontal: 'center' },
                                    autoHideDuration: 1000
                                })
                            )
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
                    />
                </TitleModalWrapper>
            ) : activeModal === 'markQCFailure' ? (
                <MarkQCFailureModal
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    closeOnBackdropClick
                    onSubmit={handleMarkQCFailureSubmission}
                />
            ) : null}
        </Box>
    )
}
