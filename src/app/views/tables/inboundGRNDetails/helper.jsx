/* eslint-disable */
import StatusBadge from '@core/components/StatusBadge'

export const locations = [
    {
      id: '1',
      user_name: 'John Doe',
      item_id: 'ITM001',
      EAN: '8901234567891',
      grn_bin: 'GRN001',
      created_at: '20-01-2025 09:00',
      table_id: 'TBL001',
      box_id: 'BX001',
      batch: 'B001',
      MFG: '06-01-2025 09:00', 
      MRP: '₹7878',
      Expire: '06-01-2026 09:00',
      QC: 'OK',
      QC_Reason: '',
      Config: {
        baseDoc: 'boxId',
        processConfig: 'normalConfig',
        additionalConfig: ['defaultQC', 'RFID']
      }
    },
    {
      id: '2',
      user_name: 'Jane Smith',
      item_id: 'ITM002',
      EAN: '8901234567892',
      grn_bin: 'GRN002',
      created_at: '21-01-2025 10:15',
      table_id: 'TBL002',
      box_id: 'BX002',
      batch: 'B002',
      MFG: '07-01-2025 08:30', 
      MRP: '₹118',
      Expire: '07-01-2026 08:30',
      QC: 'Reject',
      QC_Reason: 'Expired',
      Config: {
        baseDoc: 'boxId',
        processConfig: 'normalConfig',
        additionalConfig: ['defaultQC']
      }
    },
    {
      id: '3',
      user_name: 'Alice Johnson',
      item_id: 'ITM003',
      EAN: '8901234567893',
      grn_bin: 'GRN003',
      created_at: '22-01-2025 11:45',
      table_id: 'TBL003',
      box_id: 'BX003',
      batch: 'B003',
      MFG: '08-01-2025 10:00', 
      MRP: '₹228',
      Expire: '08-01-2026 10:00',
      QC: 'OK',
      QC_Reason: '',
      Config: {
        baseDoc: 'boxId',
        processConfig: 'specialConfig',
        additionalConfig: []
      }
    },
    {
      id: '4',
      user_name: 'Bob Brown',
      item_id: 'ITM004',
      EAN: '8901234567894',
      grn_bin: 'GRN004',
      created_at: '23-01-2025 12:30',
      table_id: 'TBL004',
      box_id: 'BX004',
      batch: 'B004',
      MFG: '09-01-2025 11:15', 
      MRP: '₹278',
      Expire: '09-01-2026 11:15',
      QC: 'Reject',
      QC_Reason: 'Misprint',
      Config: {
        baseDoc: 'boxId',
        processConfig: 'normalConfig',
        additionalConfig: ['defaultQC', 'RFID']
      }
    },
    {
      id: '5',
      user_name: 'Charlie Davis',
      item_id: 'ITM005',
      EAN: '8901234567895',
      grn_bin: 'GRN005',
      created_at: '24-01-2025 14:00',
      table_id: 'TBL005',
      box_id: 'BX005',
      batch: 'B005',
      MFG: '10-01-2025 13:20', 
      MRP: '₹878',
      Expire: '10-01-2026 13:20',
      QC: 'OK',
      QC_Reason: '',
      Config: {
        baseDoc: 'boxId',
        processConfig: 'specialConfig',
        additionalConfig: []
      }
    },
    {
      id: '6',
      user_name: 'David Miller',
      item_id: 'ITM006',
      EAN: '8901234567896',
      grn_bin: 'GRN006',
      created_at: '25-01-2025 15:30',
      table_id: 'TBL006',
      box_id: 'BX006',
      batch: 'B006',
      MFG: '11-01-2025 14:00', 
      MRP: '₹98',
      Expire: '11-01-2026 14:00',
      QC: 'Reject',
      QC_Reason: 'Leaking',
      Config: {
        baseDoc: 'boxId',
        processConfig: 'normalConfig',
        additionalConfig: ['defaultQC']
      }
    },
    {
      id: '7',
      user_name: 'Emily White',
      item_id: 'ITM007',
      EAN: '8901234567897',
      grn_bin: 'GRN007',
      created_at: '26-01-2025 16:45',
      table_id: 'TBL007',
      box_id: 'BX007',
      batch: 'B007',
      MFG: '12-01-2025 15:30', 
      MRP: '₹178',
      Expire: '12-01-2026 15:30',
      QC: 'OK',
      QC_Reason: '',
      Config: {
        baseDoc: 'boxId',
        processConfig: 'specialConfig',
        additionalConfig: []
      }
    },
    {
      id: '8',
      user_name: 'Michael Scott',
      item_id: 'ITM008',
      EAN: '8901234567898',
      grn_bin: 'GRN008',
      created_at: '27-01-2025 17:15',
      table_id: 'TBL008',
      box_id: 'BX008',
      batch: 'B008',
      MFG: '13-01-2025 16:00', 
      MRP: '₹8878',
      Expire: '13-01-2026 16:00',
      QC: 'Reject',
      QC_Reason: 'Damaged in edges',
      Config: {
        baseDoc: 'boxId',
        processConfig: 'normalConfig',
        additionalConfig: ['defaultQC', 'RFID']
      }
    },
    {
      id: '9',
      user_name: 'Sarah Green',
      item_id: 'ITM009',
      EAN: '8901234567899',
      grn_bin: 'GRN009',
      created_at: '28-01-2025 18:00',
      table_id: 'TBL009',
      box_id: 'BX009',
      batch: 'B009',
      MFG: '14-01-2025 17:30', 
      MRP: '₹878',
      Expire: '14-01-2026 17:30',
      QC: 'OK',
      QC_Reason: '',
      Config: {
        baseDoc: 'boxId',
        processConfig: 'specialConfig',
        additionalConfig: []
      }
    },
    {
      id: '10',
      user_name: 'Robert King',
      item_id: 'ITM010',
      EAN: '8901234567900',
      grn_bin: 'GRN010',
      created_at: '29-01-2025 19:00',
      table_id: 'TBL010',
      box_id: 'BX010',
      batch: 'B010',
      MFG: '15-01-2025 18:00', 
      MRP: '₹775',
      Expire: '15-01-2026 18:00',
      QC: 'Reject',
      QC_Reason: 'Misprint',
      Config: {
        baseDoc: 'boxId',
        processConfig: 'normalConfig',
        additionalConfig: ['defaultQC', 'RFID']
      }
    }
  ]
  


  export const headers = [
    {
        id: 99,
        label: 'Sr No.',
        search: false,
        sort: false,
        stick: true,
        key: 's_no',
        isFrontend: true,
        visible: true,
        minWidth: 3.1,
        maxWidth: 3.1,
        align: 'center'
    },
    {
        id: 3,
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
        id: 0,
        label: 'Item Id',
        search: true,
        sort: true,
        stick: true,
        key: 'item_id',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
      id: 1,
      label: 'Table Id',
      search: true,
      sort: true,
      stick: false,
      key: 'table_id',
      visible: true,
      minWidth: 8,
      maxWidth: 8
  },
  {
    id: 400,
    label: 'Box Id',
    search: true,
    sort: true,
    stick: false,
    key: 'box_id',
    visible: true,
    minWidth: 8,
    maxWidth: 8
},
{
  id: 2,
  label: 'GRN Bin Id',
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
        id: 10,
        label: 'Batch',
        search: true,
        sort: true,
        stick: false,
        key: 'batch',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
      id: 4,
      label: 'MRP',
      search: true,
      sort: true,
      stick: false,
      key: 'mrp',
      visible: true,
      minWidth: 8,
      maxWidth: 8
  },
    {
        id: 5,
        label: 'MFG',
        search: true,
        sort: true,
        stick: false,
        key: 'mfd_date',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'Expire',
        search: true,
        sort: true,
        stick: false,
        key: 'expiry_date',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 7,
        label: 'QC',
        align:'center',
        search: true,
        sort: true,
        stick: false,
        key: 'qc_status',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 8,
        label: 'QC Reason',
        search: true,
        sort: true,
        stick: false,
        key: 'reject_reason',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 9,
        label: 'Created At',
        search: true,
        sort: true,
        stick: false,
        key: 'created_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    // {
    //     id: 14,
    //     label: 'Config',
    //     search: true,
    //     sort: false,
    //     stick: false,
    //     key: 'Config',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // }
];


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
