import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Box, TextField, Autocomplete, Grid, MenuItem, Typography } from '@mui/material'
import { useGetSuppliersQuery } from '@/app/store/slices/api/supplierSlice'
import { VEHICLE_NAMES } from '../guestDetailsForm/tripDetails'

// ? the agency's vehicles — the same list as the guest's trip details; any other can be typed
const VEHICLE_TYPES = VEHICLE_NAMES

const MEAL_PLANS = [
    { value: '', label: 'Not set' },
    { value: 'EP', label: 'Room only (EP)' },
    { value: 'CP', label: 'Breakfast (CP)' },
    { value: 'MAP', label: 'Breakfast & dinner (MAP)' },
    { value: 'AP', label: 'All meals (AP)' }
]

const TAXI_DETAILS = {
    vehicleType: '',
    pickupPoint: '',
    dropPoint: '',
    pickupTime: '',
    driverName: '',
    driverPhone: ''
}
const HOTEL_DETAILS = { mealPlan: '', extraBeds: '', inclusions: '' }

const dateOnly = value => (value ? new Date(value).toISOString().split('T')[0] : '')

const emptyState = type => ({
    id: null,
    supplierId: null,
    cost: '',
    remarks: '',
    startDate: '',
    endDate: '',
    quantity: '',
    roomType: '',
    type,
    paidAmount: 0,
    details: type === 'Hotel' ? { ...HOTEL_DETAILS } : { ...TAXI_DETAILS }
})

/**
 * One hotel or transport line of a booking: the supplier, dates and agreed cost, and what the supplier needs to
 * know — rooms, room type and meal plan for a hotel; vehicle, pickup, drop and the driver for transport. A new
 * line starts from the guest's trip details (`row.defaults`).
 */
