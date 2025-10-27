/* eslint-disable */

export const locations = [
    {
        id: 1,
        uid: 'UID001',
        unit_price: 50,
        lot: 'DS987',
        discount: '10%',
        tax: '23%',
        qualityCheck: true,
        status: 'PICKED',
        qcReason: ''
    },
    {
        id: 2,
        uid: 'UID002',
        unit_price: 60,
        lot: 'LDS987',
        discount: '5%',
        tax: '18%',
        qualityCheck: false,
        status: 'PACKED',
        qcReason: 'Minor defect'
    },
    {
        id: 3,
        uid: 'UID003',
        unit_price: 75,
        lot: 'LDS7898',
        discount: '15%',
        tax: '12%',
        qualityCheck: true,
        status: 'PICKED',
        qcReason: ''
    },
    {
        id: 4,
        uid: 'UID004',
        unit_price: 45,
        lot: 'LO87687',
        discount: '8%',
        tax: '20%',
        qualityCheck: false,
        status: 'PACKED',
        qcReason: 'Packaging issue'
    },
    {
        id: 5,
        uid: 'UID005',
        unit_price: 90,
        lot: 'LOD988',
        discount: '12%',
        tax: '25%',
        qualityCheck: true,
        status: 'PACKED',
        qcReason: ''
    },
    {
        id: 6,
        uid: 'UID006',
        unit_price: 110,
        lot: 'DS98',
        discount: '10%',
        tax: '15%',
        qualityCheck: false,
        status: 'PICKED',
        qcReason: 'Damaged item'
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
        accessKey: 's_no',
        visible: true,
        minWidth: 3.1,
        maxWidth: 3.1
    },
    {
        id: 1,
        label: 'UID',
        align: 'center',
        search: false,
        sort: false,
        stick: true,
        key: 'uid',
        accessKey: 'uid',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'Unit Price',
        align: 'center',
        search: false,
        sort: false,
        stick: true,
        key: 'unit_price',
        accessKey: 'unit_price',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Status',
        search: false,
        sort: false,
        stick: false,
        key: 'status',
        accessKey: 'status',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 4,
        label: 'Lot',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'lot',
        accessKey: 'lot',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 5,
        label: 'Discount %',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'discount',
        accessKey: 'discount',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'Tax %',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'tax',
        accessKey: 'tax',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 10,
        label: 'Quality Check (QC)',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'qualityCheck',
        accessKey: 'qualityCheck',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 11,
        label: 'QC Reason',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'qcReason',
        accessKey: 'qcReason',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]

export const getImage = stringifiedArray => {
    const imageArray = JSON.parse(stringifiedArray) || []
    return imageArray.length ? imageArray[0] : ''
}
