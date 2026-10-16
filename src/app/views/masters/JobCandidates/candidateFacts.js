export const CANDIDATE_STATUSES = ['Pending', 'Viewed', 'Call Scheduled', 'Selected', 'Rejected', 'Closed']

export const STATUS_FILTER = {
    key: 'status',
    label: 'Status',
    options: CANDIDATE_STATUSES.map(value => ({ value, label: value }))
}

export const statusColor = status =>
    ({
        Pending: 'warning',
        Viewed: 'info',
        'Call Scheduled': 'success',
        Selected: 'success',
        Rejected: 'error'
    })[status] || 'default'

// ? one row of the table from an applicant's row: the person's details sit on the application behind it
export const candidateRow = item => ({
    ...item,
    fullName: item.jobApplication?.fullName || '-',
    email: item.jobApplication?.email || '-',
    phone: item.jobApplication?.phone || '-',
    createdAt: item.jobApplication?.createdAt ? new Date(item.jobApplication.createdAt).toLocaleDateString() : '-'
})
