/* eslint-disable */
import StatusBadge from '@core/components/StatusBadge'

export const locations = [
    {
        id: 1,
        name: 'John Doe',
        role: 'Admin',
        status: <StatusBadge type='success' label='Active' />,
        contactNo: '+91 9876543210',
        email: 'john.doe@example.com',
        userId: 'USR001',
        createdBy: 'Alice Brown',
        createdAt: '14-11-2024 10:30'
    },
    {
        id: 2,
        name: 'Jane Smith',
        role: 'User',
        status: <StatusBadge type='danger' label='Inactive' />,
        contactNo: '+91 9876543221',
        email: 'jane.smith@example.com',
        userId: 'USR002',
        createdBy: 'Bob White',
        createdAt: '13-11-2024 16:50'
    },
    {
        id: 3,
        name: 'Michael Brown',
        role: 'Moderator',
        status: <StatusBadge type='warning' label='Pending' />,
        contactNo: '+91 9876543232',
        email: 'michael.brown@example.com',
        userId: 'USR003',
        createdBy: 'Charlie Black',
        createdAt: '12-11-2024 13:20'
    },
    {
        id: 4,
        name: 'Emily Davis',
        role: 'Tech Support',
        status: <StatusBadge type='success' label='Active' />,
        contactNo: '+91 9876543243',
        email: 'emily.davis@example.com',
        userId: 'USR004',
        createdBy: 'David Green',
        createdAt: '11-11-2024 09:10'
    },
    {
        id: 5,
        name: 'Chris Wilson',
        role: 'Super Admin',
        status: <StatusBadge type='success' label='Active' />,
        contactNo: '+91 9876543254',
        email: 'chris.wilson@example.com',
        userId: 'USR005',
        createdBy: 'Eva White',
        createdAt: '10-11-2024 08:55'
    },
    {
        id: 6,
        name: 'Sophia Johnson',
        role: 'User',
        status: <StatusBadge type='danger' label='Inactive' />,
        contactNo: '+91 9876543265',
        email: 'sophia.johnson@example.com',
        userId: 'USR006',
        createdBy: 'Frank Black',
        createdAt: '09-11-2024 12:25'
    },
    {
        id: 7,
        name: 'Daniel Martinez',
        role: 'Admin',
        status: <StatusBadge type='success' label='Active' />,
        contactNo: '+91 9876543276',
        email: 'daniel.martinez@example.com',
        userId: 'USR007',
        createdBy: 'Grace Green',
        createdAt: '08-11-2024 17:40'
    },
    {
        id: 8,
        name: 'Olivia Garcia',
        role: 'Tech Support',
        status: <StatusBadge type='warning' label='Pending' />,
        contactNo: '+91 9876543287',
        email: 'olivia.garcia@example.com',
        userId: 'USR008',
        createdBy: 'Hannah Red',
        createdAt: '07-11-2024 14:15'
    },
    {
        id: 9,
        name: 'Liam Miller',
        role: 'Super Admin',
        status: <StatusBadge type='success' label='Active' />,
        contactNo: '+91 9876543298',
        email: 'liam.miller@example.com',
        userId: 'USR009',
        createdBy: 'Isaac Blue',
        createdAt: '06-11-2024 11:35'
    },
    {
        id: 10,
        name: 'Ava White',
        role: 'Moderator',
        status: <StatusBadge type='danger' label='Inactive' />,
        contactNo: '+91 9876543219',
        email: 'ava.white@example.com',
        userId: 'USR010',
        createdBy: 'Jack Yellow',
        createdAt: '05-11-2024 10:05'
    },
    {
        id: 11,
        name: 'Ethan Harris',
        role: 'User',
        status: <StatusBadge type='success' label='Active' />,
        contactNo: '+91 9876543220',
        email: 'ethan.harris@example.com',
        userId: 'USR011',
        createdBy: 'Kathy Pink',
        createdAt: '04-11-2024 13:50'
    },
    {
        id: 12,
        name: 'Isabella Lee',
        role: 'Admin',
        status: <StatusBadge type='warning' label='Pending' />,
        contactNo: '+91 9876543231',
        email: 'isabella.lee@example.com',
        userId: 'USR012',
        createdBy: 'Liam Brown',
        createdAt: '03-11-2024 15:30'
    }
]

export const headers = [
    {
        id: 0,
        label: 'Sr. No',
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
    // {
    //     id: 1,
    //     label: 'role_id',
    //     search: false,
    //     sort: false,
    //     stick: false,
    //     key: 'role_id',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    {
        id: 10,
        label: 'Name',
        search: true,
        sort: false,
        stick: true,
        key: 'name',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
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
        label: 'Contact No',
        search: true,
        sort: false,
        stick: false,
        key: 'phoneNumber',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 5,
        label: 'Email',
        search: true,
        sort: false,
        stick: false,
        key: 'email',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }

    // {
    //     id: 7,
    //     label: 'user_id',
    //     search: false,
    //     sort: false,
    //     stick: false,
    //     key: 'user_id',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
]