function SupplierAssignmentForm({ type, onDataChange, row = null }) {
    const [formState, setFormState] = useState(() => emptyState(type))

    const { data: response, isLoading } = useGetSuppliersQuery(`type=${type}`)
    const suppliers = response?.data || []

    // 1. Sync data when editing (The "Hydration" Step), or start a new line from the trip's details
    useEffect(() => {
        const base = emptyState(type)
        if (row && row.id && row.supplierId) {
            const initialState = {
                ...base,
                id: row.id,
                supplierId: row.supplierId,
                // Ensure dates are formatted as YYYY-MM-DD for the HTML5 date input
                startDate: dateOnly(row.startDate),
                endDate: dateOnly(row.endDate),
                cost: row.cost || '',
                remarks: row.remarks || '',
                quantity: row.quantity || '',
                roomType: row.roomType || '',
                paidAmount: row.paidAmount || 0,
                type: row.type || type,
                details: { ...base.details, ...(row.details || {}) }
            }
            setFormState(initialState)
            onDataChange(initialState) // Inform parent of the initial edit data
            return
        }

        const defaults = row?.defaults || {}
        const startState = {
            ...base,
            ...defaults,
            details: { ...base.details, ...(defaults.details || {}) }
        }
        setFormState(startState)
        onDataChange(startState)
    }, [row, type, onDataChange])

    const updateParent = updates => {
        const newState = { ...formState, ...updates }
        setFormState(newState)
        onDataChange(newState)
    }
    const updateDetail = (field, value) => updateParent({ details: { ...formState.details, [field]: value } })

    // 2. Find the selected supplier object for Autocomplete
    const selectedSupplier = suppliers.find(s => s.id === formState.supplierId) || null
    const isHotel = type === 'Hotel'

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Autocomplete
                options={suppliers}
                loading={isLoading}
                value={selectedSupplier} // Crucial for showing the existing supplier
                getOptionLabel={option => `${option.businessname} (${option.city})`}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                onChange={(e, val) => updateParent({ supplierId: val?.id })}
                noOptionsText={`No ${type?.toLowerCase() || 'supplier'} providers found`}
                renderInput={params => (
                    <TextField
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...params}
                        label={isHotel ? 'Hotel' : 'Transporter'}
                        variant='outlined'
                    />
                )}
            />

            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label={isHotel ? 'Check-in' : 'Start date'}
                        type='date'
                        value={formState.startDate}
                        InputLabelProps={{ shrink: true }}
                        onChange={e => updateParent({ startDate: e.target.value })}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label={isHotel ? 'Check-out' : 'End date'}
                        type='date'
                        value={formState.endDate}
                        InputLabelProps={{ shrink: true }}
                        onChange={e => updateParent({ endDate: e.target.value })}
                    />
                </Grid>

                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label='Agreed cost'
                        type='number'
                        value={formState.cost}
                        onChange={e => updateParent({ cost: e.target.value })}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label={isHotel ? 'Rooms' : 'Vehicles'}
                        type='number'
                        value={formState.quantity}
                        inputProps={{ min: 1 }}
                        onChange={e => updateParent({ quantity: e.target.value })}
                    />
                </Grid>

                {isHotel ? (
                    <>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label='Room type'
                                placeholder='e.g. Deluxe, Cottage, Swiss tent'
                                value={formState.roomType}
                                inputProps={{ maxLength: 80 }}
                                onChange={e => updateParent({ roomType: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label='Meal plan'
                                value={formState.details.mealPlan || ''}
                                onChange={e => updateDetail('mealPlan', e.target.value)}
                            >
                                {MEAL_PLANS.map(plan => (
                                    <MenuItem key={plan.value || 'none'} value={plan.value}>
                                        {plan.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label='Extra beds / mattresses'
                                type='number'
                                value={formState.details.extraBeds}
                                inputProps={{ min: 0, max: 99 }}
                                onChange={e => updateDetail('extraBeds', e.target.value.replace(/[^0-9]/g, ''))}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label='Other inclusions'
                                placeholder='e.g. Bonfire, welcome drink'
                                value={formState.details.inclusions}
                                inputProps={{ maxLength: 200 }}
                                onChange={e => updateDetail('inclusions', e.target.value)}
                            />
                        </Grid>
                    </>
                ) : (
                    <>
                        <Grid item xs={12}>
                            <Autocomplete
                                freeSolo
                                options={VEHICLE_TYPES}
                                value={formState.details.vehicleType || ''}
                                onInputChange={(e, value) => updateDetail('vehicleType', value)}
                                renderInput={params => (
                                    <TextField
                                        // eslint-disable-next-line react/jsx-props-no-spreading
                                        {...params}
                                        label='Vehicle type'
                                        placeholder='e.g. Tempo Traveller 17 seater'
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label='Pickup point'
                                placeholder='e.g. Manali Volvo stand'
                                value={formState.details.pickupPoint}
                                inputProps={{ maxLength: 160 }}
                                onChange={e => updateDetail('pickupPoint', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label='Pickup time'
                                type='time'
                                value={formState.details.pickupTime}
                                InputLabelProps={{ shrink: true }}
                                onChange={e => updateDetail('pickupTime', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label='Drop point'
                                placeholder='e.g. Bhuntar Volvo stand'
                                value={formState.details.dropPoint}
                                inputProps={{ maxLength: 160 }}
                                onChange={e => updateDetail('dropPoint', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                Driver — once the transporter confirms. The guest’s transport email shows it.
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label='Driver name'
                                value={formState.details.driverName}
                                inputProps={{ maxLength: 80 }}
                                onChange={e => updateDetail('driverName', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label='Driver phone'
                                type='tel'
                                value={formState.details.driverPhone}
                                inputProps={{ maxLength: 20, inputMode: 'tel' }}
                                onChange={e => updateDetail('driverPhone', e.target.value)}
                            />
                        </Grid>
                    </>
                )}
            </Grid>

            <TextField
                fullWidth
                label='Special requests for the supplier'
                multiline
                rows={2}
                value={formState.remarks}
                onChange={e => updateParent({ remarks: e.target.value })}
            />
        </Box>
    )
}

SupplierAssignmentForm.propTypes = {
    type: PropTypes.oneOf(['Hotel', 'Taxi']).isRequired,
    onDataChange: PropTypes.func.isRequired,
    row: PropTypes.shape({
        id: PropTypes.number,
        supplierId: PropTypes.number,
        defaults: PropTypes.shape({ details: PropTypes.objectOf(PropTypes.string) })
    })
}

export default SupplierAssignmentForm
