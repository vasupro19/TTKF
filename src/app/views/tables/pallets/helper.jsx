/* eslint-disable */
import StatusBadge from '@core/components/StatusBadge'

export const locations = [
    {
        id: 1,
        palletCode: 'PAL-001',
        status: <StatusBadge type='danger' label='# N/A' />,
        warehouseName: 'Warehouse A',
        locationCode: 'LOC001',
        type: 'Storage',
        documentNo: 'DOC10001',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 10:30',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 12:00'
    },
    {
        id: 2,
        palletCode: 'PAL-002',
        status: <StatusBadge type='success' label='Available' />,
        warehouseName: 'Warehouse B',
        locationCode: '-',
        type: 'Picking',
        documentNo: '-',
        createdBy: 'Alice Brown',
        createdAt: '14-11-2024 09:00',
        updatedBy: 'John Doe',
        updatedAt: '15-11-2024 11:00'
    },
    {
        id: 3,
        palletCode: 'PAL-003',
        status: <StatusBadge type='danger' label='# N/A' />,
        warehouseName: 'Warehouse C',
        locationCode: 'LOC003',
        type: 'Storage',
        documentNo: 'DOC10003',
        createdBy: 'Bob White',
        createdAt: '13-11-2024 16:50',
        updatedBy: 'Alice Brown',
        updatedAt: '14-11-2024 15:00'
    },
    {
        id: 4,
        palletCode: 'PAL-004',
        status: <StatusBadge type='success' label='Available' />,
        warehouseName: 'Warehouse D',
        locationCode: '-',
        type: 'Picking',
        documentNo: '-',
        createdBy: 'Jane Smith',
        createdAt: '13-11-2024 14:20',
        updatedBy: 'Bob White',
        updatedAt: '15-11-2024 10:00'
    },
    {
        id: 5,
        palletCode: 'PAL-005',
        status: <StatusBadge type='danger' label='# N/A' />,
        warehouseName: 'Warehouse E',
        locationCode: 'LOC005',
        type: 'Storage',
        documentNo: 'DOC10005',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 11:30',
        updatedBy: 'Jane Smith',
        updatedAt: '14-11-2024 18:00'
    },
    {
        id: 6,
        palletCode: 'PAL-006',
        status: <StatusBadge type='success' label='Available' />,
        warehouseName: 'Warehouse F',
        locationCode: '-',
        type: 'Picking',
        documentNo: '-',
        createdBy: 'Alice Brown',
        createdAt: '13-11-2024 15:30',
        updatedBy: 'John Doe',
        updatedAt: '15-11-2024 12:30'
    },
    {
        id: 7,
        palletCode: 'PAL-007',
        status: <StatusBadge type='danger' label='# N/A' />,
        warehouseName: 'Warehouse G',
        locationCode: 'LOC007',
        type: 'Picking',
        documentNo: 'DOC10007',
        createdBy: 'Bob White',
        createdAt: '14-11-2024 10:00',
        updatedBy: 'Alice Brown',
        updatedAt: '15-11-2024 14:30'
    },
    {
        id: 8,
        palletCode: 'PAL-008',
        status: <StatusBadge type='success' label='Available' />,
        warehouseName: 'Warehouse H',
        locationCode: '-',
        type: 'Storage',
        documentNo: '-',
        createdBy: 'Jane Smith',
        createdAt: '13-11-2024 17:45',
        updatedBy: 'Bob White',
        updatedAt: '14-11-2024 19:00'
    },
    {
        id: 9,
        palletCode: 'PAL-009',
        status: <StatusBadge type='danger' label='# N/A' />,
        warehouseName: 'Warehouse I',
        locationCode: 'LOC009',
        type: 'Storage',
        documentNo: 'DOC10009',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 08:15',
        updatedBy: 'Jane Smith',
        updatedAt: '14-11-2024 20:00'
    },
    {
        id: 10,
        palletCode: 'PAL-010',
        status: <StatusBadge type='success' label='Available' />,
        warehouseName: 'Warehouse J',
        locationCode: '-',
        type: 'Picking',
        documentNo: '-',
        createdBy: 'Alice Brown',
        createdAt: '13-11-2024 18:10',
        updatedBy: 'John Doe',
        updatedAt: '15-11-2024 09:30'
    }
]

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
        align: 'left'
    },
    {
        id: 2,
        label: 'Pallet Code',
        search: true,
        sort: true,
        stick: true,
        key: 'code',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 7,
        label: 'Status',
        search: false,
        sort: false,
        stick: false,
        key: 'available',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Warehouse Name',
        search: true,
        sort: false,
        stick: false,
        key: 'warehouse_name',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 4,
        label: 'Location Code',
        search: true,
        sort: false,
        stick: false,
        key: 'location_code',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 5,
        label: 'Document No',
        search: true,
        sort: true,
        stick: false,
        key: 'document_no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 10,
        label: 'Type',
        search: true,
        sort: false,
        stick: false,
        key: 'type',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    // {
    //     id: 8,
    //     label: 'LPN Putaway Flag',
    //     search: false,
    //     sort: false,
    //     stick: false,
    //     key: 'lpn_putaway_flag',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    // {
    //     id: 9,
    //     label: 'is_virtual',
    //     search: false,
    //     sort: false,
    //     stick: false,
    //     key: 'is_virtual',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    {
        id: 11,
        label: 'Created By',
        search: true,
        sort: false,
        stick: false,
        key: 'created_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 13,
        label: 'Created At',
        search: true,
        sort: true,
        stick: false,
        key: 'created_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 12,
        label: 'Modified By',
        search: true,
        sort: false,
        stick: false,
        key: 'modified_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 14,
        label: 'Updated At',
        search: true,
        sort: true,
        stick: false,
        key: 'updated_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]

export const STATUS_TYPE = {
    0: {
        label: '# N/A',
        color: 'danger'
    },
    1: {
        label: 'Available',
        color: 'success'
    }
}
