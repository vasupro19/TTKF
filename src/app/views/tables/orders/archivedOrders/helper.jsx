export const locations = [
    {
        id: 1,
        orderNo: '381613176',
        wmsRefNo: 'UTT-007865',
        status: 'Cancelled', // green
        orderType: 'B2B',
        channel: 'Myntra',
        sla: 2,
        paymentMode: 'COD',
        orderDate: '2024-08-12 09:00',
        courier: 'HDMS',
        awbNo: 'AWB123456',
        shipToName: 'Ishaan',
        lmdStatus: 'Booked', // blue
        quantity: 15,
        zone: 'North',
        createdAt: '2024-08-12 09:15',
        createdBy: 'Amit Sharma'
    },
    {
        id: 2,
        orderNo: '381613134',
        wmsRefNo: 'UTT-008165',
        status: 'SHIPPED', // blue
        orderType: 'B2B',
        channel: 'Shopify',
        sla: 4,
        paymentMode: 'PREPAID',
        orderDate: '2024-08-12 09:00',
        courier: 'DELHIVERY',
        awbNo: 'AWB789101',
        shipToName: 'Pankaj Singh',
        lmdStatus: 'In Transit', // orange
        quantity: 12,
        zone: 'West',
        createdAt: '2024-08-12 09:20',
        createdBy: 'Priya Mehta'
    },
    {
        id: 3,
        orderNo: '381613200',
        wmsRefNo: 'UTT-009200',
        status: 'Cancelled', // orange
        orderType: 'STO',
        channel: 'Wholesale',
        sla: 3,
        paymentMode: 'COD',
        orderDate: '2024-08-12 09:00',
        courier: 'BLUEDART',
        awbNo: 'AWB456789',
        shipToName: 'Rajesh Verma',
        lmdStatus: 'OFD', // green
        quantity: 20,
        zone: 'East',
        createdAt: '2024-08-12 09:25',
        createdBy: 'Rohit Choudhary'
    },
    {
        id: 4,
        orderNo: '381613205',
        wmsRefNo: 'UTT-009205',
        status: 'SHIPPED', // red
        orderType: 'Returnable Challan',
        channel: 'Myntra',
        sla: 1,
        paymentMode: 'PREPAID',
        orderDate: '2024-08-12 09:00',
        courier: 'EKART',
        awbNo: 'AWB102938',
        shipToName: 'Anil Sharma',
        lmdStatus: 'Delivered', // red
        quantity: 10,
        zone: 'South',
        createdAt: '2024-08-12 09:30',
        createdBy: 'Neha Kapoor'
    },
    {
        id: 5,
        orderNo: '381613210',
        wmsRefNo: 'UTT-009210',
        status: 'SHIPPED', // green
        orderType: 'Non-Returnable Challan',
        channel: 'Amazon',
        sla: 18,
        paymentMode: 'COD',
        orderDate: '2024-08-12 09:00',
        courier: 'Xpressbees',
        awbNo: 'AWB564738',
        shipToName: 'Sneha Kapoor',
        lmdStatus: 'Booked', // blue
        quantity: 5,
        zone: 'North',
        createdAt: '2024-08-12 09:35',
        createdBy: 'Vikas Yadav'
    },
    {
        id: 6,
        orderNo: '381613215',
        wmsRefNo: 'UTT-009215',
        status: 'SHIPPED', // blue
        orderType: 'Purchase Return',
        channel: 'Flipkart',
        sla: 19,
        paymentMode: 'PREPAID',
        orderDate: '2024-08-12 09:00',
        courier: 'Shadowfax',
        awbNo: 'AWB678901',
        shipToName: 'Rohit Mehta',
        lmdStatus: 'In Transit', // orange
        quantity: 8,
        zone: 'West',
        createdAt: '2024-08-12 09:40',
        createdBy: 'Ankita Sinha'
    },
    {
        id: 7,
        orderNo: '381613220',
        wmsRefNo: 'UTT-009220',
        status: 'SHIPPED', // orange
        orderType: 'Job Work',
        channel: 'Amazon',
        sla: 5,
        paymentMode: 'COD',
        orderDate: '2024-08-12 09:00',
        courier: 'GATI',
        awbNo: 'AWB987654',
        shipToName: 'Vikas Yadav',
        lmdStatus: 'OFD', // green
        quantity: 25,
        zone: 'South',
        createdAt: '2024-08-12 09:45',
        createdBy: 'Sumit Raj'
    },
    {
        id: 8,
        orderNo: '381613225',
        wmsRefNo: 'UTT-009225',
        status: 'SHIPPED', // red
        orderType: 'B2B',
        channel: 'Shopify',
        sla: 3,
        paymentMode: 'PREPAID',
        orderDate: '2024-08-12 09:00',
        courier: 'DTDC',
        awbNo: 'AWB456123',
        shipToName: 'Karan Johar',
        lmdStatus: 'Delivered', // red
        quantity: 30,
        zone: 'East',
        createdAt: '2024-08-12 09:50',
        createdBy: 'Swati Malhotra'
    },
    {
        id: 9,
        orderNo: '381613230',
        wmsRefNo: 'UTT-009230',
        status: 'Cancelled', // green
        orderType: 'STO',
        channel: 'Amazon',
        sla: 2,
        paymentMode: 'COD',
        orderDate: '2024-08-12 09:00',
        courier: 'FedEx',
        awbNo: 'AWB852963',
        shipToName: 'Priya Sharma',
        lmdStatus: 'Booked', // blue
        quantity: 22,
        zone: 'North',
        createdAt: '2024-08-12 09:55',
        createdBy: 'Tarun Sharma'
    },
    {
        id: 10,
        orderNo: '381613235',
        wmsRefNo: 'UTT-009235',
        status: 'SHIPPED', // blue
        orderType: 'Returnable Challan',
        channel: 'Wholesale',
        sla: -7,
        paymentMode: 'PREPAID',
        orderDate: '2024-08-12 09:00',
        courier: 'India Post',
        awbNo: 'AWB741258',
        shipToName: 'Amit Gupta',
        lmdStatus: 'In Transit', // orange
        quantity: 14,
        zone: 'West',
        createdAt: '2024-08-12 10:00',
        createdBy: 'Richa Verma'
    },
    {
        id: 11,
        orderNo: '381613240',
        wmsRefNo: 'UTT-009240',
        status: 'SHIPPED', // orange
        orderType: 'Non-Returnable Challan',
        channel: 'Myntra',
        sla: 45,
        paymentMode: 'COD',
        orderDate: '2024-08-12 09:00',
        courier: 'Ecom Express',
        awbNo: 'AWB963852',
        shipToName: 'Nisha Patel',
        lmdStatus: 'OFD', // green
        quantity: 7,
        zone: 'East',
        createdAt: '2024-08-12 10:05',
        createdBy: 'Kunal Joshi'
    },
    {
        id: 12,
        orderNo: '381613245',
        wmsRefNo: 'UTT-009245',
        status: 'SHIPPED', // red
        orderType: 'Purchase Return',
        channel: 'Myntra',
        sla: 1,
        paymentMode: 'PREPAID',
        orderDate: '2024-08-12 09:00',
        courier: 'Shadowfax',
        awbNo: 'AWB357159',
        shipToName: 'Ravi Kumar',
        lmdStatus: 'Delivered', // red
        quantity: 18,
        zone: 'South',
        createdAt: '2024-08-12 10:10',
        createdBy: 'Harsh Singh'
    }
]

