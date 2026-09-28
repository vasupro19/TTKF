import { describe, expect, test } from 'vitest'
import { buildHotelRequest, parseHotelReply } from './hotelSuggestions'

const reply = body => ({ content: [{ text: JSON.stringify(body) }] })

describe('hotel suggestions', () => {
    test('asks for one destination, by name', () => {
        const request = buildHotelRequest('  Manali ')
        expect(JSON.parse(request.messages[0].content)).toEqual({ destination: 'Manali' })
        expect(request.system).toMatch(/Never invent or guess a name/)
    })

    test('each category becomes “A | B | C | D”, at most four, names only', () => {
        const { hotels, count } = parseHotelReply(
            reply({
                destination: 'Jaipur',
                delux: [
                    { name: '1. Hotel Pearl Palace', town: 'Jaipur' },
                    { name: 'Hotel Arya Niwas — budget heritage stay', town: 'Jaipur' },
                    { name: 'Nahargarh Haveli (3-star)', town: 'Jaipur' },
                    { name: 'Umaid Bhawan', town: 'Jaipur' },
                    { name: 'Shahpura House', town: 'Jaipur' }
                ],
                luxury: [{ name: 'Rambagh Palace', town: 'Jaipur' }]
            }),
            'Jaipur'
        )
        expect(hotels.delux_hotel).toBe('Hotel Pearl Palace | Hotel Arya Niwas | Nahargarh Haveli | Umaid Bhawan')
        expect(hotels.luxury_hotel).toBe('Rambagh Palace')
        expect(hotels.super_delux_hotel).toBe('')
        expect(count).toBe(5)
    })

    test('a hotel the model places in another town is dropped', () => {
        const { hotels } = parseHotelReply(
            reply({
                premium: [
                    { name: 'JW Marriott Walnut Grove', town: 'Mussoorie' },
                    { name: 'Taj Lake Palace', town: 'Udaipur' },
                    { name: 'The Himalayan', town: 'Manali' }
                ]
            }),
            'Manali'
        )
        expect(hotels.premium_hotel).toBe('The Himalayan')
    })

    test('the same hotel under two spellings is kept once, in its first category', () => {
        const { hotels } = parseHotelReply(
            reply({
                luxury: [{ name: 'The Span Resort & Spa', town: 'Manali' }],
                premium: [
                    { name: 'Span Resort and Spa', town: 'Manali' },
                    { name: 'The Anantmaya Resort', town: 'Manali' }
                ]
            }),
            'Manali'
        )
        expect(hotels.luxury_hotel).toBe('The Span Resort & Spa')
        expect(hotels.premium_hotel).toBe('The Anantmaya Resort')
    })

    test('an unreadable or empty reply gives empty fields, never a made-up hotel', () => {
        expect(parseHotelReply({ content: [{ text: 'not json' }] }, 'Manali').count).toBe(0)
        expect(parseHotelReply(reply({ delux: [], premium: [] }), 'Xyzabad').hotels).toEqual({
            delux_hotel: '',
            super_delux_hotel: '',
            luxury_hotel: '',
            premium_hotel: ''
        })
    })
})
