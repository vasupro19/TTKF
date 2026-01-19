import React, { useState, useEffect } from 'react'
import { Box, TextField, Autocomplete, CircularProgress, Grid } from '@mui/material'
import { useGetSuppliersQuery } from '@/app/store/slices/api/supplierSlice'

function SupplierAssignmentForm({ type, onDataChange, row }) {
    // added row prop
    const [formState, setFormState] = useState({
        id: null, // Keep track of service ID for updates
        supplierId: null,
        cost: '',
        remarks: '',
        startDate: '',
        endDate: '',
        quantity: '',
        type,
        paidAmount: 0
    })

    const { data: response, isLoading } = useGetSuppliersQuery(`type=${type}`)
    const suppliers = response?.data || []
    console.log(row, 'row')

    // 1. Sync data when editing (The "Hydration" Step)
    useEffect(() => {
        if (row && row.id) {
            const initialState = {
                id: row.id,
                supplierId: row.supplierId,
                // Ensure dates are formatted as YYYY-MM-DD for the HTML5 date input
                startDate: row.startDate ? new Date(row.startDate).toISOString().split('T')[0] : '',
                endDate: row.endDate ? new Date(row.endDate).toISOString().split('T')[0] : '',
                cost: row.cost || '',
                remarks: row.remarks || '',
                quantity: row.quantity || '',
                paidAmount: row.paidAmount || 0,
                type: row.type || type
            }
            setFormState(initialState)
            onDataChange(initialState) // Inform parent of the initial edit data
        }
    }, [row])

    const updateParent = updates => {
        const newState = { ...formState, ...updates }
        setFormState(newState)
        onDataChange(newState)
    }

    // 2. Find the selected supplier object for Autocomplete
    const selectedSupplier = suppliers.find(s => s.id === formState.supplierId) || null

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Autocomplete
                options={suppliers}
                loading={isLoading}
                value={selectedSupplier} // Crucial for showing the existing supplier
                getOptionLabel={option => `${option.businessname} (${option.city})`}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                onChange={(e, val) => updateParent({ supplierId: val?.id })}
                // eslint-disable-next-line react/jsx-props-no-spreading
                renderInput={params => <TextField {...params} label={`Select ${type}`} variant='outlined' />}
            />

            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label={type === 'Hotel' ? 'Check-in Date' : 'Start Date'}
                        type='date'
                        value={formState.startDate} // Add value prop
                        InputLabelProps={{ shrink: true }}
                        onChange={e => updateParent({ startDate: e.target.value })}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label={type === 'Hotel' ? 'Check-out Date' : 'End Date'}
                        type='date'
                        value={formState.endDate} // Add value prop
                        InputLabelProps={{ shrink: true }}
                        onChange={e => updateParent({ endDate: e.target.value })}
                    />
                </Grid>

                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label='Agreed Cost'
                        type='number'
                        value={formState.cost} // Add value prop
                        onChange={e => updateParent({ cost: e.target.value })}
                    />
                </Grid>

                {/* ... Repeat 'value={formState.xyz}' for other fields like quantity and paidAmount ... */}
            </Grid>

            <TextField
                fullWidth
                label='Remarks'
                multiline
                rows={2}
                value={formState.remarks} // Already has value
                onChange={e => updateParent({ remarks: e.target.value })}
            />
        </Box>
    )
}

export default SupplierAssignmentForm
