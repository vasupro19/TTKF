export const headers = [
    {
        id: 0,
        label: 'Guest Name',
        search: true,
        sort: true,
        stick: true,
        key: 'guestName', // Matches the backend flat key
        visible: true,
        minWidth: 10,
        maxWidth: 15
    },
    {
        id: 1,
        label: 'Package Cost',
        search: true,
        key: 'sellingPrice',
        visible: true,
        minWidth: 8,
        maxWidth: 10
    },
    {
        id: 2,
        label: 'Hotel',
        search: true,
        key: 'hotelName', // Matches the backend flat key
        visible: true,
        minWidth: 10,
        maxWidth: 15
    },
    {
        id: 3,
        label: 'Transporter',
        search: true,
        key: 'transporterName', // Matches the backend flat key
        visible: true,
        minWidth: 10,
        maxWidth: 15
    },
    {
        id: 4,
        label: 'Status',
        search: true,
        key: 'status',
        visible: true,
        minWidth: 8,
        maxWidth: 10
    }
]

export default headers
