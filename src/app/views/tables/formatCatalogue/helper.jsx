/* eslint-disable */

import StatusBadge from "@/core/components/StatusBadge";

export const locations = [
    {
        id: 1,
        accountName: 'NavNiv',
        propertyName: 'Product Code',
        isMandatory: <StatusBadge type='success' label='Yes' />,
        createdBy: 'Alice',
        createdAt: '07-12-2024 10:40',
        modifiedBy: 'Bob',
        modifiedAt: '07-12-2024 11:00'
    },
    {
        id: 2,
        accountName: 'NavNiv',
        propertyName: 'EAN/UPC',
        isMandatory: <StatusBadge type='danger' label='No' />,
        createdBy: 'Charlie',
        createdAt: '07-12-2024 09:20',
        modifiedBy: 'Alice',
        modifiedAt: '07-12-2024 10:50'
    },
    {
        id: 3,
        accountName: 'NavNiv',
        propertyName: 'Product Name',
        isMandatory: <StatusBadge type='success' label='Yes' />,
        createdBy: 'Bob',
        createdAt: '07-12-2024 08:30',
        modifiedBy: 'Charlie',
        modifiedAt: '07-12-2024 09:15'
    },
    {
        id: 4,
        accountName: 'NavNiv',
        propertyName: 'Description',
        isMandatory: <StatusBadge type='danger' label='No' />,
        createdBy: 'Alice',
        createdAt: '07-12-2024 10:15',
        modifiedBy: 'Bob',
        modifiedAt: '07-12-2024 11:20'
    },
    {
        id: 5,
        accountName: 'NavNiv',
        propertyName: 'Category',
        isMandatory: <StatusBadge type='success' label='Yes' />,
        createdBy: 'Charlie',
        createdAt: '07-12-2024 09:00',
        modifiedBy: 'Alice',
        modifiedAt: '07-12-2024 09:45'
    },
    {
        id: 6,
        accountName: 'NavNiv',
        propertyName: 'Unit Cost',
        isMandatory: <StatusBadge type='danger' label='No' />,
        createdBy: 'Bob',
        createdAt: '07-12-2024 08:50',
        modifiedBy: 'Charlie',
        modifiedAt: '07-12-2024 09:40'
    },
    {
        id: 7,
        accountName: 'NavNiv',
        propertyName: 'MRP',
        isMandatory: <StatusBadge type='success' label='Yes' />,
        createdBy: 'Alice',
        createdAt: '07-12-2024 07:30',
        modifiedBy: 'Bob',
        modifiedAt: '07-12-2024 08:10'
    },
    {
        id: 8,
        accountName: 'NavNiv',
        propertyName: 'Expiry',
        isMandatory: <StatusBadge type='success' label='Yes' />,
        createdBy: 'Alice',
        createdAt: '07-12-2024 10:00',
        modifiedBy: 'Bob',
        modifiedAt: '07-12-2024 10:20'
    },
    {
        id: 9,
        accountName: 'NavNiv',
        propertyName: 'MFG',
        isMandatory: <StatusBadge type='danger' label='No' />,
        createdBy: 'Charlie',
        createdAt: '07-12-2024 09:45',
        modifiedBy: 'Alice',
        modifiedAt: '07-12-2024 10:05'
    },
    {
        id: 10,
        accountName: 'NavNiv',
        propertyName: 'LoT',
        isMandatory: <StatusBadge type='success' label='Yes' />,
        createdBy: 'Bob',
        createdAt: '07-12-2024 08:50',
        modifiedBy: 'Charlie',
        modifiedAt: '07-12-2024 09:20'
    },
    {
        id: 11,
        accountName: 'NavNiv',
        propertyName: 'Pick Criteria',
        isMandatory: <StatusBadge type='danger' label='No' />,
        createdBy: 'Alice',
        createdAt: '07-12-2024 09:30',
        modifiedBy: 'Bob',
        modifiedAt: '07-12-2024 10:10'
    },
    {
        id: 12,
        accountName: 'NavNiv',
        propertyName: 'UOM',
        isMandatory: <StatusBadge type='success' label='Yes' />,
        createdBy: 'Charlie',
        createdAt: '07-12-2024 08:20',
        modifiedBy: 'Alice',
        modifiedAt: '07-12-2024 09:10'
    },
    {
        id: 13,
        accountName: 'NavNiv',
        propertyName: 'Colour',
        isMandatory: <StatusBadge type='danger' label='No' />,
        createdBy: 'Bob',
        createdAt: '07-12-2024 07:45',
        modifiedBy: 'Charlie',
        modifiedAt: '07-12-2024 08:30'
    },
    {
        id: 14,
        accountName: 'NavNiv',
        propertyName: 'Image Url',
        isMandatory: <StatusBadge type='success' label='Yes' />,
        createdBy: 'Alice',
        createdAt: '07-12-2024 07:15',
        modifiedBy: 'Bob',
        modifiedAt: '07-12-2024 07:45'
    }
]


export const headers = [
    {
        id: 0,
        label: 'Sr.No.',
        align: 'center',
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
        label: 'Account Name',
        align: 'center',
        search: true,
        sort: true,
        stick: true,
        key: 'account_name',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'Property Name',
        align: 'center',
        search: true,
        sort: true,
        stick: true,
        key: 'property_name',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Is Mandatory',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'is_mandatory',
        visible: true,
        minWidth: 8,
        maxWidth: 8  
    },
    {
        id: 5,
        label: 'Created At',
        align: 'center',
        search: true,
        sort: true,
        stick: false,
        key: 'created_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8  
    },
    {
        id: 4,
        label: 'Created By',
        align: 'center',
        search: true,
        sort: true,
        stick: false,
        key: 'created_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8  
    },
    {
        id: 6,
        label: 'Modified By',
        align: 'center',
        search: true,
        sort: true,
        stick: false,
        key: 'modified_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8  
    },
    {
        id: 7,
        label: 'Modified At',
        align: 'center',
        search: true,
        sort: true,
        stick: false,
        key: 'modified_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8  
    }
]