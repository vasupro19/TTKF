/* eslint-disable */
import StatusBadge from '@core/components/StatusBadge'

export const locations = [
    {
        id: 1,
        accountName: 'NAVNIV',
        UID: '123456776543',
        mappingStatus: <StatusBadge type='danger' label='# N/A' />,
        SKUCode: '',
        EAN: '',
        GRNStatus: <StatusBadge type='danger' label='# N/A' />,
        GRNNo: '',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 12:45',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 13:30'
    },
    {
        id: 2,
        accountName: 'NAVNIV',
        UID: '323454323454',
        mappingStatus: <StatusBadge type='success' label='Available' />,
        SKUCode: 'PC001',
        EAN: '8901111111178',
        GRNStatus: <StatusBadge type='success' label='Available' />,
        GRNNo: 'GRN/01',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 12:45',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 13:30'
    },
    {
        id: 3,
        accountName: 'NAVNIV',
        UID: '23454323454',
        mappingStatus: <StatusBadge type='danger' label='# N/A' />,
        SKUCode: '',
        EAN: '',
        GRNStatus: <StatusBadge type='danger' label='# N/A' />,
        GRNNo: '',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 12:45',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 13:30'
    },
    {
        id: 4,
        accountName: 'NAVNIV',
        UID: '565456765432',
        mappingStatus: <StatusBadge type='success' label='Available' />,
        SKUCode: 'PC001',
        EAN: '8901111111178',
        GRNStatus: <StatusBadge type='danger' label='#N/A' />,
        GRNNo: '',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 12:45',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 13:30'
    },
    {
        id: 5,
        accountName: 'NAVNIV',
        UID: '456765453232',
        mappingStatus: <StatusBadge type='danger' label='# N/A' />,
        SKUCode: '',
        EAN: '',
        GRNStatus: <StatusBadge type='danger' label='# N/A' />,
        GRNNo: '',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 12:45',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 13:30'
    },
    {
        id: 6,
        accountName: 'NAVNIV',
        UID: '234566543234',
        mappingStatus: <StatusBadge type='success' label='Available' />,
        SKUCode: 'PC001',
        EAN: '8901111111178',
        GRNStatus: <StatusBadge type='success' label='Available' />,
        GRNNo: 'GRN/01',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 12:45',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 13:30'
    },
    {
        id: 7,
        accountName: 'NAVNIV',
        UID: '567567567891',
        mappingStatus: <StatusBadge type='danger' label='# N/A' />,
        SKUCode: '',
        EAN: '',
        GRNStatus: <StatusBadge type='danger' label='# N/A' />,
        GRNNo: '',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 12:45',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 13:30'
    },
    {
        id: 8,
        accountName: 'NAVNIV',
        UID: '789789789123',
        mappingStatus: <StatusBadge type='success' label='Available' />,
        SKUCode: 'PC001',
        EAN: '8901111111178',
        GRNStatus: <StatusBadge type='danger' label='#N/A' />,
        GRNNo: '',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 12:45',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 13:30'
    },
    {
        id: 9,
        accountName: 'NAVNIV',
        UID: '345345345123',
        mappingStatus: <StatusBadge type='danger' label='# N/A' />,
        SKUCode: '',
        EAN: '',
        GRNStatus: <StatusBadge type='danger' label='# N/A' />,
        GRNNo: '',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 12:45',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 13:30'
    },
    {
        id: 10,
        accountName: 'NAVNIV',
        UID: '456456456234',
        mappingStatus: <StatusBadge type='success' label='Available' />,
        SKUCode: 'PC001',
        EAN: '8901111111178',
        GRNStatus: <StatusBadge type='success' label='Available' />,
        GRNNo: 'GRN/01',
        createdBy: 'John Doe',
        createdAt: '14-11-2024 12:45',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 13:30'
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
        minWidth: 3.2475,
        maxWidth: 3.2475,
        align: 'left'
    },
    {
        id: 1,
        label: 'Account Name',
        search: false, // temporary false
        sort: false,
        stick: true,
        key: 'name',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'UID',
        search: true,
        sort: true,
        stick: true,
        key: 'uid',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Mapping Status',
        search: false,
        sort: false,
        stick: false,
        key: 'mapping_status',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 4,
        label: 'SKU Code',
        search: true,
        sort: false,
        stick: false,
        key: 'sku_code',
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
        key: 'ean',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'GRN Status',
        search: false,
        sort: true,
        stick: false,
        key: 'grn_status',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },

    {
        id: 7,
        label: 'GRN No',
        search: true,
        sort: true,
        stick: false,
        key: 'grn_no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 8,
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
        id: 9,
        label: 'Created At',
        search: false,
        sort: true,
        stick: false,
        key: 'created_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 10,
        label: 'Updated By',
        search: true,
        sort: true,
        stick: false,
        key: 'modified_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 11,
        label: 'Updated At',
        search: false,
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
