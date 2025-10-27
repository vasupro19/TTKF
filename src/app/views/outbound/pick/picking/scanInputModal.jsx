/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import ScannableInputForm from '@/core/components/ScannableInputForm'
import TitleModalWrapper from '@/core/components/TitleModalWrapper'

export default function ScanInputModal({
    isModalOpen,
    setIsModalOpen,
    storageLocationRef,
    pickBinRef,
    onSubmit,
    loading
}) {
    const [isVerified, setIsVerified] = useState({
        pickBin: false,
        storageLocation: false
    })

    // Define the initial form values
    const initialValues = {
        pickBin: '',
        storageLocation: ''
    }

    // Zod validation schema
    const validationSchema = z.object({
        pickBin: z.string().refine(value => value.trim().length > 0, {
            message: 'Pick Bin is required'
        }),
        storageLocation: z.string().refine(value => value.trim().length > 0, {
            message: 'Location is required'
        })
    })

    // Reset verification state when modal opens
    useEffect(() => {
        if (isModalOpen) {
            setTimeout(() => {
                // eslint-disable-next-line react/prop-types
                if (pickBinRef?.current) {
                    // eslint-disable-next-line react/prop-types
                    pickBinRef.current.focus()
                }
            }, 100)
        }
        setIsVerified({
            storageLocation: false,
            pickBin: false
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isModalOpen])

    // Handle form submission
    const handleSubmit = async (values, { resetForm }) => {
        if (!onSubmit) throw new Error('submit callback is required !🤨')
        // eslint-disable-next-line no-console
        const response = await onSubmit(values)
        resetForm()
        setIsVerified({
            storageLocation: false,
            pickBin: false
        })
        if (response)
            setTimeout(() => {
                setIsModalOpen(false)
            }, 100)
    }

    // Define form fields
    const fields = [
        {
            name: 'pickBin',
            label: 'Scan Pick Bin*',
            placeholder: 'Scan or enter Pick Bin',
            ref: pickBinRef,
            isVerified: isVerified.pickBin,
            isDisabled: isVerified.pickBin,
            onKeyPress: e => {
                if (e.key === 'Enter' && e.target.value.trim().length > 0) {
                    setIsVerified(prev => ({ ...prev, pickBin: true }))
                    setTimeout(() => {
                        // eslint-disable-next-line react/prop-types
                        storageLocationRef?.current?.focus()
                    }, 100)
                }
            },
            sx: {
                mb: 1.5
            }
        },
        {
            name: 'storageLocation',
            label: 'Storage Location*',
            placeholder: 'Scan any location',
            ref: storageLocationRef,
            isDisabled: !isVerified.pickBin
        }
    ]

    return (
        <TitleModalWrapper
            title='Scan Any Location'
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
                loading={loading}
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
                footerMessage='Scan any location near by you'
            />
        </TitleModalWrapper>
    )
}
