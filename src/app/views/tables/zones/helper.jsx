/* eslint-disable */
import StatusBadge from '@core/components/StatusBadge'

export const locations = [
    {
        id: 1,
        name: 'Zone A',
        code: 'ZA1001',
        status: <StatusBadge type='success' label='Available' />,
        createdBy: 'John Doe',
        createdAt: '01-11-2024 09:00',
        updatedBy: 'Jane Smith',
        updatedAt: '29-11-2024 04:30'
    },
    {
        id: 2,
        name: 'Zone B',
        code: 'ZB1002',
        status: <StatusBadge type='danger' label='# N/A' />,
        createdBy: 'Alice Johnson',
        createdAt: '10-11-2024 11:15',
        updatedBy: 'Michael Brown',
        updatedAt: '29-11-2024 05:15'
    },
    {
        id: 3,
        name: 'Zone C',
        code: 'ZC1003',
        status: <StatusBadge type='success' label='Available' />,
        createdBy: 'Emily Davis',
        createdAt: '20-11-2024 08:45',
        updatedBy: 'Chris Wilson',
        updatedAt: '29-11-2024 03:00'
    },
    {
        id: 4,
        name: 'Zone D',
        code: 'ZD1004',
        status: <StatusBadge type='danger' label='# N/A' />,
        createdBy: 'Anna Brown',
        createdAt: '25-11-2024 14:00',
        updatedBy: 'David Lee',
        updatedAt: '29-11-2024 02:45'
    },
    {
        id: 5,
        name: 'Zone E',
        code: 'ZE1005',
        status: <StatusBadge type='success' label='Available' />,
        createdBy: 'George Miller',
        createdAt: '14-11-2024 16:00',
        updatedBy: 'Jessica Taylor',
        updatedAt: '29-11-2024 01:30'
    },
    {
        id: 6,
        name: 'Zone F',
        code: 'ZF1006',
        status: <StatusBadge type='danger' label='# N/A' />,
        createdBy: 'Philip Carter',
        createdAt: '28-11-2024 10:30',
        updatedBy: 'Sarah Kim',
        updatedAt: '29-11-2024 04:00'
    },
    {
        id: 7,
        name: 'Zone G',
        code: 'ZG1007',
        status: <StatusBadge type='success' label='Available' />,
        createdBy: 'Linda Foster',
        createdAt: '15-11-2024 12:30',
        updatedBy: 'Anthony Parker',
        updatedAt: '29-11-2024 03:15'
    },
    {
        id: 8,
        name: 'Zone H',
        code: 'ZH1008',
        status: <StatusBadge type='danger' label='# N/A' />,
        createdBy: 'Barbara Reed',
        createdAt: '22-11-2024 09:00',
        updatedBy: 'William Turner',
        updatedAt: '29-11-2024 02:00'
    },
    {
        id: 9,
        name: 'Zone I',
        code: 'ZI1009',
        status: <StatusBadge type='success' label='Available' />,
        createdBy: 'David White',
        createdAt: '18-11-2024 11:45',
        updatedBy: 'Caroline Hall',
        updatedAt: '29-11-2024 01:15'
    },
    {
        id: 10,
        name: 'Zone J',
        code: 'ZJ1010',
        status: <StatusBadge type='danger' label='# N/A' />,
        createdBy: 'Natalie King',
        createdAt: '30-11-2024 08:15',
        updatedBy: 'Mark Wright',
        updatedAt: '29-11-2024 12:30'
    }
]

export const headers = [
    {
        id: 0,
        label: 'Sr. No.',
        search: false,
        sort: false,
        stick: false,
        key: 's_no',
        isFrontend: true,
        visible: true,
        minWidth: 3.1,
        maxWidth: 3.1
    },
    {
        id: 1,
        label: 'Name',
        search: true,
        sort: true,
        stick: false,
        key: 'name',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'Code',
        search: true,
        sort: true,
        stick: false,
        key: 'code',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Status',
        search: false,
        sort: false,
        stick: false,
        key: 'status',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 4,
        label: 'Created By',
        search: false,
        sort: false,
        stick: false,
        key: 'created_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 5,
        label: 'Created At',
        search: false,
        sort: true,
        stick: false,
        key: 'created_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'Modified By',
        search: false,
        sort: false,
        stick: false,
        key: 'modified_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 7,
        label: 'Modified At',
        search: false,
        sort: true,
        stick: false,
        key: 'modified_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]

export const STATUS_TYPE = {
    0: {
        label: '# N/A',
        color: 'danger'
    },
    1: {
        label: 'Available',
        color: 'success'
    }
}