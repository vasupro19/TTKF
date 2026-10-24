import { describe, expect, test } from 'vitest'
import {
    blankCabRow,
    blankHotelRow,
    cabRowProblem,
    cabsFromSheet,
    changedCabRows,
    changedHotelRows,
    copyHotelRow,
    draftHotelRow,
    duplicateCabRows,
    duplicateHotelRows,
    ticketKit,
    excelDay,
    hotelPayload,
    hotelRowProblem,
    hotelRowsMatching,
    hotelsFromSheet,
    isUntouched,
    localFromSheet,
    localKit,
    routeKit,
    routesFromSheet,
    marginExample,
    pickSheets,
    settingsProblem,
    templateSheets
} from './rateFacts'

const row = (extra = {}) => ({ ...blankHotelRow('Manali'), cpRate: '3000', ...extra })

describe('a hotel row', () => {
    test('a new row nobody typed in is untouched, not an error', () => {
        expect(isUntouched(blankHotelRow())).toBe(true)
        expect(isUntouched(blankHotelRow('Manali'))).toBe(false)
        expect(isUntouched(row({ id: 4 }))).toBe(false)
    })

    test('says what is wrong, one thing at a time', () => {
        expect(hotelRowProblem(row())).toBe('')
        expect(hotelRowProblem(row({ place: ' ' }))).toBe('Choose the place')
        expect(hotelRowProblem(row({ cpRate: '' }))).toBe('Enter at least one room rate')
        expect(hotelRowProblem(row({ cpRate: 'abc' }))).toBe('Breakfast (CP) must be an amount like 3500')
        expect(hotelRowProblem(row({ extraBedRate: '-5' }))).toBe('Extra bed must be an amount like 3500')
    })

    test('takes amounts typed with commas, spaces or a rupee sign', () => {
        expect(hotelRowProblem(row({ cpRate: '₹ 3,000' }))).toBe('')
        expect(hotelPayload(row({ cpRate: '₹ 3,000' })).cpRate).toBe('3000')
    })

    test('a season needs both dates, in order', () => {
        expect(hotelRowProblem(row({ validFrom: '2026-12-25' }))).toBe('A season needs a start and an end date')
        expect(hotelRowProblem(row({ validFrom: '2027-01-05', validTo: '2026-12-25' }))).toBe(
            'The season ends before it starts'
        )
        expect(hotelRowProblem(row({ validFrom: '2026-12-25', validTo: '2027-01-05' }))).toBe('')
    })

    test('sends only what is new or changed, and never an untouched row', () => {
        const original = [draftHotelRow({ id: 1, place: 'Manali', category: 'delux', cpRate: '3000.00', season: '' })]
        const same = original.map(item => ({ ...item }))
        const edited = original.map(item => ({ ...item, cpRate: '3200' }))
        const added = [...same, row({ place: 'Goa' }), blankHotelRow()]
        expect(changedHotelRows(same, original)).toEqual([])
        // ? "3000.00" from the server and "3000" typed are one amount, not an edit
        expect(
            changedHotelRows(
                original.map(item => ({ ...item, cpRate: '3000' })),
                original
            )
        ).toEqual([])
        expect(changedHotelRows(edited, original)).toHaveLength(1)
        expect(changedHotelRows(added, original).map(item => item.place)).toEqual(['Goa'])
    })

    test('flags the same place, category and dates twice — not a season beside the standard rate', () => {
        const first = row()
        const second = row({ place: ' manali ' })
        const season = row({ validFrom: '2026-12-25', validTo: '2027-01-05' })
        expect(duplicateHotelRows([first, second])).toEqual({
            [second.key]: 'manali Deluxe is already listed (standard rate)'
        })
        expect(duplicateHotelRows([first, season])).toEqual({})
        expect(duplicateHotelRows([first, row({ category: 'luxury' })])).toEqual({})
    })

    test('a copy starts as the same row but is a new one, so it can be saved as a season or another category', () => {
        const saved = draftHotelRow({ id: 7, place: 'Manali', category: 'luxury', cpRate: '6500.00', season: 'Peak' })
        const copy = copyHotelRow(saved)
        expect(copy).toMatchObject({ id: null, place: 'Manali', category: 'luxury', cpRate: '6500.00', season: 'Peak' })
        expect(copy.key).not.toBe(saved.key)
    })

    test('searches by place, category or season', () => {
        const rows = [row(), row({ place: 'Goa', category: 'luxury' }), row({ place: 'Shimla', season: 'New Year' })]
        expect(hotelRowsMatching(rows, 'goa')).toHaveLength(1)
        expect(hotelRowsMatching(rows, 'luxury')).toHaveLength(1)
        expect(hotelRowsMatching(rows, 'new year')).toHaveLength(1)
        expect(hotelRowsMatching(rows, '')).toHaveLength(3)
    })
})

