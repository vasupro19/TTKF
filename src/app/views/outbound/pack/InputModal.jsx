import NoCloseModal from '@/core/components/NoCloseModal'
import ScannableInputForm from '@/core/components/ScannableInputForm'
import { LOCAL_STORAGE_KEYS, useLocalStorage } from '@/hooks/useLocalStorage'
import { Box, Divider, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import React, { useRef } from 'react'
import { z } from 'zod'

export default function InputModal({ onSubmit, open, onClose }) {
    const tableIDRef = useRef(null)
    const [tableId, setTableId] = useLocalStorage(LOCAL_STORAGE_KEYS.tableId, null)
    return (
        <NoCloseModal
            open={open}
            onClose={onClose}
            initialFocusRef={tableIDRef} // Auto-focus the scan input
        >
            <Box sx={{ padding: 1 }}>
                <Typography variant='h4'>Scan Or Enter Table ID</Typography>
                <Divider sx={{ borderColor: 'primary.main', marginBottom: 1 }} />

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    <ScannableInputForm
                        initialValues={{ tableId }}
                        validationSchema={z.object({
                            tableId: z
                                .string()
                                .trim() // This removes whitespace from both ends
                                .min(1, 'Table ID is required')
                                .max(6, 'Table ID must be 6 characters or less')
                        })}
                        handleSubmit={(values, ctx) => {
                            onSubmit(values, ctx)
                            setTableId(values.tableId)
                        }}
                        fields={[
                            {
                                name: 'tableId',
                                label: 'Table Id*',
                                placeholder: 'eg: A1',
                                sx: { marginTop: 0.5, marginBottom: 1 },
                                ref: tableIDRef
                            }
                        ]}
                        scannerEnabled
                        showSubmitButton
                        submitButtonText='Confirm'
                        gridProps={{ container: true, spacing: 0 }}
                    />
                </Box>
            </Box>
        </NoCloseModal>
    )
}

InputModal.propTypes = {
    onSubmit: PropTypes.func,
    open: PropTypes.bool,
    onClose: PropTypes.func
}
