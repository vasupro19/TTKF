import React, { useEffect, useRef } from 'react'
import { Box, Divider, Typography } from '@mui/material'
import { z } from 'zod'
import ScannableInputForm from '@/core/components/ScannableInputForm'
import CustomButton from '@/core/components/extended/CustomButton'
import { RefreshAnimIcon } from '@/assets/icons/RefreshAnimIcon'
import { useDispatch, useSelector } from 'react-redux'
import { setBoxId, setCurrentStep } from '@/app/store/slices/b2bPackingSlice'

function ScanBoxId() {
    const dispatch = useDispatch()
    const { boxId } = useSelector(state => state.b2bPacking)

    const boxIdRef = useRef(null)

    const handleSubmit = (values, { resetForm }) => {
        // eslint-disable-next-line no-console
        console.log('Form submitted: boxId', values)
        dispatch(setBoxId(values?.boxId))
        dispatch(setCurrentStep('PACKING'))

        resetForm()
    }
    useEffect(() => {
        boxIdRef.current?.focus()
    }, [])

    return (
        <Box
            sx={{
                width: { lg: '440px', sm: '440px', xs: '360px' },
                padding: 1
            }}
        >
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
                <Typography variant='h4'>Scan Box Label</Typography>
                <CustomButton
                    variant='outlined'
                    size='small'
                    shouldAnimate
                    startIcon={<RefreshAnimIcon />}
                    customStyles={{
                        height: '30px'
                    }}
                >
                    Retry Printing
                </CustomButton>
            </Box>

            <Divider sx={{ borderColor: 'primary.main', marginBottom: 2 }} />

            <ScannableInputForm
                initialValues={{ boxId: boxId || '' }}
                validationSchema={z.object({
                    boxId: z.string().trim().min(1, 'Box ID is required')
                })}
                handleSubmit={handleSubmit}
                fields={[
                    {
                        name: 'boxId',
                        label: 'Box ID*',
                        placeholder: 'scan or enter',
                        ref: boxIdRef,
                        value: boxId
                    }
                ]}
                scannerEnabled={false}
                submitButtonText='Next'
                gridProps={{ container: true }}
            />
        </Box>
    )
}

export default React.memo(ScanBoxId)
