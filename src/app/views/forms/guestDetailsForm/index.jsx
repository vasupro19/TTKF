/* eslint-disable no-nested-ternary */
import React, { useState, useCallback, useEffect } from 'react'
import { z } from 'zod'
import { useFormik } from 'formik'

// router
import { useParams, useNavigate, useLocation } from 'react-router-dom'

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
    InputAdornment,
    MenuItem
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
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
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
import { useGetPackageByLeadIdQuery } from '@/app/store/slices/api/packageConvert'

import { useShareLeadDetailsMutation, useGetLeadByIdQuery } from '@/app/store/slices/api/leadSlice'
import { useGetAllPackagesClientQuery } from '@/app/store/slices/api/packageSlice'
import { getItenaryClientById, useGetItenaryClientsQuery } from '@/app/store/slices/api/itenarySlice'
import { useGetDestinationClientsQuery } from '@/app/store/slices/api/destinationSlice'
import { useUpsertGuestTourPriceMutation, useGetGuestTourPriceQuery } from '@/app/store/slices/api/guestTourPrice'

import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'
import GlobalModal from '../../../../core/components/modals/GlobalModal'
import GuestTourPriceForm from './pricingTour'
import PackageConversion from './packageConvertModal'
import ItinerarySection from './itenarySection'

function GuestForm() {
    const { id: formId } = useParams()
    const params = useParams()
    const location = useLocation()

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [editData, setEditData] = useState({})
    const [editBool, setEditBool] = useState(false)
    // const [stayBreakdown, setstaysBreakdown] = useState([])

    const { createLeadLKey, updateLeadLKey } = useSelector(state => state.loading)

    // const [activeTab, setActiveTab] = useState(0)
    const [activeTab, setActiveTab] = useState(
        location.state?.convertedQuoteNo ? 1 : 0 // tabs are 0-indexed
    )
    const [tabsEnabled, setTabsEnabled] = useState([true, false])
    const [leadId, setLeadId] = useState(null)
    const { removeGuestTourItenaryKey } = useSelector(state => state.loading)

    const [createGuest] = useCreateGuestDetailMutation()
    const [updateGuest] = useUpdateGuestDetailMutation()
    const [createTour] = useCreateGuestTourMutation()
    const [updateTour] = useUpdateGuestTourMutation()
    const [removeTour] = useRemoveGuestTourItenaryMutation()
    const { data: confirmedPackage } = useGetPackageByLeadIdQuery(params.leadId)

    const [createSingleTour] = useCreateSingleGuestTourItenaryMutation()
    const [shareLeadDetails, { isLoading }] = useShareLeadDetailsMutation()

    const { data: packages = [], isLoading: loadingPackages } = useGetAllPackagesClientQuery()
    const { data: itenaries = [], isLoading: loadingItenary } = useGetItenaryClientsQuery()
    const { data: destinations = [], isLoading: loadingDestinations } = useGetDestinationClientsQuery()
    const { data: price = [], isLoading: loadingPrices } = useGetGuestTourPriceQuery(params.leadId)

    const { data: leadData } = useGetLeadByIdQuery(params.leadId)

    const [selectedPackage, setSelectedPackage] = useState([])

    const [openItenaryModal, setOpenItenaryModal] = useState(false)

    const [formData, setFormData] = useState({
        itenaryId: '',
        title: '',
        leadId: params.leadId,
        description: '',
        destinationId: '',
        destination: '', // Name of the destination
        image: '',
        insertAfterOrder: undefined // ✅ null = append at end
    })
    const [isEditing, setisEditing] = useState(false)
    const [editingData, setEditingData] = useState({})
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false)
    const [availableQuotes, setAvailableQuotes] = useState([]) // e.g. [1, 2, 3]
    const [currentQuoteNo, setCurrentQuoteNo] = useState(
        location.state?.convertedQuoteNo || 1 // ← default to converted quote, not 1
    )

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
        const { data, error } = await dispatch(
            getGuestTourById.initiate(id, { forceRefetch: true }) // ← add this
        )
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
            const quoteNums = [...new Set(data.data.map(item => item.quoteNo || 1))].sort()
            setAvailableQuotes(quoteNums)
            // setCurrentQuoteNo(quoteNums[0] || 1)
            const targetQuote = location.state?.convertedQuoteNo
            if (targetQuote && quoteNums.includes(targetQuote)) {
                setCurrentQuoteNo(targetQuote)
                setActiveTab(1) // itinerary tab, not quote tab — adjust if needed
            } else {
                setCurrentQuoteNo(quoteNums[0] || 1)
            }
            setSelectedPackage(formatted)
        }
    }
    const currentQuoteItineraries = selectedPackage.filter(item => (item.fullItem?.quoteNo || 1) === currentQuoteNo)

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
                    type: 'select', // Changed to select
                    options: [
                        { label: 'Honeymoon', value: 'Honeymoon' },
                        { label: 'Family', value: 'Family' },
                        { label: 'Friends / Group', value: 'Friends' },
                        { label: 'Corporate / MICE', value: 'Corporate' },
                        { label: 'Solo Traveler', value: 'Solo' }
                    ],
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'taxiType',
                    label: 'Taxi Type',
                    type: 'select',
                    options: [
                        { label: 'Sedan (Dzire/Etios)', value: 'Sedan' },
                        { label: 'SUV (Innova/Ertiga)', value: 'SUV' },
                        { label: 'Tempo Traveller', value: 'Tempo Traveller' },
                        { label: 'Hatchback', value: 'Hatchback' },
                        { label: 'None (Self Drive)', value: 'None' }
                    ],
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'packageType',
                    label: 'Package Type',
                    type: 'select',
                    options: [
                        { label: 'Deluxe', value: 'Deluxe' },
                        { label: 'Super Deluxe', value: 'Super Deluxe' },
                        { label: 'Luxury', value: 'Luxury' },
                        { label: 'Premium', value: 'Premium' }
                    ],
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'foodPlan',
                    label: 'Food Plan',
                    type: 'select',
                    options: [
                        { label: 'EP (Room Only)', value: 'EP' },
                        { label: 'CP (Breakfast Only)', value: 'CP' },
                        { label: 'MAP (Breakfast & Dinner)', value: 'MAP' },
                        { label: 'AP (All Meals)', value: 'AP' }
                    ],
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
                fullItem: {
                    ...item,
                    quoteNo: currentQuoteNo
                } // keep complete raw data if needed later
            }))
            const values = value.packageItenary.map(item => ({
                title: item.title,
                itenaryId: item.itenary.id || '',
                image: item.image || '',
                destinationId: item?.destination?.id || '',
                quoteNo: currentQuoteNo
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
            const res = await createSingleTour({ ...formData, leadId: params.leadId, quoteNo: currentQuoteNo }).unwrap()
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
            // 🚀 Pass both leadId and the current active quotation number
            await shareLeadDetails({
                leadId: params.leadId,
                quotationNo: currentQuoteNo
            }).unwrap()

            dispatch(
                openSnackbar({
                    open: true,
                    message: `Mail for Quotation #${currentQuoteNo} sent successfully!`,
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } catch (err) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: err.data?.message || 'Failed to send mail.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }

    const handleWhatsAppClick = () => {
        // 1. Safety check for Lead Data
        if (!leadData) {
            alert('Lead details not found. Please wait for data to load.')
            return
        }
        console.log(leadData, 'leadData')
        // 2. Clean the phone number
        const phoneNumber = leadData.data.phone.replace(/\D/g, '')

        // 3. Get the Route (e.g., Shimla ➔ Manali ➔ Jibhi)
        const route = selectedPackage
            .map(item => item.destination)
            .filter(name => name !== 'OVERNIGHT JOURNEY' && name !== 'FRESH UP')
            .join(' ➔ ')

        // 4. Build the Pricing Text
        // Assuming packagePrices has these keys from your 'handleSavePrices' logic
        let pricingInfo = `*💰 Package Options:* \n`
        if (price.data.deluxePrice) pricingInfo += `• Deluxe: ₹${price.data.deluxePrice}\n`
        if (price.data.superDeluxePrice) pricingInfo += `• Super Deluxe: ₹${price.data.superDeluxePrice}\n`
        if (price.data.luxuryPrice) pricingInfo += `• Luxury: ₹${price.data.luxuryPrice}\n`
        if (price.data.premiumPrice) pricingInfo += `• Premium: ₹${price.data.premiumPrice}\n`

        // 5. Create the Message
        const message = encodeURIComponent(
            `*TRAVEL QUOTATION - The Travel Kart*\n\n` +
                `Hi ${leadData.data.fullName},\n` +
                `Here are the quotation details for your upcoming trip:\n\n` +
                `*📍 Route:* ${route || 'Himalayan Tour'}\n\n${
                    pricingInfo
                }\n_Detailed day-wise itinerary has been sent to your email._\n\n` +
                `Please let us know which option works best for you!`
        )

        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
        window.open(whatsappUrl, '_blank')
    }
    const handleConvertPackage = async () => {
        setIsConvertModalOpen(true)
        // 1. Check if price is already generated
        // 2. Open a Dialog/Modal to select specific Suppliers for this lead
        // 3. Calculate Profit: (Selected Quote Price) - (Supplier Costs)
        console.log('Initiating conversion for Lead:', params.leadId)

        // Example: Router.push(`/admin/bookings/convert/${params.leadId}`)
    }
    const currentQuoteNoRef = React.useRef(currentQuoteNo)

    // Keep ref in sync with state
    useEffect(() => {
        currentQuoteNoRef.current = currentQuoteNo
    }, [currentQuoteNo])
    // Track available quotes and the currently active one
    const handleInitialQuoteAdd = () => {
        const nextQuoteNo = availableQuotes.length > 0 ? Math.max(...availableQuotes) + 1 : 1
        setAvailableQuotes(prev => [...prev, nextQuoteNo])
        setCurrentQuoteNo(nextQuoteNo)
    }
    const handleReorderDay = async (item, direction) => {
        const currentOrder = item.fullItem.order
        const quoteItems = currentQuoteItineraries
        // Find the item to swap with
        const swapItem =
            direction === 'up'
                ? quoteItems.find(i => i.fullItem.order === currentOrder - 1)
                : quoteItems.find(i => i.fullItem.order === currentOrder + 1)

        if (!swapItem) return // already at top or bottom

        try {
            // ✅ Swap orders on backend
            await Promise.all([
                updateTour({
                    id: item.fullItem.id,
                    order: swapItem.fullItem.order
                }).unwrap(),
                updateTour({
                    id: swapItem.fullItem.id,
                    order: currentOrder
                }).unwrap()
            ])

            // ✅ Update local state immediately (no flicker)
            setSelectedPackage(prev =>
                prev.map(p => {
                    if (p.fullItem.id === item.fullItem.id)
                        return { ...p, fullItem: { ...p.fullItem, order: swapItem.fullItem.order } }
                    if (p.fullItem.id === swapItem.fullItem.id)
                        return { ...p, fullItem: { ...p.fullItem, order: currentOrder } }
                    return p
                })
            )
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Failed to reorder day',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
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
                            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                                {/* STEP 1: If no quotes exist, show the big "Start" button */}
                                {availableQuotes.length === 0 ? (
                                    <Button
                                        variant='contained'
                                        color='secondary'
                                        startIcon={<Save />}
                                        onClick={handleInitialQuoteAdd}
                                        sx={{ px: 4, py: 1, borderRadius: '8px' }}
                                    >
                                        Create Quotation 1
                                    </Button>
                                ) : (
                                    <>
                                        {/* STEP 2: Dropdown to switch between existing quotes */}
                                        <TextField
                                            select
                                            label='Active Quotation'
                                            value={currentQuoteNo}
                                            onChange={e => {
                                                const newQuoteNo = Number(e.target.value)
                                                setCurrentQuoteNo(newQuoteNo)
                                                currentQuoteNoRef.current = newQuoteNo
                                            }}
                                            size='small'
                                            sx={{ minWidth: 150 }}
                                            // ← Remove SelectProps={{ native: true }}
                                        >
                                            {availableQuotes.map(num => (
                                                <MenuItem key={num} value={num}>
                                                    {' '}
                                                    {/* ← MenuItem not option */}
                                                    Quotation {num}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        {/* Button to add a BRAND NEW quote version */}
                                        <Button
                                            variant='outlined'
                                            onClick={handleInitialQuoteAdd}
                                            sx={{ borderRadius: '8px' }}
                                        >
                                            + Add Quote {availableQuotes.length + 1}
                                        </Button>

                                        <Divider orientation='vertical' flexItem />

                                        {/* STEP 3: The actual Add Itinerary button for the CURRENT quote */}
                                        <Button
                                            variant='contained'
                                            startIcon={<Photo />}
                                            onClick={() => {
                                                setisEditing(false)
                                                setOpenItenaryModal(true)
                                            }}
                                        >
                                            Add Day to Quote {currentQuoteNo}
                                        </Button>
                                    </>
                                )}
                            </Box>
                        )}

                        <Box sx={{ padding: 2 }}>
                            {(activeTab === 0 || (activeTab === 1 && availableQuotes.length > 0)) && (
                                <FormComponent
                                    fields={tabsFields[activeTab].fields}
                                    formik={formik}
                                    handleCustomChange={handleCustomChange}
                                    submitting={createLeadLKey || updateLeadLKey}
                                    submitButtonText={editBool ? 'Update Details' : 'Add Details'}
                                    submitButtonSx={{ textAlign: 'right', marginTop: 2 }}
                                    showSeparaterBorder={false}
                                />
                            )}
                        </Box>

                        {activeTab === 1 && currentQuoteItineraries.length > 0 && (
                            <ItinerarySection
                                currentQuoteItineraries={currentQuoteItineraries}
                                currentQuoteNo={currentQuoteNo}
                                staysBreakdown={calculateStayBreakdown(currentQuoteItineraries)}
                                confirmedPackage={confirmedPackage}
                                lastSharedQuoteNo={leadData?.data?.lastSharedQuoteNo}
                                lastSharedAt={leadData?.data?.lastSharedAt}
                                priceData={price?.data}
                                isLoading={isLoading}
                                handleShare={handleShare}
                                handleWhatsAppClick={handleWhatsAppClick}
                                handleConvertPackage={handleConvertPackage}
                                onEditItem={onEditItem}
                                onDeleteItem={onDeleteItem}
                                GuestTourPriceForm={
                                    <GuestTourPriceForm
                                        tourId={params.leadId}
                                        quotationNo={currentQuoteNo}
                                        activeTab={activeTab}
                                    />
                                }
                                onReorderDay={handleReorderDay}
                                totalDays={currentQuoteItineraries.length}
                                params={params}
                            />
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
                    quotationNo={currentQuoteNo}
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
