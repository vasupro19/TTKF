/* eslint-disable react/no-array-index-key */
import React, { useEffect, useRef, useState } from 'react'
import { Typography, Box, CircularProgress } from '@mui/material'
import HandScannerIcon from '@/assets/icons/HandScannerIcon'
import ScannableInputForm from '@/core/components/ScannableInputForm'

import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import {
    useGetAssignedToMePickListQuery,
    scanBinForPick,
    useSelfAssignPickMutation
} from '@/app/store/slices/api/pickListSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { buildQuery } from '@/utilities'
import { setZones, setPickData } from '@/app/store/slices/pickDataSlice'
import ScanInputModal from './scanInputModal'

function Index() {
    // const picklists = [
    //     { picklistNo: 'UTT-007865-1', quantity: 293, pending: 98, isSlACritical: true },
    //     { picklistNo: 'UTT-007865-2', quantity: 192, pending: 8, isSlACritical: false }
    // ]
    const dispatch = useDispatch()
    const [selfAssignPick] = useSelfAssignPickMutation()
    const { data: pickListResponse, error: apiError, refetch } = useGetAssignedToMePickListQuery()

    const scannedValRef = useRef(null)
    const pickBin = useRef(null)
    const storageLocation = useRef(null)

    const navigate = useNavigate()

    const { assignedToMePickListLKey, selfAssignReqLKey, scanBinForPickLKey } = useSelector(state => state.loading)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [pickLists, setPickLists] = useState([])

    const [pickListId, setPickListId] = useState(null)
    const [isVerified, setIsVerified] = useState({
        scannedValue: false
    })

    // Zod validation schema: requires pickBin if user tries to submit
    const validationSchema = z.object({
        scannedValue: z.string().refine(value => value.trim().length > 0, {
            message: 'This field is required'
        })
    })

    // Handle form submission
    const handleSubmit = async (values, { setSubmitting }) => {
        let isError = false
        let message
        try {
            setIsVerified({ scannedValue: true })
            // eslint-disable-next-line no-unused-vars
            const {
                data: response,
                error: reqError,
                message: resMessage
            } = await selfAssignPick({ no: values.scannedValue }).unwrap()

            if (reqError) throw new Error(reqError?.data?.message || 'unable to verify order/pick no!')
            setSubmitting(false)
            refetch()
            message = resMessage

            if (response) {
                setPickListId(response?.id || null)
                setIsModalOpen(true)
            }
        } catch (error) {
            isError = true
            message = error?.message || 'unable to verify order/pick no!'
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success', icon: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    const handelBinAndLocationScan = async values => {
        try {
            if (!values.pickBin || !values.storageLocation || !pickListId) throw new Error('invalid storage or address')
            const { data, error: reqError } = await dispatch(
                scanBinForPick.initiate(
                    `?${buildQuery({
                        bin_no: values.pickBin,
                        address: values.storageLocation,
                        pick_detail_id: pickListId
                    })}`
                )
            )
            if (reqError) throw new Error(reqError?.data?.message || 'unable to scan bin/location')
            dispatch(setZones([...data.data.zone]))
            dispatch(
                setPickData({
                    pickId: pickListId,
                    storageAddress: values.storageLocation,
                    bin: data.data.pickDetail.bin_no,
                    bin_id: data.data.bin.id,
                    pickNo: data.data.pickDetail.picklist_no,
                    totalPickedQuantity: data.data.pickDetail.total_picked_quantity,
                    pendingQuantity: data.data.pickDetail.pending_quantity
                })
            )
            setTimeout(() => navigate(`/outbound/pickList/pick/zones/${pickListId}`), 210)

            dispatch(
                openSnackbar({
                    open: true,
                    message: data?.message || 'location and bin scanned successfully',
                    variant: 'alert',
                    alert: { color: 'success', icon: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return true
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message:
                        error?.message ||
                        error?.response?.message ||
                        error?.response?.data?.message ||
                        'unable to scan bin/location at the moment, please try again',
                    variant: 'alert',
                    alert: { color: 'error', icon: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return false
        }
    }

    // Focus the Pick Bin field on open
    useEffect(() => {
        setTimeout(() => {
            if (scannedValRef?.current) {
                scannedValRef.current.focus()
            }
        }, 100)
        // focus the pickBin input when the modal opens
        if (isModalOpen && pickBin?.current) {
            pickBin.current.focus()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (pickListResponse)
            setPickLists(
                pickListResponse?.data?.assignedPick?.map(item => ({
                    picklistNo: item.no,
                    quantity: item.quantity,
                    pending: item.pending_quantity,
                    isSlACritical: item?.is_sla_critical || false,
                    pick_id: item?.id
                }))
            )
    }, [pickListResponse])

    useEffect(() => {
        // eslint-disable-next-line no-console
        if (apiError) console.error('error in fetch list api ', apiError)
    }, [apiError])

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '86vh', paddingY: 2 }}>
            {/* Top Bar */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'white',
                    paddingTop: 0.5,
                    paddingBottom: 1,
                    borderBottom: '1px solid',
                    borderColor: 'primary.light',
                    marginBottom: 1
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HandScannerIcon width={24} height={24} />
                    <Typography variant='h3'>Start Picking</Typography>
                </Box>
            </Box>
            <Box sx={{ paddingY: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <ScannableInputForm
                    initialValues={{ scannedValue: '' }}
                    validationSchema={validationSchema}
                    handleSubmit={handleSubmit}
                    loading={selfAssignReqLKey}
                    fields={[
                        {
                            name: 'scannedValue',
                            label: 'Scan or enter Picklist ID/Order Number*',
                            placeholder: 'Type here or scan...',
                            ref: scannedValRef,
                            // isDisabled: isVerified.scannedValue
                            isDisabled: selfAssignReqLKey,
                            isVerified: isVerified.scannedValue
                        }
                    ]}
                    scannerEnabled
                    submitButtonText='Next'
                    gridProps={{ container: true }}
                    showDivider={false}
                />
            </Box>

            {/* Content: List of Picklists */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    backgroundColor: 'grey.bgLighter',
                    border: '1px solid',
                    borderColor: 'grey.borderLight',
                    borderRadius: '8px',
                    marginX: 0.5,
                    ...(assignedToMePickListLKey && {
                        justifyContent: 'center',
                        alignItems: 'center'
                    })
                }}
            >
                <Typography variant='h4'>
                    {assignedToMePickListLKey ? 'Fetching pick list' : 'Assigned Pick List'}
                </Typography>
                {assignedToMePickListLKey && (
                    <Box>
                        <CircularProgress color='success' size={25} />
                    </Box>
                )}
                {!assignedToMePickListLKey && !pickLists.length && (
                    <Box>
                        <Typography variant='h4'>
                            No picks have been assigned to you yet. You can self-assign picks using the Pick-No or
                            Order-No, or wait for them to be assigned to you.
                        </Typography>
                    </Box>
                )}
                {pickLists?.map(item => {
                    const borderColor = item.isSlACritical ? 'error.main' : '#ccc'
                    // Subtle shadow if not critical, a heavier red shadow if critical
                    const boxShadow = item.isSlACritical
                        ? '0px 8px 17px #de3b4026, 0px 0px 2px #de3b401F'
                        : '0px 2px 4px rgba(0, 0, 0, 0.1)'

                    return (
                        <Box
                            key={item.id}
                            sx={{
                                border: '1px solid',
                                borderColor,
                                borderRadius: 2,
                                p: 1,
                                mb: 0.2,
                                boxShadow,
                                cursor: 'pointer',
                                backgroundColor: 'white',
                                transition: 'box-shadow 0.2s ease-in-out',
                                '&:hover': {
                                    scale: 1.004,
                                    boxShadow: item.isSlACritical
                                        ? '0px 8px 17px rgba(222, 59, 65, 0.53), 0px 0px 2px rgba(222, 59, 65, 0.52)'
                                        : '0px 4px 8px rgba(0, 0, 0, 0.15)'
                                }
                            }}
                            onClick={() => {
                                if (item.pick_id) {
                                    setPickListId(item.pick_id)
                                    setIsModalOpen(true)
                                }
                            }}
                        >
                            <Typography fontWeight='bold' sx={{ display: 'flex', alignItems: 'center' }}>
                                Picklist No : &nbsp;
                                <Typography
                                    fontWeight='bold'
                                    sx={{ color: item.isSlACritical ? 'error.main' : 'success.main' }}
                                >
                                    {item.picklistNo}
                                </Typography>
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography
                                    variant='body2'
                                    color='text.secondary'
                                    sx={{ display: 'flex', alignItems: 'center' }}
                                >
                                    Quantity:
                                    <Typography sx={{ fontWeight: 'bold', ml: 0.5 }}>{item.quantity}</Typography>
                                </Typography>

                                <Typography
                                    variant='body2'
                                    color='text.secondary'
                                    sx={{ display: 'flex', alignItems: 'center' }}
                                >
                                    Pending Quantity:
                                    <Typography sx={{ color: 'error.main', ml: 0.5 }}>{item.pending}</Typography>
                                </Typography>
                            </Box>
                        </Box>
                    )
                })}
            </Box>
            <ScanInputModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                pickBinRef={pickBin}
                storageLocationRef={storageLocation}
                onSubmit={handelBinAndLocationScan}
                loading={scanBinForPickLKey}
            />
        </Box>
    )
}

export default Index
