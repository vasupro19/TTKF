import React, { useEffect, useRef } from 'react'
import { Box, Divider, Typography } from '@mui/material'
import { z } from 'zod'
import ScannableInputForm from '@/core/components/ScannableInputForm'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'
import { Print } from '@mui/icons-material'
import { setBoxId, setCurrentStep, setScannedOrderId } from '@/app/store/slices/b2bPackingSlice'
import { scanPackOrder } from '@/app/store/slices/api/packSlice'
import { handleQRGeneration } from '@/utilities'

function ScanOrderID() {
    const dispatch = useDispatch()
    const orderIDRef = useRef(null)
    const { tableId } = useSelector(state => state.b2bPacking)
    const { scanPackOrderLKey } = useSelector(state => state.loading)

    const validationSchema = z.object({
        orderId: z
            .string()
            .trim() // This removes whitespace from both ends
            .min(1, 'Order ID is required')
    })

    const handleSubmit = async (values, { resetForm }) => {
        let isError = false
        let message

        try {
            const { data } = await dispatch(scanPackOrder.initiate(values.orderId))

            message = 'Order Scanned successfully'
            if (!data?.data?.orderDetail?.id || !data?.data?.box_no)
                throw new Error('packed or invalid order no scanned')

            dispatch(setScannedOrderId(data?.data?.orderDetail.id)) // Set the scanned UID in local storage or state
            dispatch(setBoxId(data?.data?.box_no))
            dispatch(setCurrentStep('SCAN_BOX_ID'))

            // generate box label
            await handleQRGeneration([data?.data?.box_no], `box_${data?.data?.box_no}_label`)

            // Perform any additional actions with the scanned UID here
            resetForm()
        } catch (error) {
            isError = true
            message = error?.data?.data?.message || error?.data?.message || error?.message || 'unable to scan order id'
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message: (
                        <Typography display='flex' alignItems='center'>
                            {message}
                        </Typography>
                    ),
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'info', icon: isError ? 'error' : 'info' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' },
                    autoHideDuration: 3000
                })
            )
        }
    }

    useEffect(() => {
        if (tableId) {
            orderIDRef.current?.focus()
        }
    }, [tableId])

    return (
        <Box
            sx={{
                width: { lg: '440px', sm: '440px', xs: '360px' },
                padding: 1
            }}
        >
            <Typography variant='h4'>Scan Or Enter Order ID</Typography>
            <Divider sx={{ borderColor: 'primary.main', marginBottom: 2 }} />
            <ScannableInputForm
                initialValues={{ orderId: '' }}
                validationSchema={validationSchema}
                handleSubmit={handleSubmit}
                fields={[
                    {
                        name: 'orderId',
                        label: 'Order ID*',
                        placeholder: 'eg: DKJH989',
                        ref: orderIDRef
                    }
                ]}
                scannerEnabled={false}
                submitButtonText='Next'
                gridProps={{ container: true }}
                loading={scanPackOrderLKey}
            />
        </Box>
    )
}

export default React.memo(ScanOrderID)
