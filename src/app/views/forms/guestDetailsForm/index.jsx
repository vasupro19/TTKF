import React, { useState, useCallback, useEffect } from 'react'
import { z } from 'zod'
import { useFormik } from 'formik'

// router
import { useParams, useNavigate } from 'react-router-dom'

// theme components
import {
    Box,
    Button,
    Divider,
    Grid,
    TextField,
    Autocomplete,
    Typography,
    CircularProgress,
    InputAdornment
} from '@mui/material'
import {
    LocationOn,
    Description,
    Photo,
    Edit,
    Delete,
    // LocationOn,
    AttachMoney, // For the new section header
    Save,
    Share,
    CheckCircle
} from '@mui/icons-material'
import { motion } from 'framer-motion'

// components
import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
import MyTabs from '@/core/components/CapsuleTabs'

// redux imports
import { useDispatch, useSelector } from 'react-redux'
import {
    useCreateGuestDetailMutation,
    useUpdateGuestDetailMutation,
    getGuestById
} from '@/app/store/slices/api/guestSlice'
import {
    useCreateGuestTourMutation,
    useUpdateGuestTourMutation,
    useCreateSingleGuestTourItenaryMutation,
    getGuestTourById,
    useRemoveGuestTourItenaryMutation
} from '@/app/store/slices/api/guestTourSlice'
import { useShareLeadDetailsMutation } from '@/app/store/slices/api/leadSlice'
import { useGetAllPackagesClientQuery } from '@/app/store/slices/api/packageSlice'
import { getItenaryClientById, useGetItenaryClientsQuery } from '@/app/store/slices/api/itenarySlice'
import { useGetDestinationClientsQuery } from '@/app/store/slices/api/destinationSlice'

import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'
import GlobalModal from '../../../../core/components/modals/GlobalModal'
import GuestTourPriceForm from './pricingTour'
import PackageConversion from './packageConvertModal'

