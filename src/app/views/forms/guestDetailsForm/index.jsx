/* eslint-disable no-nested-ternary */
import React, { useState, useCallback, useEffect, useRef } from 'react'
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
    MenuItem,
    Modal,
    IconButton
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
    CheckCircle,
    Visibility,
    Send,
    Close
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

import {
    useShareLeadDetailsMutation,
    useGetLeadByIdQuery,
    getLeadPreview,
    useGenerateQuotationPdfMutation
} from '@/app/store/slices/api/leadSlice'
import { useGetTravelImagesQuery } from '@/app/store/slices/api/aiSlice'

// import AiFormAssistant from '@/core/components/forms/AiAssiastantForm'
import { useGetAllPackagesClientQuery } from '@/app/store/slices/api/packageSlice'
import {
    getItenaryClientById,
    useCreateItenaryClientMutation,
    useGetItenaryClientsQuery
} from '@/app/store/slices/api/itenarySlice'
import {
    useCreateDestinationClientMutation,
    useGetDestinationClientsQuery
} from '@/app/store/slices/api/destinationSlice'
import { useUpsertGuestTourPriceMutation, useGetGuestTourPriceQuery } from '@/app/store/slices/api/guestTourPrice'

import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'
import GlobalModal from '../../../../core/components/modals/GlobalModal'
import GuestTourPriceForm from './pricingTour'
import PackageConversion from './packageConvertModal'
import ItinerarySection from './itenarySection'

const LEGACY_TRANSIT_DESTINATIONS = new Set(['OVERNIGHT JOURNEY', 'FRESH UP', 'DAY JOURNEY'])

const isStayEntry = item => {
    if (item?.entryType) {
        return item.entryType === 'Stay'
    }

    const destinationName = item?.destination?.name || item?.destination || ''
    return !LEGACY_TRANSIT_DESTINATIONS.has(destinationName.toUpperCase())
}

