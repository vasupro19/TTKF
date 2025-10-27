import React, { useEffect, useRef } from 'react'
import { Box, Divider, Typography } from '@mui/material'
import { z } from 'zod'
import ScannableInputForm from '@/core/components/ScannableInputForm'

function ScanUID({ tableId, setScannedUID }) {
    const uidInputRef = useRef(null)

    // Memoize the validation schema so it isn't recreated on every render
    const validationSchema = z.object({
        uid: z
            .string()
            .trim() // This removes whitespace from both ends
            .min(1, 'UID is required')
    })

    const handleSubmit = (values, { resetForm }) => {
        console.log('Form submitted:', values)
        setScannedUID(values.uid) // Set the scanned UID in local storage or state
        // Perform any additional actions with the scanned UID here
        uidInputRef.current?.focus()
        resetForm()
    }

    useEffect(() => {
        if (tableId) {
            uidInputRef.current?.focus()
        }
    }, [tableId])

    return (
        <Box
            sx={{
                width: { lg: '440px', sm: '440px', xs: '360px' },
                padding: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.borderLight',
                boxShadow: 'rgba(50, 50, 93, 0.25) 0px 30px 60px -12px, rgba(0, 0, 0, 0.3) 0px 18px 36px -18px',
                backgroundColor: '#fff'
            }}
        >
            <Typography variant='h4'>Scan Or Enter UID</Typography>
            <Divider sx={{ borderColor: 'primary.main', marginBottom: 2 }} />
            <ScannableInputForm
                initialValues={{ uid: '' }}
                validationSchema={validationSchema}
                handleSubmit={handleSubmit}
                fields={[
                    {
                        name: 'uid',
                        label: 'UID*',
                        placeholder: 'eg: DKJH989',
                        ref: uidInputRef
                    }
                ]}
                scannerEnabled={false}
                submitButtonText='Submit'
                gridProps={{ container: true }}
            />
        </Box>
    )
}

export default React.memo(ScanUID)
