import React, { useState, useEffect, useRef } from 'react'

// router
import { useParams, useLocation } from 'react-router-dom'

// theme components
import { Box, Button, CircularProgress, IconButton, Modal, Typography } from '@mui/material'
import { Close, Send } from '@mui/icons-material'

// components
import MainCard from '@core/components/extended/MainCard'
import MyTabs from '@/core/components/CapsuleTabs'

// redux imports
import { useDispatch } from 'react-redux'
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

import { useShareLeadDetailsMutation, useGetLeadByIdQuery, getLeadPreview } from '@/app/store/slices/api/leadSlice'
import { useAssistAiMutation, useGetTravelImagesQuery } from '@/app/store/slices/api/aiSlice'

import { useGetAllPackagesClientQuery } from '@/app/store/slices/api/packageSlice'
import {
    useCreateItenaryClientMutation,
    useGetItenaryClientsQuery,
    useUpdateItenaryClientMutation
} from '@/app/store/slices/api/itenarySlice'
import {
    useCreateDestinationClientMutation,
    useGetDestinationClientsQuery,
    useUpdateDestinationClientMutation
} from '@/app/store/slices/api/destinationSlice'
import { useGetGuestTourPriceQuery } from '@/app/store/slices/api/guestTourPrice'
import { useGetCampaignsQuery } from '@/app/store/slices/api/campaignSlice'
import { useGetGuestQuotesQuery, useSetGuestQuoteCampaignMutation } from '@/app/store/slices/api/guestQuote'

import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'
import GuestTourPriceForm from './pricingTour'
import PackageConversion from './packageConvertModal'
import ItinerarySection from './itenarySection'
import TripDetailsStep from './TripDetailsStep'
import DayEditor from './quote/DayEditor'
import { emptyTripDetails, fromGuestDetail, toGuestPayload, tripSummary } from './tripDetails'
import { byOrder, campaignOfDays, reorderDays, stayBreakdown } from './quote/quoteDays'
import { headCount } from './quote/pricing'

const buildQuoteDayDescription = ({ entryType, title, destinationName }) => {
    if (entryType === 'Transit') {
        if (destinationName) {
            return `Comfortable transfer and road journey planned towards ${destinationName}. The day is arranged to keep travel smooth and convenient, with enough time to arrive comfortably and continue the itinerary without unnecessary rush.`
        }

        return 'Comfortable transfer and travel arrangements are planned for the day, keeping the journey smooth, practical, and guest-friendly throughout.'
    }

    if (entryType === 'TransitStay') {
        if (destinationName) {
            return `Travel towards ${destinationName}, arrive comfortably, and settle in for an overnight stay. After reaching the destination, the remaining time can be enjoyed at a relaxed pace before the night halt.`
        }

        return 'Travel, arrival, and overnight stay arrangements are planned for the day, balancing onward movement with a smooth and comfortable arrival experience.'
    }

    if (entryType === 'FreshUp') {
        return 'Freshen up, relax, and get ready for the next experience in the journey. This halt helps keep the overall travel flow comfortable and gives the guest a short reset before continuing.'
    }

    if (title && destinationName) {
        return `${title} in ${destinationName} with sightseeing, local experiences, and a comfortable stay. The day is planned at an enjoyable pace so guests can explore and unwind without feeling rushed.`
    }

    if (destinationName) {
        return `Enjoy sightseeing, local experiences, and a comfortable stay in ${destinationName}. The plan gives enough time to explore the destination while keeping the overall experience smooth and relaxing.`
    }

    if (title) {
        return `${title} with a smooth and well-planned guest experience, balancing movement, comfort, and leisure through the day.`
    }

    return ''
}

const STEPS = [{ label: '1 · Trip details' }, { label: '2 · Itinerary and price' }]

const EMPTY_DAY = {
    itenaryId: '',
    title: '',
    description: '',
    entryType: 'Stay',
    destinationId: '',
    destination: '', // legacy field kept for existing edit flow
    destinationName: '',
    delux_hotel: '',
    super_delux_hotel: '',
    luxury_hotel: '',
    premium_hotel: '',
    image: ''
}

// ? a GuestTourItenary row as the itinerary step reads it
const toQuoteDay = item => ({
    title: item.title,
    description:
        item?.description ||
        item?.itenary?.description ||
        buildQuoteDayDescription({
            entryType: item.entryType || 'Stay',
            title: item.title,
            destinationName: item.destination?.name || ''
        }),
    image: item.image || '',
    entryType: item.entryType || 'Stay',
    destination: item.destination?.name || '',
    hotels: {
        deluxe: item.destination?.delux_hotel,
        superDeluxe: item.destination?.super_delux_hotel,
        luxury: item.destination?.luxury_hotel,
        premium: item.destination?.premium_hotel
    },
    fullItem: item // keep complete raw data if needed later
})

