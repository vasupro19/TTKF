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
    isAiPending: false,
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

const getAiResponseText = response =>
    response?.content?.[0]?.text || response?.data?.content?.[0]?.text || response?.text || ''

const decodeAiFieldValue = value =>
    (value || '')
        .toString()
        .replace(/^["'`\s]+|["'`\s]+$/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .trim()

const parseAiJson = response => {
    const text = getAiResponseText(response)
    const clean = text.replace(/```json|```/g, '').trim()

    if (!clean) {
        return {}
    }

    const candidates = [clean]
    const firstObjectStart = clean.indexOf('{')
    const lastObjectEnd = clean.lastIndexOf('}')

    if (firstObjectStart !== -1 && lastObjectEnd !== -1 && lastObjectEnd > firstObjectStart) {
        candidates.push(clean.slice(firstObjectStart, lastObjectEnd + 1))
    }

    const firstArrayStart = clean.indexOf('[')
    const lastArrayEnd = clean.lastIndexOf(']')

    if (firstArrayStart !== -1 && lastArrayEnd !== -1 && lastArrayEnd > firstArrayStart) {
        candidates.push(clean.slice(firstArrayStart, lastArrayEnd + 1))
    }

    for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index]

        try {
            return JSON.parse(candidate)
        } catch (error) {
            // Keep trying looser JSON candidates.
        }
    }

    return {}
}

const extractAiDraftPayload = response => {
    const text = getAiResponseText(response)
        .replace(/```json|```/g, '')
        .trim()
    const parsed = parseAiJson(response)

    const parsedCandidate = Array.isArray(parsed) ? parsed[0] : parsed?.day || parsed?.data || parsed?.result || parsed

    let title = decodeAiFieldValue(parsedCandidate?.title)
    let description = decodeAiFieldValue(parsedCandidate?.description)

    if (!title) {
        const titleMatch =
            text.match(/"title"\s*:\s*"([\s\S]*?)"(?:\s*,|\s*})/i) || text.match(/(?:^|\n)\s*title\s*[:-]\s*(.+)/i)
        title = decodeAiFieldValue(titleMatch?.[1] || '')
    }

    if (!description) {
        const descriptionMatch =
            text.match(/"description"\s*:\s*"([\s\S]*?)"(?:\s*}\s*$|\s*,\s*"[a-z_]+")/i) ||
            text.match(/(?:^|\n)\s*description\s*[:-]\s*([\s\S]+)/i)
        description = decodeAiFieldValue(descriptionMatch?.[1] || '')
    }

    if ((!title || !description) && text) {
        const lines = text
            .split('\n')
            .map(item => item.trim())
            .filter(Boolean)

        if (!title && lines.length) {
            title = decodeAiFieldValue(lines[0])
        }

        if (!description && lines.length > 1) {
            description = decodeAiFieldValue(lines.slice(1).join('\n\n'))
        }
    }

    return {
        title,
        description
    }
}

const MIN_AI_REQUEST_GAP_MS = 1400
const MAX_AI_RETRY_ATTEMPTS = 5
const MAX_ACTIVITY_DRAFT_CYCLES = 3

const sleep = delay =>
    new Promise(resolve => {
        setTimeout(resolve, delay)
    })

const extractAiErrorMessage = error =>
    error?.data?.error?.message || error?.error?.message || error?.data?.message || error?.message || ''

const isAiRateLimitError = error => {
    const code = error?.data?.error?.code || error?.error?.code || error?.code || ''
    const message = extractAiErrorMessage(error)

    return code === 'rate_limit_exceeded' || /rate limit reached/i.test(message)
}

const getAiRetryDelayMs = error => {
    const message = extractAiErrorMessage(error)
    const match = message.match(/Please try again in\s*([\d.]+)\s*(ms|s)/i)

    if (!match) {
        return 1800
    }

    const [, value, unit] = match
    const numericValue = Number(value)

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return 1800
    }

    const baseDelay = unit?.toLowerCase() === 's' ? numericValue * 1000 : numericValue
    return Math.ceil(baseDelay + 250)
}

const isGenericActivityTitle = title =>
    /^(Arrival in .+|Transit Day|Transit \+ Stay Day|Fresh Up Day|New Stay Day)$/i.test((title || '').trim())

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
        return `Guest pickup from ${fromLocation} and proceed towards ${toLocation}${transportText} with a comfortable start to the journey. As the route unfolds, enjoy changing landscapes, pleasant halts, and the sense of anticipation that builds while moving toward the next destination. The day is planned to keep travel smooth, relaxed, and guest-friendly from departure onward.

On arrival in ${toLocation}, continue with the scheduled plan for the day at an easy pace. Depending on timing, this may include a gentle local outing, a refreshment stop, or simply settling into the destination atmosphere before the next stage of the holiday experience begins.`
    }

    return `Today the journey continues towards ${toLocation}${transportText}, keeping the travel flow smooth, comfortable, and well-paced for the guest. The route offers time to take in the scenery, enjoy the transition between destinations, and settle into the mood of the trip without feeling rushed.

On reaching ${toLocation}, continue with the planned itinerary for the day in a relaxed and organized manner. The schedule is designed to help guests move naturally into the next part of the travel experience while maintaining comfort, convenience, and a pleasant overall rhythm.`
}