export const headers = [
    {
        id: 0,
        label: 'Sr.No',
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
        label: 'Order No',
        search: true,
        sort: true,
        key: 'orderNo',
        visible: true,
        stick: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'WMS Ref No',
        search: true,
        sort: true,
        key: 'wmsRefNo',
        visible: true,
        stick: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Order Date',
        search: true,
        sort: true,
        key: 'orderDate',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 4,
        label: 'Fulfillment Status',
        search: false,
        sort: false,
        filter: true,
        options: ['Shipped', 'Cancelled'],
        key: 'status',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 5,
        label: 'Order Type',
        search: false,
        sort: false,
        filter: true,
        options: ['B2B', 'STO', 'Returnable Challan', 'Non-Returnable Challan', 'Purchase Return', 'Job Work'],
        key: 'orderType',
        align: 'center',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
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
        id: 7,
        label: 'SLA',
        search: false,
        sort: false,
        filter: true,
        options: ['0-2 hrs', '2-4 hrs', '4-10 hrs', '10-24hr', '24hr+', 'SLA Breached'],
        key: 'sla',
        visible: true,
        singleSelect: true,
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
    },
    {
        id: 10,
        label: 'AWB No.',
        search: true,
        sort: true,
        key: 'awbNo',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 8,
        label: 'Payment Mode',
        search: false,
        sort: false,
        filter: true,
        options: ['COD', 'PREPAID'],
        key: 'paymentMode',
        orderDate: '2024-08-12 09:00',
        visible: true,
        stick: false,
        minWidth: 9,
        maxWidth: 9
    },
    {
        id: 11,
        label: 'Ship to Name',
        search: true,
        sort: true,
        key: 'shipToName',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 12,
        label: 'LMD Status',
        search: false,
        sort: false,
        filter: true,
        options: ['Created', 'Picked', 'Packed', 'In Transit', 'Out for Delivery', 'Delivered'],
        key: 'lmdStatus',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 13,
        label: 'Quantity',
        search: true,
        sort: true,
        key: 'quantity',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 14,
        label: 'Zone',
        search: true,
        sort: true,
        key: 'zone',
        visible: true,
        stick: false,
        align: 'center',
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 15,
        label: 'Created At',
        search: true,
        sort: true,
        key: 'createdAt',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 16,
        label: 'Created By',
        align: 'center',
        search: true,
        sort: true,
        stick: false,
        key: 'createdBy',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]
