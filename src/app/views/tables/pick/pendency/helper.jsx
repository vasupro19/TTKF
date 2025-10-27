// eslint-disable-next-line import/prefer-default-export
export const headers = [
    {
        id: 999,
        label: 'Sr. No.',
        key: 's_no',
        isFrontend: true,
        search: false,
        sort: false,
        stick: true,
        visible: true,
        minWidth: 3.25,
        maxWidth: 3.25
    },
    {
        id: 0,
        label: 'Picklist ID',
        key: 'picklist_no',
        search: true,
        sort: true,
        stick: true,
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 1,
        label: 'Ref No',
        key: 'ref_no',
        search: true,
        sort: true,
        stick: true,
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    // {
    //     id: 3,
    //     label: 'Status',
    //     key: 'status',
    //     search: true,
    //     sort: true,
    //     filter: true,
    //     options: ['Open', 'In Progress', 'Part Picked', 'Complete', 'Assigned'],
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    {
        id: 3,
        label: 'Order Count',
        key: 'order_count',
        align: 'center',
        search: true,
        sort: true,
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'Pick Type',
        key: 'pick_type',
        search: true,
        sort: true,
        filter: true,
        options: ['Order', 'Batch'],
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 80,
        label: 'SLA (No of Hours)',
        search: false,
        sort: false,
        filter: true,
        options: ['0-2 hrs', '2-4 hrs', '4-10 hrs', '10-24hr', '24hr+', 'SLA Breached'],
        key: 'sla',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    { id: 70, label: 'Channel', key: 'channel', search: true, sort: true, visible: true, minWidth: 8, maxWidth: 8 },
    {
        id: 4,
        label: 'Order Qty',
        key: 'expected_quantity',
        align: 'center',
        search: true,
        sort: true,
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 5,
        label: 'Order Picked Qty',
        key: 'picked_quantity',
        align: 'center',
        search: true,
        sort: true,
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'Created By',
        key: 'created_by',
        search: true,
        sort: true,
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    { id: 7, label: 'Created At', key: 'created_at', search: true, sort: true, visible: true, minWidth: 8, maxWidth: 8 }
]
