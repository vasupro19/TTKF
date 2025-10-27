/* eslint-disable jsx-a11y/anchor-is-valid */
import { KeyboardBackspace } from '@mui/icons-material'
import { Box, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'
import ScannableInputForm from '@/core/components/ScannableInputForm'
import { getStorageLocation, getPickListItems, useScanPickItemMutation } from '@/app/store/slices/api/pickListSlice'
import { buildQuery } from '@/utilities'
import { setPickData, setLastScannedItem } from '@/app/store/slices/pickDataSlice'
import ChangeBinModal from './ChangeBinModal'
import QuantityBinInfo from './PickingHeader'
import ItemInfo from './ItemInfo'

function ScanItems() {
    const locationInputRef = useRef(null)
    const itemInputRef = useRef(null)

    const [scanPickItem] = useScanPickItemMutation()
    const { currentPick, selectedZone, refetchSkuList } = useSelector(state => state.pickData)
    const { getStorageLocationLKey, pickListItemLKey, scanPickItemLKey, markPnaReqLKey } = useSelector(
        state => state.loading
    )
    const [scannedLocation, setScannedLocation] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)

    const dispatch = useDispatch()
    const { id: pickListId } = useParams()

    const [data, setData] = useState([])
    const [items, setItems] = useState([])

    const handleChangeClick = () => {
        setIsModalOpen(true)
    }
    const navigate = useNavigate()

    // Handle form submission
    const handleSubmit = async (values, { resetForm }) => {
        if (values?.storageLocation) {
            try {
                setScannedLocation(values.storageLocation)
                const { data: response, error: reqError } = await dispatch(
                    getPickListItems.initiate(
                        `?${buildQuery({ address: values.storageLocation, pick_detail_id: currentPick.pickId })}`
                    )
                )
                if (reqError) throw new Error(reqError?.data?.message || 'unable to scan storage location')
                setItems(response?.data || [])
                resetForm?.()
                if (locationInputRef?.current) locationInputRef.current.value = ''
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: error?.message || 'unable to scan storage!',
                        variant: 'alert',
                        alert: { color: 'error', icon: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            }
        }
        if (values?.item) {
            itemInputRef.current?.focus()
            let isError = false
            let message = ''
            try {
                const { data: response, error: reqError } = await scanPickItem({
                    pick_detail_id: currentPick.pickId,
                    uid: values?.item,
                    bin_id: currentPick.bin_id
                }).unwrap()

                if (reqError) throw new Error(reqError?.data?.message || 'unable to scan pick item')

                if (response) {
                    const { pickDetail, allocations } = response
                    dispatch(
                        setPickData({
                            ...currentPick,
                            totalPickedQuantity: pickDetail.total_picked_quantity,
                            pendingQuantity: pickDetail.total_allot_quantity - pickDetail.total_picked_quantity
                        })
                    )
                    dispatch(
                        setLastScannedItem({
                            mfd: allocations[0]?.mfd_date || null,
                            lot: allocations[0]?.lot_no || null,
                            mrp: allocations[0]?.mrp || null,
                            exp: allocations[0]?.expiry_date || null,
                            ean: allocations[0]?.item_no || null
                        })
                    )
                }
            } catch (error) {
                isError = true
                message = error?.message || 'unable to scan item!'
            } finally {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: message || 'Picked Successfully',
                        variant: 'alert',
                        alert: { color: isError ? 'error' : 'success', icon: isError ? 'error' : 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
                resetForm?.()

                if (itemInputRef.current) itemInputRef.current.value = ''
            }
        }
    }

    useEffect(() => {
        locationInputRef.current?.focus()
        ;(async () => {
            try {
                const { data: response, error: reqError } = await dispatch(
                    getStorageLocation.initiate(
                        `?${buildQuery({ zone: selectedZone.zone, pick_detail_id: currentPick.pickId })}`
                    )
                )

                if (reqError) throw new Error(reqError?.data?.message || 'unable to scan bin/location')
                setData(response?.data || [])
            } catch (error) {
                // eslint-disable-next-line no-console
                console.log('error ', error)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!currentPick.pickId || !selectedZone.zoneId) navigate('/outbound/pickList/pick')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPick])

    useEffect(() => {
        if (refetchSkuList) handleSubmit({ storageLocation: scannedLocation }, {})
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetchSkuList])

    return (
        <Box sx={{ padding: 1, position: 'relative', minHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            <Tooltip title='Go back'>
                <IconButton
                    sx={{ position: 'absolute', top: 0, left: 0 }}
                    size='large'
                    onClick={() => {
                        // here we are navigating conditionally
                        if (!scannedLocation) {
                            navigate(`/outbound/pickList/pick/zones/${pickListId}`)
                        } else {
                            setScannedLocation('')
                            setTimeout(() => {
                                locationInputRef.current.focus()
                            }, 100)
                        }
                    }}
                >
                    <KeyboardBackspace />
                </IconButton>
            </Tooltip>
            <QuantityBinInfo
                items={currentPick}
                pickListId={currentPick.pickNo}
                location={scannedLocation}
                onChangeClick={handleChangeClick}
                pickBinId={currentPick.bin} // get this from the API using pickListId
            />
            {!scannedLocation ? (
                <ScannableInputForm
                    initialValues={{ storageLocation: '' }}
                    validationSchema={z.object({
                        storageLocation: z.string().refine(value => value.trim().length > 0, {
                            message: 'Location is required'
                        })
                    })}
                    handleSubmit={handleSubmit}
                    fields={[
                        {
                            name: 'storageLocation',
                            label: 'Scan Storage Location*',
                            placeholder: 'Scan Storage location',
                            ref: locationInputRef,
                            loading: pickListItemLKey
                        }
                    ]}
                    scannerEnabled
                    InputAdornment
                    showSubmitButton={false}
                    gridProps={{ container: true }}
                    loading={pickListItemLKey}
                />
            ) : (
                <ScannableInputForm
                    initialValues={{ item: '' }}
                    validationSchema={z.object({
                        item: z.string().refine(value => value.trim().length > 0, {
                            message: 'Item is required'
                        })
                    })}
                    handleSubmit={handleSubmit}
                    fields={[
                        {
                            name: 'item',
                            label: 'Scan Item*',
                            placeholder: 'Scan an item',
                            ref: itemInputRef,
                            loading: scanPickItemLKey || markPnaReqLKey
                        }
                    ]}
                    scannerEnabled
                    InputAdornment
                    showSubmitButton={false}
                    gridProps={{ container: true }}
                    loading={scanPickItemLKey || markPnaReqLKey}
                    isDisabled={scanPickItemLKey || markPnaReqLKey}
                />
            )}
            {/* Content: List of Pick lists */}
            {scannedLocation ? (
                <ItemInfo loading={pickListItemLKey} items={items} />
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1, // Allows it to take the remaining space
                        height: '100%', // Ensures it covers full available height
                        minHeight: 0, // Prevents unwanted height overflow
                        overflowY: 'auto', // Allows scrolling if needed
                        p: 1,
                        backgroundColor: 'grey.bgLighter',
                        border: '1px solid',
                        borderColor: 'grey.borderLight',
                        borderRadius: '8px',
                        mx: 0.5,
                        flexGrow: 1,
                        ...(getStorageLocationLKey && {
                            justifyContent: 'center',
                            alignItems: 'center'
                        })
                    }}
                >
                    {/* Header */}
                    {!getStorageLocationLKey && (
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
                                Zones : {selectedZone.zone}
                            </Typography>
                            <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                                Pending Qty
                            </Typography>
                        </Box>
                    )}

                    {/* List of Zones */}
                    {getStorageLocationLKey && (
                        <Box>
                            <CircularProgress color='success' size={25} />
                        </Box>
                    )}
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        {data.map((row, index) => (
                            <Box
                                // eslint-disable-next-line react/no-array-index-key
                                key={index}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    p: 1,
                                    alignItems: 'center'
                                }}
                            >
                                <Typography sx={{ fontWeight: 'bold' }}>{row?.address}</Typography>

                                <Typography sx={{ fontWeight: 'bold' }}>{row.quantity}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
            <ChangeBinModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} pickListId={pickListId} />
        </Box>
    )
}

export default ScanItems
