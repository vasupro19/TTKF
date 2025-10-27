import React, { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { useDispatch } from 'react-redux'
import TitleModalWrapper from '@/core/components/TitleModalWrapper'
import ScannableInputForm from '@/core/components/ScannableInputForm'

// eslint-disable-next-line react/prop-types
export default function ChangeBinModal({ isModalOpen, setIsModalOpen }) {
    const dispatch = useDispatch()
    const pickBinRef = useRef(null)
    const dropLocationRef = useRef(null)
    const [isVerified, setIsVerified] = useState({
        dropLocation: false,
        pickBin: false
    })

    const initialValues = {
        dropLocation: '',
        pickBin: ''
    }

    // Zod validation schema (dropLocation required for pickBin to proceed)
    const validationSchema = z.object({
        dropLocation: z.string().refine(value => value.trim().length > 0, {
            message: 'Drop Location is required'
        }),
        pickBin: z.string().refine(value => value.trim().length > 0, {
            message: 'Pick Bin is required'
        })
    })

    // Handle form submission
    const handleSubmit = (values, { resetForm }) => {
        // eslint-disable-next-line no-console
        console.log('values from scan drop location modal:', values)
        resetForm()
        setIsVerified({
            dropLocation: false,
            pickBin: false
        })
        dispatch(
            openSnackbar({
                open: true,
                message: 'Successfully Changed!',
                variant: 'alert',
                alert: { color: 'info', icon: 'info' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            })
        )
        setTimeout(() => {
            setIsModalOpen(false)
        }, 100)
    }

    // Define form fields
    const fields = [
        {
            name: 'dropLocation',
            label: 'Scan Drop Location*',
            placeholder: 'Scan any location',
            ref: dropLocationRef,
            isDisabled: isVerified.dropLocation,
            isVerified: isVerified.dropLocation,
            onKeyPress: e => {
                if (e.key === 'Enter' && e.target.value.trim().length > 0) {
                    setIsVerified(prev => ({ ...prev, dropLocation: true }))
                    setTimeout(() => {
                        pickBinRef?.current?.focus()
                    }, 100)
                }
            },
            sx: {
                mb: 1.5
            }
        },
        {
            name: 'pickBin',
            label: 'Scan Pick Bin*',
            placeholder: 'Scan or enter Pick Bin',
            ref: pickBinRef,
            isDisabled: !isVerified.dropLocation
        }
    ]

    // Focus Drop Location input on open
    useEffect(() => {
        if (isModalOpen) {
            setTimeout(() => {
                if (dropLocationRef?.current) {
                    dropLocationRef.current.focus()
                }
            }, 100)
        }
        setIsVerified({
            dropLocation: false,
            pickBin: false
        })
    }, [isModalOpen])

    return (
        <TitleModalWrapper
            title='Scan Drop & Pick Bin Locations'
            isOpen={isModalOpen}
            setIsOpen={setIsModalOpen}
            boxContainerSx={{
                width: { xs: '340px', sm: '400px' }
            }}
            onClose={() => {
                setIsModalOpen(false)
            }}
            closeOnBackdropClick={false}
        >
            <ScannableInputForm
                fields={fields}
                initialValues={initialValues}
                validationSchema={validationSchema}
                handleSubmit={handleSubmit}
                showSubmitButton
                submitButtonText='Submit'
                submitButtonStyle={{
                    textTransform: 'none',
                    backgroundColor: '#000',
                    color: '#fff',
                    height: '28px',
                    '&:hover': { backgroundColor: '#333' }
                }}
                scannerEnabled
                showDivider
                gridProps={{ container: true, spacing: 0 }}
                footerMessage='Scan both inputs to continue'
            />
        </TitleModalWrapper>
    )
}
