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
        label: 'Package Name',
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
        label: 'Campaign',
        search: false,
        sort: false,
        stick: false,
        key: 'campaignTitle',
        visible: true,
        minWidth: 12,
        maxWidth: 20
    }
]

export default headers
