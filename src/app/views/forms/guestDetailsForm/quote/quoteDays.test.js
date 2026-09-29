import { describe, expect, test } from 'vitest'
import { dayDate, daysSummary, formatRupees, hotelList, reorderDays, stayBreakdown } from './quoteDays'

const day = (id, order, destination = 'Shimla', entryType = 'Stay') => ({
    destination,
    entryType,
    fullItem: { id, order, entryType }
})

describe('quote days', () => {
    test('nights are counted per place, in trip order; travel days break a stay', () => {
        const days = [
            day(1, 1, 'Shimla'),
            day(2, 2, 'Shimla'),
            day(3, 3, '', 'Transit'),
            day(4, 4, 'Manali'),
            day(5, 5, 'Manali'),
            day(6, 6, 'Manali')
        ]
        const stays = stayBreakdown(days)
        expect(stays).toEqual([
            { destination: 'Shimla', nights: 2 },
            { destination: 'Manali', nights: 3 }
        ])
        expect(daysSummary(days, stays)).toBe('6 days · 5 nights · Shimla 2N, Manali 3N')
    })

    test('hotel names are read from "A | B" or one per line', () => {
        expect(hotelList('Hotel A | Hotel B |  ')).toEqual(['Hotel A', 'Hotel B'])
        expect(hotelList('Hotel A\nHotel B')).toEqual(['Hotel A', 'Hotel B'])
        expect(hotelList(null)).toEqual([])
    })

    test('each day gets its date from the start date', () => {
        expect(dayDate('2026-10-05', 0)).toMatch(/5 Oct/)
        expect(dayDate('2026-10-30', 3)).toMatch(/2 Nov/)
        expect(dayDate('', 0)).toBe('')
    })

    test('moving a day swaps it with its neighbour, writing only what changed', () => {
        const days = [day(1, 1), day(2, 2), day(3, 3)]
        expect(reorderDays(days, 2, 'up')).toEqual([
            { day: days[2], order: 2 },
            { day: days[1], order: 3 }
        ])
        expect(reorderDays(days, 0, 'up')).toBeNull()
        expect(reorderDays(days, 2, 'down')).toBeNull()
    })

    test('gaps and ties in the stored order are repaired by the move', () => {
        const legacy = [day(1, 0), day(2, 0), day(3, 0)]
        const writes = reorderDays(legacy, 2, 'up')
        expect(writes.map(({ day: moved, order }) => [moved.fullItem.id, order])).toEqual([
            [1, 1],
            [3, 2],
            [2, 3]
        ])
        const gaps = [day(1, 1), day(2, 4), day(3, 9)]
        expect(reorderDays(gaps, 0, 'down').map(({ day: moved, order }) => [moved.fullItem.id, order])).toEqual([
            [2, 1],
            [1, 2],
            [3, 3]
        ])
    })

    test('rupees in the Indian format, nothing for an empty price', () => {
        expect(formatRupees('125000')).toBe('₹1,25,000')
        expect(formatRupees('')).toBe('')
        expect(formatRupees(null)).toBe('')
    })
})

describe('the campaign of a quote', () => {
    const quoteDay = (itenaryCampaign, destinationCampaign = itenaryCampaign) => ({
        fullItem: {
            itenary: itenaryCampaign ? { campaignId: itenaryCampaign } : null,
            destination: destinationCampaign ? { campaignId: destinationCampaign } : null
        }
    })

    test('the campaign most of its days come from; a tie goes to the lead’s', async () => {
        const { campaignOfDays } = await import('./quoteDays')
        expect(campaignOfDays([quoteDay(2), quoteDay(2), quoteDay(1)], 1)).toBe(2)
        expect(campaignOfDays([quoteDay(2), quoteDay(1)], 1)).toBe(1)
        expect(campaignOfDays([quoteDay(null, 3)], 1)).toBe(3)
        expect(campaignOfDays([], 1)).toBeNull()
    })
})