const buildQuoteDayDescription = ({ entryType, title, destinationName }) => {
    if (entryType === 'Transit') {
        if (destinationName) {
            return `Comfortable transfer and road journey planned towards ${destinationName}.`
        }

        return 'Comfortable transfer and travel arrangements for the day.'
    }

    if (entryType === 'FreshUp') {
        return 'Freshen up, relax, and get ready for the next experience in the journey.'
    }

    if (title && destinationName) {
        return `${title} in ${destinationName} with sightseeing, local experiences, and a comfortable stay.`
    }

    if (destinationName) {
        return `Enjoy sightseeing, local experiences, and a comfortable stay in ${destinationName}.`
    }

    if (title) {
        return `${title} with a smooth and well-planned guest experience.`
    }

    return ''
}

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
    const [createItenaryClient] = useCreateItenaryClientMutation()
    const [createDestinationClient] = useCreateDestinationClientMutation()
    const { data: confirmedPackage } = useGetPackageByLeadIdQuery(params.leadId)

    const [createSingleTour] = useCreateSingleGuestTourItenaryMutation()
    const [shareLeadDetails, { isLoading }] = useShareLeadDetailsMutation()

    const { data: packages = [], isLoading: loadingPackages } = useGetAllPackagesClientQuery()

    // Server-side search state for the two dropdowns
    const [itenarySearch, setItenarySearch] = useState('')
    const [destinationSearch, setDestinationSearch] = useState('')

    // Debounced search values so we don't fire a request on every keystroke
    const [itenarySearchDebounced, setItenarySearchDebounced] = useState('')
    const [destinationSearchDebounced, setDestinationSearchDebounced] = useState('')

    useEffect(() => {
        const t = setTimeout(() => setItenarySearchDebounced(itenarySearch), 350)
        return () => clearTimeout(t)
    }, [itenarySearch])

    useEffect(() => {
        const t = setTimeout(() => setDestinationSearchDebounced(destinationSearch), 350)
        return () => clearTimeout(t)
    }, [destinationSearch])

    const { data: itenaries = [], isLoading: loadingItenary } = useGetItenaryClientsQuery(
        itenarySearchDebounced ? `?search=${itenarySearchDebounced}` : ''
    )
    const { data: destinations = [], isLoading: loadingDestinations } = useGetDestinationClientsQuery(
        destinationSearchDebounced ? `?search=${destinationSearchDebounced}` : ''
    )
    console.log(destinations, itenaries, 'fff')
    const { data: price = [], isLoading: loadingPrices } = useGetGuestTourPriceQuery(params.leadId)
    const [generatePdf, { isLoading: isGenerating }] = useGenerateQuotationPdfMutation()

    const { data: leadData } = useGetLeadByIdQuery(params.leadId)

    const [selectedPackage, setSelectedPackage] = useState([])

    const [openItenaryModal, setOpenItenaryModal] = useState(false)

    const [formData, setFormData] = useState({
        itenaryId: '',
        title: '',
        leadId: params.leadId,
        description: '',
        entryType: 'Stay',
        destinationId: '',
        destination: '', // legacy field kept for existing edit flow
        destinationName: '',
        delux_hotel: '',
        super_delux_hotel: '',
        luxury_hotel: '',
        premium_hotel: '',
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
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewHtml, setPreviewHtml] = useState('')
    const [loadingPreview, setLoadingPreview] = useState(false)
    const [aiPrefillLoading, setAiPrefillLoading] = useState(false)
    const lastAiPrefillKeyRef = useRef('')
    const aiPrefillTimeoutRef = useRef(null)
    // const [images, setImages] = useState([])
    // const [loadingImages, setLoadingImages] = useState(false)

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
                entryType: item.entryType || 'Stay',
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
                entryType: editingData.fullItem?.entryType || 'Stay',
                destinationId: editingData.fullItem?.destinationId || '',
                destination: editingData.destination || '',
                destinationName: editingData.destination || '',
                delux_hotel: editingData.fullItem?.destination?.delux_hotel || '',
                super_delux_hotel: editingData.fullItem?.destination?.super_delux_hotel || '',
                luxury_hotel: editingData.fullItem?.destination?.luxury_hotel || '',
                premium_hotel: editingData.fullItem?.destination?.premium_hotel || '',
                image: editingData.image || ''
            })
        } else {
            // Reset form for adding a new item
            setFormData({
                itenaryId: '',
                title: '',
                description: '',
                entryType: 'Stay',
                destinationId: '',
                destination: '',
                destinationName: '',
                delux_hotel: '',
                super_delux_hotel: '',
                luxury_hotel: '',
                premium_hotel: '',
                image: ''
            })
        }
    }, [editingData, isEditing])

    useEffect(() => {
        if (openItenaryModal) {
            setItenarySearch(formData.title || '')
            setDestinationSearch(formData.destinationName || '')
        }
    }, [openItenaryModal, formData.title, formData.destinationName])
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
                    options:
                        packages?.data?.map(pkg => ({
                            label: pkg.name,
                            value: pkg.id,
                            packageItenary: pkg.packageItenaries
                        })) || [],
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
                entryType: item.entryType || 'Stay',
                destination: item?.destination?.name || '',
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
                entryType: item.entryType || 'Stay',
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

    async function ensureQuoteMasterIds(payload = formData) {
        const campaignId = leadData?.data?.campaignId
        const nextPayload = { ...payload }

        if (!nextPayload.itenaryId && nextPayload.title?.trim()) {
            if (!campaignId) {
                throw new Error('Assign a campaign to this lead before creating a custom itinerary.')
            }

            const createdItenary = await createItenaryClient({
                title: nextPayload.title.trim(),
                description: nextPayload.description || '',
                campaignId: Number(campaignId)
            }).unwrap()

            nextPayload.itenaryId = createdItenary?.data?.id
        }

        if (nextPayload.entryType === 'Stay' && !nextPayload.destinationId && nextPayload.destinationName?.trim()) {
            if (!campaignId) {
                throw new Error('Assign a campaign to this lead before creating a custom destination.')
            }

            const createdDestination = await createDestinationClient({
                name: nextPayload.destinationName.trim(),
                campaignId: Number(campaignId),
                delux_hotel: nextPayload.delux_hotel || '',
                super_delux_hotel: nextPayload.super_delux_hotel || '',
                luxury_hotel: nextPayload.luxury_hotel || '',
                premium_hotel: nextPayload.premium_hotel || ''
            }).unwrap()

            nextPayload.destinationId = createdDestination?.data?.id
        }

        return nextPayload
    }

    const handleAddItenary = async () => {
        try {
            const preparedPayload = await ensureQuoteMasterIds()
            const res = await createSingleTour({
                ...preparedPayload,
                leadId: params.leadId,
                quoteNo: currentQuoteNo
            }).unwrap()
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
            entryType: 'Stay',
            destinationId: '',
            destination: '',
            destinationName: '',
            delux_hotel: '',
            super_delux_hotel: '',
            luxury_hotel: '',
            premium_hotel: '',
            image: ''
        })
        setItenarySearch('')
        setDestinationSearch('')
    }
    const handleUpdateItenary = async () => {
        try {
            const preparedPayload = await ensureQuoteMasterIds()
            const res = await updateTour({ id: formData.id, ...preparedPayload, leadId: params.leadId }).unwrap()
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
        setFormData(prev => {
            if (name === 'entryType') {
                const nextState = { ...prev, entryType: value }

                if (value !== 'Stay') {
                    nextState.destinationId = ''
                    nextState.destination = ''
                    nextState.destinationName = ''
                    nextState.delux_hotel = ''
                    nextState.super_delux_hotel = ''
                    nextState.luxury_hotel = ''
                    nextState.premium_hotel = ''
                }

                if (!nextState.description) {
                    nextState.description = buildQuoteDayDescription({
                        entryType: value,
                        title: nextState.title,
                        destinationName: value === 'Stay' ? nextState.destinationName : ''
                    })
                }

                return nextState
            }

            return { ...prev, [name]: value }
        })
    }

    const requestAiQuotePrefill = async payload => {
        const {
            destinationName = '',
            title = '',
            entryType = 'Stay',
            description = '',
            delux_hotel: deluxHotel = '',
            super_delux_hotel: superDeluxHotel = '',
            luxury_hotel: luxuryHotel = '',
            premium_hotel: premiumHotel = ''
        } = payload || {}

        const fallbackDescription = buildQuoteDayDescription({
            entryType,
            title,
            destinationName
        })
        const shouldFillDescription = !description?.trim() || description === fallbackDescription
        const shouldFillHotels =
            entryType === 'Stay' &&
            (!deluxHotel?.trim() || !superDeluxHotel?.trim() || !luxuryHotel?.trim() || !premiumHotel?.trim())

        if (!shouldFillDescription && !shouldFillHotels) {
            return
        }

        if (!destinationName?.trim() && !title?.trim()) {
            return
        }

        setAiPrefillLoading(true)

        try {
            const response = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/ai/assist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system: `You are an AI assistant helping fill a travel CRM quotation day form.

Respond ONLY with a valid JSON object.
Allowed keys:
- description
- delux_hotel
- super_delux_hotel
- luxury_hotel
- premium_hotel

Rules:
1. Output pure JSON only
2. Keep hotel suggestions realistic, concise, and destination-specific
3. If entryType is not "Stay", only provide description
4. Description should sound guest-ready and operationally useful
5. Leave out any key you cannot confidently fill`,
                    messages: [
                        {
                            role: 'user',
                            content: `Create quotation autofill for:
Entry Type: ${entryType}
Destination: ${destinationName || 'N/A'}
Itinerary Title: ${title || 'N/A'}
Existing Description: ${description || 'N/A'}
Need hotels: ${shouldFillHotels ? 'yes' : 'no'}
Need description: ${shouldFillDescription ? 'yes' : 'no'}`
                        }
                    ]
                })
            })

            const data = await response.json()
            const text = data?.content?.[0]?.text || ''
            const clean = text.replace(/```json|```/g, '').trim()
            const parsed = clean ? JSON.parse(clean) : {}
            const nextDeluxHotel = parsed.delux_hotel || parsed.deluxe_hotel || parsed.deluxeHotel || ''
            const nextSuperDeluxHotel =
                parsed.super_delux_hotel || parsed.superDeluxeHotel || parsed.super_deluxe_hotel || ''
            const nextLuxuryHotel = parsed.luxury_hotel || parsed.luxuryHotel || ''
            const nextPremiumHotel = parsed.premium_hotel || parsed.premiumHotel || ''

            setFormData(prev => ({
                ...prev,
                description:
                    !prev.description || prev.description === fallbackDescription
                        ? parsed.description || prev.description
                        : prev.description,
                delux_hotel: prev.delux_hotel || nextDeluxHotel || prev.delux_hotel,
                super_delux_hotel: prev.super_delux_hotel || nextSuperDeluxHotel || prev.super_delux_hotel,
                luxury_hotel: prev.luxury_hotel || nextLuxuryHotel || prev.luxury_hotel,
                premium_hotel: prev.premium_hotel || nextPremiumHotel || prev.premium_hotel
            }))
        } catch (error) {
            // Keep the modal usable even if AI parsing/network fails.
        } finally {
            setAiPrefillLoading(false)
        }
    }

    useEffect(() => {
        if (!openItenaryModal) {
            lastAiPrefillKeyRef.current = ''
            if (aiPrefillTimeoutRef.current) {
                clearTimeout(aiPrefillTimeoutRef.current)
                aiPrefillTimeoutRef.current = null
            }
            return
        }

        const aiKey = [
            formData.entryType,
            formData.title?.trim(),
            formData.destinationName?.trim(),
            formData.delux_hotel?.trim(),
            formData.super_delux_hotel?.trim(),
            formData.luxury_hotel?.trim(),
            formData.premium_hotel?.trim()
        ].join('|')

        if (lastAiPrefillKeyRef.current === aiKey) {
            return
        }

        if (!formData.title?.trim() && !formData.destinationName?.trim()) {
            return
        }

        lastAiPrefillKeyRef.current = aiKey
        if (aiPrefillTimeoutRef.current) {
            clearTimeout(aiPrefillTimeoutRef.current)
        }

        aiPrefillTimeoutRef.current = setTimeout(() => {
            requestAiQuotePrefill(formData)
        }, 500)
    }, [
        openItenaryModal,
        formData.entryType,
        formData.title,
        formData.destinationName,
        formData.delux_hotel,
        formData.super_delux_hotel,
        formData.luxury_hotel,
        formData.premium_hotel
    ])

    // 5. Autocomplete Options Handlers (Updated to use formData)
    const handleItinerarySelect = selected => {
        if (typeof selected === 'string') {
            const nextState = {
                ...formData,
                itenaryId: '',
                title: selected,
                description:
                    formData.description ||
                    buildQuoteDayDescription({
                        entryType: formData.entryType,
                        title: selected,
                        destinationName: formData.destinationName
                    })
            }
            setFormData(() => {
                const nextTitle = selected
                const nextDescription =
                    formData.description ||
                    buildQuoteDayDescription({
                        entryType: formData.entryType,
                        title: nextTitle,
                        destinationName: formData.destinationName
                    })

                return {
                    ...formData,
                    itenaryId: '',
                    title: nextTitle,
                    description: nextDescription
                }
            })
            return
        }

        const nextState = {
            ...formData,
            itenaryId: selected?.id || '',
            title: selected?.title || '',
            description:
                selected?.description ||
                formData.description ||
                buildQuoteDayDescription({
                    entryType: formData.entryType,
                    title: selected?.title || '',
                    destinationName: formData.destinationName
                })
        }
        setFormData(prev => {
            const nextTitle = selected?.title || ''
            const nextDescription =
                selected?.description ||
                buildQuoteDayDescription({
                    entryType: prev.entryType,
                    title: nextTitle,
                    destinationName: prev.destinationName
                })

            return {
                ...prev,
                itenaryId: selected?.id || '',
                title: nextTitle,
                description: nextDescription
            }
        })
    }
    const keyword = formData.destinationName || itenaries?.data?.find(i => i.id === formData.itenaryId)?.title || ''
    const {
        data: imageData,
        isLoading: loadingImages,
        isFetching
    } = useGetTravelImagesQuery(keyword, {
        skip: !keyword
    })
    const destinationInputHelperText =
        formData.entryType !== 'Stay'
            ? 'Destination is optional for transit and fresh up entries'
            : 'If not found, type it here and it will be created automatically for this lead campaign.'
    const handleDestinationSelect = selected => {
        if (typeof selected === 'string') {
            const nextState = {
                ...formData,
                destinationId: '',
                destination: selected,
                destinationName: selected,
                delux_hotel: '',
                super_delux_hotel: '',
                luxury_hotel: '',
                premium_hotel: '',
                description:
                    formData.description ||
                    buildQuoteDayDescription({
                        entryType: formData.entryType,
                        title: formData.title,
                        destinationName: selected
                    })
            }
            setFormData(() => nextState)
            return
        }

        const nextState = {
            ...formData,
            destinationId: selected?.id || '',
            destination: selected?.name || '',
            destinationName: selected?.name || '',
            delux_hotel: selected?.delux_hotel || '',
            super_delux_hotel: selected?.super_delux_hotel || '',
            luxury_hotel: selected?.luxury_hotel || '',
            premium_hotel: selected?.premium_hotel || '',
            description:
                formData.description ||
                buildQuoteDayDescription({
                    entryType: formData.entryType,
                    title: formData.title,
                    destinationName: selected?.name || ''
                })
        }
        setFormData(() => nextState)
    }
    /* eslint-disable react/jsx-props-no-spreading */
    const renderDestinationInput = autoParams => (
        <TextField {...autoParams} label='Destination' helperText={destinationInputHelperText} />
    )
    /* eslint-enable react/jsx-props-no-spreading */
    const images = imageData?.urls || []
    /* eslint-disable react/jsx-props-no-spreading */
    const renderItenaryInput = autoParams => (
        <TextField
            {...autoParams}
            label='Search or Type Itinerary'
            helperText='If not found, type it here and it will be created automatically for this lead campaign.'
        />
    )
    /* eslint-enable react/jsx-props-no-spreading */

    // 6. Final Save Action
    const handleSaveAction = async () => {
        if (!formData.title?.trim()) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please select or type an itinerary title first.',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }

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

        let currentStay = null

        // eslint-disable-next-line no-restricted-syntax
        for (const item of itineraries) {
            const isStayDay = isStayEntry(item)

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
            await shareLeadDetails({
                leadId: params.leadId,
                quotationNo: currentQuoteNo
            }).unwrap()

            setPreviewOpen(false)
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

    const handleDownloadPdf = async () => {
        if (!leadData?.data?.phone) return

        try {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Generating PDF... Please wait!',
                    variant: 'alert',
                    alert: { color: 'info' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )

            const baseUrl = import.meta.env.VITE_APP_BASE_URL
            const res = await fetch(`${baseUrl}/leads/generate-pdf/${params.leadId}/${currentQuoteNo || 1}`, {
                method: 'GET',
                credentials: 'include'
            })

            if (!res.ok) {
                let errorMessage = 'Failed to generate PDF.'
                try {
                    const text = await res.text()
                    errorMessage = text
                } catch (e) {
                    console.log(e)
                }
                throw new Error(errorMessage)
            }

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = url
            const fileName = `${leadData?.data?.fullName.replace(/\s+/g, '_')}_Trip_Quote.pdf`
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)

            setTimeout(() => window.URL.revokeObjectURL(url), 10000)

            dispatch(
                openSnackbar({
                    open: true,
                    message: 'PDF Downloaded Successfully!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } catch (err) {
            console.error('PDF Generation failed:', err)
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Failed to generate PDF. Please try again.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }

    const handleShareQuotation = async () => {
        // 1. Safety check
        if (!leadData?.data?.phone) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Lead phone number not found!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }

        // 2. Prepare WhatsApp Web URL
        const phoneNumber = leadData?.data?.phone.replace(/\D/g, '')
        const message = encodeURIComponent(
            `*TRAVEL QUOTATION - The Travel Kart*\n\n` +
                `Hi ${leadData?.data?.fullName},\n\n` +
                `I have attached your customized trip itinerary below. 📄\n\n` +
                `_Note: Please find the attached PDF in this chat._`
        )

        // 3. Open WhatsApp Web in a new tab
        const whatsappUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${message}`
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
        console.log(quoteItems)
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
    const handlePreview = async () => {
        setLoadingPreview(true)
        setPreviewOpen(true)
        try {
            const { data } = await dispatch(getLeadPreview.initiate({ leadId: params.leadId, quoteNo: currentQuoteNo }))
            setPreviewHtml(data?.data?.html || '')
        } catch (err) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Failed to load preview',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            setPreviewOpen(false)
        } finally {
            setLoadingPreview(false)
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
                                handlePreview={handlePreview}
                                handleWhatsAppClick={handleShareQuotation}
                                handleDownloadPdf={handleDownloadPdf}
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
                            width: { xs: '92vw', sm: 560 },
                            maxWidth: '92vw',
                            maxHeight: '85vh',
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            boxShadow: 24
                        }}
                    >
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                borderBottom: '1px solid #e2e8f0',
                                position: 'sticky',
                                top: 0,
                                bgcolor: 'background.paper',
                                zIndex: 1
                            }}
                        >
                            <Typography variant='h6'>
                                {isEditing ? `Edit Itinerary: ${formData.title}` : 'Add New Itinerary'}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                maxHeight: 'calc(85vh - 72px)',
                                overflowY: 'auto'
                            }}
                        >
                            <Grid container spacing={2}>
                                {/* Itinerary Autocomplete */}
                                <Grid item xs={12} sm={6}>
                                    <Autocomplete
                                        freeSolo
                                        options={itenaries?.data || []}
                                        loading={loadingItenary}
                                        getOptionLabel={option =>
                                            typeof option === 'string' ? option : option?.title || ''
                                        }
                                        filterOptions={x => x}
                                        value={
                                            itenaries?.data?.find(
                                                item => String(item.id) === String(formData.itenaryId)
                                            ) || (formData.title ? formData.title : null)
                                        }
                                        inputValue={itenarySearch}
                                        onInputChange={(e, val, reason) => {
                                            if (reason === 'input') {
                                                setItenarySearch(val)
                                                handleChange('title', val)
                                                if (!val) {
                                                    handleChange('itenaryId', '')
                                                    handleChange('description', '')
                                                }
                                            }
                                        }}
                                        onChange={(e, selected) => {
                                            handleItinerarySelect(selected)
                                            setItenarySearch(
                                                typeof selected === 'string' ? selected : selected?.title || ''
                                            )
                                        }}
                                        isOptionEqualToValue={(opt, val) => String(opt?.id) === String(val?.id)}
                                        renderInput={renderItenaryInput}
                                    />
                                </Grid>

                                {/* Destination Autocomplete */}
                                <Grid item xs={12} sm={6}>
                                    <Autocomplete
                                        freeSolo
                                        options={destinations?.data}
                                        loading={loadingDestinations}
                                        disabled={formData.entryType !== 'Stay'}
                                        getOptionLabel={option =>
                                            typeof option === 'string' ? option : option?.name || ''
                                        }
                                        filterOptions={x => x}
                                        value={
                                            destinations?.data?.find(
                                                item => String(item.id) === String(formData.destinationId)
                                            ) || (formData.destinationName ? formData.destinationName : null)
                                        }
                                        inputValue={destinationSearch}
                                        onInputChange={(e, val, reason) => {
                                            if (formData.entryType !== 'Stay') return
                                            if (reason === 'input') {
                                                setDestinationSearch(val)
                                                handleChange('destinationName', val)
                                                handleChange('destination', val)
                                                if (!val) {
                                                    handleChange('destinationId', '')
                                                }
                                            }
                                        }}
                                        onChange={(e, selected) => {
                                            if (formData.entryType !== 'Stay') return
                                            handleDestinationSelect(selected)
                                            setDestinationSearch(
                                                typeof selected === 'string' ? selected : selected?.name || ''
                                            )
                                        }}
                                        isOptionEqualToValue={(opt, val) => String(opt?.id) === String(val?.id)}
                                        renderInput={renderDestinationInput}
                                    />
                                </Grid>
                                {formData.entryType === 'Stay' && formData.destinationName && (
                                    <Grid item xs={12}>
                                        <Box
                                            sx={{
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 2,
                                                p: 1.5,
                                                bgcolor: '#f8fafc'
                                            }}
                                        >
                                            <Typography variant='subtitle2' sx={{ mb: 1 }}>
                                                Hotels for {formData.destinationName}
                                            </Typography>
                                            <Grid container spacing={1.5}>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label='Deluxe Hotel'
                                                        value={formData.delux_hotel}
                                                        onChange={e => handleChange('delux_hotel', e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label='Super Deluxe Hotel'
                                                        value={formData.super_delux_hotel}
                                                        onChange={e =>
                                                            handleChange('super_delux_hotel', e.target.value)
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label='Luxury Hotel'
                                                        value={formData.luxury_hotel}
                                                        onChange={e => handleChange('luxury_hotel', e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label='Premium Hotel'
                                                        value={formData.premium_hotel}
                                                        onChange={e => handleChange('premium_hotel', e.target.value)}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label='Description'
                                        value={formData.description}
                                        onChange={e => handleChange('description', e.target.value)}
                                        helperText='For a custom itinerary, this description will also be saved into master automatically.'
                                    />
                                </Grid>
                                {aiPrefillLoading && (
                                    <Grid item xs={12}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                px: 1.5,
                                                py: 1,
                                                borderRadius: 2,
                                                bgcolor: '#eff6ff',
                                                border: '1px solid #bfdbfe'
                                            }}
                                        >
                                            <CircularProgress size={18} />
                                            <Typography variant='body2'>
                                                AI is prefilling description and hotel suggestions...
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        label='Entry Type'
                                        value={formData.entryType}
                                        onChange={e => handleChange('entryType', e.target.value)}
                                    >
                                        <MenuItem value='Stay'>Stay</MenuItem>
                                        <MenuItem value='Transit'>Transit</MenuItem>
                                        <MenuItem value='FreshUp'>Fresh Up</MenuItem>
                                    </TextField>
                                </Grid>
                                {/* Image URL */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label='Image URL'
                                        value={formData.image}
                                        onChange={e => handleChange('image', e.target.value)}
                                    />
                                </Grid>
                                {/* Loader */}
                                {loadingImages && (
                                    <Grid item xs={12}>
                                        <CircularProgress size={24} />
                                    </Grid>
                                )}
                                {/* Image Options */}
                                {images.length > 0 && (
                                    <Grid item xs={12}>
                                        <Typography variant='caption' sx={{ mb: 1, display: 'block' }}>
                                            Select an image:
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
                                            {images.map(img => (
                                                <Box
                                                    key={img.name}
                                                    onClick={() => handleChange('image', img.url)}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        border:
                                                            formData.image === img.url
                                                                ? '2px solid #1976d2'
                                                                : '1px solid #ccc',
                                                        borderRadius: 1,
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    <img
                                                        src={img.thumb}
                                                        alt='travel'
                                                        style={{
                                                            width: 120,
                                                            height: 80,
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                </Box>
                                            ))}
                                        </Box>
                                    </Grid>
                                )}
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
                <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '85vw',
                            maxWidth: 900,
                            height: '85vh',
                            bgcolor: 'background.paper',
                            borderRadius: '16px',
                            boxShadow: 24,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid #e2e8f0'
                            }}
                        >
                            <Typography variant='h6' fontWeight={700}>
                                Email Preview — Quotation #{currentQuoteNo}
                            </Typography>
                            <IconButton onClick={() => setPreviewOpen(false)}>
                                <Close />
                            </IconButton>
                        </Box>

                        {/* Preview iframe */}
                        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                            {loadingPreview ? (
                                <Box
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <iframe
                                    srcDoc={previewHtml}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none'
                                    }}
                                    title='Email Preview'
                                />
                            )}
                        </Box>

                        {/* Footer actions */}
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                borderTop: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 2
                            }}
                        >
                            <Button
                                variant='outlined'
                                onClick={() => setPreviewOpen(false)}
                                sx={{ borderRadius: '8px', textTransform: 'none' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant='contained'
                                startIcon={isLoading ? <CircularProgress size={16} color='inherit' /> : <Send />}
                                onClick={handleShare}
                                disabled={isLoading}
                                sx={{
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #1c2d45, #2a4a7f)',
                                    '&:hover': { background: 'linear-gradient(135deg, #0f172a, #1e3a8a)' }
                                }}
                            >
                                {isLoading ? 'Sending...' : `Send to ${leadData?.data?.senderEmail || 'Guest'}`}
                            </Button>
                        </Box>
                    </Box>
                </Modal>
            </Grid>
        </MainCard>
    )
}

export default GuestForm
