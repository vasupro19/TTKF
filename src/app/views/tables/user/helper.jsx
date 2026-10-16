import StatusBadge from '@core/components/StatusBadge'

// ? a user's row for the table: the role by name (a user whose role was removed still shows), the status as a badge
export const userRows = rows =>
    (rows || []).map(item => ({
        ...item,
        status: <StatusBadge type={item.active ? 'success' : 'error'} label={item.active ? 'Active' : 'Inactive'} />,
        role: item.role?.name || 'No role',
        created: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : ''
    }))

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
        csv: row => (row.active ? 'Active' : 'Inactive'),
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
    },
    {
        id: 6,
        label: 'Created',
        search: false,
        sort: false,
        stick: false,
        key: 'created',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]
