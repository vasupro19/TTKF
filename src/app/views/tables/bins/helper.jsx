/* eslint-disable */
import StatusBadge from '@core/components/StatusBadge'

export const locations = [
    {
        id: 1,
        binCode: 'BIN-001',
        status: <StatusBadge type='danger' label='# N/A' />,
        warehouseName: 'Warehouse A',
        type: 'Storage',
        documentNo: 'DOC12345',
        locationCode: 'LOC001',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 10:30',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 12:00'
    },
    {
        id: 2,
        binCode: 'BIN-002',
        status: <StatusBadge type='success' label='Available' />,
        warehouseName: 'Warehouse B',
        type: 'Picking',
        documentNo: '-',
        locationCode: '-',
        createdBy: 'Alice Brown',
        createdAt: '14-11-2024 09:00',
        updatedBy: 'John Doe',
        updatedAt: '15-11-2024 11:00'
    },
    {
        id: 3,
        binCode: 'BIN-003',
        status: <StatusBadge type='danger' label='# N/A' />,
        warehouseName: 'Warehouse C',
        type: 'Picking',
        documentNo: 'DOC12347',
        locationCode: 'LOC003',
        createdBy: 'Bob White',
        createdAt: '13-11-2024 16:50',
        updatedBy: 'Alice Brown',
        updatedAt: '14-11-2024 15:00'
    },
    {
        id: 4,
        binCode: 'BIN-004',
        status: <StatusBadge type='success' label='Available' />,
        warehouseName: 'Warehouse D',
        type: 'Storage',
        documentNo: '-',
        locationCode: '-',
        createdBy: 'Jane Smith',
        createdAt: '13-11-2024 14:20',
        updatedBy: 'Bob White',
        updatedAt: '15-11-2024 10:00'
    },
    {
        id: 5,
        binCode: 'BIN-005',
        status: <StatusBadge type='danger' label='# N/A' />,
        warehouseName: 'Warehouse E',
        type: 'Picking',
        documentNo: 'DOC12349',
        locationCode: 'LOC005',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 11:30',
        updatedBy: 'Jane Smith',
        updatedAt: '14-11-2024 18:00'
    },
    {
        id: 6,
        binCode: 'BIN-006',
        status: <StatusBadge type='success' label='Available' />,
        warehouseName: 'Warehouse F',
        type: 'Storage',
        documentNo: '-',
        locationCode: '-',
        createdBy: 'Alice Brown',
        createdAt: '13-11-2024 15:30',
        updatedBy: 'John Doe',
        updatedAt: '15-11-2024 12:30'
    },
    {
        id: 7,
        binCode: 'BIN-007',
        status: <StatusBadge type='danger' label='# N/A' />,
        warehouseName: 'Warehouse G',
        type: 'Picking',
        documentNo: 'DOC12351',
        locationCode: 'LOC007',
        createdBy: 'Bob White',
        createdAt: '14-11-2024 10:00',
        updatedBy: 'Alice Brown',
        updatedAt: '15-11-2024 14:30'
    },
    {
        id: 8,
        binCode: 'BIN-008',
        status: <StatusBadge type='success' label='Available' />,
        warehouseName: 'Warehouse H',
        type: 'Storage',
        documentNo: '-',
        locationCode: '-',
        createdBy: 'Jane Smith',
        createdAt: '13-11-2024 17:45',
        updatedBy: 'Bob White',
        updatedAt: '14-11-2024 19:00'
    },
    {
        id: 9,
        binCode: 'BIN-009',
        status: <StatusBadge type='danger' label='# N/A' />,
        warehouseName: 'Warehouse I',
        type: 'Picking',
        documentNo: 'DOC12353',
        locationCode: 'LOC009',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 08:15',
        updatedBy: 'Jane Smith',
        updatedAt: '14-11-2024 20:00'
    },
    {
        id: 10,
        binCode: 'BIN-010',
        status: <StatusBadge type='success' label='Available' />,
        warehouseName: 'Warehouse J',
        type: 'Storage',
        documentNo: '-',
        locationCode: '-',
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
        label: 'Bin Code',
        search: true,
        sort: true,
        stick: true,
        key: 'code',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Warehouse Name',
        search: true,
        sort: false,
        stick: true,
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
        label: 'Pallet Code',
        search: true,
        sort: false,
        stick: false,
        key: 'pallet_code',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'Document No',
        search: true,
        sort: false,
        stick: false,
        key: 'document_no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 8,
        label: 'Status',
        search: false,
        sort: false,
        stick: false,
        key: 'available',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    // {
    //     id: 9,
    //     label: 'lpn_putaway_flag',
    //     search: false,
    //     sort: false,
    //     stick: false,
    //     key: 'lpn_putaway_flag',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    // {
    //     id: 10,
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
        label: 'Type',
        search: true,
        sort: false,
        stick: false,
        key: 'type',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 12,
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
        id: 15,
        label: 'Updated At',
        search: false,
        sort: true,
        stick: false,
        key: 'updated_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 13,
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
        label: 'Created At',
        search: false,
        sort: true,
        stick: false,
        key: 'created_at',
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
