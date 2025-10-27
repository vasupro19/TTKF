export const locations = [
    {
        id: 1,
        orderNo: '#NAV1869',
        quantity: 6,
        channel: 'Myntra',
        status: 'Confirmed',
        customer: 'SUBASRI. S',
        locations: 3,
        sla: 4,
        courier: 'eKart'
    },
    {
        id: 2,
        orderNo: '#NAV1855',
        quantity: 4,
        channel: 'Amazon',
        status: 'Part Picked',
        customer: 'ANJU JAIN',
        locations: 2,
        sla: 3,
        courier: 'Delhivery'
    },
    {
        id: 3,
        orderNo: '#NAV1846',
        quantity: 3,
        channel: 'Amazon',
        status: 'Confirmed',
        customer: 'SENTHILNATHAN R',
        locations: 1,
        sla: 3,
        courier: 'Amazon'
    },
    {
        id: 4,
        orderNo: '#NAV1833',
        quantity: 5,
        channel: 'Flipkart',
        status: 'Confirmed',
        customer: 'RAVI KUMAR',
        locations: 2,
        sla: 4,
        courier: 'BlueDart'
    },
    {
        id: 5,
        orderNo: '#NAV1829',
        quantity: 8,
        channel: 'Myntra',
        status: 'Part Picked',
        customer: 'PRIYA SHARMA',
        locations: 3,
        sla: 5,
        courier: 'eKart'
    },
    {
        id: 6,
        orderNo: '#NAV1822',
        quantity: 2,
        channel: 'Amazon',
        status: 'Confirmed',
        customer: 'VIKAS MEHTA',
        locations: 1,
        sla: 2,
        courier: 'Amazon'
    },
    {
        id: 7,
        orderNo: '#NAV1815',
        quantity: 7,
        channel: 'Flipkart',
        status: 'Confirmed',
        customer: 'SUNIL YADAV',
        locations: 2,
        sla: -3,
        courier: 'Delhivery'
    },
    {
        id: 8,
        orderNo: '#NAV1809',
        quantity: 10,
        channel: 'Myntra',
        status: 'Confirmed',
        customer: 'NEHA AGARWAL',
        locations: 4,
        sla: 6,
        courier: 'eKart'
    },
    {
        id: 9,
        orderNo: '#NAV1803',
        quantity: 1,
        channel: 'Amazon',
        status: 'Part Picked',
        customer: 'RAHUL SINGH',
        locations: 1,
        sla: 2,
        courier: 'Amazon'
    },
    {
        id: 10,
        orderNo: '#NAV1797',
        quantity: 9,
        channel: 'Flipkart',
        status: 'Confirmed',
        customer: 'KAVITA VERMA',
        locations: 3,
        sla: 5,
        courier: 'BlueDart'
    }
]

export const headers = [
    {
        id: 1,
        label: 'Sr No',
        search: false,
        sort: false,
        key: 's_no',
        visible: true,
        stick: true,
        isFrontend: true,
        minWidth: 3.1,
        maxWidth: 3.1
    },
    {
        id: 2,
        label: 'Order No',
        search: true,
        sort: true,
        key: 'order_no',
        visible: true,
        stick: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Quantity',
        search: true,
        sort: true,
        key: 'quantity',
        align: 'center',
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
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 5,
        label: 'Status',
        search: false,
        sort: false,
        filter: true,
        options: ['Confirmed'],
        key: 'status',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'Customer',
        search: true,
        sort: true,
        key: 'customer',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    // {
    //     id: 7,
    //     label: 'Locations',
    //     search: true,
    //     sort: true,
    //     key: 'locations',
    //     align: 'center',
    //     visible: true,
    //     stick: false,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    {
        id: 8,
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
    {
        id: 9,
        label: 'Courier',
        search: true,
        sort: true,
        key: 'courier',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    }
]
