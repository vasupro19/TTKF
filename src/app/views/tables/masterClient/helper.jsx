export const headers = [
    {
        id: 2,
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
        id: 0,
        label: 'Client Name',
        search: true,
        sort: true,
        stick: true,
        key: 'name',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 1,
        label: 'Email',
        search: true,
        sort: false,
        stick: true,
        key: 'email',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },

    {
        id: 3,
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
        id: 4,
        label: 'Phone Number',
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
        label: 'Address',
        search: true,
        sort: false,
        stick: false,
        key: 'address',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]

export default headers