const buildTransitStayDescription = ({ fromLocation, toLocation, transportMode }) => {
    const transportText = transportMode ? ` via ${transportMode}` : ''

    if (fromLocation) {
        return `Guest pickup from ${fromLocation} and proceed to ${toLocation}${transportText}, beginning the day with a smooth and comfortable transfer experience. The route is planned to keep the journey relaxed, allowing guests to enjoy the changing surroundings, travel at an easy pace, and arrive feeling refreshed rather than rushed.

After reaching ${toLocation}, check in and unwind while settling into the atmosphere of the destination. The remaining time can be used for light local exploration, a relaxed stroll, or peaceful leisure, creating a gentle and enjoyable transition into the overnight stay.`
    }

    return `Travel onwards to ${toLocation}${transportText} and arrive comfortably at the destination, keeping the day balanced between movement and a smooth sense of arrival. The plan allows guests to travel without stress while gradually shifting into the experience and rhythm of the new place.

After arrival, settle into the stay and enjoy the rest of the day at an easy pace. There is time to relax, enjoy the surroundings, or experience a soft introduction to the destination before the overnight halt, making the day feel complete without becoming tiring.`
}

const buildReturnTitle = ({ fromLocation, toLocation, transportMode }) => {
    const baseTitle = fromLocation ? `Drop from ${fromLocation} to ${toLocation}` : `Drop to ${toLocation}`
    return transportMode ? `${baseTitle} via ${transportMode}` : baseTitle
}

const buildReturnDescription = ({ fromLocation, toLocation, transportMode }) => {
    const transportText = transportMode ? ` via ${transportMode}` : ''

    if (fromLocation) {
        return `After completing the holiday, depart from ${fromLocation} and proceed towards ${toLocation}${transportText} with a smooth and comfortable return transfer. The day is kept easy and well-organized so guests can relax, enjoy the final leg of the route, and reflect on the memorable experiences of the journey.

Before reaching the final drop location, the return movement is planned to feel convenient and unhurried. This helps the trip conclude on a polished and comfortable note, leaving guests with a pleasant final impression of the overall travel experience.`
    }

    return `Proceed towards ${toLocation}${transportText} for the final drop, keeping the last stage of the journey smooth, comfortable, and well-managed for the guest. The return movement is arranged at an easy pace so the holiday ends without rush or inconvenience.

This final transfer is intended to close the trip gracefully, giving guests a relaxed end to their travel experience while maintaining comfort, convenience, and a sense of completion through the final drop.`
}

const buildArrivalStayDescription = destinationName =>
    `Arrive in ${destinationName} and settle in comfortably after the journey. Depending on your arrival time, enjoy a relaxed local outing, market visit, or leisure moments while soaking in the atmosphere of the destination. The day is kept easy and welcoming so the trip begins on a pleasant and comfortable note before the overnight stay.`

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

const STAY_TITLE_PATTERNS = [
    destinationName => `${destinationName} Local Highlights & Leisure`,
    destinationName => `${destinationName} Scenic Spots & Market Walk`,
    destinationName => `${destinationName} Culture Trail & Sunset Time`,
    destinationName => `${destinationName} Landmarks & Evening Leisure`
]

const buildFallbackStayTitle = ({ destinationName, dayNumber = 1 }) => {
    const safeDestination = destinationName?.trim() || 'Destination'
    const titleBuilder = STAY_TITLE_PATTERNS[(Math.max(dayNumber, 1) - 1) % STAY_TITLE_PATTERNS.length]
    return titleBuilder(safeDestination)
}

