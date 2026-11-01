/**
 * PASTE AN ENQUIRY, GET A LEAD.
 *
 * The agent pastes what the guest sent (a WhatsApp message, an email, notes
 * from a call). The AI reads who it is and what trip they want; the lead form
 * and the lead's trip details are filled from that, and the agent checks them
 * before saving.
 *
 * The AI may only report what the text says. Anything it returns is checked
 * here against the text and the app's own lists: a phone number or email that
 * is not in the text is dropped (no made-up contacts), a trip, hotel category,
 * meal plan or vehicle must be one the agency has, and a start date must be a
 * real date not in the past. When the AI can't be reached, the phone number
 * and email are still read from the text.
 */

import { HOTEL_CATEGORIES, MEAL_PLANS, TRAVEL_WAYS, TRIP_TYPES } from '../guestDetailsForm/tripDetails'
import { cleanPlaces } from './places'

const DAY_MS = 24 * 60 * 60 * 1000

export const ENQUIRY_SYSTEM_PROMPT = `You read a travel enquiry that an Indian travel agency received (a WhatsApp message, an email, or notes from a call) and extract the guest and the trip they ask for.

Respond ONLY with a JSON object with these keys (leave a key out, or use "" or null, when the text does not say it):
- fullName: the guest's name as written
- phone: the guest's phone number exactly as written
- email: the guest's email exactly as written
- trip: one title from "trips" that the enquiry is about (e.g. Manali or Shimla is "Himachal" when that is a trip), or ""
- startDate: "YYYY-MM-DD"; a date without a year is the next one on or after "today"
- endDate: "YYYY-MM-DD", or ""
- nights: total nights as a number ("6N/7D" is 6, "7 days" is 6), or null
- adults, children: numbers; a couple is 2 adults; "family of 4" with no split is 4 adults
- rooms: number, or null
- hotelCategory: one of "hotelCategories" ("3 star" is Deluxe, "4 star" Super Deluxe, "5 star" Luxury), or ""
- mealPlan: one of "mealPlans" (EP room only, CP breakfast, MAP breakfast and dinner, AP all meals), or ""
- tripType: one of "tripTypes", or ""
- vehicle: the vehicle asked for (e.g. "Innova Crysta", "Tempo Traveller"), or ""
- pickupLocation: where the trip starts (a city, airport or station), or ""
- dropLocation: where it ends, or ""
- arriveBy: one of "travelWays" when the guest reaches the first place that way (Volvo, Train, Flight), or ""
- places: the places the guest wants to see, in travel order, as written, with the nights in each when said: [{ "name": "Shimla", "nights": 2 }, { "name": "Manali", "nights": null }]; [] when no place is named (never a place the text does not name)
- budget: the budget as written, or ""
- wishes: a short plain summary of places, activities and requests (e.g. "Shimla 2N, Manali 3N, Solang Valley, no trekking"), or ""

Rules: never invent a name, number, email, date or place the text does not contain. Return JSON only.`

const str = (value, max = 200) =>
    typeof value === 'string' || typeof value === 'number'
        ? String(value).replace(/\s+/g, ' ').trim().slice(0, max)
        : ''

const digits = value => String(value || '').replace(/\D/g, '')

const count = value => {
    const number = Math.round(Number(value))
    return Number.isFinite(number) && number >= 0 && number < 100 && value !== '' && value !== null ? number : null
}

const oneOf = (value, options) => {
    const wanted = str(value).toLowerCase()
    return options.find(option => option.toLowerCase() === wanted) || ''
}

/** @description today as YYYY-MM-DD in India, where the agencies are */
export const indiaToday = (now = new Date()) => new Date(now.getTime() + 330 * 60 * 1000).toISOString().slice(0, 10)

const validDate = (value, today) => {
    const text = str(value, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return ''
    const time = Date.parse(`${text}T00:00:00Z`)
    if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== text) return ''
    return text >= today ? text : ''
}

// ? the agency's vehicle the guest asked for: the same name, or the one name containing the other ("Innova" is
// ? "Innova Crysta"); '' when none fits, so the trip details never show a vehicle the agency doesn't have
const vehicleOf = (asked, vehicles) => {
    const wanted = str(asked, 60).toLowerCase()
    if (!wanted) return ''
    const names = vehicles.map(name => String(name))
    return (
        names.find(name => name.toLowerCase() === wanted) ||
        names.find(name => name.toLowerCase().includes(wanted) || wanted.includes(name.toLowerCase())) ||
        ''
    )
}

const addDays = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)

// ? Indian mobiles (with or without +91 / 0) and numbers written with a country code
const PHONE_PATTERN = /(?:\+?\d[\d\s-]{8,15}\d)/g
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i

/** @description the first phone number in the text, as written; '' when there is none */
export const phoneInText = text =>
    (String(text || '').match(PHONE_PATTERN) || []).find(match => {
        const number = digits(match)
        return number.length >= 10 && number.length <= 13
    }) || ''

