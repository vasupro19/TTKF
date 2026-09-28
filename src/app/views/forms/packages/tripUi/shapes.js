/**
 * Prop shapes for the itinerary engine's Trip model, as the trip UI reads it.
 */
import PropTypes from 'prop-types'

const { arrayOf, bool, number, oneOfType, shape, string } = PropTypes

export const legShape = shape({
    id: string,
    from: string,
    to: string,
    mode: string,
    estimate: shape({
        durationHours: arrayOf(number),
        distanceKm: arrayOf(number),
        via: arrayOf(string),
        stops: arrayOf(shape({ name: string, kind: string, note: string })),
        notes: arrayOf(string)
    })
})

const accessShape = shape({ place: string, kind: string, note: string })

export const dayShape = shape({
    dayNumber: number,
    type: string,
    date: string,
    title: string,
    location: string,
    stay: string,
    leg: legShape,
    budget: shape({
        departAt: number,
        arrive: shape({ earliest: number, latest: number })
    }),
    timeline: arrayOf(
        shape({
            kind: string,
            label: string,
            start: number,
            end: number,
            assumed: bool,
            leg: legShape,
            activity: shape({ name: string, note: string, required: bool, recommended: bool })
        })
    ),
    clusters: arrayOf(shape({ name: string, access: arrayOf(accessShape) })),
    warnings: arrayOf(string)
})

export const stopShape = shape({ name: string, kind: string, nights: number })

export const questionShape = shape({ id: string, field: string, text: string, priority: number })

export const requirementsShape = shape({
    origin: string,
    startDate: string,
    pace: string,
    styles: arrayOf(string),
    destinations: arrayOf(shape({ name: string, nights: oneOfType([number, string]) })),
    requiredAttractions: arrayOf(shape({ name: string, destination: string })),
    travellers: shape({
        type: string,
        adults: oneOfType([number, string]),
        children: oneOfType([number, string]),
        seniors: oneOfType([number, string])
    }),
    transport: shape({ mode: string, vehicle: string })
})

export const tripShape = shape({
    status: string,
    requirements: requirementsShape,
    route: shape({ stops: arrayOf(stopShape) }),
    legs: arrayOf(legShape),
    conflicts: arrayOf(shape({ id: string, text: string, options: arrayOf(shape({ id: string, label: string })) })),
    questions: arrayOf(questionShape),
    assumptions: arrayOf(shape({ id: string, text: string })),
    notes: arrayOf(accessShape),
    recommendations: arrayOf(shape({ kind: string, name: string, reason: string, impact: string }))
})

export const voiceShape = shape({ supported: bool, listening: bool, transcript: string, onToggle: PropTypes.func })

export const plannerInputShape = shape({
    origin: string,
    endsAt: string,
    destinations: arrayOf(shape({ name: string, nights: oneOfType([number, string]) })),
    startDate: string,
    who: string,
    adults: number,
    children: number,
    withParents: bool,
    pace: string,
    transport: string,
    vehicle: string,
    interests: arrayOf(string),
    mustSee: string,
    budget: string,
    excluded: arrayOf(string)
})

export const rowShape = shape({
    id: string,
    title: string,
    description: string,
    image: string,
    planKey: string
})
