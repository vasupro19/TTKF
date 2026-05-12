import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    MenuItem,
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography
} from '@mui/material'
import { Add, AutoAwesome, Delete, Save } from '@mui/icons-material'
import { useDispatch } from 'react-redux'
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import { openSnackbar } from '@app/store/slices/snackbar'
import { getCampaigns } from '@/app/store/slices/api/campaignSlice'
import { getTravelImages, useAssistAiMutation } from '@/app/store/slices/api/aiSlice'
import { useCreatePackageClientMutation } from '@/app/store/slices/api/packageSlice'
import {
    getDestinationClients,
    useCreateDestinationClientMutation,
    useUpdateDestinationClientMutation
} from '@/app/store/slices/api/destinationSlice'
import {
    getItenaryClients,
    useCreateItenaryClientMutation,
    useUpdateItenaryClientMutation
} from '@/app/store/slices/api/itenarySlice'
import { useCreatePackageItenaryClientMutation } from '@/app/store/slices/api/packageItenarySlice'

const steps = ['Package', 'Destinations', 'Activities', 'Review']

const createDestinationRow = (name = '', nights = 1) => ({
    id: `${Date.now()}-${Math.random()}`,
    name,
    nights,
    delux_hotel: '',
    super_delux_hotel: '',
    luxury_hotel: '',
    premium_hotel: ''
})

const createActivityRow = (values = {}) => ({
    id: `${Date.now()}-${Math.random()}`,
    title: '',
    description: '',
    destinationName: '',
    destinationId: '',
    entryType: 'Stay',
    image: '',
    ...values
})

const createInsertedActivityTitle = entryType => {
    if (entryType === 'Transit') {
        return 'Transit Day'
    }

    if (entryType === 'TransitStay') {
        return 'Transit + Stay Day'
    }

    if (entryType === 'FreshUp') {
        return 'Fresh Up Day'
    }

    return 'New Stay Day'
}

const toNormalized = value => (value || '').toString().trim().toLowerCase()

const parseAiJson = response => {
    const text = response?.content?.[0]?.text || response?.data?.content?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    return clean ? JSON.parse(clean) : {}
}

const TRANSPORT_PATTERNS = [
    { regex: /\btempo\s*travell?er\b/i, label: 'Tempo Traveller' },
    { regex: /\btempo\b/i, label: 'Tempo Traveller' },
    { regex: /\bvolvo\b/i, label: 'Volvo' },
    { regex: /\bcab\b/i, label: 'Cab' },
    { regex: /\btaxi\b/i, label: 'Cab' },
    { regex: /\btrain\b/i, label: 'Train' },
    { regex: /\bflight\b/i, label: 'Flight' },
    { regex: /\bbus\b/i, label: 'Bus' }
]

const cleanDestinationLabel = value =>
    (value || '')
        .toString()
        .replace(/\bfrom\s+[a-z\s]+$/i, '')
        .replace(/\bvia\s+[a-z\s]+$/i, '')
        .replace(/\bby\s+[a-z\s]+$/i, '')
        .replace(/\bwith\s+[a-z\s]+$/i, '')
        .replace(/\bpickup\s+from\s+[a-z\s]+$/i, '')
        .replace(/\s+/g, ' ')
        .trim()

const extractTransportMode = prompt => {
    const normalizedPrompt = (prompt || '').toString()
    const matches = TRANSPORT_PATTERNS.map(pattern => {
        const match = normalizedPrompt.match(pattern.regex)
        return match ? { index: match.index ?? Number.MAX_SAFE_INTEGER, label: pattern.label } : null
    }).filter(Boolean)

    const uniqueLabels = matches
        .sort((left, right) => left.index - right.index)
        .map(item => item.label)
        .filter((label, index, collection) => collection.indexOf(label) === index)

    return uniqueLabels.join(' + ')
}

const buildTransferTitle = ({ fromLocation, toLocation, transportMode }) => {
    const baseTitle = fromLocation ? `Transfer from ${fromLocation} to ${toLocation}` : `Transfer to ${toLocation}`
    return transportMode ? `${baseTitle} via ${transportMode}` : baseTitle
}

const buildTransferDescription = ({ fromLocation, toLocation, transportMode }) => {
    const transportText = transportMode ? ` via ${transportMode}` : ''

    if (fromLocation) {
        return `Guest pickup from ${fromLocation} and proceed towards ${toLocation}${transportText}. Enjoy a comfortable journey with time to take in the changing landscapes and route experiences along the way. On arrival, continue with the planned schedule for the day, whether it is local exploration, a refreshment break, or the next step of the holiday experience.`
    }

    return `Today the journey continues towards ${toLocation}${transportText}. Travel comfortably through the route while enjoying the scenery and smooth onward movement between destinations. On reaching ${toLocation}, continue with the planned itinerary for the day and settle into the next part of the travel experience with ease.`
}

const buildTransitStayDescription = ({ fromLocation, toLocation, transportMode }) => {
    const transportText = transportMode ? ` via ${transportMode}` : ''

    if (fromLocation) {
        return `Guest pickup from ${fromLocation} and proceed to ${toLocation}${transportText}. Enjoy the journey with a comfortable transfer plan and a smooth arrival into the destination. After reaching ${toLocation}, check in and unwind, with the remaining time available for light local exploration or relaxed leisure before the overnight stay.`
    }

    return `Travel onwards to ${toLocation}${transportText} and arrive comfortably at the destination. After arrival, settle into the stay and take the rest of the day at an easy pace with time to relax, enjoy the surroundings, or experience a gentle introduction to the place before the overnight halt.`
}

const buildReturnTitle = ({ fromLocation, toLocation, transportMode }) => {
    const baseTitle = fromLocation ? `Drop from ${fromLocation} to ${toLocation}` : `Drop to ${toLocation}`
    return transportMode ? `${baseTitle} via ${transportMode}` : baseTitle
}

const buildReturnDescription = ({ fromLocation, toLocation, transportMode }) => {
    const transportText = transportMode ? ` via ${transportMode}` : ''

    if (fromLocation) {
        return `After completing the holiday, depart from ${fromLocation} and proceed towards ${toLocation}${transportText}. Enjoy a smooth return transfer with time to relax and reflect on the journey before drop-off at the final location. This brings the trip to a comfortable and well-organized close.`
    }

    return `Proceed towards ${toLocation}${transportText} for the final drop. The return transfer is planned to keep the end of the journey smooth, comfortable, and convenient for the guest.`
}

const parseDraftPrompt = prompt => {
    const normalizedPrompt = prompt.replace(/\s+/g, ' ').trim()
    const originMatch =
        normalizedPrompt.match(/\bfrom\s+([a-z][a-z\s]+?)(?=(?:\s+\d+\s*(?:n|night|nights)\b)|$)/i) ||
        normalizedPrompt.match(/\bpickup\s+from\s+([a-z][a-z\s]+?)(?=(?:\s+\d+\s*(?:n|night|nights)\b)|$)/i)
    const originLocation = originMatch?.[1]?.trim() || ''
    const transportMode = extractTransportMode(normalizedPrompt)

    const lines = normalizedPrompt
        .split(/\n|,/)
        .map(item => item.trim())
        .filter(Boolean)

    const destinations = []

    lines.forEach(line => {
        const matches = [
            ...line.matchAll(/(\d+)\s*(?:n|night|nights)\s+([^,\n]+?)(?=(?:\s+\d+\s*(?:n|night|nights)\b)|$)/gi)
        ]

        matches.forEach(match => {
            const destinationName = cleanDestinationLabel(match[2])
            if (destinationName) {
                destinations.push(createDestinationRow(destinationName, Number(match[1]) || 1))
            }
        })
    })

    const uniqueDestinations = destinations.filter((destination, index, collection) => {
        const key = toNormalized(destination.name)
        return collection.findIndex(item => toNormalized(item.name) === key) === index
    })

    return {
        originLocation,
        transportMode,
        destinations: uniqueDestinations
    }
}

