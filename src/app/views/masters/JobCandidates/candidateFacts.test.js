import { describe, expect, it } from 'vitest'
import { CANDIDATE_STATUSES, STATUS_FILTER, candidateRow, statusColor } from './candidateFacts'

describe('candidateFacts', () => {
    it('offers every status the review screen can set', () => {
        expect(STATUS_FILTER.options.map(o => o.value)).toEqual(CANDIDATE_STATUSES)
    })
    it('colours statuses, with a neutral default', () => {
        expect(statusColor('Rejected')).toBe('error')
        expect(statusColor('Closed')).toBe('default')
    })
    it('flattens the applicant onto the row', () => {
        const row = candidateRow({ id: 1, jobApplication: { fullName: 'Asha', email: 'a@x.in', phone: '99' } })
        expect(row).toMatchObject({ fullName: 'Asha', email: 'a@x.in', phone: '99', createdAt: '-' })
        expect(candidateRow({ id: 2 }).fullName).toBe('-')
    })
})
