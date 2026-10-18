import { describe, expect, test } from 'vitest'
import {
    bankIsLegacy,
    campaignPayload,
    campaignProblems,
    emptyBank,
    formFromCampaign,
    parseBank,
    parseList,
    serializeBank,
    serializeList
} from './campaignFormFacts'

const BANK_TEXT = [
    "Please deposit 50% advance in our company's account to confirm your trip.",
    'Account Name ----------The Travel Kart',
    'Bank Name ----------Central Bank of India',
    'Branch Name ----------Sanjauli',
    'Account No ----------5927396287',
    'Account Type ----------Current Account',
    'IFSC CODE ----------CBIN0285199'
].join('\n')

describe('lists', () => {
    test('are kept as numbered lines, the way the quotation reads them', () => {
        expect(serializeList(['Breakfast', 'All taxes'])).toBe('1. Breakfast\n2. All taxes')
    })

    test('blank items are dropped and an empty list is empty text', () => {
        expect(serializeList(['  ', 'Cab', ''])).toBe('1. Cab')
        expect(serializeList([''])).toBe('')
    })

    test('a saved list reads back as its items, with a line to type in when there is none', () => {
        expect(parseList('1. Breakfast\n2. All taxes')).toEqual(['Breakfast', 'All taxes'])
        expect(parseList('')).toEqual([''])
        expect(parseList(null)).toEqual([''])
        expect(parseList('10. Tenth')).toEqual(['Tenth'])
    })

    test('writing then reading gives the same items', () => {
        const items = ['Hotel check-in at 12:00 noon', '5 % GST']
        expect(parseList(serializeList(items))).toEqual(items)
    })
})

describe('bank details', () => {
    test('are kept exactly as the old form wrote them', () => {
        const bank = parseBank(BANK_TEXT)
        expect(bank).toEqual({
            accountName: 'The Travel Kart',
            bankName: 'Central Bank of India',
            branchName: 'Sanjauli',
            accountNo: '5927396287',
            accountType: 'Current Account',
            ifscCode: 'CBIN0285199'
        })
        expect(serializeBank(bank)).toBe(BANK_TEXT)
    })

    test('nothing filled in is nothing saved', () => {
        expect(serializeBank(emptyBank())).toBe('')
    })

    test('text the fields cannot read is recognised, so it is not wiped', () => {
        expect(bankIsLegacy('Pay to HDFC 1234 IFSC HDFC0001')).toBe(true)
        expect(bankIsLegacy(BANK_TEXT)).toBe(false)
        expect(bankIsLegacy('')).toBe(false)
    })
})

describe('the campaign as the server sees it', () => {
    test('a saved campaign loads into the form and saves back unchanged', () => {
        const row = {
            id: 4,
            title: 'Shimla Manali',
            description: 'Honeymoon',
            inclusions: '1. Breakfast\n2. Cab',
            exclusions: '1. Airfare',
            importantNote: '1. Carry ID',
            bankDetails: BANK_TEXT,
            active: true
        }
        expect(campaignPayload(formFromCampaign(row))).toEqual({
            title: 'Shimla Manali',
            description: 'Honeymoon',
            inclusions: row.inclusions,
            exclusions: row.exclusions,
            importantNote: row.importantNote,
            bankDetails: BANK_TEXT
        })
    })

    test('only the six editable fields are sent', () => {
        expect(
            Object.keys(campaignPayload(formFromCampaign({ title: 'Goa trip', description: 'Beach' }))).sort()
        ).toEqual(['bankDetails', 'description', 'exclusions', 'importantNote', 'inclusions', 'title'])
    })

    test('bank text in another layout is sent back untouched until the fields replace it', () => {
        const form = formFromCampaign({ title: 'Goa trip', description: 'Beach', bankDetails: 'Pay to HDFC 1234' })
        expect(form.legacyBank).toBe('Pay to HDFC 1234')
        expect(campaignPayload(form).bankDetails).toBe('Pay to HDFC 1234')
        const replaced = { ...form, bank: { ...emptyBank(), accountName: 'Acme' } }
        expect(campaignPayload(replaced).bankDetails).toContain('Account Name ----------Acme')
    })
})

describe('what must be filled in', () => {
    test('a title and a description of at least 3 characters', () => {
        expect(campaignProblems({ title: 'Goa', description: 'Sea' })).toEqual({})
        expect(campaignProblems({ title: ' ', description: '' })).toEqual({
            title: 'Title is required',
            description: 'Description is required'
        })
        expect(campaignProblems({ title: 'Go', description: 'Sea' }).title).toMatch(/3/)
    })
})
