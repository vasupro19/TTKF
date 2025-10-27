/* eslint-disable */
import StatusBadge from '@core/components/StatusBadge'

export const locations = [
    {
        id: 1,
        put_away_no: 'PT001',
        gate_entry_no: 'GE801',
        gate_entry_status: 'Completed',
        grn_no: 'GRN001',
        put_away_status: 'Completed',
        total_grn_qty: 50,
        put_away_qty: 50,
        pending_qty: 0,
        started_at: '20-01-2025 09:00',
        started_by: 'John Doe',
        closed_at: '20-01-2025 17:00'
    },
    {
        id: 2,
        put_away_no: 'PT002',
        gate_entry_no: 'GE802',
        gate_entry_status: 'Completed',
        grn_no: 'GRN002',
        put_away_status: 'In Progress',
        total_grn_qty: 80,
        put_away_qty: 70,
        pending_qty: 30,
        started_at: '21-01-2025 11:00',
        started_by: 'Jane Smith',
        closed_at: null
    },
    {
        id: 3,
        put_away_no: 'PT003',
        gate_entry_no: 'GE803',
        gate_entry_status: 'Completed',
        grn_no: 'GRN003',
        put_away_status: 'Completed',
        total_grn_qty: 200,
        put_away_qty: 200,
        pending_qty: 0,
        started_at: '19-01-2025 08:45',
        started_by: 'Alice Johnson',
        closed_at: '19-01-2025 16:30'
    },
    {
        id: 4,
        put_away_no: 'PT004',
        gate_entry_no: 'GE804',
        gate_entry_status: 'Completed',
        grn_no: 'GRN004',
        put_away_status: 'In Progress',
        total_grn_qty: 150,
        put_away_qty: 90,
        pending_qty: 60,
        started_at: '22-01-2025 8:15',
        started_by: 'Michael Brown',
        closed_at: null
    },
    {
        id: 5,
        put_away_no: 'PT005',
        gate_entry_no: 'GE805',
        gate_entry_status: 'Completed',
        grn_no: 'GRN005',
        put_away_status: 'In Progress',
        total_grn_qty: 80,
        put_away_qty: 30,
        pending_qty: 50,
        started_at: '22-01-2025 11:30',
        started_by: 'Mary Lee',
        closed_at: null
    },
    {
        id: 6,
        put_away_no: 'PT006',
        gate_entry_no: 'GE806',
        gate_entry_status: 'Completed',
        grn_no: 'GRN006',
        put_away_status: 'Completed',
        total_grn_qty: 120,
        put_away_qty: 120,
        pending_qty: 0,
        started_at: '20-01-2025 12:00',
        started_by: 'Tom Hardy',
        closed_at: '20-01-2025 18:00'
    },
    {
        id: 7,
        put_away_no: 'PT007',
        gate_entry_no: 'GE807',
        gate_entry_status: 'Completed',
        grn_no: 'GRN007',
        put_away_status: 'In Progress',
        total_grn_qty: 60,
        put_away_qty: 30,
        pending_qty: 30,
        started_at: '23-01-2025 09:30',
        started_by: 'Alice Cooper',
        closed_at: null
    },
    {
        id: 8,
        put_away_no: 'PT008',
        gate_entry_no: 'GE808',
        gate_entry_status: 'Completed',
        grn_no: 'GRN008',
        put_away_status: 'Completed',
        total_grn_qty: 300,
        put_away_qty: 300,
        pending_qty: 0,
        started_at: '18-01-2025 07:00',
        started_by: 'John Carter',
        closed_at: '18-01-2025 15:00'
    },
    {
        id: 9,
        put_away_no: 'PT009',
        gate_entry_no: 'GE809',
        gate_entry_status: 'Completed',
        grn_no: 'GRN009',
        put_away_status: 'In Progress',
        total_grn_qty: 90,
        put_away_qty: 50,
        pending_qty: 40,
        started_at: '23-01-2025 8:45',
        started_by: 'Mary Jane',
        closed_at: null
    },
    {
        id: 10,
        put_away_no: 'PT010',
        gate_entry_no: 'GE810',
        gate_entry_status: 'Completed',
        grn_no: 'GRN010',
        put_away_status: 'Completed',
        total_grn_qty: 100,
        put_away_qty: 100,
        pending_qty: 0,
        started_at: '17-01-2025 06:00',
        started_by: 'Laura Kim',
        closed_at: '17-01-2025 14:00'
    },
    {
        id: 11,
        put_away_no: 'PT011',
        gate_entry_no: 'GE811',
        gate_entry_status: 'Completed',
        grn_no: 'GRN011',
        put_away_status: 'Completed',
        total_grn_qty: 180,
        put_away_qty: 180,
        pending_qty: 0,
        started_at: '16-01-2025 10:30',
        started_by: 'Paul White',
        closed_at: '16-01-2025 19:00'
    },
    {
        id: 12,
        put_away_no: 'PT012',
        gate_entry_no: 'GE812',
        gate_entry_status: 'Completed',
        grn_no: 'GRN012',
        put_away_status: 'In Progress',
        total_grn_qty: 75,
        put_away_qty: 25,
        pending_qty: 50,
        started_at: '24-01-2025 09:00',
        started_by: 'Sophia Brown',
        closed_at: null
    }
    // {
    //     id: 13,
    //     put_away_no: 'PT013',
    //     gate_entry_no: 'GE813',
    //     gate_entry_status: 'Completed',
    //     grn_no: 'GRN013',
    //     put_away_status: 'Completed',
    //     total_grn_qty: 220,
    //     put_away_qty: 220,
    //     pending_qty: 0,
    //     started_at: '15-01-2025 08:00',
    //     started_by: 'Kevin Hart',
    //     closed_at: '15-01-2025 16:30'
    // },
    // {
    //     id: 14,
    //     put_away_no: 'PT014',
    //     gate_entry_no: 'GE814',
    //     gate_entry_status: 'Completed',
    //     grn_no: 'GRN014',
    //     put_away_status: 'In Progress',
    //     total_grn_qty: 140,
    //     put_away_qty: 70,
    //     pending_qty: 70,
    //     started_at: '24-01-2025 10:15',
    //     started_by: 'Diana Prince',
    //     closed_at: null
    // },
    // {
    //     id: 15,
    //     put_away_no: 'PT015',
    //     gate_entry_no: 'GE815',
    //     gate_entry_status: 'Completed',
    //     grn_no: 'GRN015',
    //     put_away_status: 'Completed',
    //     total_grn_qty: 50,
    //     put_away_qty: 50,
    //     pending_qty: 0,
    //     started_at: '14-01-2025 07:45',
    //     started_by: 'Clark Kent',
    //     closed_at: '14-01-2025 13:30'
    // }
]

