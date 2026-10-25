/**
 * THE VEHICLE MASTER — what the agency's vehicle list holds and how the screens use it. Pure functions, no React. The server checks
 * everything again (backend Helpers/vehicle.helper.js).
 *
 * A vehicle is a name and its seats. Rates, trips and quotes find a vehicle by its name as text, so a saved vehicle's name is not
 * changed here: to change one, hide it or remove it and add the new name.
 */
import nameKey from '@views/forms/packages/nameKey'
import { VEHICLES, VEHICLE_NAMES } from '@views/forms/guestDetailsForm/tripDetails'

// ? what the screens offered before the agency had a list of its own — still offered until the server's upgrade is run
const BUILT_IN = VEHICLE_NAMES.filter(name => !/^volvo/i.test(name))

// ? "Volvo + Sedan": a guest who comes by Volvo and then takes a car. Offered for each vehicle of up to this many seats
const COMBO_MAX_SEATS = 7

const MAX_NAME = 60
const MAX_SEATS = 60
const RESERVED = ['volvo', 'none', 'not decided']

/**
 * @description the vehicle lists the forms offer
 * @param {{ name: string, seats: number|null, active: boolean }[]} list the saved vehicles
 * @param {boolean} ready whether the server has the vehicle list at all
 * @returns {{ ready: boolean, names: string[], choices: { value: string, label: string }[] }} `names` are the vehicles themselves
 *          (the supplier form's suggestions); `choices` the trip form's: those, a Volvo and a Volvo with a car, and "No vehicle"
 */
export const vehicleLists = (list, ready) => {
    if (!ready) return { ready: false, names: BUILT_IN, choices: VEHICLES }
    const shown = (list || []).filter(vehicle => vehicle.active !== false)
    const names = shown.map(vehicle => vehicle.name)
    const cars = shown.filter(vehicle => vehicle.seats && vehicle.seats <= COMBO_MAX_SEATS).map(vehicle => vehicle.name)
    return {
        ready: true,
        names,
        choices: [
            ...names.map(name => ({ value: name, label: name })),
            { value: 'Volvo', label: 'Volvo' },
            ...cars.map(name => ({ value: `Volvo + ${name}`, label: `Volvo + ${name}` })),
            { value: 'None', label: 'No vehicle' }
        ]
    }
}

// ---------------------------------------------------------------- the rows of the screen

let counter = 0
const nextKey = () => {
    counter += 1
    return `new-vehicle-${counter}`
}

const clean = value =>
    String(value ?? '')
        .replace(/\s+/g, ' ')
        .trim()

export const blankVehicle = () => ({ key: nextKey(), id: null, name: '', seats: '', active: true })

export const draftVehicle = row => ({
    key: `vehicle-${row.id}`,
    id: row.id,
    name: row.name,
    seats: row.seats === null || row.seats === undefined ? '' : String(row.seats),
    active: row.active !== false
})

const untouched = row => !row.id && !clean(row.name) && !String(row.seats).trim()

/** @description what is wrong with a row, or '' */
export const vehicleProblem = row => {
    const name = clean(row.name)
    if (!name) return 'Enter the vehicle’s name, such as Innova Crysta'
    if (name.length > MAX_NAME) return `A vehicle’s name is at most ${MAX_NAME} characters`
    if (/[+<>]/.test(name)) return 'A vehicle’s name can’t have “+”: a trip with a Volvo is made from the vehicles'
    if (RESERVED.includes(name.toLowerCase()))
        return `“${name}” is used by the trip form already — name the vehicle itself`
    const seats = String(row.seats).trim()
    if (seats && (!/^\d+$/.test(seats) || Number(seats) < 1 || Number(seats) > MAX_SEATS)) {
        return `Seats must be a whole number from 1 to ${MAX_SEATS}`
    }
    return ''
}

/** @description the rows that are new or whose seats or visibility changed, ignoring a new row left empty */
export const changedVehicles = (rows, original) =>
    rows
        .filter(row => !untouched(row))
        .filter(row => {
            if (!row.id) return true
            const before = original.find(item => item.id === row.id)
            return String(row.seats).trim() !== before?.seats || Boolean(row.active) !== Boolean(before?.active)
        })

/** @returns {Record<string, string>} row key → message, for a vehicle listed twice (as the rate card reads names) */
export const vehicleDuplicates = rows => {
    const seen = new Set()
    const problems = {}
    rows.forEach(row => {
        if (untouched(row)) return
        const key = nameKey(row.name)
        if (!key) return
        if (seen.has(key)) problems[row.key] = `${clean(row.name)} is already listed`
        else seen.add(key)
    })
    return problems
}

export const vehiclePayload = row => ({
    ...(row.id ? { id: row.id } : {}),
    name: clean(row.name),
    seats: String(row.seats).trim(),
    active: Boolean(row.active)
})
