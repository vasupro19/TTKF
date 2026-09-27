/**
 * TRIP REQUIREMENTS — everything the agent told us, in one structure.
 *
 * Two sources feed it: the Trip details form, and whatever the agent typed in
 * plain words ("we're a couple, no trekking, definitely Rohtang"). The model
 * extracts the typed text into this shape; the form wins wherever both say
 * something, because a filled-in field is the most explicit statement of intent.
 *
 * Everything in here is a HARD constraint. AI suggestions never enter this
 * object unless the agent accepts them.
 */

export const PACES = ['relaxed', 'balanced', 'packed']

export const TRANSPORT_OPTIONS = ['Private cab', 'Own car', 'Volvo / bus', 'Train', 'Flight', 'Tempo Traveller']

export const emptyRequirements = () => ({
    origin: '',
    // ? where the trip ends; empty means back at the origin
    finalDestination: '',
    // ? [{ name, nights }] in travel order
    destinations: [],
    // ? set when the agent named only a region ("6 days Himachal")
    region: '',
    totalNights: null,
    startDate: '',
    travellers: { adults: null, children: null, seniors: null, type: '', notes: [] },
    transport: { mode: '', vehicle: '' },
    pace: '',
    styles: [],
    interests: [],
    // ? [{ name, destination }] — places or experiences the guest asked for by name
    requiredAttractions: [],
    excludedAttractions: [],
    // ? free-form restrictions: "no trekking", "limited walking"
    constraints: [],
    arrival: { time: '', place: '' },
    departure: { time: '', place: '' },
    budget: '',
    hotelPreference: '',
    // ? only when the agent named no destinations: the model's proposal, shown as an assumption
    suggestedDestinations: []
})

const str = (value, max = 120) =>
    typeof value === 'string' || typeof value === 'number'
        ? String(value).replace(/\s+/g, ' ').trim().slice(0, max)
        : ''

const list = value => (Array.isArray(value) ? value : [])

const count = value => {
    const number = Math.round(Number(value))
    return Number.isFinite(number) && number >= 0 && number < 100 ? number : null
}

const nights = value => Math.min(30, Math.max(1, Math.round(Number(value)) || 1))

// ? lowercase words only, so "Rohtang Pass" and "rohtang-pass" compare equal
export const normalizeText = value =>
    (value || '')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()

export const sameName = (left, right) => normalizeText(left) === normalizeText(right)

const uniqueBy = (items, keyOf) =>
    items.filter((item, index) => items.findIndex(other => keyOf(other) === keyOf(item)) === index)

const strings = (value, max = 80) =>
    uniqueBy(
        list(value)
            .map(item => str(item, max))
            .filter(Boolean),
        normalizeText
    )

const time = value => (/^([01]?\d|2[0-3]):[0-5]\d$/.test(str(value)) ? str(value).padStart(5, '0') : '')

const isoDate = value => (/^\d{4}-\d{2}-\d{2}$/.test(str(value)) ? str(value) : '')

/**
 * @description sanitises a requirements object from any source — the model's output is untrusted, and the
 *              form can hold half-typed values
 */
export const normalizeRequirements = raw => {
    const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
    const base = emptyRequirements()

    const destinations = uniqueBy(
        list(input.destinations)
            .map(item => ({ name: str(item?.name, 60), nights: nights(item?.nights) }))
            .filter(item => item.name),
        item => normalizeText(item.name)
    )

    const requiredAttractions = uniqueBy(
        list(input.requiredAttractions)
            .map(item =>
                typeof item === 'string'
                    ? { name: str(item, 60), destination: '' }
                    : { name: str(item?.name, 60), destination: str(item?.destination, 60) }
            )
            .filter(item => item.name && !destinations.some(place => sameName(place.name, item.name))),
        item => normalizeText(item.name)
    )

    return {
        ...base,
        origin: str(input.origin, 60),
        finalDestination: str(input.finalDestination, 60),
        destinations,
        region: str(input.region, 60),
        totalNights: input.totalNights == null || input.totalNights === '' ? null : nights(input.totalNights),
        startDate: isoDate(input.startDate),
        travellers: {
            // ? "0 adults" is a model's way of saying "not stated"
            adults: count(input.travellers?.adults) || null,
            children: count(input.travellers?.children),
            seniors: count(input.travellers?.seniors),
            type: str(input.travellers?.type, 30).toLowerCase(),
            notes: strings(input.travellers?.notes, 120)
        },
        transport: { mode: str(input.transport?.mode, 40), vehicle: str(input.transport?.vehicle, 40) },
        pace: PACES.includes(str(input.pace).toLowerCase()) ? str(input.pace).toLowerCase() : '',
        styles: strings(input.styles, 30),
        interests: strings(input.interests, 40),
        requiredAttractions,
        excludedAttractions: strings(input.excludedAttractions, 60),
        constraints: strings(input.constraints, 120),
        arrival: { time: time(input.arrival?.time), place: str(input.arrival?.place, 60) },
        departure: { time: time(input.departure?.time), place: str(input.departure?.place, 60) },
        budget: str(input.budget, 40),
        hotelPreference: str(input.hotelPreference, 60),
        suggestedDestinations: list(input.suggestedDestinations)
            .map(item => ({ name: str(item?.name, 60), nights: nights(item?.nights), reason: str(item?.reason, 200) }))
            .filter(item => item.name)
    }
}