const hasPromptOrigin = prompt => /\b(?:from|pickup\s+from)\b/i.test(prompt || '')

const parsePromptWithFallbackOrigin = (prompt, currentOriginLocation = '') => {
    const parsed = parseDraftPrompt(prompt)
    return {
        originLocation: parsed.originLocation || (hasPromptOrigin(prompt) ? '' : currentOriginLocation),
        transportMode: parsed.transportMode || '',
        destinations: parsed.destinations
    }
}

const buildSuggestedPackageName = destinationRows => {
    const validNames = destinationRows.map(item => item.name.trim()).filter(Boolean)

    if (!validNames.length) {
        return ''
    }

    const totalNights = destinationRows.reduce((sum, item) => sum + (Number(item.nights) || 0), 0)
    const totalDays = totalNights + 1

    return `${validNames.join(' - ')} ${totalDays}D/${totalNights}N`
}

const buildActivitiesFromDestinations = (destinationRows, originLocation = '', transportMode = '') => {
    const activities = []
    const validOrigin = originLocation.trim()
    const validTransportMode = transportMode.trim()
    const validDestinations = destinationRows.filter(item => item.name?.trim())

    validDestinations.forEach((destination, index) => {
        const nights = Number(destination.nights) || 1
        const previousDestination = validDestinations[index - 1]
        const transferFromLocation = index === 0 ? validOrigin : previousDestination?.name || ''

        if (transferFromLocation) {
            activities.push(
                createActivityRow({
                    title: buildTransferTitle({
                        fromLocation: transferFromLocation,
                        toLocation: destination.name,
                        transportMode: validTransportMode
                    }),
                    description: buildTransitStayDescription({
                        fromLocation: transferFromLocation,
                        toLocation: destination.name,
                        transportMode: validTransportMode
                    }),
                    destinationName: destination.name,
                    destinationId: '',
                    entryType: 'TransitStay'
                })
            )
        } else {
            activities.push(
                createActivityRow({
                    title: `Arrival in ${destination.name}`,
                    description: `Arrive in ${destination.name} and settle in comfortably after the journey. Depending on your arrival time, enjoy a relaxed local outing, market visit, or leisure moments while soaking in the atmosphere of the destination. The day is kept easy and welcoming so the trip begins on a pleasant and comfortable note before the overnight stay.`,
                    destinationName: destination.name,
                    destinationId: '',
                    entryType: 'Stay'
                })
            )
        }

        for (let day = 1; day < nights; day += 1) {
            activities.push(
                createActivityRow({
                    title: `Explore ${destination.name}`,
                    description: `Spend the day exploring the highlights of ${destination.name} with time for sightseeing, local experiences, and memorable moments at a comfortable pace. Enjoy the character of the destination through its scenic spots, culture, and atmosphere, then return for a relaxed evening and overnight stay after a fulfilling day of travel experiences.`,
                    destinationName: destination.name,
                    destinationId: '',
                    entryType: 'Stay'
                })
            )
        }
    })

    if (validOrigin && validDestinations.length) {
        const lastDestination = validDestinations[validDestinations.length - 1]

        activities.push(
            createActivityRow({
                title: buildReturnTitle({
                    fromLocation: lastDestination.name,
                    toLocation: validOrigin,
                    transportMode: validTransportMode
                }),
                description: buildReturnDescription({
                    fromLocation: lastDestination.name,
                    toLocation: validOrigin,
                    transportMode: validTransportMode
                }),
                entryType: 'Transit'
            })
        )
    }

    return activities
}

const buildDefaultDescription = ({ entryType, destinationName, title, originLocation, transportMode }) => {
    if (entryType === 'Transit') {
        if (originLocation && destinationName) {
            return buildTransferDescription({
                fromLocation: originLocation,
                toLocation: destinationName,
                transportMode
            })
        }

        if (destinationName) {
            return buildTransferDescription({
                toLocation: destinationName,
                transportMode
            })
        }

        return transportMode
            ? `Travel and transfer arrangements for the guest journey are planned comfortably via ${transportMode}. The schedule keeps the movement smooth and easy for the guest while ensuring the day remains practical, well-paced, and aligned with the onward travel plan.`
            : 'Travel and transfer arrangements for the guest journey are planned comfortably. The schedule keeps the movement smooth and easy for the guest while ensuring the day remains practical, well-paced, and aligned with the onward travel plan.'
    }

    if (entryType === 'TransitStay') {
        if (originLocation && destinationName) {
            return `Guest pickup from ${originLocation} and proceed to ${destinationName}${transportMode ? ` via ${transportMode}` : ''}. Enjoy the journey with a comfortable transfer plan and a smooth arrival into the destination. After reaching ${destinationName}, check in and unwind, with the remaining time available for light local exploration or relaxed leisure before the overnight stay.`
        }

        if (destinationName) {
            return `Travel onwards to ${destinationName}${transportMode ? ` via ${transportMode}` : ''} and arrive comfortably at the destination. After arrival, settle into the stay and take the rest of the day at an easy pace with time to relax, enjoy the surroundings, or experience a gentle introduction to the place before the overnight halt.`
        }

        return transportMode
            ? `Travel, arrival, and overnight stay arrangements are planned comfortably for the guest journey via ${transportMode}. The day balances onward movement with enough time to arrive smoothly, settle in, and transition into the stay experience without rush.`
            : 'Travel, arrival, and overnight stay arrangements are planned comfortably for the guest journey. The day balances onward movement with enough time to arrive smoothly, settle in, and transition into the stay experience without rush.'
    }

    if (entryType === 'FreshUp') {
        return 'Use this break to freshen up, relax, and get ready for the next part of the journey. This short halt can be used for wash and change, refreshments, a quick pause after travel, or a comfortable reset before continuing with the planned sightseeing or onward movement. The timing helps keep the overall journey smooth and guest-friendly.'
    }

    if (destinationName) {
        return `Enjoy a well-paced day in ${destinationName} with time for sightseeing, local experiences, and moments that reflect the character of the destination. The plan keeps the experience comfortable and memorable, allowing guests to enjoy the place without feeling rushed before returning for a restful stay in the evening.`
    }

    if (title) {
        return `Enjoy the planned experiences for ${title} with a comfortable pace and a guest-friendly flow. The day is designed to balance movement, sightseeing, and leisure so the overall travel experience feels smooth, enjoyable, and well-organized from start to finish.`
    }

    return 'Enjoy a comfortable and well-planned day filled with sightseeing, local experiences, and a smooth overall travel flow. The itinerary is arranged to keep the experience engaging yet relaxed, helping guests make the most of the destination while maintaining comfort throughout the journey.'
}

const copyHotelsFromDestination = (destination = {}) => ({
    delux_hotel: destination.delux_hotel || '',
    super_delux_hotel: destination.super_delux_hotel || '',
    luxury_hotel: destination.luxury_hotel || '',
    premium_hotel: destination.premium_hotel || ''
})

const normalizeHotelSuggestions = value => {
    const rawList = Array.isArray(value) ? value : (value || '').toString().split(/\n|;|\||,/)

    const cleaned = rawList
        .map(item =>
            item
                ?.toString?.()
                ?.replace(/^\s*\d+[).\s-]*/g, '')
                ?.replace(/^[-*•]\s*/g, '')
                ?.trim?.()
        )
        .filter(Boolean)

    return cleaned.slice(0, 4).join(' | ')
}