describe('cab rows', () => {
    test('need a type and a rate above zero', () => {
        expect(cabRowProblem({ vehicle: 'Sedan', perDayRate: '3500' })).toBe('')
        expect(cabRowProblem({ vehicle: '', perDayRate: '3500' })).toMatch(/cab type/)
        expect(cabRowProblem({ vehicle: 'Sedan', perDayRate: '0' })).toMatch(/rate per day/)
    })

    test('sends only new or changed cabs, and flags one listed twice', () => {
        const original = [{ id: 1, vehicle: 'Sedan', perDayRate: '3500.00' }]
        const kept = [{ ...blankCabRow(), id: 1, vehicle: 'Sedan', perDayRate: '3500' }]
        expect(changedCabRows(kept, original)).toEqual([])
        expect(changedCabRows([{ ...kept[0], perDayRate: '3600' }, blankCabRow()], original)).toHaveLength(1)
        const twice = [
            { ...blankCabRow(), vehicle: 'Innova' },
            { ...blankCabRow(), vehicle: ' INNOVA ' }
        ]
        expect(Object.keys(duplicateCabRows(twice))).toEqual([twice[1].key])
    })
})

describe('the margin', () => {
    test('is a percentage, rounded to a whole number of rupees', () => {
        expect(settingsProblem({ defaultMarginPct: '15', roundTo: '100' })).toBe('')
        expect(settingsProblem({ defaultMarginPct: '', roundTo: 100 })).toMatch(/percentage/)
        expect(settingsProblem({ defaultMarginPct: -1, roundTo: 100 })).toMatch(/percentage/)
        expect(settingsProblem({ defaultMarginPct: 15, roundTo: 0 })).toMatch(/whole number/)
        expect(settingsProblem({ defaultMarginPct: 15, roundTo: 2.5 })).toMatch(/whole number/)
    })
})