const filled = value => {
    if (value == null) return false
    if (typeof value === 'string') return value.trim() !== ''
    if (Array.isArray(value)) return value.length > 0
    return true
}

/**
 * @description combines what the model extracted from the typed text with the form. A filled-in form field
 *              wins; lists are unioned, so "must visit" typed in either place is kept.
 */
export const mergeRequirements = (extracted, form) => {
    const fromText = normalizeRequirements(extracted)
    const fromForm = normalizeRequirements(form)
    const pick = key => (filled(fromForm[key]) ? fromForm[key] : fromText[key])
    const pickObject = key =>
        Object.fromEntries(
            Object.keys(fromText[key]).map(field => [
                field,
                filled(fromForm[key][field]) ? fromForm[key][field] : fromText[key][field]
            ])
        )
    const union = key => uniqueBy([...fromForm[key], ...fromText[key]], item => normalizeText(item?.name ?? item))

    return normalizeRequirements({
        ...fromText,
        origin: pick('origin'),
        finalDestination: pick('finalDestination'),
        destinations: pick('destinations'),
        region: pick('region'),
        totalNights: fromForm.totalNights ?? fromText.totalNights,
        startDate: pick('startDate'),
        travellers: {
            ...pickObject('travellers'),
            notes: uniqueBy([...fromForm.travellers.notes, ...fromText.travellers.notes], normalizeText)
        },
        transport: pickObject('transport'),
        pace: pick('pace'),
        styles: union('styles'),
        interests: union('interests'),
        requiredAttractions: union('requiredAttractions'),
        excludedAttractions: union('excludedAttractions'),
        constraints: union('constraints'),
        arrival: pickObject('arrival'),
        departure: pickObject('departure'),
        budget: pick('budget'),
        hotelPreference: pick('hotelPreference'),
        suggestedDestinations: fromText.suggestedDestinations
    })
}

export const totalNightsOf = requirements => requirements.destinations.reduce((sum, item) => sum + item.nights, 0)

const travellerSummary = travellers => {
    const parts = [
        travellers.adults ? `${travellers.adults} adult${travellers.adults > 1 ? 's' : ''}` : '',
        travellers.children ? `${travellers.children} child${travellers.children > 1 ? 'ren' : ''}` : '',
        travellers.seniors ? `${travellers.seniors} senior${travellers.seniors > 1 ? 's' : ''}` : ''
    ].filter(Boolean)
    const type = travellers.type ? travellers.type[0].toUpperCase() + travellers.type.slice(1) : ''
    return [type, parts.join(', ')].filter(Boolean).join(' · ')
}

export const describeTravellers = travellers => travellerSummary(travellers) || '2 adults'

export const hasSeniorsOrChildren = requirements =>
    Boolean(requirements.travellers.seniors || requirements.travellers.children) ||
    /parent|elder|senior|kid|child|infant|toddler/i.test(
        [requirements.travellers.type, ...requirements.travellers.notes].join(' ')
    )

/**
 * @description fills the gaps that do not need a question with a sensible default, and records each one as an
 *              assumption the agent can see and change. Returns the questions that do matter.
 * @returns {{ requirements: object, assumptions: object[], questions: object[], blocked: boolean }}
 */
