/* eslint-disable */
import StatusBadge from '@core/components/StatusBadge'

export const locations = [
    {
        id: '001A',
        user_name: 'John Doe',
        item_id: 'ITM001',
        EAN: '8901234567891',
        grn_bin: 'GRN001',
        put_away_bin: 'BIN001',
        put_away_loc: 'LOC001',
        put_away_type: 'Full Bin',
        created_at: '20-01-2025 09:00',
        created_by: 'John Doe'
    }
]

export const headers = [
    {
        id: 99,
        label: 'Id',
        search: false,
        sort: false,
        stick: true,
        key: 's_no',
isFrontend: true,
        visible: true,
        minWidth: 4,
        maxWidth: 4,
        align: 'center'
    },
    {
        id: 10,
        label: 'User Name',
        search: true,
        sort: true,
        stick: true,
        key: 'created_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8,
    },
    {
        id: 6,
        label: 'Put Away Type',
        search: false,
        sort: false,
        filter: true,
        options: ['Full Bin', 'Piece'],
        stick: true,
        key: 'type',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 15,
        label: 'Item Id',
        search: true,
        sort: true,
        stick: false,
        key: 'uid',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'EAN',
        search: true,
        sort: true,
        stick: false,
        key: 'sku',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 11,
        label: 'GRN Bin',
        search: true,
        sort: true,
        stick: false,
        key: 'bin_no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 11,
        label: 'Put Away Bin',
        search: true,
        sort: true,
        stick: false,
        key: 'bin_no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 1,
        label: 'Location Code',
        search: true,
        sort: true,
        stick: false,
        key: 'location_code',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 8,
        label: 'Created At',
        search: true,
        sort: true,
        stick: false,
        key: 'created_at',
        visible: true,
        minWidth: 12,
        maxWidth: 12
    }
];

export const STATUS_TYPE = {
    WIP: {
        label: 'WIP',
        color: 'info'
    },
    Completed: {
        label: 'Completed',
        color: 'success'
    }
}
