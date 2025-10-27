/* eslint-disable */
import StatusBadge from '@core/components/StatusBadge'
import CustomLink from '@core/components/extended/CustomLink'

/* eslint-disable */
export const locations = [
    {
        id: 1,
        GRN_No: (
            <CustomLink href='/inbound/goodsReceiptNote/view/1' icon>
                GRN-1001
            </CustomLink>
        ),
        Status: <StatusBadge type='info' label='Open' />,
        GateEntryNo: 'GE-001',
        InvoiceNo: 'INV-202401',
        VendorName: 'Vendor A',
        PO_ASN_Qty: 100,
        ReceivedQty: 50,
        StartedAt: '2024-11-01T08:30:00',
        ClosedAt: null
    },
    {
        id: 2,
        GRN_No: (
            <CustomLink href='/inbound/goodsReceiptNote/view/2' icon>
                GRN-1002
            </CustomLink>
        ),
        Status: <StatusBadge type='danger' label='Put Aside' />,
        GateEntryNo: 'GE-002',
        InvoiceNo: 'INV-202402',
        VendorName: 'Vendor B',
        PO_ASN_Qty: 200,
        ReceivedQty: 150,
        StartedAt: '2024-11-02T09:00:00',
        ClosedAt: null
    },
    {
        id: 3,
        GRN_No: (
            <CustomLink href='/inbound/goodsReceiptNote/view/3' icon>
                GRN-1003
            </CustomLink>
        ),
        Status: <StatusBadge type='success' label='Completed' />,
        GateEntryNo: 'GE-003',
        InvoiceNo: 'INV-202403',
        VendorName: 'Vendor C',
        PO_ASN_Qty: 150,
        ReceivedQty: 150,
        StartedAt: '2024-11-03T08:45:00',
        ClosedAt: '2024-11-03T14:30:00'
    },
    {
        id: 4,
        GRN_No: (
            <CustomLink href='/inbound/goodsReceiptNote/view/4' icon>
                GRN-1004
            </CustomLink>
        ),
        Status: <StatusBadge type='info' label='Open' />,
        GateEntryNo: 'GE-004',
        InvoiceNo: 'INV-202404',
        VendorName: 'Vendor D',
        PO_ASN_Qty: 300,
        ReceivedQty: 50,
        StartedAt: '2024-11-04T10:00:00',
        ClosedAt: null
    },
    {
        id: 5,
        GRN_No: (
            <CustomLink href='/inbound/goodsReceiptNote/view/5' icon>
                GRN-1005
            </CustomLink>
        ),
        Status: <StatusBadge type='success' label='Completed' />,
        GateEntryNo: 'GE-005',
        InvoiceNo: 'INV-202405',
        VendorName: 'Vendor E',
        PO_ASN_Qty: 120,
        ReceivedQty: 120,
        StartedAt: '2024-11-04T11:00:00',
        ClosedAt: '2024-11-04T15:30:00'
    },
    {
        id: 6,
        GRN_No: (
            <CustomLink href='/inbound/goodsReceiptNote/view/6' icon>
                GRN-1006
            </CustomLink>
        ),
        Status: <StatusBadge type='danger' label='Put Aside' />,
        GateEntryNo: 'GE-006',
        InvoiceNo: 'INV-202406',
        VendorName: 'Vendor F',
        PO_ASN_Qty: 500,
        ReceivedQty: 300,
        StartedAt: '2024-11-05T12:30:00',
        ClosedAt: null
    },
    {
        id: 7,
        GRN_No: (
            <CustomLink href='/inbound/goodsReceiptNote/view/7' icon>
                GRN-1007
            </CustomLink>
        ),
        Status: <StatusBadge type='info' label='Open' />,
        GateEntryNo: 'GE-007',
        InvoiceNo: 'INV-202407',
        VendorName: 'Vendor G',
        PO_ASN_Qty: 250,
        ReceivedQty: 125,
        StartedAt: '2024-11-06T13:00:00',
        ClosedAt: null
    },
    {
        id: 8,
        GRN_No: (
            <CustomLink href='/inbound/goodsReceiptNote/view/8' icon>
                GRN-1008
            </CustomLink>
        ),
        Status: <StatusBadge type='success' label='Completed' />,
        GateEntryNo: 'GE-008',
        InvoiceNo: 'INV-202408',
        VendorName: 'Vendor H',
        PO_ASN_Qty: 350,
        ReceivedQty: 350,
        StartedAt: '2024-11-07T09:45:00',
        ClosedAt: '2024-11-07T17:00:00'
    },
    {
        id: 9,
        GRN_No: (
            <CustomLink href='/inbound/goodsReceiptNote/view/9' icon>
                GRN-1009
            </CustomLink>
        ),
        Status: <StatusBadge type='danger' label='Put Aside' />,
        GateEntryNo: 'GE-009',
        InvoiceNo: 'INV-202409',
        VendorName: 'Vendor I',
        PO_ASN_Qty: 400,
        ReceivedQty: 250,
        StartedAt: '2024-11-08T10:30:00',
        ClosedAt: null
    },
    {
        id: 10,
        GRN_No: (
            <CustomLink href='/inbound/goodsReceiptNote/view/10' icon>
                GRN-1010
            </CustomLink>
        ),
        Status: <StatusBadge type='info' label='Open' />,
        GateEntryNo: 'GE-010',
        InvoiceNo: 'INV-202410',
        VendorName: 'Vendor J',
        PO_ASN_Qty: 600,
        ReceivedQty: 100,
        StartedAt: '2024-11-09T08:15:00',
        ClosedAt: null
    }
]

export const headers = [
    {
        id: 0,
        label: 'Sr.No',
        isFrontend: true,
        search: false,
        sort: false,
        stick: true,
        key: 's_no',
        visible: true,
        minWidth: 3.1,
        maxWidth: 3.1
    },
    {
        id: 9,
        label: 'GRN No',
        search: false,
        sort: false,
        stick: true,
        key: 'grn_no',
        isFrontend: true,
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'Status',
        search: false,
        sort: false,
        stick: true,
        key: 'status',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 1,
        label: 'Gate Entry No',
        search: true,
        sort: false,
        stick: false,
        key: 'no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Invoice No',
        search: true,
        sort: false,
        stick: false,
        key: 'invoice_no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 8,
        label: 'Vendor Name',
        search: true,
        sort: false,
        stick: false,
        key: 'name',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 4,
        label: 'PO ASN Qty',
        search: false,
        sort: true,
        stick: false,
        key: 'total_invoice_quantity',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 5,
        label: 'Received Qty',
        search: true,
        sort: true,
        stick: false,
        key: 'total_grn_quantity',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'Started At',
        search: true,
        sort: true,
        stick: false,
        key: 'created_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 7,
        label: 'Closed At',
        search: false,
        sort: true,
        stick: false,
        key: 'closed_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]