describe('reading an Excel sheet', () => {
    test('reads the template’s own headers', () => {
        const sheets = templateSheets()
        const [header, ...lines] = sheets.Hotels
        const rows = lines.map(line => Object.fromEntries(header.map((name, index) => [name, line[index]])))
        const hotels = hotelsFromSheet(rows)
        expect(hotels).toHaveLength(3)
        expect(hotels[1]).toMatchObject({
            place: 'Manali',
            category: 'Deluxe',
            season: 'New Year',
            validFrom: '2026-12-25',
            cpRate: '5000',
            childRate: '900'
        })
        const [cabHeader, ...cabLines] = sheets.Cabs
        const cabs = cabsFromSheet(
            cabLines.map(line => Object.fromEntries(cabHeader.map((name, index) => [name, line[index]])))
        )
        expect(cabs).toEqual([
            { vehicle: 'Sedan', perDayRate: '3000' },
            { vehicle: 'Innova', perDayRate: '4000' }
        ])
    })

    test('reads headers worded another way, in any case', () => {
        const hotels = hotelsFromSheet([
            {
                DESTINATION: 'Kasol',
                'Hotel Category': 'Premium',
                'Room only': 2000,
                'Breakfast + Dinner': 3500,
                'Valid from': '25/12/2026',
                'Valid to': '05-01-2027'
            }
        ])
        expect(hotels[0]).toMatchObject({
            place: 'Kasol',
            category: 'Premium',
            epRate: '2000',
            mapRate: '3500',
            validFrom: '2026-12-25',
            validTo: '2027-01-05'
        })
    })

    test('skips empty rows and ignores columns it does not know', () => {
        expect(
            hotelsFromSheet([
                { Place: '', Category: '' },
                { Place: 'Goa', Category: 'Luxury', CP: 5000, Notes: 'x' }
            ])
        ).toHaveLength(1)
    })

    test('turns an Excel date number, a Date, or text into a day', () => {
        expect(excelDay(46381)).toBe('2026-12-25')
        expect(excelDay(new Date('2026-12-25T00:00:00Z'))).toBe('2026-12-25')
        expect(excelDay('2026-12-25')).toBe('2026-12-25')
        expect(excelDay('5/1/2027')).toBe('2027-01-05')
        expect(excelDay('soon')).toBe('')
        expect(excelDay(12)).toBe('')
        expect(excelDay('')).toBe('')
    })

    test('picks the hotels sheet and the cabs sheet by name', () => {
        expect(pickSheets(['Hotels', 'Cabs'])).toEqual({ hotels: 'Hotels', cabs: 'Cabs' })
        expect(pickSheets(['Sheet1'])).toEqual({ hotels: 'Sheet1', cabs: undefined })
        expect(pickSheets(['Vehicle rates', 'Room rates'])).toEqual({ hotels: 'Room rates', cabs: 'Vehicle rates' })
        expect(pickSheets(['Hotels', 'Cab routes', 'Cab days', 'Cabs'])).toEqual({
            hotels: 'Hotels',
            cabs: 'Cabs',
            routes: 'Cab routes',
            days: 'Cab days'
        })
    })

    test('reads the template’s cab route and cab day sheets, with seasons that come back every year', () => {
        const sheets = templateSheets()
        const asRows = ([header, ...lines]) =>
            lines.map(line => Object.fromEntries(header.map((name, index) => [name, line[index]])))
        const routes = routesFromSheet(asRows(sheets['Cab routes']))
        expect(routes).toHaveLength(3)
        expect(routes[0]).toMatchObject({
            vehicle: 'Sedan',
            fromPlace: 'Chandigarh',
            toPlace: 'Manali',
            rate: '5500',
            bothWays: true,
            repeatsYearly: false
        })
        expect(routes[1]).toMatchObject({
            season: 'New Year',
            validFrom: '2026-12-20',
            validTo: '2027-01-05',
            repeatsYearly: true
        })
        const days = localFromSheet(asRows(sheets['Cab days']))
        expect(days[0]).toMatchObject({ vehicle: 'Sedan', place: 'Manali', dayRate: '2500' })
        const hotels = hotelsFromSheet(asRows(sheets.Hotels))
        expect(hotels.map(item => item.repeatsYearly)).toEqual([false, true, false])
    })
    test('a route sheet that says No under both ways is one way', () => {
        const [route] = routesFromSheet([{ Vehicle: 'Sedan', From: 'A', To: 'B', Price: 100, 'Both ways': 'No' }])
        expect(route.bothWays).toBe(false)
    })
})

describe('the margin example', () => {
    test('works a ₹23,000 trip for two out: +15% = ₹26,450, ÷ 2 = ₹13,225, to the nearest ₹100 = ₹13,200', () => {
        expect(marginExample(15, 100)).toEqual({ cost: 23000, margin: 3450, total: 26450, perPerson: 13200 })
    })

    test('follows the rounding step and the margin the agent types', () => {
        expect(marginExample('20', 50)).toMatchObject({ margin: 4600, total: 27600, perPerson: 13800 })
        expect(marginExample(15, 1).perPerson).toBe(13225)
        expect(marginExample('', 100).margin).toBe(0)
    })
})

