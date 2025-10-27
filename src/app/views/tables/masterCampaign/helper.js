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
        label: 'Campaign Title',
        search: true,
        sort: false,
        stick: true,
        key: 'title',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'Campaign Description',
        search: true,
        sort: false,
        stick: true,
        key: 'description',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]

export default headers