export const resolveRequirements = raw => {
    const requirements = normalizeRequirements(raw)
    const assumptions = []
    const questions = []

    if (!requirements.destinations.length && requirements.suggestedDestinations.length) {
        requirements.destinations = requirements.suggestedDestinations.map(({ name, nights: n }) => ({
            name,
            nights: n
        }))
        assumptions.push({
            id: 'route',
            field: 'destinations',
            text: `No destinations were named, so AI chose ${requirements.destinations
                .map(item => `${item.name} (${item.nights}N)`)
                .join(', ')}${requirements.region ? ` for ${requirements.region}` : ''}. Change them in Trip details.`
        })
    }

    if (!requirements.destinations.length) {
        questions.push({
            id: 'destinations',
            field: 'destinations',
            priority: 1,
            text: 'Which destinations, and how many nights in each? For example "Shimla 2 nights, Manali 3 nights".'
        })
    }

    if (!requirements.origin) {
        questions.push({
            id: 'origin',
            field: 'origin',
            priority: 2,
            text: 'Where does the trip start? The drive from there changes the first and last day.'
        })
        if (requirements.destinations.length) {
            assumptions.push({
                id: 'origin',
                field: 'origin',
                text: `No pickup city given, so the trip starts on arrival in ${requirements.destinations[0].name} around midday.`
            })
        }
    }

    if (requirements.origin && !requirements.finalDestination) {
        requirements.finalDestination = requirements.origin
        assumptions.push({
            id: 'final',
            field: 'finalDestination',
            text: `The trip ends back in ${requirements.origin}.`
        })
    }

    if (!requirements.transport.mode) {
        requirements.transport.mode = 'Private cab'
        assumptions.push({
            id: 'transport',
            field: 'transport',
            text: 'Private cab assumed for road travel, because no transport was given.'
        })
    }

    if (!requirements.pace) {
        requirements.pace = hasSeniorsOrChildren(requirements) ? 'relaxed' : 'balanced'
        assumptions.push({ id: 'pace', field: 'pace', text: `A ${requirements.pace} pace is assumed.` })
    }

    if (!requirements.travellers.adults && !requirements.travellers.type) {
        assumptions.push({ id: 'travellers', field: 'travellers', text: '2 adults assumed.' })
    }

    return {
        requirements,
        assumptions,
        questions: questions.sort((left, right) => left.priority - right.priority),
        // ? only a missing route stops the plan; everything else has a labelled default
        blocked: !requirements.destinations.length
    }
}

/**
 * @description applies one change to the agent's requirements — an answered question, a conflict option, an
 *              accepted AI suggestion. Everything the patch does not touch is kept.
 * @param {object} requirements what the agent specified (not the resolved defaults)
 * @param {{ type: string }} patch
 */
export const applyPatch = (requirements, patch) => {
    const next = normalizeRequirements(requirements)
    const loosely = (left, right) => {
        const a = normalizeText(left)
        const b = normalizeText(right)
        return Boolean(a && b) && (a.includes(b) || (a.length >= 4 && b.includes(a)))
    }

    switch (patch.type) {
        case 'set':
            return normalizeRequirements({ ...next, [patch.field]: patch.value })
        case 'add-night':
            next.destinations = next.destinations.map(item =>
                sameName(item.name, patch.destination) ? { ...item, nights: item.nights + (patch.nights || 1) } : item
            )
            return next
        case 'remove-required':
            next.requiredAttractions = next.requiredAttractions.filter(
                item => !patch.names.some(name => loosely(name, item.name))
            )
            return next
        case 'add-required':
            next.requiredAttractions = [
                ...next.requiredAttractions,
                { name: patch.name, destination: patch.destination || '' }
            ]
            return normalizeRequirements(next)
        case 'add-destination': {
            const at = next.destinations.findIndex(item => sameName(item.name, patch.after))
            const entry = { name: patch.name, nights: patch.nights || 1 }
            next.destinations =
                at === -1
                    ? [...next.destinations, entry]
                    : [...next.destinations.slice(0, at + 1), entry, ...next.destinations.slice(at + 1)]
            return normalizeRequirements(next)
        }
        default:
            return next
    }
}
