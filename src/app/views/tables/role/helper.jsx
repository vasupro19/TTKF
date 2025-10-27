/* eslint-disable */
import StatusBadge from '@core/components/StatusBadge'

export const locations = [
    {
        id: 1,
        role: 'Tech Support',
        status: <StatusBadge type='success' label='Active' />,
        createdBy: 'Pankaj Singh',
        createdAt: '26-06-2024 14:40',
        updatedBy: 'Pankaj Singh',
        updatedAt: '26-06-2024 14:40'
    },
    {
        id: 2,
        role: 'Super Admin',
        status: <StatusBadge type='success' label='Active' />,
        createdBy: 'Pankaj Singh',
        createdAt: '26-06-2024 14:40',
        updatedBy: 'Pankaj Singh',
        updatedAt: '26-06-2024 14:40'
    },
    {
        id: 3,
        role: 'Warehouse Manager',
        status: <StatusBadge type='success' label='Active' />,
        createdBy: 'Pankaj Singh',
        createdAt: '26-06-2024 14:40',
        updatedBy: 'Pankaj Singh',
        updatedAt: '26-06-2024 14:40'
    },
    {
        id: 4,
        role: 'Supervisor',
        status: <StatusBadge type='success' label='Active' />,
        createdBy: 'Pankaj Singh',
        createdAt: '26-06-2024 14:40',
        updatedBy: 'Pankaj Singh',
        updatedAt: '26-06-2024 14:40'
    },
    {
        id: 5,
        role: 'Operator',
        status: <StatusBadge type='success' label='Active' />,
        createdBy: 'Pankaj Singh',
        createdAt: '26-06-2024 14:40',
        updatedBy: 'Pankaj Singh',
        updatedAt: '26-06-2024 14:40'
    },
    {
        id: 6,
        role: 'Picker',
        status: <StatusBadge type='success' label='Active' />,
        createdBy: 'Pankaj Singh',
        createdAt: '26-06-2024 14:40',
        updatedBy: 'Pankaj Singh',
        updatedAt: '26-06-2024 14:40'
    },
    {
        id: 7,
        role: 'Packer',
        status: <StatusBadge type='danger' label='Deactivated' />,
        createdBy: 'Pankaj Singh',
        createdAt: '26-06-2024 14:40',
        updatedBy: 'Ishaan Tiwari',
        updatedAt: '08-11-2024 11:24'
    },
    {
        id: 8,
        role: 'Inventory Manager',
        status: <StatusBadge type='success' label='Active' />,
        createdBy: 'Amit Kumar',
        createdAt: '15-07-2024 10:20',
        updatedBy: 'Amit Kumar',
        updatedAt: '15-07-2024 10:20'
    },
    {
        id: 9,
        role: 'Quality Inspector',
        status: <StatusBadge type='success' label='Active' />,
        createdBy: 'Suman Rathi',
        createdAt: '18-08-2024 12:30',
        updatedBy: 'Suman Rathi',
        updatedAt: '18-08-2024 12:30'
    },
    {
        id: 10,
        role: 'Logistics Coordinator',
        status: <StatusBadge type='danger' label='Deactivated' />,
        createdBy: 'Rajesh Patel',
        createdAt: '22-09-2024 09:50',
        updatedBy: 'Rajesh Patel',
        updatedAt: '22-09-2024 09:50'
    }
]

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
        maxWidth: 3.1,
        align: 'center'
    },
    {
        id: 1,
        label: 'Role',
        search: true,
        sort: false,
        stick: true,
        key: 'role',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'Status',
        search: false,
        sort: false,
        stick: false,
        key: 'status',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    // {
    //     id: 3,
    //     label: 'role_menu_status',
    //     search: false,
    //     sort: false,
    //     stick: true,
    //     key: 'role_menu_status',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    {
        id: 4,
        label: 'Created By',
        search: true,
        sort: true,
        stick: false,
        key: 'created_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'Created At',
        search: true,
        sort: false,
        stick: false,
        key: 'created_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 5,
        label: 'Modified By',
        search: true,
        sort: false,
        stick: false,
        key: 'modified_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]
