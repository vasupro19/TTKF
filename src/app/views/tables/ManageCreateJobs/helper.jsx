/* eslint-disable */
import StatusBadge from '@core/components/StatusBadge'

export const locations = [
    {
        id: 1,
        user_name: 'John Doe',
        bin_id: 'BIN001',
        location: 'LOC001A',
        item_id: 'ITM001',
        EAN: '8901234567891',
        putaway_status: 'Completed',
        started_at: '20-01-2025 09:00',
        completed_at: '20-01-2025 09:30'
    },
    {
        id: 2,
        user_name: 'Jane Smith',
        bin_id: 'BIN002',
        location: 'LOC002B',
        item_id: 'ITM002',
        EAN: '8901234567892',
        putaway_status: 'WIP',
        started_at: '21-01-2025 11:00',
        completed_at: '21-01-2025 11:30'
    },
    {
        id: 3,
        user_name: 'Alice Brown',
        bin_id: 'BIN003',
        location: 'LOC003C',
        item_id: 'ITM003',
        EAN: '8901234567893',
        putaway_status: 'Completed',
        started_at: '22-01-2025 10:00',
        completed_at: '22-01-2025 10:30'
    },
    {
        id: 4,
        user_name: 'Bob Green',
        bin_id: 'BIN004',
        location: 'LOC004D',
        item_id: 'ITM004',
        EAN: '8901234567894',
        putaway_status: 'WIP',
        started_at: '23-01-2025 12:00',
        completed_at: '23-01-2025 12:30'
    },
    {
        id: 5,
        user_name: 'Chris White',
        bin_id: 'BIN005',
        location: 'LOC005E',
        item_id: 'ITM005',
        EAN: '8901234567895',
        putaway_status: 'Completed',
        started_at: '24-01-2025 08:00',
        completed_at: '24-01-2025 08:30'
    },
    {
        id: 6,
        user_name: 'Dana Black',
        bin_id: 'BIN006',
        location: 'LOC006F',
        item_id: 'ITM006',
        EAN: '8901234567896',
        putaway_status: 'WIP',
        started_at: '25-01-2025 14:00',
        completed_at: '25-01-2025 14:30'
    },
    {
        id: 7,
        user_name: 'Evan Grey',
        bin_id: 'BIN007',
        location: 'LOC007G',
        item_id: 'ITM007',
        EAN: '8901234567897',
        putaway_status: 'Completed',
        started_at: '26-01-2025 15:00',
        completed_at: '26-01-2025 15:30'
    },
    {
        id: 8,
        user_name: 'Fiona Blue',
        bin_id: 'BIN008',
        location: 'LOC008H',
        item_id: 'ITM008',
        EAN: '8901234567898',
        putaway_status: 'WIP',
        started_at: '27-01-2025 16:00',
        completed_at: '27-01-2025 16:30'
    },
    {
        id: 9,
        user_name: 'George Red',
        bin_id: 'BIN009',
        location: 'LOC009I',
        item_id: 'ITM009',
        EAN: '8901234567899',
        putaway_status: 'Completed',
        started_at: '28-01-2025 17:00',
        completed_at: '28-01-2025 17:30'
    },
    {
        id: 10,
        user_name: 'Hannah Violet',
        bin_id: 'BIN010',
        location: 'LOC010J',
        item_id: 'ITM010',
        EAN: '8901234567800',
        putaway_status: 'WIP',
        started_at: '29-01-2025 18:00',
        completed_at: '29-01-2025 18:30'
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
        maxWidth: 3.1
    },
    // {
    //     id: 1,
    //     label: 'User Name',
    //     search: true,
    //     sort: true,
    //     stick: true,
    //     key: 'user_name',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    {
        id: 2,
        label: 'GRN Bin Id',
        search: true,
        sort: true,
        stick: false,
        key: 'bin_id',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Location',
        search: true,
        sort: true,
        stick: false,
        key: 'location',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 4,
        label: 'Item Id',
        search: true,
        sort: true,
        stick: false,
        key: 'item_id',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 5,
        label: 'EAN',
        search: true,
        sort: true,
        stick: false,
        key: 'EAN',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'Job Status',
        search: true,
        sort: true,
        stick: false,
        key: 'putaway_status',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 7,
        label: 'Started At',
        search: true,
        sort: true,
        stick: false,
        key: 'started_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 8,
        label: 'Completed At',
        search: true,
        sort: true,
        stick: false,
        key: 'completed_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]


export const STATUS_TYPE = {
    'WIP': {
        label: 'WIP',
        color: 'info'
    },
    'Completed': {
        label: 'Completed',
        color: 'success'
    }
}