// export const headers = [
//     {
//         id: 0,
//         label: 'Sr. No.',
//         search: true,
//         sort: false,
//         stick: false,
//         key: 's_no',
// isFrontend: true,
//         visible: true,
//         minWidth: 3.1,
//         maxWidth: 3.1
//     },
//     {
//         id: 1,
//         label: 'Put Away No.',
//         search: true,
//         sort: true,
//         stick: false,
//         key: 'put_away_no',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 3,
//         label: 'Put Away Status',
//         search: false,
//         sort: false,
//         filter: true,
//         options: ['Pending', 'In Progress', 'Completed'],
//         stick: false,
//         key: 'put_away_status',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 4,
//         label: 'Gate Entry No.',
//         search: true,
//         sort: true,
//         stick: false,
//         key: 'gate_entry_no',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8,
//         align: 'center'
//     },
//     {
//         id: 5,
//         label: 'Gate Entry Status',
//         search: false,
//         sort: false,
//         filter: true,
//         options: ['In Progress', 'Completed'],
//         stick: false,
//         key: 'gate_entry_status',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 6,
//         label: 'GRN No.',
//         search: true,
//         sort: true,
//         stick: false,
//         key: 'grn_no',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8,
//         align: 'center'
//     },

//     {
//         id: 7,
//         label: 'Total GRN Qty',
//         search: true,
//         sort: true,
//         stick: false,
//         key: 'total_grn_qty',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 8,
//         label: 'Put Away Qty',
//         search: true,
//         sort: true,
//         stick: false,
//         key: 'put_away_qty',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 9,
//         label: 'Pending Qty',
//         search: true,
//         sort: true,
//         stick: false,
//         key: 'pending_qty',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 10,
//         label: 'Started At',
//         search: true,
//         sort: true,
//         stick: false,
//         key: 'started_at',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 11,
//         label: 'Closed At',
//         search: true,
//         sort: true,
//         stick: false,
//         key: 'closed_at',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 12,
//         label: 'Started By',
//         search: true,
//         sort: true,
//         stick: false,
//         key: 'started_by',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     }
// ]

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
        maxWidth: 3.1
    },
    {
        id: 1,
        label: 'Put Away No.',
        search: false,
        sort: false,
        stick: true,
        key: 'no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 7,
        label: 'Put Away Status',
        search: false,
        sort: false,
        stick: true,
        key: 'status',
        visible: true,
        filter: true,
        options: [{label: 'Open', value: 1 }, {label: 'Closed', value: 2}],
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 15,
        label: 'Gate Entry No',
        search: false,
        sort: false,
        stick: false,
        key: 'gate_entry_no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 16,
        label: 'Gate Entry Status',
        search: false,
        sort: false,
        stick: false,
        key: 'gate_entry_status',
        visible: true,
        filter: true,
        options: [{label: 'Open', value: 1 }, {label: 'Closed', value: 2}],
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 14,
        label: 'GRN No',
        search: false,
        sort: false,
        stick: false,
        key: 'grn_no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 13,
        label: 'Total GRN Qty',
        search: false,
        sort: false,
        stick: false,
        key: 'total_grn_quantity',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 4,
        label: 'Put Away Qty',
        search: false,
        sort: false,
        stick: false,
        key: 'putaway_qty',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Pending Qty',
        search: false,
        sort: false,
        stick: false,
        key: 'pending_quantity',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 8,
        label: 'Started At',
        search: false,
        sort: false,
        stick: false,
        key: 'created_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 9,
        label: 'Started By',
        search: false,
        sort: false,
        stick: false,
        key: 'created_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    // {
    //     id: 2,
    //     label: 'updated_at',
    //     search: false,
    //     sort: false,
    //     stick: false,
    //     key: 'updated_at',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    // {
    //     id: 5,
    //     label: 'location_code',
    //     search: false,
    //     sort: false,
    //     stick: false,
    //     key: 'location_code',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    // {
    //     id: 6,
    //     label: 'client_id',
    //     search: false,
    //     sort: false,
    //     stick: false,
    //     key: 'client_id',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },

    // {
    //     id: 10,
    //     label: 'scan_item_no',
    //     search: false,
    //     sort: false,
    //     stick: false,
    //     key: 'scan_item_no',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    // {
    //     id: 11,
    //     label: 'document_type',
    //     search: false,
    //     sort: false,
    //     stick: false,
    //     key: 'document_type',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    // {
    //     id: 12,
    //     label: 'putaway_type',
    //     search: false,
    //     sort: false,
    //     stick: false,
    //     key: 'putaway_type',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // }
]

export const STATUS_TYPE = {
    'In Progress': {
        label: 'In Progress',
        color: 'info'
    },
    Completed: {
        label: 'Completed',
        color: 'success'
    }
}
