import { describe, expect, test } from 'vitest'
import {
    blankVehicle,
    changedVehicles,
    draftVehicle,
    vehicleDuplicates,
    vehicleLists,
    vehiclePayload,
    vehicleProblem
} from './vehicleFacts'

const saved = [
    { id: 1, name: 'Sedan', seats: 4, active: true },
    { id: 2, name: 'Innova Crysta', seats: 7, active: true },
    { id: 3, name: 'Mini Bus 32 seater', seats: 32, active: true },
    { id: 4, name: 'Winger', seats: null, active: true },
    { id: 5, name: 'Old Swift', seats: 4, active: false }
]

describe('the lists the forms offer', () => {
    test('the agency’s own vehicles that show, then a Volvo and a Volvo with each car, then no vehicle', () => {
        const { ready, names, choices } = vehicleLists(saved, true)
        expect(ready).toBe(true)
        expect(names).toEqual(['Sedan', 'Innova Crysta', 'Mini Bus 32 seater', 'Winger'])
        expect(choices.map(choice => choice.value)).toEqual([
            'Sedan',
            'Innova Crysta',
            'Mini Bus 32 seater',
            'Winger',
            'Volvo',
            'Volvo + Sedan',
            'Volvo + Innova Crysta',
            'None'
        ])
        expect(choices[choices.length - 1]).toEqual({ value: 'None', label: 'No vehicle' })
    })

    test('a bus or a vehicle with no seats given gets no “Volvo +” (a car comes after a Volvo, not a bus)', () => {
        const values = vehicleLists(saved, true).choices.map(choice => choice.value)
        expect(values).not.toContain('Volvo + Mini Bus 32 seater')
        expect(values).not.toContain('Volvo + Winger')
    })

    test('a hidden vehicle is offered nowhere', () => {
        const { names, choices } = vehicleLists(saved, true)
        expect(names).not.toContain('Old Swift')
        expect(choices.map(choice => choice.value)).not.toContain('Volvo + Old Swift')
    })

    test('an agency with none shown is offered none of the built-in ones', () => {
        expect(vehicleLists([], true).names).toEqual([])
        expect(vehicleLists([], true).choices.map(choice => choice.value)).toEqual(['Volvo', 'None'])
    })

    test('before the server has the list, the built-in one — as the forms offered before', () => {
        const { ready, names, choices } = vehicleLists([], false)
        expect(ready).toBe(false)
        expect(names).toContain('Innova Crysta')
        expect(names.some(name => /volvo/i.test(name))).toBe(false)
        expect(choices.map(choice => choice.value)).toContain('Volvo + Sedan')
        expect(choices[choices.length - 1].value).toBe('None')
    })
})

describe('the rows of the screen', () => {
    const original = saved.map(draftVehicle)

    test('a saved vehicle shows its seats as text and whether it shows', () => {
        expect(draftVehicle(saved[3])).toMatchObject({ id: 4, name: 'Winger', seats: '', active: true })
        expect(draftVehicle(saved[0])).toMatchObject({ seats: '4' })
        expect(draftVehicle(saved[4]).active).toBe(false)
    })

    test('nothing is changed until a row is', () => {
        expect(changedVehicles(original, original)).toEqual([])
        expect(changedVehicles([...original, blankVehicle()], original)).toEqual([])
    })

    test('a new vehicle, new seats or a vehicle hidden is a change', () => {
        const rows = original.map(row => {
            if (row.id === 1) return { ...row, seats: '5' }
            if (row.id === 2) return { ...row, active: false }
            return row
        })
        const added = { ...blankVehicle(), name: 'Mini Bus', seats: '32' }
        expect(changedVehicles([...rows, added], original).map(row => row.name)).toEqual([
            'Sedan',
            'Innova Crysta',
            'Mini Bus'
        ])
    })

    test('says what is wrong with a row', () => {
        const row = patch => ({ ...blankVehicle(), name: 'Mini Bus', ...patch })
        expect(vehicleProblem(row({}))).toBe('')
        expect(vehicleProblem(row({ name: '  ' }))).toMatch(/Enter the vehicle’s name/)
        expect(vehicleProblem(row({ name: 'x'.repeat(61) }))).toMatch(/at most 60/)
        expect(vehicleProblem(row({ name: 'Volvo + Sedan' }))).toMatch(/“\+”/)
        expect(vehicleProblem(row({ name: 'Volvo' }))).toMatch(/trip form already/)
        expect(vehicleProblem(row({ name: 'None' }))).toMatch(/trip form already/)
        expect(vehicleProblem(row({ seats: '0' }))).toMatch(/Seats must be/)
        expect(vehicleProblem(row({ seats: '61' }))).toMatch(/Seats must be/)
        expect(vehicleProblem(row({ seats: '32' }))).toBe('')
        expect(vehicleProblem(row({ name: 'Volvo B9R' }))).toBe('')
    })

    test('the same vehicle twice, whatever the case or spacing, is said — and a row left empty is not', () => {
        const rows = [
            ...original,
            { ...blankVehicle(), name: ' sedan ' },
            { ...blankVehicle(), name: 'Mini Bus' },
            { ...blankVehicle(), name: 'mini   bus' },
            blankVehicle()
        ]
        const problems = vehicleDuplicates(rows)
        expect(Object.values(problems).sort()).toEqual(
            ['Mini Bus is already listed'.replace('Mini Bus', 'mini bus'), 'sedan is already listed'].sort()
        )
    })

    test('is sent as the server takes it, with its id only when saved', () => {
        expect(vehiclePayload({ ...blankVehicle(), name: '  Mini   Bus ', seats: ' 32 ', active: true })).toEqual({
            name: 'Mini Bus',
            seats: '32',
            active: true
        })
        expect(vehiclePayload(original[0])).toEqual({ id: 1, name: 'Sedan', seats: '4', active: true })
    })
})