describe('a cab route row', () => {
    const drive = (extra = {}) => ({
        ...routeKit.blank(),
        vehicle: 'Sedan',
        fromPlace: 'Chandigarh',
        toPlace: 'Manali',
        rate: '5500',
        ...extra
    })

    test('a new row nobody typed in is untouched; a filled one is checked', () => {
        expect(routeKit.untouched(routeKit.blank())).toBe(true)
        expect(routeKit.problem(drive())).toBe('')
        expect(routeKit.problem(drive({ vehicle: '' }))).toMatch(/cab type/)
        expect(routeKit.problem(drive({ toPlace: 'chandigarh' }))).toMatch(/two different places/)
        expect(routeKit.problem(drive({ rate: '' }))).toMatch(/price/)
        expect(routeKit.problem(drive({ validFrom: '2026-12-20' }))).toMatch(/start and an end/)
        expect(routeKit.problem(drive({ repeatsYearly: true }))).toMatch(/needs its dates/)
    })
    test('a season over New Year is fine when it comes back every year, wrong when it does not', () => {
        const over = { validFrom: '2026-12-20', validTo: '2026-01-05' }
        expect(routeKit.problem(drive(over))).toMatch(/ends before it starts/)
        expect(routeKit.problem(drive({ ...over, repeatsYearly: true }))).toBe('')
    })
    test('the same drive twice is flagged, also the other way round when both ways', () => {
        const rows = [drive(), drive({ fromPlace: 'Manali', toPlace: 'Chandigarh' })]
        expect(Object.values(routeKit.duplicates(rows))).toEqual([
            'Sedan Manali to Chandigarh is already listed (standard rate)'
        ])
        const oneWay = [
            drive({ bothWays: false }),
            drive({ bothWays: false, fromPlace: 'Manali', toPlace: 'Chandigarh' })
        ]
        expect(routeKit.duplicates(oneWay)).toEqual({})
        const seasons = [drive(), drive({ validFrom: '2026-12-20', validTo: '2027-01-05', repeatsYearly: true })]
        expect(routeKit.duplicates(seasons)).toEqual({})
    })
    test('only rows that changed are sent, with the price as typed cleaned up', () => {
        const saved = { ...drive(), id: 4, key: 'route-4', rate: '5500.00' }
        expect(routeKit.changed([saved], [saved])).toEqual([])
        const edited = { ...saved, rate: '6,000' }
        expect(routeKit.changed([edited], [saved])).toEqual([edited])
        expect(routeKit.payload(edited)).toMatchObject({
            id: 4,
            vehicle: 'Sedan',
            rate: '6000',
            bothWays: true,
            repeatsYearly: false
        })
    })
})

describe('a cab local-day row', () => {
    test('is checked, and the same cab in the same place and dates twice is flagged', () => {
        const day = (extra = {}) => ({
            ...localKit.blank(),
            vehicle: 'Sedan',
            place: 'Manali',
            dayRate: '2500',
            ...extra
        })
        expect(localKit.problem(day())).toBe('')
        expect(localKit.problem(day({ place: '' }))).toMatch(/place/)
        expect(Object.values(localKit.duplicates([day(), day({ place: 'manali' })]))).toEqual([
            'Sedan in manali is already listed (standard rate)'
        ])
        expect(localKit.payload(day())).toMatchObject({ vehicle: 'Sedan', place: 'Manali', dayRate: '2500' })
    })
})

describe('ticket fares', () => {
    const fare = extra => ({
        ...ticketKit.blank(),
        mode: 'Volvo',
        fromPlace: 'Delhi',
        toPlace: 'Shimla',
        adultRate: '1,200',
        ...extra
    })

    test('needs a mode, two different places and an adult fare, and checks a child fare when there is one', () => {
        expect(ticketKit.problem(ticketKit.blank())).toMatch(/how they travel/)
        expect(ticketKit.problem(fare({ toPlace: 'delhi' }))).toMatch(/two different/)
        expect(ticketKit.problem(fare({ adultRate: '' }))).toMatch(/Enter the price/)
        expect(ticketKit.problem(fare({ childRate: 'half' }))).toMatch(/child fare/)
        expect(ticketKit.problem(fare())).toBe('')
        expect(ticketKit.problem(fare({ childRate: '600' }))).toBe('')
    })

    test('sends the fares as plain amounts, the child fare empty when there is none', () => {
        expect(ticketKit.payload(fare())).toMatchObject({
            mode: 'Volvo',
            adultRate: '1200',
            childRate: '',
            bothWays: true
        })
        expect(ticketKit.payload(fare({ childRate: '₹600' }))).toMatchObject({ childRate: '600' })
    })

    test('sees a changed child fare, and the same journey twice written the other way round', () => {
        const saved = { ...fare({ adultRate: '1200', childRate: '600' }), id: 5 }
        const edited = { ...saved, childRate: '700' }
        expect(ticketKit.changed([edited], [saved])).toEqual([edited])
        expect(ticketKit.changed([saved], [saved])).toEqual([])
        const twice = [fare(), fare({ fromPlace: 'Shimla', toPlace: 'Delhi' })]
        expect(Object.keys(ticketKit.duplicates(twice))).toEqual([twice[1].key])
        expect(ticketKit.copy(saved).childRate).toBe('600')
    })
})