/** @description the first email address in the text; '' when there is none */
export const emailInText = text => (String(text || '').match(EMAIL_PATTERN) || [''])[0]

/** @description the request to the AI endpoint (POST /ai/assist) */
export const buildEnquiryRequest = ({ text, campaigns = [], today = indiaToday() }) => ({
    system: ENQUIRY_SYSTEM_PROMPT,
    messages: [
        {
            role: 'user',
            content: JSON.stringify({
                today,
                trips: campaigns.map(campaign => campaign.title),
                hotelCategories: HOTEL_CATEGORIES.map(item => item.value),
                mealPlans: MEAL_PLANS.map(item => item.value),
                tripTypes: TRIP_TYPES.map(item => item.value),
                travelWays: TRAVEL_WAYS.map(item => item.value).filter(Boolean),
                enquiry: String(text || '').slice(0, 6000)
            })
        }
    ]
})

/**
 * @description what the AI read, checked against the text and the agency's lists
 * @param {object} raw the AI's JSON ({} when it could not be reached)
 * @returns {{ lead: object, trip: object, places: object[], found: string[] }} lead: form fields; trip: trip-details
 *          values (strings, as the trip details form keeps them); places: the places the guest named ("Shimla 2N");
 *          found: what was filled in, for the agent to see
 */
export const readEnquiry = (raw, { text, campaigns = [], vehicles = [], today = indiaToday() }) => {
    const source = String(text || '')
    const sourceDigits = digits(source)
    const sourceLower = source.toLowerCase()

    // ? contacts only when they are in the text: the AI's number is used if its digits are there, else the text's own
    const aiPhone = str(raw?.phone, 30)
    const phone =
        aiPhone && digits(aiPhone).length >= 10 && sourceDigits.includes(digits(aiPhone).slice(-10))
            ? aiPhone
            : phoneInText(source)
    const aiEmail = str(raw?.email, 120)
    const email = aiEmail && sourceLower.includes(aiEmail.toLowerCase()) ? aiEmail : emailInText(source)
    const campaign = campaigns.find(item => item.title.toLowerCase() === str(raw?.trip).toLowerCase())

    const startDate = validDate(raw?.startDate, today)
    const nights = count(raw?.nights)
    let endDate = validDate(raw?.endDate, today)
    if (endDate && (!startDate || endDate <= startDate)) endDate = ''
    if (!endDate && startDate && nights && nights <= 30) endDate = addDays(startDate, nights)

    // ? the places the guest named: only those whose name is in the text, so the route is never the AI's guess
    const words = ` ${sourceLower.replace(/[^a-z0-9]+/g, ' ')} `
    const places = cleanPlaces(Array.isArray(raw?.places) ? raw.places : []).filter(place =>
        words.includes(
            ` ${place.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, ' ')
                .trim()} `
        )
    )

    const adults = count(raw?.adults)
    const wishes = str(raw?.wishes, 500)
    const budget = str(raw?.budget, 60)

    const lead = {
        fullName: str(raw?.fullName, 100),
        phone: phone.trim(),
        senderEmail: email,
        campaignId: campaign ? String(campaign.id) : '',
        remarks: [wishes, budget ? `Budget: ${budget}` : ''].filter(Boolean).join(' · ')
    }
    const asText = value => (value === null || value === undefined ? '' : String(value))
    const trip = {
        adults: asText(adults || null),
        children: asText(count(raw?.children) || null),
        rooms: asText(count(raw?.rooms) || null),
        pickupDate: startDate,
        dropDate: endDate,
        packageType: oneOf(
            raw?.hotelCategory,
            HOTEL_CATEGORIES.map(item => item.value)
        ),
        foodPlan: oneOf(
            raw?.mealPlan,
            MEAL_PLANS.map(item => item.value)
        ),
        tourType: oneOf(
            raw?.tripType,
            TRIP_TYPES.map(item => item.value)
        ),
        taxiType: vehicleOf(raw?.vehicle, vehicles),
        pickupLocation: str(raw?.pickupLocation, 120),
        dropLocation: str(raw?.dropLocation, 120),
        arriveBy: oneOf(raw?.arriveBy, TRAVEL_WAYS.map(item => item.value).filter(Boolean)),
        leadRemarks: lead.remarks
    }

    const found = [
        lead.fullName && 'name',
        lead.phone && 'phone',
        lead.senderEmail && 'email',
        campaign && `trip (${campaign.title})`,
        places.length && 'places',
        trip.pickupDate && 'dates',
        trip.adults && 'guests',
        trip.packageType && 'hotel category',
        trip.pickupLocation && 'pickup',
        wishes && 'wishes'
    ].filter(Boolean)

    return { lead, trip, places, found }
}

/** @description whether any trip detail was read, so the lead's trip details are worth saving */
export const hasTripDetails = trip =>
    Object.entries(trip || {}).some(([key, value]) => key !== 'leadRemarks' && String(value || '').trim() !== '')
