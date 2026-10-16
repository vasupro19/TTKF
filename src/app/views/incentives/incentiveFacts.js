/**
 * Incentives: how the figures read. Pure — the incentive screens use these.
 */
import { money2 } from '../gst/gstFacts'

/** @description what a plan's rate is measured on, said under the rate box */
export const BASIS_HELP = Object.freeze({
    profit: 'Profit is the price without GST, less the booking’s costs; a booking with no cost yet earns nothing',
    sales: 'Sales are the price without GST',
    package: 'The same amount for every booking they convert'
})

/** @description "₹750 + ₹500 bonus" once the bonus is earned, else how many more packages earn it */
export const earnedNote = earned => {
    if (earned.bonusEarned) return `${money2(earned.base)} + ${money2(earned.bonus)} bonus`
    if (earned.packagesToBonus > 0) {
        return `${earned.packagesToBonus} more package${earned.packagesToBonus === 1 ? '' : 's'} for the bonus`
    }
    return ''
}

export const PLAN_FILTERS = Object.freeze([
    { value: 'has', label: 'Has a plan' },
    { value: 'none', label: 'No plan' },
    { value: 'bonus', label: 'Bonus earned' }
])

/** @description the team rows that match a person search (name or role) and the plan filter; the figures are not touched */
export const filterTeamRows = (rows, { q = '', plan = '' } = {}) => {
    const needle = String(q).trim().toLowerCase()
    return (rows || []).filter(row => {
        if (needle && !`${row.user?.name || ''} ${row.user?.role || ''}`.toLowerCase().includes(needle)) return false
        if (plan === 'has') return Boolean(row.plan)
        if (plan === 'none') return !row.plan
        if (plan === 'bonus') return Boolean(row.earned?.bonusEarned)
        return true
    })
}

/** @description the columns of the team table, with what each writes to CSV (a profit not known yet is left empty) */
export const TEAM_COLUMNS = Object.freeze([
    { key: 'person', label: 'Person', csv: row => row.user?.name || '' },
    { key: 'role', label: 'Role', csv: row => (row.user?.active ? row.user?.role || '' : 'No longer active') },
    { key: 'leads', label: 'Leads', csv: row => row.leads },
    { key: 'packages', label: 'Packages', csv: row => row.packages },
    { key: 'sales', label: 'Sales (no GST)', csv: row => Number(row.sales) || 0 },
    {
        key: 'profit',
        label: 'Profit',
        csv: row => (row.costPending || row.profit == null ? '' : Number(row.profit) || 0)
    },
    { key: 'plan', label: 'Plan', csv: row => row.plan?.summary || 'No plan' },
    { key: 'earned', label: 'Earned', csv: row => Number(row.earned?.total) || 0 }
])
