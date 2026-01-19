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
        label: 'Name',
        search: true,
        sort: false,
        stick: true,
        key: 'fullName',
        visible: true,
        minWidth: 10,
        maxWidth: 15
    },
    {
        id: 2,
        label: 'Email',
        search: true,
        sort: false,
        stick: true,
        key: 'senderEmail',
        visible: true,
        minWidth: 6,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Phone',
        search: false,
        sort: false,
        stick: false,
        key: 'phone',
        visible: true,
        minWidth: 12,
        maxWidth: 20
    },
    {
        id: 4,
        label: 'Source',
        search: false,
        sort: false,
        stick: false,
        key: 'leadSource',
        visible: true,
        minWidth: 12,
        maxWidth: 20
    },
    {
        id: 5,
        label: 'Campaign',
        search: false,
        sort: false,
        stick: false,
        key: 'campaignName',
        visible: true,
        minWidth: 12,
        maxWidth: 20
    },
    {
        id: 6,
        label: 'Assigned To',
        search: false,
        sort: false,
        stick: false,
        key: 'assignedTo',
        visible: true,
        minWidth: 12,
        maxWidth: 20
    },

    {
        id: 7,
        label: 'Created At',
        search: false,
        sort: false,
        stick: false,
        key: 'createdAt',
        visible: true,
        minWidth: 12,
        maxWidth: 20
    }
]

export default headers