function PackageCreationWizard() {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()

    const campaignContextId = location.state?.campaignId

    const [activeStep, setActiveStep] = useState(0)
    const [campaignOptions, setCampaignOptions] = useState([])
    const [existingDestinations, setExistingDestinations] = useState([])
    const [existingItenaries, setExistingItenaries] = useState([])
    const [draftPrompt, setDraftPrompt] = useState('')
    const [saving, setSaving] = useState(false)
    const [voiceSupported, setVoiceSupported] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [voiceStatus, setVoiceStatus] = useState('')
    const [voiceDrafting, setVoiceDrafting] = useState(false)
    const [imageOptionsByRow, setImageOptionsByRow] = useState({})
    const [imageLoadingByRow, setImageLoadingByRow] = useState({})
    const [destinationHotelLoadingByRow, setDestinationHotelLoadingByRow] = useState({})
    const [descriptionLoadingByRow, setDescriptionLoadingByRow] = useState({})
    const imageAutofillTimeoutRef = useRef({})
    const destinationHotelTimeoutRef = useRef({})
    const activityDescriptionTimeoutRef = useRef({})
    const speechRecognitionRef = useRef(null)

    const [packageForm, setPackageForm] = useState({
        name: '',
        campaignId: campaignContextId?.toString() || '',
        originLocation: '',
        transportMode: ''
    })
    const [destinations, setDestinations] = useState([createDestinationRow()])
    const [activities, setActivities] = useState([])

    const [createPackageClient] = useCreatePackageClientMutation()
    const [createDestinationClient] = useCreateDestinationClientMutation()
    const [updateDestinationClient] = useUpdateDestinationClientMutation()
    const [createItenaryClient] = useCreateItenaryClientMutation()
    const [updateItenaryClient] = useUpdateItenaryClientMutation()
    const [createPackageItenaryClient] = useCreatePackageItenaryClientMutation()
    const [assistAi] = useAssistAiMutation()

    const totalStayNights = useMemo(
        () => destinations.reduce((sum, item) => sum + (Number(item.nights) || 0), 0),
        [destinations]
    )
    const stayActivityCount = useMemo(
        () => activities.filter(item => item.entryType === 'Stay' || item.entryType === 'TransitStay').length,
        [activities]
    )
    const transitActivityCount = useMemo(
        () => activities.filter(item => item.entryType === 'Transit').length,
        [activities]
    )
    const freshUpActivityCount = useMemo(
        () => activities.filter(item => item.entryType === 'FreshUp').length,
        [activities]
    )
    const transitStayActivityCount = useMemo(
        () => activities.filter(item => item.entryType === 'TransitStay').length,
        [activities]
    )

    const campaignIdNumber = packageForm.campaignId ? Number(packageForm.campaignId) : null
    const availableDestinationChips = useMemo(
        () => existingDestinations.filter(item => item.name?.trim()),
        [existingDestinations]
    )
    const existingDestinationMap = useMemo(
        () =>
            Object.fromEntries(
                existingDestinations.filter(item => item.name?.trim()).map(item => [toNormalized(item.name), item])
            ),
        [existingDestinations]
    )
    const existingItenaryMap = useMemo(
        () =>
            Object.fromEntries(
                existingItenaries.filter(item => item.title?.trim()).map(item => [toNormalized(item.title), item])
            ),
        [existingItenaries]
    )

    const loadCampaigns = useCallback(async () => {
        const { data } = await dispatch(getCampaigns.initiate())
        setCampaignOptions((data?.data || []).map(item => ({ label: item.title, value: item.id.toString() })))
    }, [dispatch])

    const loadCampaignDependencies = useCallback(
        async campaignId => {
            if (!campaignId) {
                setExistingDestinations([])
                setExistingItenaries([])
                return
            }

            const [destinationResponse, itenaryResponse] = await Promise.all([
                dispatch(getDestinationClients.initiate(`?campaignId=${campaignId}`, false)),
                dispatch(getItenaryClients.initiate(`?campaignId=${campaignId}`, false))
            ])

            setExistingDestinations(destinationResponse?.data?.data || [])
            setExistingItenaries(itenaryResponse?.data?.data || [])
        },
        [dispatch]
    )

    useEffect(() => {
        loadCampaigns()
    }, [loadCampaigns])

    useEffect(() => {
        if (campaignIdNumber) {
            loadCampaignDependencies(campaignIdNumber)
        }
    }, [campaignIdNumber, loadCampaignDependencies])

    const handlePackageChange = event => {
        const { name, value } = event.target
        setPackageForm(prev => ({ ...prev, [name]: value }))
    }

    const getMatchedDestination = useCallback(
        name => existingDestinationMap[toNormalized(name)],
        [existingDestinationMap]
    )
    const getMatchedItenary = useCallback(title => existingItenaryMap[toNormalized(title)], [existingItenaryMap])

    const buildDestinationRowFromValue = (name = '', nights = 1) => ({
        ...createDestinationRow(name, nights),
        ...copyHotelsFromDestination(getMatchedDestination(name))
    })

    const shouldReplaceDescription = ({ previousRow, nextDescription, field, nextValue }) => {
        if (!previousRow.description?.trim()) {
            return true
        }

        const previousMatchedItenary = getMatchedItenary(previousRow.title)
        const previousDefaultDescription = buildDefaultDescription({
            entryType: previousRow.entryType,
            destinationName: previousRow.destinationName,
            title: previousRow.title,
            originLocation: packageForm.originLocation,
            transportMode: packageForm.transportMode
        })

        if (previousRow.description === previousMatchedItenary?.description) {
            return true
        }

        if (previousRow.description === previousDefaultDescription) {
            return true
        }

        if (field === 'description') {
            return false
        }

        return previousRow.description === nextDescription && nextValue !== previousRow[field]
    }

    const scheduleImageAutofillForRow = row => {
        const keyword = (row.destinationName || row.title || '').trim()
        if (!keyword || row.image) {
            return
        }

        const existingTimeout = imageAutofillTimeoutRef.current[row.id]
        if (existingTimeout) {
            clearTimeout(existingTimeout)
        }

        imageAutofillTimeoutRef.current[row.id] = setTimeout(async () => {
            setImageLoadingByRow(prev => ({ ...prev, [row.id]: true }))

            try {
                const response = await dispatch(getTravelImages.initiate(keyword, false))
                const nextOptions = response?.data?.urls || []
                const firstImage = nextOptions?.[0]?.url || ''

                setImageOptionsByRow(prev => ({ ...prev, [row.id]: nextOptions }))
                if (firstImage) {
                    setActivities(prev =>
                        prev.map(item => (item.id === row.id && !item.image ? { ...item, image: firstImage } : item))
                    )
                }
            } catch (error) {
                setImageOptionsByRow(prev => ({ ...prev, [row.id]: prev[row.id] || [] }))
            } finally {
                setImageLoadingByRow(prev => ({ ...prev, [row.id]: false }))
                delete imageAutofillTimeoutRef.current[row.id]
            }
        }, 600)
    }

    const scheduleActivityDescriptionAutofill = row => {
        const title = row.title?.trim()
        const destinationName = row.destinationName?.trim()
        const matchedItenary = getMatchedItenary(title)

        if (!title || matchedItenary?.description?.trim()) {
            return
        }

        const existingTimeout = activityDescriptionTimeoutRef.current[row.id]
        if (existingTimeout) {
            clearTimeout(existingTimeout)
        }

        activityDescriptionTimeoutRef.current[row.id] = setTimeout(async () => {
            setDescriptionLoadingByRow(prev => ({ ...prev, [row.id]: true }))

            try {
                const response = await assistAi({
                    system: `You are a premium travel copywriter helping a package creation wizard draft day-wise itinerary descriptions.

Respond ONLY with a valid JSON object.
Allowed keys:
- description

Rules:
1. description must be one polished paragraph between 55 and 90 words
2. write warm, guest-friendly travel language suitable for a package quotation
3. include arrival, local sightseeing, stay, transfer, or fresh-up context based on the entryType
4. if entryType is Stay or TransitStay and a destination is available, mention the destination naturally
5. if transportMode is provided for a transfer-style day, weave it in naturally
6. do not use bullet points, numbering, markdown, emojis, or headings
7. do not mention hotel category names
8. return JSON only`,
                    messages: [
                        {
                            role: 'user',
                            content: JSON.stringify({
                                packageName: packageForm.name || '',
                                originLocation: packageForm.originLocation || '',
                                transportMode: packageForm.transportMode || '',
                                day: {
                                    title,
                                    destinationName,
                                    entryType: row.entryType
                                }
                            })
                        }
                    ]
                }).unwrap()

                const parsed = parseAiJson(response)
                const nextDescription = parsed?.description?.toString?.().trim?.() || ''

                if (!nextDescription) {
                    return
                }

                setActivities(prev =>
                    prev.map(item => {
                        if (item.id !== row.id) {
                            return item
                        }

                        if (
                            !shouldReplaceDescription({
                                previousRow: item,
                                nextDescription,
                                field: 'title',
                                nextValue: item.title
                            })
                        ) {
                            return item
                        }

                        return {
                            ...item,
                            description: nextDescription
                        }
                    })
                )
            } catch (error) {
                // Keep the wizard editable even if AI description generation fails.
            } finally {
                setDescriptionLoadingByRow(prev => ({ ...prev, [row.id]: false }))
                delete activityDescriptionTimeoutRef.current[row.id]
            }
        }, 500)
    }

    const scheduleDestinationHotelAutofill = row => {
        const destinationName = row.name?.trim()
        if (!destinationName || getMatchedDestination(destinationName)) {
            return
        }

        const hasAllHotels =
            row.delux_hotel?.trim() &&
            row.super_delux_hotel?.trim() &&
            row.luxury_hotel?.trim() &&
            row.premium_hotel?.trim()

        if (hasAllHotels) {
            return
        }

        const existingTimeout = destinationHotelTimeoutRef.current[row.id]
        if (existingTimeout) {
            clearTimeout(existingTimeout)
        }

        destinationHotelTimeoutRef.current[row.id] = setTimeout(async () => {
            setDestinationHotelLoadingByRow(prev => ({ ...prev, [row.id]: true }))

            try {
                const response = await assistAi({
                    system: `You are a destination research assistant for an India travel package wizard.

Respond ONLY with a valid JSON object.
Allowed keys:
- delux_hotel
- super_delux_hotel
- luxury_hotel
- premium_hotel

Rules:
1. Output pure JSON only
2. Every key must contain exactly 4 hotel names
3. Return hotel names only, with no descriptions, prices, numbering, bullets, or commentary
4. Separate the 4 hotel names with " | "
5. Hotels must be destination-specific and realistic for Indian travel planning
6. Keep category quality distinct:
   - delux_hotel: strong budget/deluxe properties
   - super_delux_hotel: better super deluxe or 4-star style properties
   - luxury_hotel: recognized luxury properties
   - premium_hotel: top-tier premium, iconic, or high-end boutique properties
7. If exact certainty is limited, still give the best-fit plausible hotel names for that destination`,
                    messages: [
                        {
                            role: 'user',
                            content: `Destination: ${destinationName}. Suggest 4 hotel names for each category.`
                        }
                    ]
                }).unwrap()

                const parsed = parseAiJson(response)
                const nextDeluxHotel = normalizeHotelSuggestions(
                    parsed.delux_hotel || parsed.deluxe_hotel || parsed.deluxeHotel || ''
                )
                const nextSuperDeluxHotel = normalizeHotelSuggestions(
                    parsed.super_delux_hotel || parsed.superDeluxeHotel || parsed.super_deluxe_hotel || ''
                )
                const nextLuxuryHotel = normalizeHotelSuggestions(parsed.luxury_hotel || parsed.luxuryHotel || '')
                const nextPremiumHotel = normalizeHotelSuggestions(parsed.premium_hotel || parsed.premiumHotel || '')

                setDestinations(prev =>
                    prev.map(item => {
                        if (item.id !== row.id) {
                            return item
                        }

                        return {
                            ...item,
                            delux_hotel: item.delux_hotel || nextDeluxHotel || item.delux_hotel,
                            super_delux_hotel: item.super_delux_hotel || nextSuperDeluxHotel || item.super_delux_hotel,
                            luxury_hotel: item.luxury_hotel || nextLuxuryHotel || item.luxury_hotel,
                            premium_hotel: item.premium_hotel || nextPremiumHotel || item.premium_hotel
                        }
                    })
                )
            } catch (error) {
                // Keep wizard usable even if AI hotel suggestions fail.
            } finally {
                setDestinationHotelLoadingByRow(prev => ({ ...prev, [row.id]: false }))
                delete destinationHotelTimeoutRef.current[row.id]
            }
        }, 500)
    }

    const updateDestinationRow = (rowId, field, value) => {
        let nextRowForHotelAutofill = null

        setDestinations(prev =>
            prev.map(item => {
                if (item.id !== rowId) {
                    return item
                }

                const updated = { ...item, [field]: value }

                if (field === 'name') {
                    const matchedDestination = getMatchedDestination(value)
                    if (matchedDestination) {
                        Object.assign(updated, copyHotelsFromDestination(matchedDestination))
                    } else {
                        updated.delux_hotel = ''
                        updated.super_delux_hotel = ''
                        updated.luxury_hotel = ''
                        updated.premium_hotel = ''
                    }
                }

                nextRowForHotelAutofill = updated
                return updated
            })
        )

        if (field === 'name' && nextRowForHotelAutofill) {
            scheduleDestinationHotelAutofill(nextRowForHotelAutofill)
        }
    }

    const addDestinationRow = () => setDestinations(prev => [...prev, createDestinationRow()])
    const removeDestinationRow = rowId => setDestinations(prev => prev.filter(item => item.id !== rowId))

    const addExistingDestination = destination => {
        const alreadyAdded = destinations.some(item => toNormalized(item.name) === toNormalized(destination.name))
        if (alreadyAdded) {
            return
        }

        setDestinations(prev => [
            ...prev,
            {
                ...buildDestinationRowFromValue(destination.name, 1),
                ...copyHotelsFromDestination(destination)
            }
        ])
    }

    const updateActivityRow = (rowId, field, value) => {
        let nextRowForImageAutofill = null

        setActivities(prev =>
            prev.map(item => {
                if (item.id !== rowId) {
                    return item
                }

                const updated = { ...item, [field]: value }
                if (field === 'entryType' && value !== 'Stay' && value !== 'TransitStay') {
                    updated.destinationName = ''
                    updated.destinationId = ''
                }

                const matchedItenary = getMatchedItenary(field === 'title' ? value : updated.title)
                const nextDescription =
                    matchedItenary?.description ||
                    buildDefaultDescription({
                        entryType: updated.entryType,
                        destinationName: updated.destinationName,
                        title: updated.title,
                        originLocation: packageForm.originLocation,
                        transportMode: packageForm.transportMode
                    })

                if (
                    shouldReplaceDescription({
                        previousRow: item,
                        nextDescription,
                        field,
                        nextValue: value
                    })
                ) {
                    updated.description = nextDescription
                }

                if (field === 'destinationName' && !updated.image) {
                    updated.image = ''
                }

                nextRowForImageAutofill = updated
                return updated
            })
        )

        if (field !== 'image' && field !== 'description' && nextRowForImageAutofill) {
            scheduleImageAutofillForRow(nextRowForImageAutofill)
            scheduleActivityDescriptionAutofill(nextRowForImageAutofill)
        }
    }

    const addActivityRow = () => {
        const nextRow = createActivityRow({
            title: 'New Stay Day',
            description: buildDefaultDescription({ entryType: 'Stay' })
        })
        setActivities(prev => [...prev, nextRow])
        scheduleActivityDescriptionAutofill(nextRow)
    }
    const insertActivityRow = (index, entryType = 'Stay') => {
        const nextRow = createActivityRow({
            title: createInsertedActivityTitle(entryType),
            entryType,
            description: buildDefaultDescription({ entryType, transportMode: packageForm.transportMode })
        })

        setActivities(prev => [...prev.slice(0, index), nextRow, ...prev.slice(index)])
        scheduleActivityDescriptionAutofill(nextRow)
    }

    const addSpecialActivityRow = entryType => {
        let title = 'Fresh Up Day'
        const description = buildDefaultDescription({ entryType })

        if (entryType === 'Transit') {
            title = 'Transit Day'
        } else if (entryType === 'TransitStay') {
            title = 'Transit + Stay Day'
        }

        const nextRow = createActivityRow({
            title,
            description,
            entryType
        })

        setActivities(prev => [...prev, nextRow])
        scheduleActivityDescriptionAutofill(nextRow)
    }
    const removeActivityRow = rowId => setActivities(prev => prev.filter(item => item.id !== rowId))

    const fetchImagesForActivity = async row => {
        const keyword = row.destinationName || row.title

        if (!keyword?.trim()) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Add a title or destination first so I can search images.',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }

        setImageLoadingByRow(prev => ({ ...prev, [row.id]: true }))

        try {
            const response = await dispatch(getTravelImages.initiate(keyword, false))
            setImageOptionsByRow(prev => ({ ...prev, [row.id]: response?.data?.urls || [] }))
        } catch (error) {
            setImageOptionsByRow(prev => ({ ...prev, [row.id]: [] }))
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Unable to fetch images right now.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            setImageLoadingByRow(prev => ({ ...prev, [row.id]: false }))
        }
    }

    const autoFillImagesForActivities = async activityRows => {
        const rowsToUpdate = activityRows.filter(row => !row.image && (row.destinationName || row.title))

        if (!rowsToUpdate.length) {
            return
        }

        setImageLoadingByRow(prev => ({
            ...prev,
            ...Object.fromEntries(rowsToUpdate.map(row => [row.id, true]))
        }))

        const results = await Promise.all(
            rowsToUpdate.map(async row => {
                try {
                    const keyword = row.destinationName || row.title
                    const response = await dispatch(getTravelImages.initiate(keyword, false))
                    const firstImage = response?.data?.urls?.[0]?.url || ''
                    return { rowId: row.id, image: firstImage, options: response?.data?.urls || [] }
                } catch (error) {
                    return { rowId: row.id, image: '', options: [] }
                }
            })
        )

        setActivities(prev =>
            prev.map(item => {
                const matched = results.find(result => result.rowId === item.id)
                if (!matched || !matched.image || item.image) {
                    return item
                }

                return { ...item, image: matched.image }
            })
        )

        setImageOptionsByRow(prev => ({
            ...prev,
            ...Object.fromEntries(results.map(result => [result.rowId, result.options]))
        }))

        setImageLoadingByRow(prev => ({
            ...prev,
            ...Object.fromEntries(rowsToUpdate.map(row => [row.id, false]))
        }))
    }

    const handleGenerateFromPrompt = () => {
        const parsedPrompt = parsePromptWithFallbackOrigin(draftPrompt, packageForm.originLocation)
        const hydratedDestinations = parsedPrompt.destinations.map(item =>
            buildDestinationRowFromValue(item.name, item.nights)
        )

        if (!hydratedDestinations.length) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Use lines like "2N Shimla, 2N Manali" so I can draft destinations automatically.',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }

        const nextOriginLocation = parsedPrompt.originLocation
        const nextTransportMode = parsedPrompt.transportMode || packageForm.transportMode
        const generatedActivities = buildActivitiesFromDestinations(
            hydratedDestinations,
            nextOriginLocation,
            nextTransportMode
        )
        setPackageForm(prev => ({
            ...prev,
            originLocation: nextOriginLocation,
            transportMode: nextTransportMode,
            name: prev.name || buildSuggestedPackageName(hydratedDestinations) || prev.name
        }))
        setDestinations(hydratedDestinations)
        setActivities(generatedActivities)
        hydratedDestinations.forEach(scheduleDestinationHotelAutofill)
        generatedActivities.forEach(scheduleActivityDescriptionAutofill)
        autoFillImagesForActivities(generatedActivities)
        setActiveStep(1)
    }

    const applyVoiceDraft = useCallback(
        async promptText => {
            const trimmedPrompt = promptText.trim()

            if (!trimmedPrompt) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Add or speak a package brief first so I can draft it for you.',
                        variant: 'alert',
                        alert: { color: 'warning' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
                return
            }

            try {
                setVoiceDrafting(true)

                const response = await assistAi({
                    system: `You convert spoken travel package requests into structured JSON for a package wizard.

Respond ONLY with valid JSON.
Allowed keys:
- originLocation
- transportMode
- packageName
- destinations

Rules:
1. destinations must be an array of objects
2. each destination object must contain:
   - name
   - nights
3. Convert shorthand like "2n manali 2n shimla from delhi" into proper structured values
4. transportMode should capture words like Cab, Volvo, Train, Flight, Tempo Traveller when present
5. Keep originLocation empty if not clearly mentioned
6. packageName should be concise and travel-friendly
7. Never return explanation text or markdown`,
                    messages: [
                        {
                            role: 'user',
                            content: trimmedPrompt
                        }
                    ]
                }).unwrap()

                const parsed = parseAiJson(response)
                const aiDestinations = Array.isArray(parsed?.destinations) ? parsed.destinations : []
                const hydratedDestinations = aiDestinations
                    .map(item =>
                        buildDestinationRowFromValue(
                            item?.name?.toString?.().trim?.() || '',
                            Math.max(1, Number(item?.nights) || 1)
                        )
                    )
                    .filter(item => item.name.trim())

                if (!hydratedDestinations.length) {
                    handleGenerateFromPrompt()
                    return
                }

                const nextOriginLocation = parsed?.originLocation?.toString?.().trim?.() || packageForm.originLocation
                const nextTransportMode = parsed?.transportMode?.toString?.().trim?.() || packageForm.transportMode
                const nextPackageName =
                    parsed?.packageName?.toString?.().trim?.() || buildSuggestedPackageName(hydratedDestinations)
                const generatedActivities = buildActivitiesFromDestinations(
                    hydratedDestinations,
                    nextOriginLocation,
                    nextTransportMode
                )

                setPackageForm(prev => ({
                    ...prev,
                    originLocation: nextOriginLocation,
                    transportMode: nextTransportMode,
                    name: prev.name || nextPackageName || prev.name
                }))
                setDraftPrompt(trimmedPrompt)
                setDestinations(hydratedDestinations)
                setActivities(generatedActivities)
                hydratedDestinations.forEach(scheduleDestinationHotelAutofill)
                generatedActivities.forEach(scheduleActivityDescriptionAutofill)
                autoFillImagesForActivities(generatedActivities)
                setActiveStep(1)
                setVoiceStatus('Voice draft applied. You can still edit every field before saving.')
            } catch (error) {
                handleGenerateFromPrompt()
            } finally {
                setVoiceDrafting(false)
            }
        },
        [
            assistAi,
            autoFillImagesForActivities,
            buildDestinationRowFromValue,
            dispatch,
            handleGenerateFromPrompt,
            packageForm.originLocation,
            packageForm.transportMode,
            scheduleActivityDescriptionAutofill,
            scheduleDestinationHotelAutofill
        ]
    )

    const handleAutoBuildActivities = () => {
        const validDestinations = destinations.filter(item => item.name.trim())
        const generatedActivities = buildActivitiesFromDestinations(
            validDestinations,
            packageForm.originLocation,
            packageForm.transportMode
        ).map(item => {
            const matchedItenary = getMatchedItenary(item.title)

            return {
                ...item,
                description:
                    matchedItenary?.description ||
                    item.description ||
                    buildDefaultDescription({
                        entryType: item.entryType,
                        destinationName: item.destinationName,
                        title: item.title,
                        originLocation: packageForm.originLocation,
                        transportMode: packageForm.transportMode
                    })
            }
        })

        setActivities(generatedActivities)
        generatedActivities.forEach(scheduleActivityDescriptionAutofill)
        autoFillImagesForActivities(generatedActivities)
        setActiveStep(2)
    }

    const handleSuggestPackageName = () => {
        const suggestedName = buildSuggestedPackageName(destinations)

        if (!suggestedName) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Add destinations first so I can suggest a package name.',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }

        setPackageForm(prev => ({ ...prev, name: suggestedName }))
    }

    const startVoiceCapture = () => {
        if (!voiceSupported || speechRecognitionRef.current) {
            return
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-IN'

        recognition.onstart = () => {
            setIsListening(true)
            setVoiceStatus('Listening... say something like "2N Manali, 2N Shimla from Delhi".')
        }

        recognition.onresult = event => {
            const transcript = Array.from(event.results)
                .map(result => result[0]?.transcript || '')
                .join(' ')
                .trim()

            setDraftPrompt(transcript)
        }

        recognition.onerror = () => {
            setVoiceStatus('Voice capture ran into a problem. You can still type and generate the draft.')
        }

        recognition.onend = () => {
            setIsListening(false)
            speechRecognitionRef.current = null
            setVoiceStatus(prev => prev || 'Voice capture stopped. You can edit the text and generate the package.')
        }

        speechRecognitionRef.current = recognition
        recognition.start()
    }

    const stopVoiceCapture = () => {
        speechRecognitionRef.current?.stop()
    }

    useEffect(() => {
        const timeouts = imageAutofillTimeoutRef.current
        return () => Object.values(timeouts).forEach(timeoutId => clearTimeout(timeoutId))
    }, [])

    useEffect(() => {
        const timeouts = destinationHotelTimeoutRef.current
        return () => Object.values(timeouts).forEach(timeoutId => clearTimeout(timeoutId))
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        setVoiceSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition))
    }, [])

    useEffect(
        () => () => {
            speechRecognitionRef.current?.stop()
        },
        []
    )

    useEffect(() => {
        setDestinations(prev =>
            prev.map(item =>
                item.name?.trim()
                    ? { ...item, ...copyHotelsFromDestination(getMatchedDestination(item.name) || item) }
                    : item
            )
        )
    }, [existingDestinationMap, getMatchedDestination])

    const validateCurrentStep = () => {
        if (activeStep === 0) {
            return packageForm.name.trim().length >= 3 && packageForm.campaignId
        }

        if (activeStep === 1) {
            return destinations.some(item => item.name.trim())
        }

        if (activeStep === 2) {
            return activities.some(item => item.title.trim())
        }

        return true
    }

    const handleNext = () => {
        if (!validateCurrentStep()) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please complete the current step before moving ahead.',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }

        setActiveStep(prev => Math.min(prev + 1, steps.length - 1))
    }

    const handleBack = () => setActiveStep(prev => Math.max(prev - 1, 0))

    const saveWizard = async () => {
        try {
            setSaving(true)

            const packageResponse = await createPackageClient({
                name: packageForm.name.trim(),
                campaignId: Number(packageForm.campaignId)
            }).unwrap()

            const packageId = packageResponse?.data?.id

            const validDestinations = destinations.filter(item => item.name.trim())
            const destinationResults = await Promise.all(
                validDestinations.map(async row => {
                    const existing = existingDestinations.find(
                        item => toNormalized(item.name) === toNormalized(row.name)
                    )

                    if (existing) {
                        const nextHotels = {
                            delux_hotel: row.delux_hotel || '',
                            super_delux_hotel: row.super_delux_hotel || '',
                            luxury_hotel: row.luxury_hotel || '',
                            premium_hotel: row.premium_hotel || ''
                        }

                        if (
                            row.name.trim() !== (existing.name || '') ||
                            nextHotels.delux_hotel !== (existing.delux_hotel || '') ||
                            nextHotels.super_delux_hotel !== (existing.super_delux_hotel || '') ||
                            nextHotels.luxury_hotel !== (existing.luxury_hotel || '') ||
                            nextHotels.premium_hotel !== (existing.premium_hotel || '')
                        ) {
                            const updated = await updateDestinationClient({
                                id: existing.id,
                                name: row.name.trim(),
                                campaignId: existing.campaignId || Number(packageForm.campaignId),
                                ...nextHotels
                            }).unwrap()

                            return [toNormalized(row.name), updated?.data || { ...existing, ...nextHotels }]
                        }

                        return [toNormalized(row.name), existing]
                    }

                    const created = await createDestinationClient({
                        name: row.name.trim(),
                        campaignId: Number(packageForm.campaignId),
                        delux_hotel: row.delux_hotel || '',
                        super_delux_hotel: row.super_delux_hotel || '',
                        luxury_hotel: row.luxury_hotel || '',
                        premium_hotel: row.premium_hotel || ''
                    }).unwrap()

                    return [toNormalized(row.name), created?.data]
                })
            )

            const destinationMap = Object.fromEntries(destinationResults)

            const validActivities = activities.filter(item => item.title.trim())
            const uniqueActivityTitles = [...new Set(validActivities.map(item => item.title.trim()))]

            const itenaryResults = await Promise.all(
                uniqueActivityTitles.map(async title => {
                    const existing = existingItenaries.find(item => toNormalized(item.title) === toNormalized(title))
                    const sourceActivity = validActivities.find(
                        item => toNormalized(item.title) === toNormalized(title)
                    )
                    const nextDescription = sourceActivity?.description?.trim() || ''

                    if (existing) {
                        const existingDescription = existing?.description?.trim?.() || ''

                        if (nextDescription && nextDescription !== existingDescription) {
                            const updated = await updateItenaryClient({
                                id: existing.id,
                                title: existing.title,
                                description: nextDescription,
                                campaignId: existing.campaignId || Number(packageForm.campaignId)
                            }).unwrap()

                            return [toNormalized(title), updated?.data || { ...existing, description: nextDescription }]
                        }

                        return [toNormalized(title), existing]
                    }

                    const created = await createItenaryClient({
                        title,
                        description: nextDescription,
                        campaignId: Number(packageForm.campaignId)
                    }).unwrap()

                    return [toNormalized(title), created?.data]
                })
            )

            const itenaryMap = Object.fromEntries(itenaryResults)

            // Save activities in day order so the package keeps the exact itinerary sequence.
            // The backend currently does not store an explicit sort index, so parallel creates can scramble days.
            // eslint-disable-next-line no-restricted-syntax
            for (const row of validActivities) {
                const destinationRecord =
                    (row.entryType === 'Stay' || row.entryType === 'TransitStay') && row.destinationName
                        ? destinationMap[toNormalized(row.destinationName)] || null
                        : null

                // eslint-disable-next-line no-await-in-loop
                await createPackageItenaryClient({
                    packageId,
                    campaignId: Number(packageForm.campaignId),
                    itenaryId: itenaryMap[toNormalized(row.title)]?.id,
                    destinationId: destinationRecord?.id || null,
                    entryType: row.entryType,
                    image: row.image || ''
                }).unwrap()
            }

            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Package wizard completed successfully.',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )

            navigate(`/master/packages/${packageForm.campaignId}`)
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Unable to save package wizard data.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <MainCard content={false} sx={{ py: '2px' }}>
            <Box sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant='h3'>Package Creation Wizard</Typography>
                        <Typography variant='body2' color='text.secondary'>
                            Create package, destinations, and day-wise activities together so the team doesn&apos;t have
                            to jump across masters.
                        </Typography>
                    </Box>

                    <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant='h5'>Quick Draft</Typography>
                                <Typography variant='body2' color='text.secondary'>
                                    Paste or speak a simple prompt like `2N Shimla, 2N Manali from Delhi` and we&apos;ll
                                    draft the destination plan, hotel suggestions, and day flow for you.
                                </Typography>
                                <TextField
                                    multiline
                                    minRows={3}
                                    value={draftPrompt}
                                    onChange={event => setDraftPrompt(event.target.value)}
                                    placeholder='2N Shimla, 2N Manali from Delhi'
                                />
                                <Stack direction='row' spacing={1.5} flexWrap='wrap' useFlexGap>
                                    {voiceSupported ? (
                                        <CustomButton
                                            variant={isListening ? 'contained' : 'outlined'}
                                            color={isListening ? 'error' : 'primary'}
                                            onClick={isListening ? stopVoiceCapture : startVoiceCapture}
                                        >
                                            {isListening ? 'Stop Listening' : 'Start Voice Input'}
                                        </CustomButton>
                                    ) : (
                                        <Chip
                                            color='default'
                                            label='Voice input works in supported Chrome browsers'
                                            variant='outlined'
                                        />
                                    )}
                                    <CustomButton
                                        startIcon={<AutoAwesome />}
                                        onClick={() => applyVoiceDraft(draftPrompt)}
                                        loading={voiceDrafting}
                                    >
                                        Create From Voice / Text
                                    </CustomButton>
                                    <CustomButton startIcon={<AutoAwesome />} onClick={handleGenerateFromPrompt}>
                                        Generate Draft
                                    </CustomButton>
                                </Stack>
                                {voiceStatus ? (
                                    <Typography variant='body2' color='text.secondary'>
                                        {voiceStatus}
                                    </Typography>
                                ) : null}
                            </Stack>
                        </CardContent>
                    </Card>

                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map(label => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {activeStep === 0 && (
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label='Package Name'
                                            name='name'
                                            value={packageForm.name}
                                            onChange={handlePackageChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            select
                                            label='Campaign'
                                            name='campaignId'
                                            value={packageForm.campaignId}
                                            onChange={handlePackageChange}
                                            disabled={Boolean(campaignContextId)}
                                        >
                                            {campaignOptions.map(option => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label='Origin / Pickup City'
                                            name='originLocation'
                                            value={packageForm.originLocation}
                                            onChange={handlePackageChange}
                                            placeholder='Delhi, Chandigarh, Pathankot'
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label='Transport Mode'
                                            name='transportMode'
                                            value={packageForm.transportMode}
                                            onChange={handlePackageChange}
                                            placeholder='Cab, Volvo, Train, Flight'
                                            helperText='Prompt phrases like "via cab" or "with Volvo" will prefill this.'
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <CustomButton
                                            variant='outlined'
                                            startIcon={<AutoAwesome />}
                                            onClick={handleSuggestPackageName}
                                        >
                                            Suggest Package Name
                                        </CustomButton>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                    {activeStep === 1 && (
                        <Stack spacing={2}>
                            {availableDestinationChips.length > 0 && (
                                <Card sx={{ borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                                    <CardContent>
                                        <Stack spacing={1.5}>
                                            <Typography variant='h5'>Use Existing Campaign Destinations</Typography>
                                            <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
                                                {availableDestinationChips.map(item => (
                                                    <Chip
                                                        key={item.id}
                                                        label={item.name}
                                                        variant='outlined'
                                                        onClick={() => addExistingDestination(item)}
                                                    />
                                                ))}
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            )}
                            {destinations.map((row, index) => (
                                <Card key={row.id} sx={{ borderRadius: 3 }}>
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                                <Typography variant='h5'>Destination {index + 1}</Typography>
                                                {destinations.length > 1 && (
                                                    <Button
                                                        color='error'
                                                        startIcon={<Delete />}
                                                        onClick={() => removeDestinationRow(row.id)}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </Stack>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        label='Destination Name'
                                                        value={row.name}
                                                        onChange={event =>
                                                            updateDestinationRow(row.id, 'name', event.target.value)
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        fullWidth
                                                        type='number'
                                                        label='Nights'
                                                        value={row.nights}
                                                        onChange={event =>
                                                            updateDestinationRow(
                                                                row.id,
                                                                'nights',
                                                                Math.max(1, Number(event.target.value) || 1)
                                                            )
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <Stack direction='row' spacing={1} alignItems='center'>
                                                        <Chip
                                                            color='primary'
                                                            label={`${Number(row.nights) + 1 || 2} day suggestion`}
                                                        />
                                                        {destinationHotelLoadingByRow[row.id] && (
                                                            <Typography variant='caption' color='text.secondary'>
                                                                AI filling hotels...
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label='Deluxe Hotel'
                                                        value={row.delux_hotel}
                                                        onChange={event =>
                                                            updateDestinationRow(
                                                                row.id,
                                                                'delux_hotel',
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label='Super Deluxe Hotel'
                                                        value={row.super_delux_hotel}
                                                        onChange={event =>
                                                            updateDestinationRow(
                                                                row.id,
                                                                'super_delux_hotel',
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label='Luxury Hotel'
                                                        value={row.luxury_hotel}
                                                        onChange={event =>
                                                            updateDestinationRow(
                                                                row.id,
                                                                'luxury_hotel',
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label='Premium Hotel'
                                                        value={row.premium_hotel}
                                                        onChange={event =>
                                                            updateDestinationRow(
                                                                row.id,
                                                                'premium_hotel',
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}

                            <Stack direction='row' spacing={2}>
                                <CustomButton startIcon={<Add />} onClick={addDestinationRow}>
                                    Add Destination
                                </CustomButton>
                                <CustomButton
                                    variant='outlined'
                                    startIcon={<AutoAwesome />}
                                    onClick={handleAutoBuildActivities}
                                >
                                    Auto Build Day Plan
                                </CustomButton>
                            </Stack>
                        </Stack>
                    )}

                    {activeStep === 2 && (
                        <Stack spacing={2}>
                            <Alert severity='info'>
                                Stay and Transit + Stay entries will link to destinations and hotel suggestions. Transit
                                and Fresh Up days stay in the itinerary but won&apos;t count as hotel nights.
                            </Alert>
                            {activities.map((row, index) => (
                                <Card key={row.id} sx={{ borderRadius: 3 }}>
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Stack direction='row' spacing={1} flexWrap='wrap'>
                                                <CustomButton
                                                    variant='outlined'
                                                    onClick={() => insertActivityRow(index, 'Stay')}
                                                >
                                                    Add Stay Before
                                                </CustomButton>
                                                <CustomButton
                                                    variant='outlined'
                                                    onClick={() => insertActivityRow(index, 'Transit')}
                                                >
                                                    Add Transit Before
                                                </CustomButton>
                                                <CustomButton
                                                    variant='outlined'
                                                    onClick={() => insertActivityRow(index, 'TransitStay')}
                                                >
                                                    Add Transit + Stay Before
                                                </CustomButton>
                                                <CustomButton
                                                    variant='outlined'
                                                    onClick={() => insertActivityRow(index, 'FreshUp')}
                                                >
                                                    Add Fresh Up Before
                                                </CustomButton>
                                            </Stack>
                                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                                <Typography variant='h5'>Day {index + 1}</Typography>
                                                {activities.length > 1 && (
                                                    <Button
                                                        color='error'
                                                        startIcon={<Delete />}
                                                        onClick={() => removeActivityRow(row.id)}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </Stack>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} md={5}>
                                                    <TextField
                                                        fullWidth
                                                        label='Title'
                                                        value={row.title}
                                                        onChange={event =>
                                                            updateActivityRow(row.id, 'title', event.target.value)
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        fullWidth
                                                        select
                                                        label='Entry Type'
                                                        value={row.entryType}
                                                        onChange={event =>
                                                            updateActivityRow(row.id, 'entryType', event.target.value)
                                                        }
                                                    >
                                                        <MenuItem value='Stay'>Stay</MenuItem>
                                                        <MenuItem value='Transit'>Transit</MenuItem>
                                                        <MenuItem value='TransitStay'>Transit + Stay</MenuItem>
                                                        <MenuItem value='FreshUp'>Fresh Up</MenuItem>
                                                    </TextField>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <TextField
                                                        fullWidth
                                                        select
                                                        label='Destination'
                                                        value={row.destinationName}
                                                        disabled={
                                                            row.entryType !== 'Stay' && row.entryType !== 'TransitStay'
                                                        }
                                                        onChange={event =>
                                                            updateActivityRow(
                                                                row.id,
                                                                'destinationName',
                                                                event.target.value
                                                            )
                                                        }
                                                        helperText={
                                                            row.entryType !== 'Stay' && row.entryType !== 'TransitStay'
                                                                ? 'Destination is optional for transit and fresh up'
                                                                : ''
                                                        }
                                                    >
                                                        {destinations
                                                            .filter(item => item.name.trim())
                                                            .map(item => (
                                                                <MenuItem key={item.id} value={item.name}>
                                                                    {item.name}
                                                                </MenuItem>
                                                            ))}
                                                    </TextField>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={4}
                                                        label='Description'
                                                        value={row.description}
                                                        onChange={event =>
                                                            updateActivityRow(row.id, 'description', event.target.value)
                                                        }
                                                        helperText={
                                                            descriptionLoadingByRow[row.id]
                                                                ? 'AI is drafting a richer day description...'
                                                                : ''
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Stack spacing={1.5}>
                                                        <Stack
                                                            direction='row'
                                                            spacing={1}
                                                            alignItems='center'
                                                            flexWrap='wrap'
                                                        >
                                                            <TextField
                                                                fullWidth
                                                                label='Image URL'
                                                                value={row.image}
                                                                onChange={event =>
                                                                    updateActivityRow(
                                                                        row.id,
                                                                        'image',
                                                                        event.target.value
                                                                    )
                                                                }
                                                            />
                                                            <CustomButton
                                                                variant='outlined'
                                                                startIcon={<AutoAwesome />}
                                                                onClick={() => fetchImagesForActivity(row)}
                                                                loading={Boolean(imageLoadingByRow[row.id])}
                                                            >
                                                                Fetch Images
                                                            </CustomButton>
                                                        </Stack>

                                                        {imageOptionsByRow[row.id]?.length > 0 && (
                                                            <Stack
                                                                direction='row'
                                                                spacing={1}
                                                                useFlexGap
                                                                flexWrap='wrap'
                                                            >
                                                                {imageOptionsByRow[row.id].slice(0, 6).map(image => (
                                                                    <Box
                                                                        key={image.url}
                                                                        onClick={() =>
                                                                            updateActivityRow(
                                                                                row.id,
                                                                                'image',
                                                                                image.url
                                                                            )
                                                                        }
                                                                        sx={{
                                                                            width: 108,
                                                                            cursor: 'pointer',
                                                                            border:
                                                                                row.image === image.url
                                                                                    ? '2px solid #1976d2'
                                                                                    : '1px solid #d1d5db',
                                                                            borderRadius: 2,
                                                                            overflow: 'hidden',
                                                                            bgcolor: 'white'
                                                                        }}
                                                                    >
                                                                        <Box
                                                                            component='img'
                                                                            src={image.thumb}
                                                                            alt={row.title || 'Travel option'}
                                                                            sx={{
                                                                                width: '100%',
                                                                                height: 74,
                                                                                objectFit: 'cover',
                                                                                display: 'block'
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        )}
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                            <Stack direction='row' spacing={1} flexWrap='wrap'>
                                                <CustomButton
                                                    variant='outlined'
                                                    onClick={() => insertActivityRow(index + 1, 'Stay')}
                                                >
                                                    Add Stay After
                                                </CustomButton>
                                                <CustomButton
                                                    variant='outlined'
                                                    onClick={() => insertActivityRow(index + 1, 'Transit')}
                                                >
                                                    Add Transit After
                                                </CustomButton>
                                                <CustomButton
                                                    variant='outlined'
                                                    onClick={() => insertActivityRow(index + 1, 'FreshUp')}
                                                >
                                                    Add Fresh Up After
                                                </CustomButton>
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}

                            <Box>
                                <Stack direction='row' spacing={2}>
                                    <CustomButton startIcon={<Add />} onClick={addActivityRow}>
                                        Add Stay Day
                                    </CustomButton>
                                    <CustomButton variant='outlined' onClick={() => addSpecialActivityRow('Transit')}>
                                        Add Transit Day
                                    </CustomButton>
                                    <CustomButton
                                        variant='outlined'
                                        onClick={() => addSpecialActivityRow('TransitStay')}
                                    >
                                        Add Transit + Stay Day
                                    </CustomButton>
                                    <CustomButton variant='outlined' onClick={() => addSpecialActivityRow('FreshUp')}>
                                        Add Fresh Up Day
                                    </CustomButton>
                                </Stack>
                            </Box>
                        </Stack>
                    )}

                    {activeStep === 3 && (
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Typography variant='h5'>Review</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <Chip
                                                color='primary'
                                                label={`Campaign: ${packageForm.campaignId || 'Not selected'}`}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Chip
                                                color='success'
                                                label={`${destinations.filter(item => item.name.trim()).length} destinations`}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Chip
                                                color='warning'
                                                label={`${activities.filter(item => item.title.trim()).length} day entries`}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
                                        <Chip color='success' label={`${stayActivityCount} Stay`} />
                                        <Chip color='info' label={`${transitActivityCount} Transit`} />
                                        <Chip color='warning' label={`${transitStayActivityCount} Transit + Stay`} />
                                        <Chip color='secondary' label={`${freshUpActivityCount} Fresh Up`} />
                                    </Stack>
                                    <Divider />
                                    <Typography variant='body2' color='text.secondary'>
                                        Total stay nights: {totalStayNights}. Transit and Fresh Up days will still be
                                        saved in the package plan, while Stay and Transit + Stay rows will drive hotel
                                        summaries.
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    <Stack direction='row' justifyContent='space-between'>
                        <Button disabled={activeStep === 0} onClick={handleBack}>
                            Back
                        </Button>

                        <Stack direction='row' spacing={2}>
                            <Button variant='outlined' onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                            {activeStep === steps.length - 1 ? (
                                <CustomButton startIcon={<Save />} onClick={saveWizard} loading={saving}>
                                    Save Package Flow
                                </CustomButton>
                            ) : (
                                <CustomButton onClick={handleNext}>Next</CustomButton>
                            )}
                        </Stack>
                    </Stack>
                </Stack>
            </Box>
        </MainCard>
    )
}

export default PackageCreationWizard
