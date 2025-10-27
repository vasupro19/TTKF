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
        label: 'Destination Name',
        search: true,
        sort: false,
        stick: true,
        key: 'name',
        visible: true,
        minWidth: 10,
        maxWidth: 15
    },
    {
        id: 2,
        label: 'Campaign ID',
        search: true,
        sort: false,
        stick: true,
        key: 'campaignId',
        visible: true,
        minWidth: 6,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Delux Hotel',
        search: false,
        sort: false,
        stick: false,
        key: 'delux_hotel',
        visible: true,
        minWidth: 12,
        maxWidth: 20
    },
    {
        id: 4,
        label: 'Super Delux Hotel',
        search: false,
        sort: false,
        stick: false,
        key: 'super_delux_hotel',
        visible: true,
        minWidth: 12,
        maxWidth: 20
    },
    {
        id: 5,
        label: 'Luxury Hotel',
        search: false,
        sort: false,
        stick: false,
        key: 'luxury_hotel',
        visible: true,
        minWidth: 12,
        maxWidth: 20
    },
    {
        id: 6,
        label: 'Premium Hotel',
        search: false,
        sort: false,
        stick: false,
        key: 'premium_hotel',
        visible: true,
        minWidth: 12,
        maxWidth: 20
    }
]

export default headers