function GuestForm() {
    const { id: formId } = useParams()
    const params = useParams()

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [editData, setEditData] = useState({})
    const [editBool, setEditBool] = useState(false)
    // const [stayBreakdown, setstaysBreakdown] = useState([])

    const { createLeadLKey, updateLeadLKey } = useSelector(state => state.loading)

    const [activeTab, setActiveTab] = useState(0)
    const [tabsEnabled, setTabsEnabled] = useState([true, false])
    const [leadId, setLeadId] = useState(null)
    const { removeGuestTourItenaryKey } = useSelector(state => state.loading)

    const [createGuest] = useCreateGuestDetailMutation()
    const [updateGuest] = useUpdateGuestDetailMutation()
    const [createTour] = useCreateGuestTourMutation()
    const [updateTour] = useUpdateGuestTourMutation()
    const [removeTour] = useRemoveGuestTourItenaryMutation()

    const [createSingleTour] = useCreateSingleGuestTourItenaryMutation()
    const [shareLeadDetails, { isLoading }] = useShareLeadDetailsMutation()

    const { data: packages = [], isLoading: loadingPackages } = useGetAllPackagesClientQuery()
    const { data: itenaries = [], isLoading: loadingItenary } = useGetItenaryClientsQuery()
    const { data: destinations = [], isLoading: loadingDestinations } = useGetDestinationClientsQuery()

    const [selectedPackage, setSelectedPackage] = useState([])

    const [openItenaryModal, setOpenItenaryModal] = useState(false)

    const [formData, setFormData] = useState({
        itenaryId: '',
        title: '',
        leadId: params.leadId,
        description: '',
        destinationId: '',
        destination: '', // Name of the destination
        image: ''
    })
    const [isEditing, setisEditing] = useState(false)
    const [editingData, setEditingData] = useState({})
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false)

    // Initial Values
    const initialValues = {
        // ✅ Guest Details
        tourType: '',
        taxiType: '',
        packageType: '',
        foodPlan: '',
        adults: '',
        children: '',
        rooms: '',
        extraBedding: '',
        pickupDate: '',
        pickupLocation: '',
        dropDate: '',
        dropLocation: '',
        originState: '',
        contactQuality: '',
        contactStatus: '',
        leadRemarks: '',
        leadId: params.leadId
        // packageId: ''
    }

    // Validation schema per tab
    const validationSchema = [
        z.object({
            tourType: z.string().optional(),
            taxiType: z.string().optional(),
            packageType: z.string().optional(),
            foodPlan: z.string().optional(),
            adults: z.number().optional(),
            children: z.number().optional(),
            rooms: z.number().optional(),
            extraBedding: z.number().optional(),
            pickupDate: z.string().optional(),
            pickupLocation: z.string().optional(),
            dropDate: z.string().optional(),
            dropLocation: z.string().optional(),
            originState: z.string().optional(),
            contactQuality: z.string().optional(),
            contactStatus: z.string().optional(),
            leadRemarks: z.string().optional()
        })
    ]

    const validate = values => {
        try {
            validationSchema[activeTab].parse(values)
            return {}
        } catch (error) {
            const formikErrors = {}
            error.errors.forEach(err => {
                formikErrors[err.path[0]] = err.message
            })
            return formikErrors
        }
    }

    const enableTabsAfterValidation = upToIndex => {
        const updated = tabsEnabled.map((enabled, index) => index <= upToIndex)
        setTabsEnabled(updated)
    }

    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        onSubmit: async values => {
            try {
                let response
                if (!editBool) {
                    response = await createGuest(values).unwrap()
                    setLeadId(response.data.id)
                    navigate(-1)

                    setActiveTab(0)
                    enableTabsAfterValidation(1)
                } else {
                    response = await updateGuest({ id: leadId, ...values }).unwrap()
                    formik.resetForm()
                    setActiveTab(0)
                    setTabsEnabled([true, false])
                    navigate(-1)
                }

                if (response.success && response.status_code === 200) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: response.message || 'Lead saved successfully!',
                            variant: 'alert',
                            alert: { color: 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                }
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: error.data?.data?.message || 'Something went wrong',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
            }
        },
        validateOnBlur: true,
        validateOnChange: true,
        validate
    })

    const handleTabChange = (event, newVal) => {
        console.log(newVal)
        if (tabsEnabled[newVal]) setActiveTab(newVal)
    }

    const getLead = async id => {
        const { data, error } = await dispatch(getGuestById.initiate(id))
        if (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please Add Guest Details',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
        if (!data?.data || !objectLength(data.data)) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please Add Guest Details',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            // navigate(-1)
        } else {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Guest Details Fetched Successfully',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            setEditBool(true)
            setEditData(data.data)
        }
    }

    const getGuestTour = async id => {
        const { data, error } = await dispatch(getGuestTourById.initiate(id))
        if (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please Add Tour Details',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
        if (!data?.data || !objectLength(data.data)) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please Add Tour Details',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            // navigate(-1)
        } else {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Tour Details Fetched Successfully',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            // setEditBool(true)
            console.log(data.data, 'data')
            const formatted = data.data.map(item => ({
                title: item.title,
                description: item?.description || item.itenary?.description || '',
                image: item.image || '',
                destination: item.destination?.name || '',
                hotels: {
                    deluxe: item.destination.delux_hotel,
                    superDeluxe: item.destination.super_delux_hotel,
                    luxury: item.destination.luxury_hotel,
                    premium: item.destination.premium_hotel
                },
                fullItem: item // keep complete raw data if needed later
            }))

            setSelectedPackage(formatted)
        }
    }

    const editHandler = (id, row) => {
        setLeadId(row.id)

        const numberFields = ['adults', 'children', 'rooms', 'extraBedding']

        const formatted = {}

        Object.keys(row).forEach(key => {
            if (numberFields.includes(key)) {
                formatted[key] = row[key] !== null && row[key] !== undefined ? Number(row[key]) : undefined
            } else {
                formatted[key] = row[key] != null ? row[key].toString() : ''
            }
        })

        formik.setValues({ ...formatted })
        enableTabsAfterValidation(1)
    }

    useEffect(() => {
        if (params.leadId) {
            getLead(params.leadId)
        }
        if (activeTab === 1) {
            getGuestTour(params.leadId)
        }
    }, [params.leadId, activeTab])

    useEffect(() => {
        if (editData && objectLength(editData)) editHandler(params.leadId, editData)
    }, [editData])

    const customSx = {
        '& input': {
            backgroundColor: '#fff',
            padding: '12px 8px'
        },
        '& .MuiInputBase-root.MuiOutlinedInput-root': {
            backgroundColor: 'white'
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'gray'
        },
        flexGrow: 1
    }
    useEffect(() => {
        if (isEditing) {
            // Populate form with existing item data for editing
            setFormData({
                id: editingData.fullItem.id,
                itenaryId: editingData.fullItem?.itenaryId || '',
                title: editingData.title || '',
                leadId: params.leadId,
                description: editingData.description || editingData?.fullItem?.itenary?.description,
                destinationId: editingData.fullItem?.destinationId || '',
                destination: editingData.destination || '',
                image: editingData.image || ''
            })
        } else {
            // Reset form for adding a new item
            setFormData({
                itenaryId: '',
                title: '',
                description: '',
                destinationId: '',
                destination: '',
                image: ''
            })
        }
    }, [editingData, isEditing])
    const tabsFields = [
        {
            label: 'Guest Details',
            fields: [
                {
                    name: 'tourType',
                    label: 'Tour Type',
                    type: 'text',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'taxiType',
                    label: 'Taxi Type',
                    type: 'text',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'packageType',
                    label: 'Package Type',
                    type: 'text',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'foodPlan',
                    label: 'Food Plan',
                    type: 'text',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                { name: 'adults', label: 'Adults', type: 'number', grid: { xs: 12, sm: 4 }, size: 'small', customSx },
                {
                    name: 'children',
                    label: 'Children',
                    type: 'number',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                { name: 'rooms', label: 'Rooms', type: 'number', grid: { xs: 12, sm: 4 }, size: 'small', customSx },
                {
                    name: 'extraBedding',
                    label: 'Extra Bedding',
                    type: 'number',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'pickupDate',
                    label: 'Pickup Date',
                    type: 'date',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'pickupLocation',
                    label: 'Pickup Location',
                    type: 'text',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'dropDate',
                    label: 'Drop Date',
                    type: 'date',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'dropLocation',
                    label: 'Drop Location',
                    type: 'text',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'originState',
                    label: 'Origin State',
                    type: 'text',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'contactQuality',
                    label: 'Contact Quality',
                    type: 'select',
                    options: [
                        { label: 'Hot', value: 'Hot' },
                        { label: 'Warm', value: 'Warm' },
                        { label: 'Cold', value: 'Cold' }
                    ],
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'contactStatus',
                    label: 'Contact Status',
                    type: 'select',
                    options: [
                        { label: 'New', value: 'New' },
                        { label: 'In Progress', value: 'InProgress' },
                        { label: 'Closed', value: 'Closed' }
                    ],
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                { name: 'leadRemarks', label: 'Lead Remarks', type: 'text', grid: { xs: 12 }, size: 'small', customSx }
            ]
        },
        {
            label: 'Package & Itinerary',
            fields: [
                {
                    name: 'packageId',
                    label: 'Select Package',
                    type: 'CustomAutocomplete',
                    options: packages?.data?.map(pkg => ({
                        label: pkg.name,
                        value: pkg.id,
                        packageItenary: pkg.packageItenaries
                    })),
                    grid: { xs: 12, sm: 6 },
                    size: 'small',
                    customSx
                }
            ]
        }
    ]

    // eslint-disable-next-line no-shadow
    const handleCustomChange = async (e, formik) => {
        const { name, value } = e.target

        formik.handleChange(e)

        if (name === 'packageId') {
            // const pkg = packages?.data?.find(p => p.id === Number(value))

            const formatted = value.packageItenary.map(item => ({
                title: item.title,
                description: item.itenary?.description || '',
                image: item.image || '',
                destination: item?.destination?.name || 'FRESH UP',
                hotels: {
                    deluxe: item?.destination?.delux_hotel,
                    superDeluxe: item?.destination?.super_delux_hotel,
                    luxury: item?.destination?.luxury_hotel,
                    premium: item?.destination?.premium_hotel
                },
                fullItem: item // keep complete raw data if needed later
            }))
            const values = value.packageItenary.map(item => ({
                title: item.title,
                itenaryId: item.itenary.id || '',
                image: item.image || '',
                destinationId: item?.destination?.id || ''
                // leadId: params.leadId || ''
            }))

            setSelectedPackage(formatted) // <-- Array
            // values.map(item => createTour(item).unwrap())
            try {
                const res = await createTour({
                    leadId: params.leadId,
                    itenaryList: values
                }).unwrap()
            } catch (error) {
                console.error('Error:', error)
            }
        }
    }

    const handleAddItenary = async () => {
        try {
            const res = await createSingleTour({ ...formData, leadId: params.leadId }).unwrap()
            if (res.success) {
                setOpenItenaryModal(false)

                dispatch(getGuestTour(params.leadId))
                dispatch(
                    openSnackbar({
                        open: true,
                        message: res.message || 'Itenary added successfully!',
                        variant: 'alert',
                        alert: { color: 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
            }
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error.message || 'Itenary be cannot added!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            console.log(error)
        }

        // Reset form
        setFormData({
            itenaryId: '',
            title: '',
            description: '',
            destinationId: '',
            destination: '',
            image: ''
        })
    }
    const handleUpdateItenary = async () => {
        try {
            const res = await updateTour({ id: formData.id, ...formData, leadId: params.leadId }).unwrap()
            if (res.success) {
                setOpenItenaryModal(false)
                dispatch(
                    openSnackbar({
                        open: true,
                        message: res.message || 'Itenary updated successfully!',
                        variant: 'alert',
                        alert: { color: 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
                await getGuestTour(params.leadId)
            }
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error.message || 'Itenary be cannot updated!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            console.log(error)
        }
    }
    const handleDeleteItenary = async id => {
        try {
            const res = await removeTour(id).unwrap()
            if (res.success) {
                // setOpenItenaryModal(false)
                dispatch(
                    openSnackbar({
                        open: true,
                        message: res.message || 'Itenary deleted successfully!',
                        variant: 'alert',
                        alert: { color: 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
                dispatch(getGuestTour(params.leadId))
            }
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error.message || 'Itenary be cannot deleted!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            console.log(error)
        }
        // await getGuestTour(params.leadId)

        // Reset form
    }

    const onEditItem = (item, index) => {
        console.log(item)
        setisEditing(true)
        setOpenItenaryModal(true)

        // setEditingIndex(index)
        setEditingData(item)
        // // open your popup / drawer
        // setEditDrawer(true)
    }

    const onDeleteItem = async (item, index) => {
        console.log(item)
        const updated = selectedPackage.filter((_, i) => i !== index)
        setSelectedPackage(updated)
        await handleDeleteItenary(item?.fullItem?.id)
    }

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // 5. Autocomplete Options Handlers (Updated to use formData)
    const handleItinerarySelect = selected => {
        setFormData(prev => ({
            ...prev,
            itenaryId: selected?.id || '',
            title: selected?.title || '',
            description: selected?.description || ''
        }))
    }

    const handleDestinationSelect = selected => {
        setFormData(prev => ({
            ...prev,
            destinationId: selected?.id || '',
            destination: selected?.name || ''
        }))
    }

    // 6. Final Save Action
    const handleSaveAction = async () => {
        if (!isEditing) {
            await handleAddItenary()
        } else {
            await handleUpdateItenary()
        }
        // Pass the form data and the original item (for context) to the handler
        // handleSave(formData, currentItem)
        // setIsOpen(false)
    }

    // Function to calculate where the nights were stayed
    const calculateStayBreakdown = itineraries => {
        if (!itineraries || itineraries.length === 0) {
            return []
        }

        const staysBreakdown = []
        const travelDestinations = ['OVERNIGHT JOURNEY', 'FRESH UP', 'DAY JOURNEY']

        let currentStay = null

        // eslint-disable-next-line no-restricted-syntax
        for (const item of itineraries) {
            const destinationName = (item?.destination || '').toUpperCase()

            // Check if the current day is a true stay
            const isStayDay = !travelDestinations.includes(destinationName)

            if (isStayDay) {
                // Normalize the destination name (e.g., 'Shimla' instead of 'shimla')
                const displayDestination = item.destination

                if (currentStay && currentStay.destination === displayDestination) {
                    // If it's the same destination as the previous day, increment the count
                    currentStay.nights += 1
                } else {
                    // If it's a new destination or the first stay day, start a new count
                    currentStay = {
                        destination: displayDestination,
                        nights: 1
                    }
                    staysBreakdown.push(currentStay)
                }
            } else {
                // If it's a travel day, break the consecutive stay count
                currentStay = null
            }
        }
        // setstaysBreakdown(staysBreakdown)

        return staysBreakdown
    }
    const handleShare = async () => {
        try {
            await shareLeadDetails(params.leadId).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Mail sent successfully!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } catch (err) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: err.message || 'Itenary be cannot deleted!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }
    const handleConvertPackage = async () => {
        setIsConvertModalOpen(true)
        // 1. Check if price is already generated
        // 2. Open a Dialog/Modal to select specific Suppliers for this lead
        // 3. Calculate Profit: (Selected Quote Price) - (Supplier Costs)
        console.log('Initiating conversion for Lead:', params.leadId)

        // Example: Router.push(`/admin/bookings/convert/${params.leadId}`)
    }
    return (
        <MainCard
            sx={{ py: 2 }}
            contentSX={{ px: '2px', py: 1.5 }}
            title={!editBool ? 'Add Quotation' : 'Edit Quotation'}
        >
            <Grid container gap={4} sx={{ border: '1px solid #d0d0d0', px: 1.5, py: 2, borderRadius: '8px' }}>
                <Grid md={8} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <MyTabs
                            activeTab={activeTab}
                            handleTabChange={handleTabChange}
                            tabsFields={tabsFields}
                            tabsEnabled={tabsEnabled}
                        />
                        {activeTab === 1 && (
                            <Button
                                variant='contained'
                                onClick={() => {
                                    setisEditing(false)

                                    setOpenItenaryModal(true)
                                }}
                                sx={{ mb: 2 }}
                            >
                                Add Itinerary
                            </Button>
                        )}

                        <Box sx={{ padding: 2 }}>
                            <FormComponent
                                fields={tabsFields[activeTab].fields}
                                formik={formik}
                                handleCustomChange={handleCustomChange}
                                submitting={createLeadLKey || updateLeadLKey}
                                submitButtonText={editBool ? 'Update Details' : 'Add Details'}
                                submitButtonSx={{ textAlign: 'right', marginTop: 2 }}
                                showSeparaterBorder={false}
                            />
                        </Box>
                        {activeTab === 1 && selectedPackage.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <h3>Selected Package Itineraries</h3>
                                {(() => {
                                    const staysBreakdown = calculateStayBreakdown(selectedPackage)
                                    const totalNights = staysBreakdown.reduce((sum, stay) => sum + stay.nights, 0)

                                    return (
                                        <Box
                                            sx={{
                                                mb: 4,
                                                p: 3, // Increased padding for a more premium feel
                                                borderRadius: '16px',
                                                background: 'linear-gradient(135deg, #e3f2fd 0%, #f5faff 100%)',
                                                border: '1px solid #90caf9',
                                                boxShadow: '0px 4px 12px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    flexWrap: 'wrap',
                                                    gap: 2
                                                }}
                                            >
                                                <Box>
                                                    <h4
                                                        style={{
                                                            margin: 0,
                                                            color: '#1a73e8',
                                                            fontSize: '20px',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <LocationOn sx={{ mr: 1, fontSize: 24 }} />
                                                        Total Nights Stayed:{' '}
                                                        <strong style={{ marginLeft: '8px', fontSize: '24px' }}>
                                                            {totalNights}
                                                        </strong>
                                                    </h4>

                                                    {/* Stay Breakdown Chips */}
                                                    <Box sx={{ mt: 1.5, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                                        {staysBreakdown.map((stay, i) => (
                                                            <Box
                                                                key={Math.random(i)}
                                                                sx={{
                                                                    px: 2,
                                                                    py: 0.5,
                                                                    borderRadius: '20px',
                                                                    background: '#fff',
                                                                    border: '1px solid #bbdefb',
                                                                    color: '#1976d2',
                                                                    fontWeight: 600,
                                                                    fontSize: '13px',
                                                                    boxShadow: '0px 2px 4px rgba(0,0,0,0.03)'
                                                                }}
                                                            >
                                                                {stay.destination}: {stay.nights} Night
                                                                {stay.nights > 1 ? 's' : ''}
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Box>

                                                {/* Action Buttons Container */}
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <Button
                                                        variant='outlined'
                                                        color='success'
                                                        startIcon={<Share />}
                                                        onClick={handleShare}
                                                        disabled={isLoading}
                                                        sx={{
                                                            borderRadius: '10px',
                                                            fontWeight: 700,
                                                            textTransform: 'none',
                                                            px: 3,
                                                            borderWidth: '2px',
                                                            '&:hover': { borderWidth: '2px' }
                                                        }}
                                                    >
                                                        Share Details
                                                    </Button>

                                                    <Button
                                                        variant='contained'
                                                        color='primary'
                                                        startIcon={<CheckCircle />}
                                                        onClick={() => handleConvertPackage()} // We'll define this below
                                                        sx={{
                                                            borderRadius: '10px',
                                                            fontWeight: 700,
                                                            textTransform: 'none',
                                                            px: 3,
                                                            background:
                                                                'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
                                                            boxShadow: '0px 4px 12px rgba(26, 115, 232, 0.4)',
                                                            '&:hover': {
                                                                background:
                                                                    'linear-gradient(135deg, #1565c0 0%, #0a3d91 100%)'
                                                            }
                                                        }}
                                                    >
                                                        Convert Package
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    )
                                })()}
                                <GuestTourPriceForm tourId={params.leadId} />
                                <Grid container spacing={4}>
                                    {selectedPackage.map((item, index) => (
                                        <Grid item xs={12} key={item.id}>
                                            <motion.div
                                                initial={{ opacity: 0, y: 40 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: index * 0.15 }}
                                                style={{ display: 'flex' }}
                                            >
                                                {/* Timeline Line + Day Badge */}
                                                <Box
                                                    sx={{
                                                        position: 'relative',
                                                        width: '85px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    {/* Vertical Line */}
                                                    {index !== selectedPackage.length - 1 && (
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                top: '70px',
                                                                width: '5px',
                                                                height: 'calc(100% - 70px)',
                                                                background:
                                                                    'linear-gradient(to bottom, #90caf9, #1a73e8)',
                                                                borderRadius: 3
                                                            }}
                                                        />
                                                    )}

                                                    {/* Premium Day Badge */}
                                                    <motion.div
                                                        whileHover={{ scale: 1.1 }}
                                                        style={{
                                                            width: '65px',
                                                            height: '65px',
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #1a73e8, #4a90e2)',
                                                            color: '#fff',
                                                            fontSize: '18px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 700,
                                                            zIndex: 2,
                                                            boxShadow: '0px 8px 20px rgba(0,0,0,0.15)'
                                                        }}
                                                    >
                                                        Day {index + 1}
                                                    </motion.div>
                                                </Box>

                                                {/* Premium Card */}
                                                <motion.div
                                                    whileHover={{
                                                        scale: 1.01,
                                                        boxShadow: '0px 6px 20px rgba(0,0,0,0.2)'
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        marginLeft: '22px',
                                                        padding: '24px',
                                                        borderRadius: '20px',
                                                        border: '1px solid #e3e7ef',
                                                        background: '#ffffff',
                                                        boxShadow: '0px 4px 16px rgba(0,0,0,0.08)',
                                                        transition: '0.3s',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    {/* ---------- Edit + Delete Buttons ---------- */}
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 16,
                                                            right: 16,
                                                            display: 'flex',
                                                            gap: 1
                                                        }}
                                                    >
                                                        {/* Edit Button */}
                                                        <Box
                                                            onClick={() => onEditItem(item, index)}
                                                            sx={{
                                                                px: 2,
                                                                py: 1,
                                                                borderRadius: '10px',
                                                                cursor: 'pointer',
                                                                background: '#e3f2fd',
                                                                color: '#1976d2',
                                                                fontWeight: 600,
                                                                fontSize: '14px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                boxShadow: '0px 2px 6px rgba(0,0,0,0.1)',
                                                                '&:hover': { background: '#bbdefb' }
                                                            }}
                                                        >
                                                            <Edit sx={{ fontSize: 18 }} /> Edit
                                                        </Box>

                                                        {/* Delete Button */}
                                                        {!removeGuestTourItenaryKey ? (
                                                            <Box
                                                                onClick={() => onDeleteItem(item, index)}
                                                                sx={{
                                                                    px: 2,
                                                                    py: 1,
                                                                    borderRadius: '10px',
                                                                    cursor: 'pointer',
                                                                    background: '#ffebee',
                                                                    color: '#d32f2f',
                                                                    fontWeight: 600,
                                                                    fontSize: '14px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1,
                                                                    boxShadow: '0px 2px 6px rgba(0,0,0,0.1)',
                                                                    '&:hover': { background: '#ffcdd2' }
                                                                }}
                                                            >
                                                                <Delete sx={{ fontSize: 18 }} /> Delete
                                                            </Box>
                                                        ) : (
                                                            <CircularProgress />
                                                        )}
                                                    </Box>
                                                    <Grid container spacing={3}>
                                                        {/* Image Section */}
                                                        <Grid item xs={12} sm={4}>
                                                            <motion.img
                                                                src={item.image}
                                                                alt={item.itenary?.title}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                transition={{ duration: 0.6 }}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '240px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '14px',
                                                                    boxShadow: '0px 6px 14px rgba(0,0,0,0.1)'
                                                                }}
                                                            />
                                                        </Grid>

                                                        {/* Info Section */}
                                                        <Grid item xs={12} sm={8}>
                                                            <h2
                                                                style={{
                                                                    margin: 0,
                                                                    fontSize: '28px',
                                                                    fontWeight: 700,
                                                                    color: '#1d1d1d',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '10px'
                                                                }}
                                                            >
                                                                <Photo style={{ color: '#1a73e8' }} />
                                                                {item?.title}
                                                            </h2>

                                                            <p
                                                                style={{
                                                                    margin: '14px 0',
                                                                    fontSize: '15px',
                                                                    lineHeight: 1.7,
                                                                    color: '#444',
                                                                    display: 'flex',
                                                                    gap: '10px'
                                                                }}
                                                            >
                                                                <Description style={{ color: '#4a90e2' }} />
                                                                {item?.description}
                                                            </p>

                                                            {/* Destination Chip */}
                                                            <Box
                                                                sx={{
                                                                    mt: 1,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    px: 2,
                                                                    py: 1,
                                                                    background: '#e8f0fe',
                                                                    color: '#1a73e8',
                                                                    borderRadius: '30px',
                                                                    fontWeight: 600,
                                                                    fontSize: '14px',
                                                                    boxShadow: '0px 2px 8px rgba(0,0,0,0.1)'
                                                                }}
                                                            >
                                                                <LocationOn sx={{ mr: 1 }} />
                                                                {item?.destination}
                                                            </Box>
                                                            {/* Hotel Categories */}
                                                            {(item?.destination !== 'OVERNIGHT JOURNEY' ||
                                                                item?.destination === 'FRESH UP') && (
                                                                <Box sx={{ mt: 2 }}>
                                                                    <h4 style={{ margin: 0, color: '#1d1d1d' }}>
                                                                        Hotels
                                                                    </h4>

                                                                    <Grid container spacing={1} sx={{ mt: 1 }}>
                                                                        {/* Deluxe */}
                                                                        <Grid item xs={6} sm={3}>
                                                                            <Box
                                                                                sx={{
                                                                                    p: 1.2,
                                                                                    borderRadius: '10px',
                                                                                    background: '#f1f5ff',
                                                                                    border: '1px solid #d0ddff'
                                                                                }}
                                                                            >
                                                                                <strong style={{ color: '#1a73e8' }}>
                                                                                    Deluxe
                                                                                </strong>
                                                                                <p
                                                                                    style={{
                                                                                        margin: 0,
                                                                                        fontSize: '14px',
                                                                                        wordBreak: 'break-word'
                                                                                    }}
                                                                                >
                                                                                    {item.hotels?.deluxe || 'N/A'}
                                                                                </p>
                                                                            </Box>
                                                                        </Grid>

                                                                        {/* Super Deluxe */}
                                                                        <Grid item xs={6} sm={3}>
                                                                            <Box
                                                                                sx={{
                                                                                    p: 1.2,
                                                                                    borderRadius: '10px',
                                                                                    background: '#f1f5ff',
                                                                                    border: '1px solid #d0ddff'
                                                                                }}
                                                                            >
                                                                                <strong style={{ color: '#1a73e8' }}>
                                                                                    Super Deluxe
                                                                                </strong>
                                                                                <p
                                                                                    style={{
                                                                                        margin: 0,
                                                                                        fontSize: '14px',
                                                                                        wordBreak: 'break-word'
                                                                                    }}
                                                                                >
                                                                                    {item.hotels?.superDeluxe || 'N/A'}
                                                                                </p>
                                                                            </Box>
                                                                        </Grid>

                                                                        {/* Premium */}
                                                                        <Grid item xs={6} sm={3}>
                                                                            <Box
                                                                                sx={{
                                                                                    p: 1.2,
                                                                                    borderRadius: '10px',
                                                                                    background: '#f1f5ff',
                                                                                    border: '1px solid #d0ddff'
                                                                                }}
                                                                            >
                                                                                <strong style={{ color: '#1a73e8' }}>
                                                                                    Premium
                                                                                </strong>
                                                                                <p
                                                                                    style={{
                                                                                        margin: 0,
                                                                                        fontSize: '14px',
                                                                                        wordBreak: 'break-word'
                                                                                    }}
                                                                                >
                                                                                    {item.hotels?.premium || 'N/A'}
                                                                                </p>
                                                                            </Box>
                                                                        </Grid>

                                                                        {/* Luxury */}
                                                                        <Grid item xs={6} sm={3}>
                                                                            <Box
                                                                                sx={{
                                                                                    p: 1.2,
                                                                                    borderRadius: '10px',
                                                                                    background: '#f1f5ff',
                                                                                    border: '1px solid #d0ddff'
                                                                                }}
                                                                            >
                                                                                <strong style={{ color: '#1a73e8' }}>
                                                                                    Luxury
                                                                                </strong>
                                                                                <p
                                                                                    style={{
                                                                                        margin: 0,
                                                                                        fontSize: '14px',
                                                                                        wordBreak: 'break-word'
                                                                                    }}
                                                                                >
                                                                                    {item.hotels?.luxury || 'N/A'}
                                                                                </p>
                                                                            </Box>
                                                                        </Grid>
                                                                    </Grid>
                                                                </Box>
                                                            )}
                                                        </Grid>
                                                    </Grid>
                                                </motion.div>
                                            </motion.div>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                    </Box>
                </Grid>
                <GlobalModal isOpen={openItenaryModal} setIsOpen={setOpenItenaryModal}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 500,
                            bgcolor: 'background.paper',
                            p: 3,
                            borderRadius: 2,
                            boxShadow: 24
                        }}
                    >
                        <Typography variant='h6' mb={2}>
                            {isEditing ? `Edit Itinerary: ${formData.title}` : 'Add New Itinerary'}
                        </Typography>

                        <Grid container spacing={2}>
                            {/* Itinerary Autocomplete */}
                            <Grid item xs={12} sm={6}>
                                <Autocomplete
                                    options={itenaries?.data || []}
                                    loading={loadingItenary}
                                    getOptionLabel={option => option.title || ''}
                                    // Find the currently selected itinerary based on ID
                                    value={itenaries?.data?.find(item => item.id === formData.itenaryId) || null}
                                    onChange={(e, selected) => handleItinerarySelect(selected)}
                                    // eslint-disable-next-line no-shadow, react/jsx-props-no-spreading
                                    renderInput={params => <TextField {...params} label='Select Itinerary' fullWidth />}
                                />
                            </Grid>

                            {/* Destination Autocomplete */}
                            <Grid item xs={12} sm={6}>
                                <Autocomplete
                                    options={destinations?.data || []}
                                    loading={loadingDestinations}
                                    getOptionLabel={option => option.name || ''}
                                    // Find the currently selected destination based on ID
                                    value={destinations?.data?.find(item => item.id === formData.destinationId) || null}
                                    onChange={(e, selected) => handleDestinationSelect(selected)}
                                    // eslint-disable-next-line no-shadow
                                    renderInput={params => (
                                        // eslint-disable-next-line react/jsx-props-no-spreading
                                        <TextField {...params} label='Select Destination' fullWidth />
                                    )}
                                />
                            </Grid>

                            {/* Title and Description fields (Add these for editing!) */}
                            {isEditing && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label='Title'
                                        value={formData.title}
                                        onChange={e => handleChange('title', e.target.value)}
                                    />
                                </Grid>
                            )}
                            {isEditing && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label='Description'
                                        value={formData.description}
                                        onChange={e => handleChange('description', e.target.value)}
                                    />
                                </Grid>
                            )}

                            {/* Image URL */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label='Image URL'
                                    value={formData.image}
                                    onChange={e => handleChange('image', e.target.value)}
                                />
                            </Grid>

                            {/* Image Preview */}
                            {formData.image && (
                                <Grid item xs={12}>
                                    <Box sx={{ border: '1px solid #ccc', p: 1, borderRadius: '4px' }}>
                                        <motion.img
                                            src={formData.image}
                                            alt='Image Preview'
                                            style={{ width: '100%', maxHeight: '150px', objectFit: 'contain' }}
                                        />
                                    </Box>
                                </Grid>
                            )}

                            {/* Save Button */}
                            <Grid item xs={12}>
                                <Button variant='contained' fullWidth onClick={handleSaveAction}>
                                    {isEditing ? 'Update Itinerary' : 'Save New Itinerary'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </GlobalModal>
                <PackageConversion
                    isOpen={isConvertModalOpen}
                    setIsOpen={setIsConvertModalOpen}
                    leadId={params.leadId}
                    // priceData={guestTourPrice} // Pass your existing price data object here
                />
                <Grid item xs={12} md={6} lg={12}>
                    <Divider
                        sx={{
                            marginTop: '-2rem',
                            borderColor: '#BCC1CA',
                            marginBottom: '1rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default GuestForm