const errorText = (error, fallback) => error?.data?.message || error?.message || fallback

/**
 * The quotation for one verified lead, in two steps: the trip details (only adults and the start date are
 * required), then the itinerary, the price, sending it and booking it.
 */
function GuestForm() {
    const params = useParams()
    const { leadId } = params
    const location = useLocation()
    const dispatch = useDispatch()

    const notify = (message, color = 'success') =>
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: { color },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )

    const [activeTab, setActiveTab] = useState(
        location.state?.convertedQuoteNo ? 1 : 0 // tabs are 0-indexed
    )

    // --- Step 1: trip details ---

    const [guestId, setGuestId] = useState(null)
    const [tripValues, setTripValues] = useState(emptyTripDetails)
    const [loadingTrip, setLoadingTrip] = useState(true)
    const [savingTrip, setSavingTrip] = useState(false)
    const [tripError, setTripError] = useState('')

    const [createGuest] = useCreateGuestDetailMutation()
    const [updateGuest] = useUpdateGuestDetailMutation()

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setLoadingTrip(true)
            // ? no cache: a "not found" from before the details were saved must not be replayed
            const { data } = await dispatch(getGuestById.initiate(leadId, { forceRefetch: true }))
            if (cancelled) return
            if (data?.data && objectLength(data.data)) {
                setGuestId(data.data.id)
                setTripValues(fromGuestDetail(data.data))
                // ? details already taken: the work left is the itinerary
                setActiveTab(1)
            }
            setLoadingTrip(false)
        }
        if (leadId) load()
        return () => {
            cancelled = true
        }
    }, [leadId, dispatch])

    const saveTripDetails = async values => {
        setSavingTrip(true)
        setTripError('')
        try {
            const payload = toGuestPayload(values, Number(leadId))
            const response = guestId
                ? await updateGuest({ id: guestId, ...payload }).unwrap()
                : await createGuest(payload).unwrap()
            const saved = response?.data || {}
            setGuestId(saved.id || guestId)
            setTripValues(fromGuestDetail({ ...payload, ...saved }))
            notify(guestId ? 'Trip details updated' : 'Trip details saved — now build the itinerary')
            setActiveTab(1)
        } catch (error) {
            setTripError(errorText(error, 'Couldn’t save the trip details. Please try again.'))
        } finally {
            setSavingTrip(false)
        }
    }

    const tabsEnabled = [true, Boolean(guestId)]
    const handleTabChange = (event, newVal) => {
        if (tabsEnabled[newVal]) setActiveTab(newVal)
    }

    // --- Step 2: the quote's days ---

    const [createTour] = useCreateGuestTourMutation()
    const [updateTour] = useUpdateGuestTourMutation()
    const [removeTour] = useRemoveGuestTourItenaryMutation()
    const [createSingleTour] = useCreateSingleGuestTourItenaryMutation()
    const [createItenaryClient] = useCreateItenaryClientMutation()
    const [updateItenaryClient] = useUpdateItenaryClientMutation()
    const [createDestinationClient] = useCreateDestinationClientMutation()
    const [updateDestinationClient] = useUpdateDestinationClientMutation()
    const [assistAi] = useAssistAiMutation()
    const { data: confirmedPackage } = useGetPackageByLeadIdQuery(leadId)
    const [shareLeadDetails, { isLoading }] = useShareLeadDetailsMutation()
    // ? the list is paged at 25 by default, which hid older packages from the picker
    const { data: packages = [], isLoading: loadingPackages } = useGetAllPackagesClientQuery('?length=200')
    const { data: leadData, refetch: refetchLead } = useGetLeadByIdQuery(leadId)

    const [quoteDays, setQuoteDays] = useState([])
    const [loadingDays, setLoadingDays] = useState(false)
    const [applyingPackage, setApplyingPackage] = useState(false)
    const [availableQuotes, setAvailableQuotes] = useState([])
    const [currentQuoteNo, setCurrentQuoteNo] = useState(
        location.state?.convertedQuoteNo || 1 // ← default to converted quote, not 1
    )
    // ? the first load picks the quote to show; later reloads (after an edit) must not jump away from it
    const quotePickedRef = useRef(Boolean(location.state?.convertedQuoteNo))

    const { data: price } = useGetGuestTourPriceQuery(
        { leadId, quotationNo: currentQuoteNo },
        { skip: activeTab !== 1 || !leadId }
    )

    const loadDays = async () => {
        setLoadingDays(true)
        const { data } = await dispatch(getGuestTourById.initiate(leadId, { forceRefetch: true }))
        const rows = Array.isArray(data?.data) ? data.data : []
        setQuoteDays(rows.map(toQuoteDay))
        const quoteNums = [...new Set(rows.map(item => item.quoteNo || 1))]
        setAvailableQuotes(prev => [...new Set([...quoteNums, ...prev])].sort((a, b) => a - b))
        if (!quotePickedRef.current && quoteNums.length) setCurrentQuoteNo(Math.min(...quoteNums))
        quotePickedRef.current = true
        setLoadingDays(false)
    }

    useEffect(() => {
        if (activeTab === 1 && leadId) loadDays()
        // ? reload only when the step opens or the lead changes; edits reload explicitly
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, leadId])

    // ? the trip picked for each quote, kept on the server (GuestQuote); `justSaved` shows a pick before the refetch
    const { data: savedQuotesData, refetch: refetchSavedQuotes } = useGetGuestQuotesQuery(leadId, { skip: !leadId })
    const [setGuestQuoteCampaign, { isLoading: savingQuoteCampaign }] = useSetGuestQuoteCampaignMutation()
    const [justSaved, setJustSaved] = useState({})
    const savedQuoteCampaigns = {
        ...Object.fromEntries(
            (Array.isArray(savedQuotesData?.data) ? savedQuotesData.data : []).map(item => [
                Number(item.quoteNo),
                Number(item.campaignId) || null
            ])
        ),
        ...justSaved
    }

    // ? a quote made with its trip picked but no days yet is still a quote after a reload
    const quotes = [
        ...new Set([...availableQuotes, ...Object.keys(savedQuoteCampaigns).map(Number), currentQuoteNo])
    ].sort((a, b) => a - b)
    const daysOfQuote = quoteNo => quoteDays.filter(item => (item.fullItem?.quoteNo || 1) === quoteNo).sort(byOrder)
    const currentDays = daysOfQuote(currentQuoteNo)

    // --- A quote's campaign: a guest can ask for Himachal as Quote 1 and Uttarakhand as Quote 2 ---

    const { data: campaignsData } = useGetCampaignsQuery('?length=200')
    const campaigns = (campaignsData?.data || []).map(item => ({ id: Number(item.id), title: item.title }))
    const leadCampaignId = Number(leadData?.data?.campaignId) || null
    // ? the trip the agent picked wins (the server uses it too — Helpers/quoteCampaign.helper.js). A quote with
    // ? none saved — made before this, or in a workspace not updated yet — takes its days' campaign; the pick
    // ? kept only in this page covers a quote with no days
    const [chosenQuoteCampaigns, setChosenQuoteCampaigns] = useState({})
    const campaignOfQuote = quoteNo =>
        savedQuoteCampaigns[quoteNo] ||
        campaignOfDays(daysOfQuote(quoteNo), leadCampaignId) ||
        chosenQuoteCampaigns[quoteNo] ||
        leadCampaignId
    const campaignTitle = id => campaigns.find(item => item.id === Number(id))?.title || ''
    const currentCampaignId = campaignOfQuote(currentQuoteNo)
    const quoteCampaigns = Object.fromEntries(quotes.map(quoteNo => [quoteNo, campaignTitle(campaignOfQuote(quoteNo))]))

    const saveQuoteCampaign = async (quoteNo, campaignId, { quiet = false } = {}) => {
        try {
            await setGuestQuoteCampaign({ leadId: Number(leadId), quoteNo, campaignId }).unwrap()
            setJustSaved(current => ({ ...current, [quoteNo]: campaignId }))
            refetchSavedQuotes()
            return true
        } catch (error) {
            if (!quiet) notify(error?.data?.message || 'Couldn’t save the trip for this quote.', 'error')
            return false
        }
    }

    const handleNewQuote = campaignId => {
        const nextQuoteNo = Math.max(...quotes) + 1
        const id = Number(campaignId) || leadCampaignId
        setAvailableQuotes([...quotes, nextQuoteNo])
        setChosenQuoteCampaigns(current => ({ ...current, [nextQuoteNo]: id }))
        setCurrentQuoteNo(nextQuoteNo)
        // ? with one campaign there was no choice to report on, so a workspace not updated yet stays quiet
        if (id) saveQuoteCampaign(nextQuoteNo, id, { quiet: campaigns.length < 2 })
    }

    const handleQuoteCampaignChange = async campaignId => {
        const id = Number(campaignId)
        if (!id || id === currentCampaignId) return
        if (await saveQuoteCampaign(currentQuoteNo, id)) {
            notify(`Quote ${currentQuoteNo} is now for ${campaignTitle(id)}`)
        }
    }

    const applyPackage = async pkg => {
        const itenaryList = (pkg?.packageItenaries || []).map(item => ({
            title: item.title,
            itenaryId: item.itenary?.id || item.itenaryId || '',
            image: item.image || '',
            destinationId: item?.destination?.id || item.destinationId || '',
            entryType: item.entryType || 'Stay',
            quoteNo: currentQuoteNo
        }))
        if (!itenaryList.length) {
            notify('That package has no days yet.', 'warning')
            return
        }
        setApplyingPackage(true)
        try {
            await createTour({ leadId, itenaryList }).unwrap()
            await loadDays()
            notify(`Quote ${currentQuoteNo} now has the ${itenaryList.length} days of “${pkg.name}”`)
        } catch (error) {
            notify(errorText(error, 'Couldn’t add the package’s days.'), 'error')
        } finally {
            setApplyingPackage(false)
        }
    }

    const handleDeleteDay = async item => {
        try {
            const res = await removeTour(item?.fullItem?.id).unwrap()
            if (res.success) {
                setQuoteDays(prev => prev.filter(day => day.fullItem?.id !== item?.fullItem?.id))
                notify('Day deleted')
            }
        } catch (error) {
            notify(errorText(error, 'Couldn’t delete the day.'), 'error')
        }
    }

    const handleMoveDay = async (item, direction) => {
        const index = currentDays.findIndex(day => day.fullItem?.id === item.fullItem?.id)
        const writes = reorderDays(currentDays, index, direction)
        if (!writes) return
        try {
            await Promise.all(writes.map(({ day, order }) => updateTour({ id: day.fullItem.id, order }).unwrap()))
            const orders = new Map(writes.map(({ day, order }) => [day.fullItem.id, order]))
            setQuoteDays(prev =>
                prev.map(day =>
                    orders.has(day.fullItem?.id)
                        ? { ...day, fullItem: { ...day.fullItem, order: orders.get(day.fullItem.id) } }
                        : day
                )
            )
        } catch (error) {
            notify('Couldn’t move the day', 'error')
        }
    }

    // --- The day editor ---

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

    const [openItenaryModal, setOpenItenaryModal] = useState(false)
    const [formData, setFormData] = useState({ ...EMPTY_DAY, leadId })
    const [isEditing, setisEditing] = useState(false)
    const [editingData, setEditingData] = useState({})
    const [savingDay, setSavingDay] = useState(false)
    const [aiPrefillLoading, setAiPrefillLoading] = useState(false)
    const lastAiPrefillKeyRef = useRef('')
    const aiPrefillTimeoutRef = useRef(null)

    useEffect(() => {
        if (isEditing) {
            // Populate form with existing item data for editing
            setFormData({
                id: editingData.fullItem.id,
                itenaryId: editingData.fullItem?.itenaryId || '',
                title: editingData.title || '',
                leadId,
                description:
                    editingData.description ||
                    editingData?.fullItem?.description ||
                    editingData?.fullItem?.itenary?.description,
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
            setFormData({ ...EMPTY_DAY })
        }
    }, [editingData, isEditing, leadId])

    useEffect(() => {
        if (openItenaryModal) {
            setItenarySearch(formData.title || '')
            setDestinationSearch(formData.destinationName || '')
        }
    }, [openItenaryModal, formData.title, formData.destinationName])

    async function ensureQuoteMasterIds(payload = formData) {
        // ? a day typed for Quote 2 (Uttarakhand) is saved in Uttarakhand, not the lead's Himachal campaign
        const campaignId = currentCampaignId
        const nextPayload = {
            ...payload,
            title: payload.title?.trim?.() || '',
            description: payload.description?.trim?.() || ''
        }
        const matchedItenary =
            itenaries?.data?.find(item => String(item.id) === String(nextPayload.itenaryId)) ||
            editingData?.fullItem?.itenary ||
            null
        const matchedDestination =
            destinations?.data?.find(item => String(item.id) === String(nextPayload.destinationId)) ||
            editingData?.fullItem?.destination ||
            null

        if (!nextPayload.itenaryId && nextPayload.title?.trim()) {
            if (!campaignId) {
                throw new Error('Choose a campaign for this quote before adding a new day.')
            }

            const createdItenary = await createItenaryClient({
                title: nextPayload.title.trim(),
                description: nextPayload.description || '',
                campaignId: Number(campaignId)
            }).unwrap()

            nextPayload.itenaryId = createdItenary?.data?.id
        } else if (nextPayload.itenaryId && matchedItenary) {
            const nextItenaryTitle = nextPayload.title || matchedItenary.title || ''
            const nextItenaryDescription = nextPayload.description || matchedItenary.description || ''

            if (
                nextItenaryTitle !== (matchedItenary.title || '') ||
                nextItenaryDescription !== (matchedItenary.description || '')
            ) {
                await updateItenaryClient({
                    id: matchedItenary.id,
                    title: nextItenaryTitle,
                    description: nextItenaryDescription,
                    campaignId: matchedItenary.campaignId || Number(campaignId)
                }).unwrap()
            }
        }

        if (
            (nextPayload.entryType === 'Stay' || nextPayload.entryType === 'TransitStay') &&
            !nextPayload.destinationId &&
            nextPayload.destinationName?.trim()
        ) {
            if (!campaignId) {
                throw new Error('Choose a campaign for this quote before adding a new destination.')
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
        } else if (
            (nextPayload.entryType === 'Stay' || nextPayload.entryType === 'TransitStay') &&
            nextPayload.destinationId
        ) {
            const nextDestinationName = nextPayload.destinationName?.trim() || matchedDestination?.name || ''
            const nextHotels = {
                delux_hotel: nextPayload.delux_hotel || '',
                super_delux_hotel: nextPayload.super_delux_hotel || '',
                luxury_hotel: nextPayload.luxury_hotel || '',
                premium_hotel: nextPayload.premium_hotel || ''
            }

            if (
                matchedDestination &&
                (nextDestinationName !== (matchedDestination.name || '') ||
                    nextHotels.delux_hotel !== (matchedDestination.delux_hotel || '') ||
                    nextHotels.super_delux_hotel !== (matchedDestination.super_delux_hotel || '') ||
                    nextHotels.luxury_hotel !== (matchedDestination.luxury_hotel || '') ||
                    nextHotels.premium_hotel !== (matchedDestination.premium_hotel || ''))
            ) {
                await updateDestinationClient({
                    id: matchedDestination.id,
                    name: nextDestinationName,
                    campaignId: matchedDestination.campaignId || Number(campaignId),
                    ...nextHotels
                }).unwrap()
            }
        }

        return nextPayload
    }

    const resetDayForm = () => {
        setFormData({ ...EMPTY_DAY })
        setItenarySearch('')
        setDestinationSearch('')
    }

    const handleAddItenary = async () => {
        try {
            const preparedPayload = await ensureQuoteMasterIds()
            const res = await createSingleTour({
                ...preparedPayload,
                leadId,
                quoteNo: currentQuoteNo
            }).unwrap()
            if (res.success) {
                setOpenItenaryModal(false)
                resetDayForm()
                await loadDays()
                notify(`Day added to Quote ${currentQuoteNo}`)
            }
        } catch (error) {
            notify(errorText(error, 'Couldn’t add the day.'), 'error')
        }
    }

    const handleUpdateItenary = async () => {
        try {
            const preparedPayload = await ensureQuoteMasterIds()
            const res = await updateTour({ id: formData.id, ...preparedPayload, leadId }).unwrap()
            if (res.success) {
                setOpenItenaryModal(false)
                await loadDays()
                notify('Day updated')
            }
        } catch (error) {
            notify(errorText(error, 'Couldn’t update the day.'), 'error')
        }
    }

    const openNewDay = () => {
        setisEditing(false)
        setEditingData({})
        resetDayForm()
        setOpenItenaryModal(true)
    }

    const onEditItem = item => {
        setisEditing(true)
        setEditingData(item)
        setOpenItenaryModal(true)
    }

    const handleChange = (name, value) => {
        setFormData(prev => {
            if (name === 'entryType') {
                const nextState = { ...prev, entryType: value }

                if (value !== 'Stay' && value !== 'TransitStay') {
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
                        destinationName: value === 'Stay' || value === 'TransitStay' ? nextState.destinationName : ''
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
            (entryType === 'Stay' || entryType === 'TransitStay') &&
            (!deluxHotel?.trim() || !superDeluxHotel?.trim() || !luxuryHotel?.trim() || !premiumHotel?.trim())

        if (!shouldFillDescription && !shouldFillHotels) {
            return
        }

        if (!destinationName?.trim() && !title?.trim()) {
            return
        }

        setAiPrefillLoading(true)

        try {
            const response = await assistAi({
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
2. Keep hotel suggestions realistic, concise, and destination-specific: real hotel names only, separated by " | ", no descriptions
3. If entryType is "Transit", only provide description
4. If entryType is "TransitStay", provide description and hotel suggestions because it includes an overnight stay
5. Description should sound guest-ready and operationally useful
6. Leave out any key you cannot confidently fill`,
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
            }).unwrap()

            const text = response?.content?.[0]?.text || ''
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
        // ? keyed on the fields that change the suggestion; the timer reads the latest form
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleItinerarySelect = selected => {
        if (typeof selected === 'string') {
            setFormData(prev => ({
                ...prev,
                itenaryId: '',
                title: selected,
                description:
                    prev.description ||
                    buildQuoteDayDescription({
                        entryType: prev.entryType,
                        title: selected,
                        destinationName: prev.destinationName
                    })
            }))
            return
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

    const handleDestinationSelect = selected => {
        if (typeof selected === 'string') {
            setFormData(prev => ({
                ...prev,
                destinationId: '',
                destination: selected,
                destinationName: selected,
                delux_hotel: '',
                super_delux_hotel: '',
                luxury_hotel: '',
                premium_hotel: '',
                description:
                    prev.description ||
                    buildQuoteDayDescription({
                        entryType: prev.entryType,
                        title: prev.title,
                        destinationName: selected
                    })
            }))
            return
        }

        setFormData(prev => ({
            ...prev,
            destinationId: selected?.id || '',
            destination: selected?.name || '',
            destinationName: selected?.name || '',
            delux_hotel: selected?.delux_hotel || '',
            super_delux_hotel: selected?.super_delux_hotel || '',
            luxury_hotel: selected?.luxury_hotel || '',
            premium_hotel: selected?.premium_hotel || '',
            description:
                prev.description ||
                buildQuoteDayDescription({
                    entryType: prev.entryType,
                    title: prev.title,
                    destinationName: selected?.name || ''
                })
        }))
    }

    const onTitleInput = value => {
        setItenarySearch(value)
        handleChange('title', value)
        if (!value) {
            handleChange('itenaryId', '')
            handleChange('description', '')
        }
    }

    const onTitlePick = selected => {
        handleItinerarySelect(selected)
        setItenarySearch(typeof selected === 'string' ? selected : selected?.title || '')
    }

    const onDestinationInput = value => {
        setDestinationSearch(value)
        handleChange('destinationName', value)
        handleChange('destination', value)
        if (!value) handleChange('destinationId', '')
    }

    const onDestinationPick = selected => {
        handleDestinationSelect(selected)
        setDestinationSearch(typeof selected === 'string' ? selected : selected?.name || '')
    }

    // ? photos for the place once the agent stops typing — every keystroke used to search, and use up the limit
    const typedKeyword =
        formData.destinationName || itenaries?.data?.find(i => i.id === formData.itenaryId)?.title || ''
    const [keyword, setKeyword] = useState('')
    useEffect(() => {
        const timer = setTimeout(() => setKeyword(typedKeyword), 600)
        return () => clearTimeout(timer)
    }, [typedKeyword])
    const { data: imageData, isLoading: loadingImages } = useGetTravelImagesQuery(keyword, {
        skip: !keyword || !openItenaryModal
    })
    const images = imageData?.urls || []

    const handleSaveAction = async () => {
        if (!formData.title?.trim()) {
            notify('Pick or type a title for the day first.', 'warning')
            return
        }
        setSavingDay(true)
        if (!isEditing) {
            await handleAddItenary()
        } else {
            await handleUpdateItenary()
        }
        setSavingDay(false)
    }

    // --- Sending and booking ---

    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewHtml, setPreviewHtml] = useState('')
    const [previewSubject, setPreviewSubject] = useState('')
    const [loadingPreview, setLoadingPreview] = useState(false)

    const handleShare = async () => {
        try {
            await shareLeadDetails({
                leadId,
                quotationNo: currentQuoteNo
            }).unwrap()

            setPreviewOpen(false)
            // ? sending is queued: the quote section shows when it has gone, or why it has not
            notify(`Quote ${currentQuoteNo} is on its way to ${leadData?.data?.senderEmail || 'the guest'}`)
            setTimeout(() => refetchLead(), 8000)
        } catch (err) {
            notify(err.data?.message || 'Failed to send mail.', 'error')
        }
    }

    // ? a PDF needs no phone number — only WhatsApp does; Gmail and Facebook leads often have none
    const handleDownloadPdf = async () => {
        try {
            notify('Generating the PDF…', 'info')

            const baseUrl = import.meta.env.VITE_APP_BASE_URL
            const res = await fetch(`${baseUrl}/leads/generate-pdf/${leadId}/${currentQuoteNo || 1}`, {
                method: 'GET',
                credentials: 'include'
            })

            if (!res.ok) {
                throw new Error((await res.text().catch(() => '')) || 'Failed to generate PDF.')
            }

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = url
            a.download = `${(leadData?.data?.fullName || 'Guest').replace(/\s+/g, '_')}_Trip_Quote.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)

            setTimeout(() => window.URL.revokeObjectURL(url), 10000)

            notify('PDF downloaded')
        } catch (err) {
            notify('Couldn’t generate the PDF. Please try again.', 'error')
        }
    }

    const handleShareQuotation = () => {
        if (!leadData?.data?.phone) {
            notify('This lead has no phone number.', 'error')
            return
        }

        const phoneNumber = leadData?.data?.phone.replace(/\D/g, '')
        const message = encodeURIComponent(
            `*TRAVEL QUOTATION - The Travel Kart*\n\n` +
                `Hi ${leadData?.data?.fullName},\n\n` +
                `I have attached your customized trip itinerary below. 📄\n\n` +
                `_Note: Please find the attached PDF in this chat._`
        )

        window.open(`https://web.whatsapp.com/send?phone=${phoneNumber}&text=${message}`, '_blank')
    }

    const handlePreview = async () => {
        setLoadingPreview(true)
        setPreviewOpen(true)
        try {
            const { data } = await dispatch(getLeadPreview.initiate({ leadId, quoteNo: currentQuoteNo }))
            setPreviewHtml(data?.data?.html || '')
            setPreviewSubject(data?.data?.subject || '')
        } catch (err) {
            notify('Failed to load preview', 'error')
            setPreviewOpen(false)
        } finally {
            setLoadingPreview(false)
        }
    }

    const guestName = leadData?.data?.fullName

    const titleValue =
        itenaries?.data?.find(item => String(item.id) === String(formData.itenaryId)) ||
        (formData.title ? formData.title : null)
    const destinationValue =
        destinations?.data?.find(item => String(item.id) === String(formData.destinationId)) ||
        (formData.destinationName ? formData.destinationName : null)

    return (
        <MainCard
            sx={{ py: 2 }}
            contentSX={{ px: { xs: 2, sm: 3 }, py: 2 }}
            title={
                guestName ? ['Quotation', guestName, leadData?.data?.leadNo].filter(Boolean).join(' · ') : 'Quotation'
            }
        >
            <Box
                sx={{
                    maxWidth: 1040,
                    '& .MuiButton-root': { textTransform: 'none' },
                    // ? 16px inputs: easier to read, and iOS does not zoom the page when a field is tapped
                    '& .MuiInputBase-input': { fontSize: '1rem' }
                }}
            >
                <Typography
                    color='text.secondary'
                    sx={{ fontSize: '0.8125rem', letterSpacing: '0.08em', fontWeight: 600, mb: 2 }}
                >
                    {guestName ? `QUOTATION · ${guestName.toUpperCase()}` : 'QUOTATION'}
                </Typography>
                <Box sx={{ maxWidth: 520, mb: 4 }}>
                    <MyTabs
                        activeTab={activeTab}
                        handleTabChange={handleTabChange}
                        tabsFields={STEPS}
                        tabsEnabled={tabsEnabled}
                    />
                </Box>

                {activeTab === 0 && loadingTrip ? (
                    <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : null}

                {activeTab === 0 && !loadingTrip ? (
                    <TripDetailsStep
                        enquiry={leadData?.data?.message || ''}
                        initialValues={tripValues}
                        isNew={!guestId}
                        onSave={saveTripDetails}
                        saving={savingTrip}
                        error={tripError}
                    />
                ) : null}

                {activeTab === 1 ? (
                    <ItinerarySection
                        quotes={quotes}
                        currentQuoteNo={currentQuoteNo}
                        onSelectQuote={setCurrentQuoteNo}
                        onNewQuote={handleNewQuote}
                        campaigns={campaigns}
                        quoteCampaigns={quoteCampaigns}
                        currentCampaignId={currentCampaignId}
                        leadCampaignId={leadCampaignId}
                        onChangeQuoteCampaign={handleQuoteCampaignChange}
                        savingQuoteCampaign={savingQuoteCampaign}
                        tripLine={tripSummary(tripValues)}
                        onEditTrip={() => setActiveTab(0)}
                        startDate={tripValues.pickupDate}
                        guestCategory={tripValues.packageType}
                        days={currentDays}
                        stays={stayBreakdown(currentDays)}
                        loadingDays={loadingDays}
                        packages={packages?.data || []}
                        loadingPackages={loadingPackages}
                        applyingPackage={applyingPackage}
                        onApplyPackage={applyPackage}
                        onAddDay={openNewDay}
                        onEditDay={onEditItem}
                        onDeleteDay={handleDeleteDay}
                        onMoveDay={handleMoveDay}
                        priceForm={
                            <GuestTourPriceForm
                                tourId={leadId}
                                quotationNo={currentQuoteNo}
                                activeTab={activeTab}
                                guestCategory={tripValues.packageType}
                                people={headCount(tripValues)}
                            />
                        }
                        priceData={price?.data || null}
                        confirmedPackage={confirmedPackage?.data || null}
                        lastSharedQuoteNo={leadData?.data?.lastSharedQuoteNo || null}
                        lastSharedAt={leadData?.data?.lastSharedAt || null}
                        lastShareStatus={leadData?.data?.lastShareStatus || null}
                        lastShareError={leadData?.data?.lastShareError || null}
                        onPreview={handlePreview}
                        onDownloadPdf={handleDownloadPdf}
                        onWhatsApp={handleShareQuotation}
                        onConvert={() => setIsConvertModalOpen(true)}
                    />
                ) : null}
            </Box>

            <DayEditor
                open={openItenaryModal}
                onClose={() => setOpenItenaryModal(false)}
                isEditing={isEditing}
                saving={savingDay}
                day={formData}
                onChange={handleChange}
                titleOptions={itenaries?.data || []}
                titleValue={titleValue}
                titleInput={itenarySearch}
                loadingTitles={loadingItenary}
                onTitleInput={onTitleInput}
                onTitlePick={onTitlePick}
                destinationOptions={destinations?.data || []}
                destinationValue={destinationValue}
                destinationInput={destinationSearch}
                loadingDestinations={loadingDestinations}
                onDestinationInput={onDestinationInput}
                onDestinationPick={onDestinationPick}
                aiBusy={aiPrefillLoading}
                images={images}
                loadingImages={loadingImages}
                onSave={handleSaveAction}
            />

            <PackageConversion
                isOpen={isConvertModalOpen}
                setIsOpen={setIsConvertModalOpen}
                leadId={leadId}
                quotationNo={currentQuoteNo}
                priceData={price?.data}
                people={headCount(tripValues)}
            />

            <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: { xs: '100vw', sm: '85vw' },
                        maxWidth: 900,
                        height: { xs: '100dvh', sm: '85vh' },
                        bgcolor: 'background.paper',
                        borderRadius: { xs: 0, sm: 2 },
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
                            borderBottom: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
                                Email preview · Quote {currentQuoteNo}
                            </Typography>
                            {!loadingPreview && (previewSubject || leadData?.data?.senderEmail) ? (
                                <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mt: 0.25 }} noWrap>
                                    {leadData?.data?.senderEmail ? `To ${leadData.data.senderEmail}` : ''}
                                    {leadData?.data?.senderEmail && previewSubject ? ' · ' : ''}
                                    {previewSubject}
                                </Typography>
                            ) : null}
                        </Box>
                        <IconButton aria-label='Close' onClick={() => setPreviewOpen(false)}>
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
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 2,
                            '& .MuiButton-root': { textTransform: 'none' }
                        }}
                    >
                        <Button variant='text' onClick={() => setPreviewOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant='contained'
                            startIcon={isLoading ? <CircularProgress size={16} color='inherit' /> : <Send />}
                            onClick={handleShare}
                            disabled={isLoading || loadingPreview || !leadData?.data?.senderEmail}
                        >
                            {isLoading && 'Sending…'}
                            {!isLoading && leadData?.data?.senderEmail ? `Send to ${leadData.data.senderEmail}` : ''}
                            {!isLoading && !leadData?.data?.senderEmail
                                ? 'No email on this lead — add one to send'
                                : ''}
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </MainCard>
    )
}

export default GuestForm
