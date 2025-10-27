/* eslint-disable */
import StatusBadge from '@core/components/StatusBadge'

export const locations = [
    {
        id: 1,
        job_id: 'JOB001',
        progress_bar: '50%',
        status: 'In Progress',
        created_by: 'John Doe',
        created_at: '20-01-2025 09:00',
        assigned_to: 'Jane Smith',
        no_of_bins: 5,
        total_qty: 100,
        pending_qty: 50,
        started_at: '20-01-2025 09:15',
        completed_at: ''
    },
    {
        id: 2,
        job_id: 'JOB002',
        progress_bar: '30%',
        status: 'In Progress',
        created_by: 'Jane Smith',
        created_at: '21-01-2025 11:00',
        assigned_to: 'Alice Brown',
        no_of_bins: 3,
        total_qty: 70,
        pending_qty: 49,
        started_at: '21-01-2025 11:20',
        completed_at: ''
    },
    {
        id: 3,
        job_id: 'JOB003',
        progress_bar: '70%',
        status: 'Part Completed',
        created_by: 'Alice Brown',
        created_at: '22-01-2025 12:00',
        assigned_to: 'Bob Green',
        no_of_bins: 4,
        total_qty: 80,
        pending_qty: 24,
        started_at: '22-01-2025 12:30',
        completed_at: '22-01-2025 13:00'
    },
    {
        id: 4,
        job_id: 'JOB004',
        progress_bar: '90%',
        status: 'In Progress',
        created_by: 'Bob Green',
        created_at: '23-01-2025 13:00',
        assigned_to: 'Chris White',
        no_of_bins: 6,
        total_qty: 120,
        pending_qty: 12,
        started_at: '23-01-2025 13:15',
        completed_at: ''
    },
    {
        id: 5,
        job_id: 'JOB005',
        progress_bar: '100%',
        status: 'Completed',
        created_by: 'Chris White',
        created_at: '24-01-2025 14:00',
        assigned_to: 'Dana Black',
        no_of_bins: 2,
        total_qty: 50,
        pending_qty: 0,
        started_at: '24-01-2025 14:30',
        completed_at: '24-01-2025 15:00'
    },
    {
        id: 6,
        job_id: 'JOB006',
        progress_bar: '20%',
        status: 'Open',
        created_by: 'Dana Black',
        created_at: '25-01-2025 15:00',
        assigned_to: 'Evan Grey',
        no_of_bins: 3,
        total_qty: 90,
        pending_qty: 72,
        started_at: '25-01-2025 15:20',
        completed_at: ''
    },
    {
        id: 7,
        job_id: 'JOB007',
        progress_bar: '80%',
        status: 'In Progress',
        created_by: 'Evan Grey',
        created_at: '26-01-2025 16:00',
        assigned_to: 'Fiona Blue',
        no_of_bins: 7,
        total_qty: 140,
        pending_qty: 28,
        started_at: '26-01-2025 16:30',
        completed_at: ''
    },
    {
        id: 8,
        job_id: 'JOB008',
        progress_bar: '60%',
        status: 'Part Completed',
        created_by: 'Fiona Blue',
        created_at: '27-01-2025 17:30',
        assigned_to: 'George Red',
        no_of_bins: 4,
        total_qty: 100,
        pending_qty: 40,
        started_at: '27-01-2025 18:00',
        completed_at: '27-01-2025 18:45'
    },
    {
        id: 9,
        job_id: 'JOB009',
        progress_bar: '10%',
        status: 'Open',
        created_by: 'George Red',
        created_at: '28-01-2025 18:45',
        assigned_to: 'Hannah Violet',
        no_of_bins: 5,
        total_qty: 150,
        pending_qty: 135,
        started_at: '28-01-2025 19:15',
        completed_at: ''
    },
    {
        id: 10,
        job_id: 'JOB010',
        progress_bar: '0%',
        status: 'Discarded',
        created_by: 'Hannah Violet',
        created_at: '29-01-2025 20:00',
        assigned_to: 'John Doe',
        no_of_bins: 6,
        total_qty: 200,
        pending_qty: 200,
        started_at: '29-01-2025 20:30',
        completed_at: '29-01-2025 21:00'
    }
]

/* Updated ArrowButton Styling Logic */
export const getStatusVariant = (status) => {
    switch (status) {
        case 'Completed': return 'green'
        case 'Open': return 'blue'
        case 'Discarded': return 'red'
        case 'In Progress': return 'orange'
        case 'Part Completed': return 'purple'
        default: return 'gray'
    }
}

export const headers = [
    {
        id: 0,
        label: 'Sr. No.',
        search: false,
        sort: false,
        stick: true,
        key: 's_no',
        isFrontend: true,
        visible: true,
        minWidth: 3.1,
        align: 'center'
    },
    {
        id: 1,
        label: 'Job ID',
        search: true,
        sort: true,
        stick: true,
        key: 'job_id',
        visible: true,
        minWidth: 8
    },
    {
        id: 2,
        label: 'Progress Bar',
        search: false,
        sort: true,
        stick: true,
        key: 'progress_bar',
        visible: true,
        minWidth: 8
    },
    {
        id: 3,
        label: 'Status',
        search: false,
        sort: false,
        filter: true,
        options: ['In Progress', 'Part Completed', 'Open', 'Discarded',],
        stick: true,
        key: 'status',
        visible: true,
        minWidth: 8
    },
    {
        id: 4,
        label: 'Assigned To',
        search: true,
        sort: true,
        stick: false,
        key: 'assigned_to',
        visible: true,
        minWidth: 8
    },
    {
        id: 5,
        label: 'Created By',
        search: true,
        sort: true,
        stick: false,
        key: 'created_by',
        visible: true,
        minWidth: 8
    },
    {
        id: 6,
        label: 'Created At',
        search: true,
        sort: true,
        stick: false,
        key: 'created_at',
        visible: true,
        minWidth: 8
    },
    {
        id: 7,
        label: 'No. of Bins',
        search: true,
        sort: true,
        stick: false,
        key: 'no_of_bins',
        visible: true,
        minWidth: 8
    },
    {
        id: 8,
        label: 'Total Qty',
        search: true,
        sort: true,
        stick: false,
        key: 'total_qty',
        visible: true,
        minWidth: 8
    },
    {
        id: 9,
        label: 'Pending Qty',
        search: true,
        sort: true,
        stick: false,
        key: 'pending_qty',
        visible: true,
        minWidth: 8
    },
    {
        id: 10,
        label: 'Started At',
        search: true,
        sort: true,
        stick: false,
        key: 'started_at',
        visible: true,
        minWidth: 8
    },
    {
        id: 11,
        label: 'Completed At',
        search: true,
        sort: true,
        stick: false,
        key: 'completed_at',
        visible: true,
        minWidth: 8
    }
]


export const STATUS_TYPE = {
    'WIP': {
        label: 'WIP',
        color: 'info'
    },
    'Completed': {
        label: 'Completed',
        color: 'success'
    }
}