const buildFallbackStayDescription = ({ destinationName, dayNumber = 1, totalDaysAtDestination = 1 }) => {
    const safeDestination = destinationName?.trim() || 'the destination'

    if (totalDaysAtDestination <= 1) {
        return `Spend a comfortable day discovering the charm of ${safeDestination}, with time to enjoy its atmosphere, signature local experiences, and well-paced sightseeing. The day is designed to feel relaxed yet fulfilling, giving guests enough space to absorb the character of the destination while still covering meaningful highlights in a smooth and enjoyable flow.

From scenic spots to local moments that reflect the mood of the place, the experience is arranged to feel warm, polished, and guest-friendly throughout. By evening, return with a sense of having enjoyed the destination fully before settling in for a restful overnight stay.`
    }

    return `Day ${dayNumber} in ${safeDestination} is planned with a comfortable mix of local exploration, signature experiences, and relaxed leisure so guests can enjoy the destination without feeling rushed. The flow of the day keeps sightseeing smooth and guest-friendly, allowing enough time to take in the local character, enjoy key highlights, and move through the schedule at a pleasant pace.

The overall experience is designed to feel balanced and memorable, blending sightseeing, atmosphere, and moments of leisure into one polished day. By the end of the excursion, guests return with a fuller sense of the destination before winding down for a restful overnight stay.`
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
            return buildTransitStayDescription({
                fromLocation: originLocation,
                toLocation: destinationName,
                transportMode
            })
        }

        if (destinationName) {
            return buildTransitStayDescription({
                toLocation: destinationName,
                transportMode
            })
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

const parseRouteTitle = title => {
    const cleanTitle = (title || '').toString().trim()

    let match = cleanTitle.match(/^Transfer\s+from\s+(.+?)\s+to\s+(.+?)(?:\s+via\s+(.+))?$/i)
    if (match) {
        return {
            kind: 'transfer',
            fromLocation: match[1]?.trim() || '',
            toLocation: match[2]?.trim() || '',
            transportMode: match[3]?.trim() || ''
        }
    }

    match = cleanTitle.match(/^Drop\s+from\s+(.+?)\s+to\s+(.+?)(?:\s+via\s+(.+))?$/i)
    if (match) {
        return {
            kind: 'return',
            fromLocation: match[1]?.trim() || '',
            toLocation: match[2]?.trim() || '',
            transportMode: match[3]?.trim() || ''
        }
    }

    match = cleanTitle.match(/^Transfer\s+to\s+(.+?)(?:\s+via\s+(.+))?$/i)
    if (match) {
        return {
            kind: 'transfer',
            fromLocation: '',
            toLocation: match[1]?.trim() || '',
            transportMode: match[2]?.trim() || ''
        }
    }

    match = cleanTitle.match(/^Drop\s+to\s+(.+?)(?:\s+via\s+(.+))?$/i)
    if (match) {
        return {
            kind: 'return',
            fromLocation: '',
            toLocation: match[1]?.trim() || '',
            transportMode: match[2]?.trim() || ''
        }
    }

    return null
}

const isReplaceableActivityTitle = title => {
    const normalizedTitle = (title || '').toString().trim()

    if (!normalizedTitle) {
        return true
    }

    return (
        isGenericActivityTitle(normalizedTitle) ||
        /^Arrival in /i.test(normalizedTitle) ||
        /^Transfer\s+(?:from|to)\s+/i.test(normalizedTitle) ||
        /^Drop\s+(?:from|to)\s+/i.test(normalizedTitle)
    )
}

const getReplaceableDescriptionCandidates = ({ row, originLocation, transportMode }) => {
    const candidates = [
        buildDefaultDescription({
            entryType: row.entryType,
            destinationName: row.destinationName,
            title: row.title,
            originLocation,
            transportMode
        })
    ]

    if (row.entryType === 'Stay' && row.destinationName && row.title?.trim() === `Arrival in ${row.destinationName}`) {
        candidates.push(buildArrivalStayDescription(row.destinationName))
    }

    const parsedRoute = parseRouteTitle(row.title)
    if (parsedRoute?.toLocation) {
        const nextTransportMode = parsedRoute.transportMode || transportMode

        if (row.entryType === 'TransitStay') {
            candidates.push(
                buildTransitStayDescription({
                    fromLocation: parsedRoute.fromLocation,
                    toLocation: parsedRoute.toLocation,
                    transportMode: nextTransportMode
                })
            )
        }

        if (row.entryType === 'Transit') {
            if (parsedRoute.kind === 'return') {
                candidates.push(
                    buildReturnDescription({
                        fromLocation: parsedRoute.fromLocation,
                        toLocation: parsedRoute.toLocation,
                        transportMode: nextTransportMode
                    })
                )
            } else {
                candidates.push(
                    buildTransferDescription({
                        fromLocation: parsedRoute.fromLocation,
                        toLocation: parsedRoute.toLocation,
                        transportMode: nextTransportMode
                    })
                )
            }
        }
    }

    return candidates.map(item => item?.trim()).filter(Boolean)
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
                    description: buildArrivalStayDescription(destination.name),
                    destinationName: destination.name,
                    destinationId: '',
                    entryType: 'Stay'
                })
            )
        }
        for (let day = 1; day < nights; day += 1) {
            activities.push(
                createActivityRow({
                    title: buildFallbackStayTitle({
                        destinationName: destination.name,
                        dayNumber: day + 1
                    }),
                    description: buildFallbackStayDescription({
                        destinationName: destination.name,
                        dayNumber: day + 1,
                        totalDaysAtDestination: nights
                    }),
                    isAiPending: true,
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

const copyHotelsFromDestination = (destination = {}) => ({
    delux_hotel: destination.delux_hotel || '',
    super_delux_hotel: destination.super_delux_hotel || '',
    luxury_hotel: destination.luxury_hotel || '',
    premium_hotel: destination.premium_hotel || ''
})

const HOTEL_NOISE_PATTERN =
    /(amenities|room details|pricing hints|starting from|per night|facilities|inclusions|price range)/i

const extractHotelNameList = value => {
    let rawList = (value || '').toString().split(/\n|;|\||,/)

    if (Array.isArray(value)) {
        rawList = value
    } else if (typeof value === 'object' && value !== null) {
        rawList = Object.values(value)
    }

    const cleaned = rawList
        .map(item =>
            item
                ?.toString?.()
                ?.replace(/^\s*\d+[).\s-]*/g, '')
                ?.replace(/^[-*•]\s*/g, '')
                ?.replace(/\s{2,}/g, ' ')
                ?.trim?.()
        )
        .map(item => item?.split(/amenities:|room details:|pricing hints:|starting from:/i)?.[0]?.trim?.())
        .filter(Boolean)
        .filter(item => !HOTEL_NOISE_PATTERN.test(item))
        .filter(item => item.length >= 3 && item.length <= 80)

    return [...new Set(cleaned)]
}

const normalizeHotelSuggestions = value => extractHotelNameList(value).slice(0, 4).join(' | ')
const hasFourHotels = value => extractHotelNameList(value).length >= 4
const mergeHotelSuggestions = (...values) => [...new Set(values.flatMap(extractHotelNameList))].slice(0, 4).join(' | ')
const ensureFourHotels = (value, destinationName, categoryLabel) => {
    const base = extractHotelNameList(value).slice(0, 4)
    const destinationPrefix = destinationName?.trim() || 'Destination'
    const fallback = [
        `${destinationPrefix} ${categoryLabel} Hotel 1`,
        `${destinationPrefix} ${categoryLabel} Hotel 2`,
        `${destinationPrefix} ${categoryLabel} Hotel 3`,
        `${destinationPrefix} ${categoryLabel} Hotel 4`
    ]

    fallback.forEach(item => {
        if (base.length < 4 && !base.includes(item)) {
            base.push(item)
        }
    })

    return base.slice(0, 4).join(' | ')
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
    const aiRequestQueueRef = useRef(Promise.resolve())
    const aiLastRequestStartedAtRef = useRef(0)
    const activityDraftRetryCountRef = useRef({})
    const activityDraftInFlightRef = useRef({})
    const destinationDraftInFlightRef = useRef({})

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

    const runQueuedAiRequest = useCallback(task => {
        const runTaskWithRetry = async (attempt = 0) => {
            const waitBeforeStart = Math.max(0, aiLastRequestStartedAtRef.current + MIN_AI_REQUEST_GAP_MS - Date.now())

            if (waitBeforeStart > 0) {
                await sleep(waitBeforeStart)
            }

            aiLastRequestStartedAtRef.current = Date.now()

            try {
                return await task()
            } catch (error) {
                if (!isAiRateLimitError(error) || attempt >= MAX_AI_RETRY_ATTEMPTS - 1) {
                    throw error
                }

                await sleep(getAiRetryDelayMs(error))
                return runTaskWithRetry(attempt + 1)
            }
        }

        const queuedTask = aiRequestQueueRef.current.catch(() => null).then(() => runTaskWithRetry())
        aiRequestQueueRef.current = queuedTask.catch(() => null)
        return queuedTask
    }, [])

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

    const requestSingleActivityDraft = useCallback(
        async ({ row, destinationName, dayNumber = 1, totalDaysAtDestination = 1, usedTitles = [] }) => {
            const promptAttempts = [
                {
                    system: `You are a senior luxury travel writer crafting one day of itinerary content for a premium travel package.

Respond ONLY with a valid JSON object.
Allowed keys:
- title
- description

TITLE RULES:
1. Create a destination-specific, experience-rich title with 2 to 3 real places or experiences
2. Never start with Explore, Visit, Tour, Discover, Day, Enjoy, or Experience
3. Keep title under 10 words
4. Do not repeat any title or place already used on other days
5. Make the title exciting, polished, and quotation-ready

DESCRIPTION RULES:
1. Write 2 rich paragraphs separated by a blank line
2. Total length: 150 to 190 words
3. Paragraph 1 should set the scene and mood of the day at the destination
4. Paragraph 2 should describe what guests actually do, see, eat, or experience at the specific places in the title
5. End warmly with the guest returning for overnight stay
6. No bullets, markdown, emojis, hotel names, or generic filler

Return JSON only.`,
                    content: JSON.stringify({
                        packageName: packageForm.name || '',
                        originLocation: packageForm.originLocation || '',
                        transportMode: packageForm.transportMode || '',
                        destinationName,
                        dayNumber,
                        totalDaysAtDestination,
                        entryType: row.entryType,
                        currentTitle: row.title || '',
                        currentDescription: row.description || '',
                        alreadyUsedTitles: usedTitles
                    })
                },
                {
                    system: `You write one premium travel itinerary day for a high-quality holiday package.

Return ONLY valid JSON with:
- title
- description

Rules:
1. Title must be specific, catchy, and destination-based
2. Description must be two polished paragraphs totaling 125 to 160 words
3. Avoid repeating any earlier title
4. No markdown or bullets`,
                    content: `Destination: ${destinationName}
Day number: ${dayNumber} of ${totalDaysAtDestination}
Transport mode: ${packageForm.transportMode || 'N/A'}
Already used titles: ${usedTitles.join(' | ') || 'None'}`
                }
            ]

            const runPromptAttempt = async (attemptIndex = 0) => {
                if (attemptIndex >= promptAttempts.length) {
                    return null
                }

                const attempt = promptAttempts[attemptIndex]
                try {
                    const response = await runQueuedAiRequest(() =>
                        assistAi({
                            system: attempt.system,
                            messages: [{ role: 'user', content: attempt.content }]
                        }).unwrap()
                    )

                    const { title: nextTitle, description: nextDescription } = extractAiDraftPayload(response)

                    if (nextTitle || nextDescription) {
                        return {
                            title: nextTitle,
                            description: nextDescription
                        }
                    }
                } catch (error) {
                    // Try the simpler retry prompt next.
                }

                return runPromptAttempt(attemptIndex + 1)
            }

            const draftedCopy = await runPromptAttempt()
            if (draftedCopy) {
                return draftedCopy
            }

            return {
                title: '',
                description: ''
            }
        },
        [assistAi, packageForm.name, packageForm.originLocation, packageForm.transportMode, runQueuedAiRequest]
    )

    const shouldReplaceDescription = useCallback(
        ({ previousRow, nextDescription, field, nextValue }) => {
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

            const replaceableDescriptionCandidates = getReplaceableDescriptionCandidates({
                row: previousRow,
                originLocation: packageForm.originLocation,
                transportMode: packageForm.transportMode
            })

            if (
                previousRow.description === previousDefaultDescription ||
                replaceableDescriptionCandidates.includes(previousRow.description?.trim())
            ) {
                return true
            }

            if (field === 'description') {
                return false
            }

            return previousRow.description === nextDescription && nextValue !== previousRow[field]
        },
        [getMatchedItenary, packageForm.originLocation, packageForm.transportMode]
    )

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

    //     const scheduleActivityDescriptionAutofill = row => {
    //         const title = row.title?.trim()
    //         const destinationName = row.destinationName?.trim()
    //         const matchedItenary = getMatchedItenary(title)

    //         if (!title || matchedItenary?.description?.trim()) {
    //             return
    //         }

    //         const existingTimeout = activityDescriptionTimeoutRef.current[row.id]
    //         if (existingTimeout) {
    //             clearTimeout(existingTimeout)
    //         }

    //         activityDescriptionTimeoutRef.current[row.id] = setTimeout(async () => {
    //             setDescriptionLoadingByRow(prev => ({ ...prev, [row.id]: true }))

    //             try {
    //                 const isPlaceholderTitle = /^Explore .+ – Day \d+$/.test(title)

    //                 const response = await assistAi({
    //                     system: `You are an expert India travel itinerary writer who creates vivid, specific, experience-driven day titles and descriptions for package quotations.

    // Respond ONLY with a valid JSON object.
    // Allowed keys:
    // - title
    // - description

    // TITLE RULES (most important):
    // 1. Titles must name SPECIFIC places, experiences, or vibes — never generic phrases like "Explore X" or "Day in X"
    // 2. Think like a travel influencer — make it sound exciting and worth doing
    // 3. Good title patterns:
    //    - Place combo: "Baga Beach, Tito's Lane & Fort Aguada"
    //    - Experience-led: "Dudhsagar Falls Trek & Spice Plantation Lunch"
    //    - Vibe-led: "Sunset Cruise on Mandovi & Goan Seafood Trail"
    //    - Cultural: "Old Goa Churches, Latin Quarter & Fontainhas Walk"
    //    - Adventure: "Solang Valley Snow Activities & Hadimba Temple"
    // 4. Max 8 words in title
    // 5. Only generate a new title if current one is a placeholder like "Explore X – Day N". Otherwise return the existing title unchanged.
    // 6. If multiple days exist for the same destination, each title MUST cover completely different parts of the destination — no overlap

    // DESCRIPTION RULES:
    // 1. One polished paragraph, 60 to 85 words
    // 2. Naturally weave in the specific places from the title
    // 3. Mention 2 to 3 real activities or experiences guests will actually do
    // 4. Warm, guest-friendly tone suitable for a premium package quotation
    // 5. End with the return to stay and overnight halt
    // 6. No bullets, no numbering, no markdown, no emojis, no hotel category names

    // Return JSON only. No explanation. No markdown fences.`,
    //                     messages: [
    //                         {
    //                             role: 'user',
    //                             content: JSON.stringify({
    //                                 packageName: packageForm.name || '',
    //                                 originLocation: packageForm.originLocation || '',
    //                                 transportMode: packageForm.transportMode || '',
    //                                 day: {
    //                                     currentTitle: title,
    //                                     isPlaceholderTitle,
    //                                     destinationName,
    //                                     entryType: row.entryType,
    //                                     dayIndex:
    //                                         activities
    //                                             .filter(
    //                                                 a => a.destinationName === row.destinationName && a.entryType === 'Stay'
    //                                             )
    //                                             .findIndex(a => a.id === row.id) + 1,
    //                                     totalDaysAtDestination: activities.filter(
    //                                         a => a.destinationName === row.destinationName && a.entryType === 'Stay'
    //                                     ).length,
    //                                     otherDayTitlesAtSameDestination: activities
    //                                         .filter(
    //                                             a =>
    //                                                 a.destinationName === row.destinationName &&
    //                                                 a.entryType === 'Stay' &&
    //                                                 a.id !== row.id
    //                                         )
    //                                         .map(a => a.title)
    //                                 }
    //                             })
    //                         }
    //                     ]
    //                 }).unwrap()
    //                 const parsed = parseAiJson(response)
    //                 const nextDescription = parsed?.description?.toString?.().trim?.() || ''
    //                 const nextTitle = parsed?.title?.toString?.().trim?.() || ''

    //                 if (!nextDescription && !nextTitle) {
    //                     return
    //                 }

    //                 setActivities(prev =>
    //                     prev.map(item => {
    //                         if (item.id !== row.id) {
    //                             return item
    //                         }

    //                         const updatedItem = { ...item }

    //                         // Only replace title if it's still a placeholder
    //                         if (nextTitle && /^Explore .+ – Day \d+$/.test(item.title)) {
    //                             updatedItem.title = nextTitle
    //                         }

    //                         if (
    //                             nextDescription &&
    //                             shouldReplaceDescription({
    //                                 previousRow: item,
    //                                 nextDescription,
    //                                 field: 'title',
    //                                 nextValue: updatedItem.title
    //                             })
    //                         ) {
    //                             updatedItem.description = nextDescription
    //                         }

    //                         return updatedItem
    //                     })
    //                 )
    //             } catch (error) {
    //                 // Keep the wizard editable even if AI description generation fails.
    //             } finally {
    //                 setDescriptionLoadingByRow(prev => ({ ...prev, [row.id]: false }))
    //                 delete activityDescriptionTimeoutRef.current[row.id]
    //             }
    //         }, 500)
    //     }
    const pendingDestinationBatchRef = useRef({})
    const destinationBatchTimeoutRef = useRef({})

    const scheduleActivityDescriptionAutofill = useCallback(
        row => {
            const title = row.title?.trim()
            const destinationName = row.destinationName?.trim()
            const isPlaceholder = row.isAiPending === true

            // For AI pending rows skip the title check — they intentionally have no title yet
            if (!isPlaceholder) {
                const matchedItenary = getMatchedItenary(title)
                if (!title || matchedItenary?.description?.trim()) {
                    return
                }
            }

            // Non-placeholder rows — transit, arrival, freshup — fire individually
            if (!isPlaceholder || !destinationName) {
                if (activityDraftInFlightRef.current[row.id]) {
                    return
                }

                const existingTimeout = activityDescriptionTimeoutRef.current[row.id]
                if (existingTimeout) clearTimeout(existingTimeout)

                activityDescriptionTimeoutRef.current[row.id] = setTimeout(async () => {
                    activityDraftInFlightRef.current[row.id] = true
                    setDescriptionLoadingByRow(prev => ({ ...prev, [row.id]: true }))
                    try {
                        const response = await runQueuedAiRequest(() =>
                            assistAi({
                                system: `You are a senior luxury travel writer crafting day-wise itinerary content for premium holiday packages.

Respond ONLY with a valid JSON object.
Allowed keys:
- title
- description

TITLE RULES:
1. Name 2 to 3 SPECIFIC real places or experiences relevant to the entryType and destination
2. Use "&" to join — e.g. "Shimla Arrival & Mall Road Evening Stroll"
3. For Transit or TransitStay days, name the route and travel style clearly — e.g. "Delhi to Manali Overnight Volvo Journey" or "Manali to Shimla Scenic Road Transfer"
4. For FreshUp — e.g. "Quick Freshen Up & Leisure Time"
5. For Arrival days name the destination and first experience — e.g. "Goa Arrival & Calangute Beach Evening"
6. NEVER use: Explore, Visit, Tour, Discover, Day at the start
7. If currentTitle is a plain system title like "Arrival in X", "Transfer from A to B", or "Drop from A to B", upgrade it to a more polished, quotation-ready title
8. Max 10 words

DESCRIPTION RULES:
1. Write TWO paragraphs with a blank line between them
2. Paragraph 1 (75-95 words): Set the scene — the journey mood, route atmosphere, or destination vibe. Make guests feel they are already there. Be vivid and specific
3. Paragraph 2 (75-95 words): Walk through what guests actually experience — transfer comfort, departure rhythm, likely arrival part of day, first impressions, nearby evening outing, or the ease of the plan. End warmly with check-in or overnight halt
4. If entryType is TransitStay or Stay mention the destination and specific local details naturally
5. If transportMode is provided weave it naturally into the narrative
6. If this is a bus or Volvo route day, naturally mention whether it feels like an overnight departure, a scenic road journey, or a comfortable return, whichever suits the route context
7. For return days, mention the smooth wrap-up of the holiday and arrival back to origin
8. Do not invent exact bus operators, fares, or timings unless clearly provided in context
9. Tone: warm, vivid, aspirational — like a seasoned travel writer
10. No bullets, numbering, markdown, emojis, or hotel names
11. Return JSON only`,
                                messages: [
                                    {
                                        role: 'user',
                                        content: JSON.stringify({
                                            packageName: packageForm.name || '',
                                            originLocation: packageForm.originLocation || '',
                                            transportMode: packageForm.transportMode || '',
                                            day: {
                                                currentTitle: title,
                                                destinationName,
                                                entryType: row.entryType,
                                                isReturnDay: /^Drop\s+/i.test(title || ''),
                                                isRouteDay:
                                                    row.entryType === 'Transit' || row.entryType === 'TransitStay',
                                                titleNeedsUpgrade: isReplaceableActivityTitle(title)
                                            }
                                        })
                                    }
                                ]
                            }).unwrap()
                        )

                        const { title: nextTitle, description: nextDescription } = extractAiDraftPayload(response)

                        if (!nextTitle && !nextDescription) return

                        setActivities(prev =>
                            prev.map(item => {
                                if (item.id !== row.id) return item

                                const updatedItem = { ...item }

                                if (nextTitle && isReplaceableActivityTitle(item.title)) {
                                    updatedItem.title = nextTitle
                                }

                                if (
                                    nextDescription &&
                                    shouldReplaceDescription({
                                        previousRow: item,
                                        nextDescription,
                                        field: 'title',
                                        nextValue: updatedItem.title
                                    })
                                ) {
                                    updatedItem.description = nextDescription
                                }

                                updatedItem.isAiPending = false

                                return updatedItem
                            })
                        )
                    } catch (error) {
                        if (isAiRateLimitError(error)) {
                            setTimeout(() => {
                                scheduleActivityDescriptionAutofill(row)
                            }, getAiRetryDelayMs(error))
                        }
                    } finally {
                        delete activityDraftInFlightRef.current[row.id]
                        setDescriptionLoadingByRow(prev => ({ ...prev, [row.id]: false }))
                        delete activityDescriptionTimeoutRef.current[row.id]
                    }
                }, 500)
                return
            }

            // Placeholder Stay rows — queue by destination, then draft each day sequentially for reliability.
            if (destinationDraftInFlightRef.current[destinationName]) {
                return
            }

            if (!pendingDestinationBatchRef.current[destinationName]) {
                pendingDestinationBatchRef.current[destinationName] = []
            }

            const alreadyQueued = pendingDestinationBatchRef.current[destinationName].some(r => r.id === row.id)
            if (!alreadyQueued) {
                pendingDestinationBatchRef.current[destinationName].push(row)
            }

            if (destinationBatchTimeoutRef.current[destinationName]) {
                clearTimeout(destinationBatchTimeoutRef.current[destinationName])
            }

            destinationBatchTimeoutRef.current[destinationName] = setTimeout(async () => {
                destinationDraftInFlightRef.current[destinationName] = true
                const batchRows = pendingDestinationBatchRef.current[destinationName] || []
                delete pendingDestinationBatchRef.current[destinationName]
                delete destinationBatchTimeoutRef.current[destinationName]

                if (!batchRows.length) return

                batchRows.forEach(r => {
                    setDescriptionLoadingByRow(prev => ({ ...prev, [r.id]: true }))
                })

                try {
                    const generatedRows = []
                    const alreadyUsedTitles = activities
                        .filter(
                            item =>
                                item.destinationName?.trim() === destinationName &&
                                item.id &&
                                !batchRows.some(batchRow => batchRow.id === item.id) &&
                                item.title?.trim()
                        )
                        .map(item => item.title.trim())

                    // eslint-disable-next-line no-restricted-syntax
                    for (const [index, batchRow] of batchRows.entries()) {
                        // eslint-disable-next-line no-await-in-loop
                        const generated = await requestSingleActivityDraft({
                            row: batchRow,
                            destinationName,
                            dayNumber: index + 1,
                            totalDaysAtDestination: batchRows.length,
                            usedTitles: [...alreadyUsedTitles, ...generatedRows.map(item => item.title).filter(Boolean)]
                        })

                        generatedRows.push({
                            id: batchRow.id,
                            title: generated.title,
                            description: generated.description
                        })
                    }

                    const generatedSuccessRows = generatedRows.filter(item => item.title || item.description)
                    const failedRows = batchRows.filter(
                        batchRow => !generatedSuccessRows.some(generatedRow => generatedRow.id === batchRow.id)
                    )

                    setActivities(prev =>
                        prev.map(item => {
                            const generated = generatedRows.find(result => result.id === item.id)

                            if (!generated) {
                                return item
                            }

                            if (!generated.title && !generated.description) {
                                return item
                            }

                            return {
                                ...item,
                                title: generated.title || item.title,
                                description: generated.description || item.description,
                                isAiPending: false
                            }
                        })
                    )

                    generatedSuccessRows.forEach(item => {
                        delete activityDraftRetryCountRef.current[item.id]
                    })

                    if (failedRows.length) {
                        const fallbackRows = []
                        const retryRows = []

                        failedRows.forEach((failedRow, index) => {
                            const nextAttemptCount = (activityDraftRetryCountRef.current[failedRow.id] || 0) + 1
                            activityDraftRetryCountRef.current[failedRow.id] = nextAttemptCount

                            if (nextAttemptCount >= MAX_ACTIVITY_DRAFT_CYCLES) {
                                fallbackRows.push({ row: failedRow, dayNumber: index + 1 })
                            } else {
                                retryRows.push(failedRow)
                            }
                        })

                        if (fallbackRows.length) {
                            setActivities(prev =>
                                prev.map(item => {
                                    const fallbackRow = fallbackRows.find(entry => entry.row.id === item.id)
                                    if (!fallbackRow) {
                                        return item
                                    }

                                    delete activityDraftRetryCountRef.current[item.id]

                                    return {
                                        ...item,
                                        title:
                                            item.title?.trim() ||
                                            buildFallbackStayTitle({
                                                destinationName,
                                                dayNumber: fallbackRow.dayNumber
                                            }),
                                        description:
                                            item.description?.trim() ||
                                            buildFallbackStayDescription({
                                                destinationName,
                                                dayNumber: fallbackRow.dayNumber,
                                                totalDaysAtDestination: batchRows.length
                                            }),
                                        isAiPending: false
                                    }
                                })
                            )
                        }

                        if (retryRows.length) {
                            setTimeout(() => {
                                retryRows.forEach(scheduleActivityDescriptionAutofill)
                            }, 1600)
                        }
                    }
                } catch (error) {
                    if (isAiRateLimitError(error)) {
                        setTimeout(() => {
                            batchRows.forEach(scheduleActivityDescriptionAutofill)
                        }, getAiRetryDelayMs(error))
                        return
                    }

                    dispatch(
                        openSnackbar({
                            open: true,
                            message: `AI could not draft day copy for ${destinationName} right now. You can type it manually and continue.`,
                            variant: 'alert',
                            alert: { color: 'warning' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                } finally {
                    delete destinationDraftInFlightRef.current[destinationName]
                    batchRows.forEach(r => {
                        setDescriptionLoadingByRow(prev => ({ ...prev, [r.id]: false }))
                    })
                }
            }, 800)
        },
        [
            activities,
            assistAi,
            dispatch,
            getMatchedItenary,
            packageForm.name,
            packageForm.originLocation,
            packageForm.transportMode,
            requestSingleActivityDraft,
            runQueuedAiRequest,
            shouldReplaceDescription
        ]
    )
    useEffect(() => {
        const timeouts = destinationBatchTimeoutRef.current
        return () => Object.values(timeouts).forEach(id => clearTimeout(id))
    }, [])

    const scheduleDestinationHotelAutofill = useCallback(
        row => {
            const destinationName = row.name?.trim()
            if (!destinationName) {
                return
            }

            const hasAllHotels =
                hasFourHotels(row.delux_hotel) &&
                hasFourHotels(row.super_delux_hotel) &&
                hasFourHotels(row.luxury_hotel) &&
                hasFourHotels(row.premium_hotel)

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
                    const response = await runQueuedAiRequest(() =>
                        assistAi({
                            system: `You are a destination research assistant for a travel package wizard.

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
                                    content: JSON.stringify({
                                        destination: destinationName,
                                        existingHotels: {
                                            delux_hotel: extractHotelNameList(row.delux_hotel),
                                            super_delux_hotel: extractHotelNameList(row.super_delux_hotel),
                                            luxury_hotel: extractHotelNameList(row.luxury_hotel),
                                            premium_hotel: extractHotelNameList(row.premium_hotel)
                                        },
                                        instruction:
                                            'Keep useful existing hotel names if present, and add enough more destination-specific hotel names so every category has exactly 4 names.'
                                    })
                                }
                            ]
                        }).unwrap()
                    )

                    const parsed = parseAiJson(response)
                    const nextDeluxHotel = normalizeHotelSuggestions(
                        parsed.delux_hotel || parsed.deluxe_hotel || parsed.deluxeHotel || ''
                    )
                    const nextSuperDeluxHotel = normalizeHotelSuggestions(
                        parsed.super_delux_hotel || parsed.superDeluxeHotel || parsed.super_deluxe_hotel || ''
                    )
                    const nextLuxuryHotel = normalizeHotelSuggestions(parsed.luxury_hotel || parsed.luxuryHotel || '')
                    const nextPremiumHotel = normalizeHotelSuggestions(
                        parsed.premium_hotel || parsed.premiumHotel || ''
                    )

                    let finalDeluxHotel = mergeHotelSuggestions(row.delux_hotel, nextDeluxHotel)
                    let finalSuperDeluxHotel = mergeHotelSuggestions(row.super_delux_hotel, nextSuperDeluxHotel)
                    let finalLuxuryHotel = mergeHotelSuggestions(row.luxury_hotel, nextLuxuryHotel)
                    let finalPremiumHotel = mergeHotelSuggestions(row.premium_hotel, nextPremiumHotel)

                    let strictRetryCount = 0
                    while (
                        strictRetryCount < 3 &&
                        (!hasFourHotels(finalDeluxHotel) ||
                            !hasFourHotels(finalSuperDeluxHotel) ||
                            !hasFourHotels(finalLuxuryHotel) ||
                            !hasFourHotels(finalPremiumHotel))
                    ) {
                        // eslint-disable-next-line no-await-in-loop
                        const strictResponse = await runQueuedAiRequest(() =>
                            assistAi({
                                system: `Return ONLY valid JSON with exactly these keys:
delux_hotel, super_delux_hotel, luxury_hotel, premium_hotel.

Each key must contain exactly 4 hotel names.
Output format per key: "Hotel 1 | Hotel 2 | Hotel 3 | Hotel 4"
No descriptions. No prices. No amenities. No bullets. No markdown.`,
                                messages: [
                                    {
                                        role: 'user',
                                        content: `Destination: ${destinationName}. Return exactly 4 hotel names in each category.`
                                    }
                                ]
                            }).unwrap()
                        )

                        const strictParsed = parseAiJson(strictResponse)
                        if (!hasFourHotels(finalDeluxHotel)) {
                            finalDeluxHotel = mergeHotelSuggestions(
                                finalDeluxHotel,
                                strictParsed.delux_hotel || strictParsed.deluxe_hotel || strictParsed.deluxeHotel || ''
                            )
                        }
                        if (!hasFourHotels(finalSuperDeluxHotel)) {
                            finalSuperDeluxHotel = mergeHotelSuggestions(
                                finalSuperDeluxHotel,
                                strictParsed.super_delux_hotel ||
                                    strictParsed.superDeluxeHotel ||
                                    strictParsed.super_deluxe_hotel ||
                                    ''
                            )
                        }
                        if (!hasFourHotels(finalLuxuryHotel)) {
                            finalLuxuryHotel = mergeHotelSuggestions(
                                finalLuxuryHotel,
                                strictParsed.luxury_hotel || strictParsed.luxuryHotel || ''
                            )
                        }
                        if (!hasFourHotels(finalPremiumHotel)) {
                            finalPremiumHotel = mergeHotelSuggestions(
                                finalPremiumHotel,
                                strictParsed.premium_hotel || strictParsed.premiumHotel || ''
                            )
                        }

                        strictRetryCount += 1
                    }

                    const resolvedDeluxHotel = ensureFourHotels(finalDeluxHotel, destinationName, 'Delux')
                    const resolvedSuperDeluxHotel = ensureFourHotels(
                        finalSuperDeluxHotel,
                        destinationName,
                        'Super Delux'
                    )
                    const resolvedLuxuryHotel = ensureFourHotels(finalLuxuryHotel, destinationName, 'Luxury')
                    const resolvedPremiumHotel = ensureFourHotels(finalPremiumHotel, destinationName, 'Premium')

                    setDestinations(prev =>
                        prev.map(item => {
                            if (item.id !== row.id) {
                                return item
                            }

                            return {
                                ...item,
                                delux_hotel: resolvedDeluxHotel,
                                super_delux_hotel: resolvedSuperDeluxHotel,
                                luxury_hotel: resolvedLuxuryHotel,
                                premium_hotel: resolvedPremiumHotel
                            }
                        })
                    )
                } catch (error) {
                    if (isAiRateLimitError(error)) {
                        setTimeout(() => {
                            scheduleDestinationHotelAutofill(row)
                        }, getAiRetryDelayMs(error))
                    }
                } finally {
                    setDestinationHotelLoadingByRow(prev => ({ ...prev, [row.id]: false }))
                    delete destinationHotelTimeoutRef.current[row.id]
                }
            }, 500)
        },
        [assistAi, runQueuedAiRequest]
    )

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

                if ((field === 'title' || field === 'description') && value?.toString?.().trim?.()) {
                    updated.isAiPending = false
                }

                if (field === 'entryType' && value !== 'Stay' && value !== 'TransitStay') {
                    updated.destinationName = ''
                    updated.destinationId = ''
                    updated.isAiPending = false
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
        if (!packageForm.originLocation || packageForm.transportMode === 'On Own Vehicles') {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please enter a origin location and transport mode.',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }
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

                const response = await runQueuedAiRequest(() =>
                    assistAi({
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
                )

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
            runQueuedAiRequest,
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
            // Leave AI pending rows untouched — batch autofill will handle them
            if (item.isAiPending) return item

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
            return activities.some(item => item.title.trim() || item.isAiPending)
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
            const unresolvedAiRows = activities.filter(
                item => item.isAiPending && (!item.title?.trim() || !item.description?.trim())
            )

            if (unresolvedAiRows.length) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message:
                            'A few day titles or descriptions are still pending. Please wait for AI or fill them manually before saving.',
                        variant: 'alert',
                        alert: { color: 'warning' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
                return
            }

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

            // const validActivities = activities.filter(item => item.title.trim())
            const validActivities = activities.filter(item => item.title.trim())
            const uniqueActivityTitles = [...new Set(validActivities.map(item => item.title.trim()))]

            const itenaryResults = await Promise.all(
                uniqueActivityTitles.map(async title => {
                    const existing = existingItenaries.find(item => toNormalized(item.title) === toNormalized(title))
                    const sourceActivity = validActivities.find(
                        item => toNormalized(item.title) === toNormalized(title)
                    )
                    const nextDescription =
                        sourceActivity?.description?.trim() ||
                        buildDefaultDescription({
                            entryType: sourceActivity?.entryType,
                            destinationName: sourceActivity?.destinationName,
                            title: sourceActivity?.title,
                            originLocation: packageForm.originLocation,
                            transportMode: packageForm.transportMode
                        })

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
                                                        label='Delux Hotel'
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
                                                        label='Super Delux Hotel'
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
                                                <Typography variant='h5'>
                                                    Day {index + 1}
                                                    {row.title ? ` – ${row.title}` : ''}
                                                </Typography>
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
                                                        placeholder={row.isAiPending ? 'Generating title...' : ''}
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
