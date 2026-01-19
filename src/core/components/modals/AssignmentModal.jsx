import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
    Box,
    Divider,
    CircularProgress
} from '@mui/material'
import { Close, Apartment, DirectionsCar } from '@mui/icons-material'
import CustomButton from '@core/components/extended/CustomButton'
import SupplierAssignmentForm from '../../../app/views/forms/supplier/supplierAssignment' // Your form component

function AssignmentModal({ open, onClose, type, row, onSave, isLoading }) {
    const [formData, setFormData] = useState({ supplierId: null, cost: '' })

    // Reset form whenever modal opens/closes
    useEffect(() => {
        if (!open) setFormData({ supplierId: null, cost: '' })
    }, [open])

    const handleSave = () => {
        if (!formData.supplierId || !formData.cost) return
        onSave(formData)
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth='xs'
            PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
        >
            <DialogTitle>
                <Box display='flex' alignItems='center' justifyContent='space-between'>
                    <Box display='flex' alignItems='center' gap={1}>
                        {type === 'Hotel' ? <Apartment color='primary' /> : <DirectionsCar color='secondary' />}
                        <Typography variant='h4'>Assign {type}</Typography>
                    </Box>
                    <IconButton onClick={onClose} size='small'>
                        <Close />
                    </IconButton>
                </Box>
                <Divider sx={{ mt: 1.5 }} />
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Typography variant='body2' color='textSecondary' gutterBottom>
                        Assigning for: <strong>{row?.guestName}</strong>
                    </Typography>
                    <SupplierAssignmentForm type={type} row={row} onDataChange={data => setFormData(data)} />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 0 }}>
                <CustomButton onClick={onClose} variant='outlined' color='inherit'>
                    Cancel
                </CustomButton>
                <CustomButton
                    onClick={handleSave}
                    variant='contained'
                    disabled={isLoading || !formData.supplierId || !formData.cost}
                >
                    {isLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                    Save Details
                </CustomButton>
            </DialogActions>
        </Dialog>
    )
}

export default AssignmentModal
