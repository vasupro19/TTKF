/* eslint-disable */
import StatusBadge from '@core/components/StatusBadge'

export const locations = [
    {
        id: 1,
        inventoryType: <StatusBadge type='success' label='Good' />,
        bucketName: 'Electronics - Laptops',
        status: <StatusBadge type='danger' label='# N/A' />,
        createdBy: 'John Doe',
        createdAt: '14-11-2024 10:30',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 12:00'
    },
    {
        id: 2,
        inventoryType: <StatusBadge type='danger' label='Bad' />,
        bucketName: 'Furniture - Office Chairs',
        status: <StatusBadge type='success' label='Available' />,
        createdBy: 'Jane Smith',
        createdAt: '12-11-2024 09:00',
        updatedBy: 'John Doe',
        updatedAt: '15-11-2024 11:00'
    },
    {
        id: 3,
        inventoryType: <StatusBadge type='success' label='Good' />,
        bucketName: 'Clothing - Winter Jackets',
        status: <StatusBadge type='danger' label='# N/A' />,
        createdBy: 'Alice Johnson',
        createdAt: '10-11-2024 08:00',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 10:30'
    },
    {
        id: 4,
        inventoryType: <StatusBadge type='danger' label='Bad' />,
        bucketName: 'Automotive - Car Batteries',
        status: <StatusBadge type='success' label='Available' />,
        createdBy: 'John Doe',
        createdAt: '09-11-2024 14:20',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 13:15'
    },
    {
        id: 5,
        inventoryType: <StatusBadge type='success' label='Good' />,
        bucketName: 'Appliances - Microwave Ovens',
        status: <StatusBadge type='danger' label='# N/A' />,
        createdBy: 'Jane Smith',
        createdAt: '11-11-2024 11:15',
        updatedBy: 'John Doe',
        updatedAt: '15-11-2024 14:10'
    },
    {
        id: 6,
        inventoryType: <StatusBadge type='danger' label='Bad' />,
        bucketName: 'Books - Programming Guides',
        status: <StatusBadge type='success' label='Available' />,
        createdBy: 'Alice Johnson',
        createdAt: '10-11-2024 15:10',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 16:30'
    },
    {
        id: 7,
        inventoryType: <StatusBadge type='success' label='Good' />,
        bucketName: 'Home Decor - Wall Clocks',
        status: <StatusBadge type='danger' label='# N/A' />,
        createdBy: 'Jane Smith',
        createdAt: '12-11-2024 10:00',
        updatedBy: 'John Doe',
        updatedAt: '15-11-2024 14:20'
    },
    {
        id: 8,
        inventoryType: <StatusBadge type='danger' label='Bad' />,
        bucketName: 'Toys - Action Figures',
        status: <StatusBadge type='success' label='Available' />,
        createdBy: 'Alice Johnson',
        createdAt: '09-11-2024 14:00',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 16:00'
    },
    {
        id: 9,
        inventoryType: <StatusBadge type='success' label='Good' />,
        bucketName: 'Tools - Hammers',
        status: <StatusBadge type='danger' label='# N/A' />,
        createdBy: 'John Doe',
        createdAt: '08-11-2024 11:45',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 14:45'
    },
    {
        id: 10,
        inventoryType: <StatusBadge type='danger' label='Bad' />,
        bucketName: 'Groceries - Cereal Boxes',
        status: <StatusBadge type='success' label='Available' />,
        createdBy: 'Alice Johnson',
        createdAt: '11-11-2024 12:30',
        updatedBy: 'Jane Smith',
        updatedAt: '15-11-2024 15:45'
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
        maxWidth: 3.1,
        backEndIndex: 0
    },
    {
        id: 1,
        label: 'Inventory Type',
        align: undefined,
        search: true,
        sort: true,
        stick: true,
        key: 'inventory_type',
        visible: true,
        minWidth: 8,
        maxWidth: 8,
        backEndIndex: 1
    },
    {
        id: 2,
        label: 'Bucket Name',
        align: undefined,
        search: true,
        sort: false,
        stick: true,
        key: 'bucket_name',
        visible: true,
        minWidth: 8,
        maxWidth: 8,
        backEndIndex: 2
    },
    {
        id: 3,
        label: 'Status',
        align: undefined,
        search: false,
        sort: true,
        stick: false,
        key: 'status',
        visible: true,
        minWidth: 8,
        maxWidth: 8,
        backEndIndex: 3
    },
    {
      id: 4,
      label: 'Created By',
      align: undefined,
      search: true,
      sort: false,
      stick: false,
      key: 'created_by',
      visible: true,
      minWidth: 8,
      maxWidth: 8,
      backEndIndex: 4
  },
  {
      id: 5,
      label: 'Created At',
      align: undefined,
      search: false,
      sort: false,
      stick: false,
      key: 'created_at',
      visible: true,
      minWidth: 8,
      maxWidth: 8,
      backEndIndex: 5
  },
  {
      id: 6,
      label: 'Modified By',
      align: undefined,
      search: true,
      sort: false,
      stick: false,
      key: 'modified_by',
      visible: true,
      minWidth: 8,
      maxWidth: 8,
      backEndIndex: 6
  },
  {
      id: 7,
      label: 'Modified At',
      align: undefined,
      search: false,
      sort: false,
      stick: false,
      key: 'modified_at',
      visible: true,
      minWidth: 8,
      maxWidth: 8,
      backEndIndex: 7
  }
]
