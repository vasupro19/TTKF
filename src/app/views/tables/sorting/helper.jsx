export const headers = [
    {
        id: 0,
        label: 'S. No.',
        search: false,
        sort: false,
        stick: true,
        key: 's_no',
        isFrontend: true,
        visible: true,
        minWidth: 3.1,
        maxWidth: 3.1
    },
    {
        id: 1,
        label: 'Putwall ID',
        search: true,
        sort: true,
        key: 'putwallId',
        visible: true,
        stick: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'Status',
        search: false,
        sort: false,
        filter: true,
        options: ['Empty', 'In Progress', 'Complete'],
        key: 'status',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Order No.',
        search: true,
        sort: true,
        key: 'order_no',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 4,
        label: 'Channel',
        search: true,
        sort: true,
        key: 'channel',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 5,
        label: 'Picked Qty',
        search: true,
        align: 'center',
        sort: true,
        key: 'picked_quantity',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'Sorted Qty',
        search: true,
        align: 'center',
        sort: true,
        key: 'sorted_quantity',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 7,
        label: 'Created at',
        search: true,
        sort: true,
        key: 'created_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 8,
        label: 'Created By',
        search: true,
        sort: true,
        key: 'created_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]
export const locations = [
    {
        id: 1,
        putwallId: 'PI509598587',
        status: 'Complete',
        orderNo: 'ORD0987876',
        channel: 'Flipkart',
        pickedQty: 10,
        sortedQty: 10,
        createdAt: '2024-07-01 14:20:14',
        createdBy: 'Rizwan'
    },
    {
        id: 2,
        putwallId: 'PI459845957',
        status: 'In Progress',
        orderNo: 'ORD0987888',
        channel: 'Amazon',
        pickedQty: 5,
        sortedQty: 4,
        createdAt: '2024-07-01 14:25:10',
        createdBy: 'Pankaj'
    },
    {
        id: 3,
        putwallId: 'PI459845967',
        status: 'Complete',
        orderNo: 'ORD0987890',
        channel: 'Myntra',
        pickedQty: 5,
        sortedQty: 5,
        createdAt: '2024-07-01 14:30:12',
        createdBy: 'Kaushik'
    },
    {
        id: 4,
        putwallId: 'PI459845986',
        status: 'In Progress',
        orderNo: 'ORD0987892',
        channel: 'Flipkart',
        pickedQty: 8,
        sortedQty: 6,
        createdAt: '2024-07-01 14:33:10',
        createdBy: 'Ishaan'
    },
    {
        id: 5,
        putwallId: 'PI459845980',
        status: 'Complete',
        orderNo: 'ORD0987894',
        channel: 'Amazon',
        pickedQty: 5,
        sortedQty: 5,
        createdAt: '2024-07-01 14:36:18',
        createdBy: 'Younis'
    },
    {
        id: 6,
        putwallId: 'PI459845990',
        status: 'Empty',
        orderNo: '',
        channel: '',
        pickedQty: 0,
        sortedQty: 0,
        createdAt: '2024-07-01 14:40:00',
        createdBy: 'Rizwan'
    },
    {
        id: 7,
        putwallId: 'PI459846001',
        status: 'Complete',
        orderNo: 'ORD0987897',
        channel: 'Myntra',
        pickedQty: 6,
        sortedQty: 6,
        createdAt: '2024-07-01 14:45:05',
        createdBy: 'Arjun'
    },
    {
        id: 8,
        putwallId: 'PI459846002',
        status: 'In Progress',
        orderNo: 'ORD0987898',
        channel: 'Amazon',
        pickedQty: 3,
        sortedQty: 2,
        createdAt: '2024-07-01 14:50:14',
        createdBy: 'Deepak'
    },
    {
        id: 9,
        putwallId: 'PI459846003',
        status: 'Complete',
        orderNo: 'ORD0987899',
        channel: 'Flipkart',
        pickedQty: 7,
        sortedQty: 7,
        createdAt: '2024-07-01 14:53:21',
        createdBy: 'Meena'
    },
    {
        id: 10,
        putwallId: 'PI459846004',
        status: 'Empty',
        orderNo: '',
        channel: '',
        pickedQty: 0,
        sortedQty: 0,
        createdAt: '2024-07-01 14:56:45',
        createdBy: 'Sahil'
    },
    {
        id: 11,
        putwallId: 'PI459846005',
        status: 'Complete',
        orderNo: 'ORD0987901',
        channel: 'Amazon',
        pickedQty: 12,
        sortedQty: 12,
        createdAt: '2024-07-01 15:00:00',
        createdBy: 'Ritika'
    },
    {
        id: 12,
        putwallId: 'PI459846006',
        status: 'In Progress',
        orderNo: 'ORD0987902',
        channel: 'Myntra',
        pickedQty: 4,
        sortedQty: 3,
        createdAt: '2024-07-01 15:03:12',
        createdBy: 'Karan'
    }
]
