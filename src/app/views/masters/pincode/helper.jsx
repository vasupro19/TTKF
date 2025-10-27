/* eslint-disable */
export const locations = [
    {
        id: 1,
        pincode: '110001',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        createdBy: 'user1',
        createdAt: '2023-01-10T10:00:00',
        modifiedBy: 'user2',
        modifiedAt: '2023-01-15T12:00:00'
    },
    {
        id: 2,
        pincode: '750001',
        city: 'Bhubaneswar',
        state: 'Odisha',
        country: 'India',
        createdBy: 'user3',
        createdAt: '2023-02-11T11:30:00',
        modifiedBy: 'user4',
        modifiedAt: '2023-02-20T15:45:00'
    },
    {
        id: 3,
        pincode: '400001',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        createdBy: 'user5',
        createdAt: '2023-03-05T09:20:00',
        modifiedBy: 'user6',
        modifiedAt: '2023-03-22T17:10:00'
    },
    {
        id: 4,
        pincode: '500001',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        createdBy: 'user7',
        createdAt: '2023-04-01T13:15:00',
        modifiedBy: 'user8',
        modifiedAt: '2023-04-18T14:30:00'
    },
    {
        id: 5,
        pincode: '600001',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        createdBy: 'user9',
        createdAt: '2023-05-12T08:45:00',
        modifiedBy: 'user10',
        modifiedAt: '2023-05-25T21:55:00'
    },
    {
        id: 6,
        pincode: '110001',
        city: 'Dehradun',
        state: 'Uttarakhand',
        country: 'India',
        createdBy: 'user1',
        createdAt: '2023-06-10T10:00:00',
        modifiedBy: 'user2',
        modifiedAt: '2023-06-12T12:00:00'
    },
    {
        id: 7,
        pincode: '700001',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        createdBy: 'user3',
        createdAt: '2023-07-15T16:00:00',
        modifiedBy: 'user4',
        modifiedAt: '2023-07-20T18:30:00'
    },
    {
        id: 8,
        pincode: '380001',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        createdBy: 'user5',
        createdAt: '2023-08-20T14:50:00',
        modifiedBy: 'user6',
        modifiedAt: '2023-08-28T19:05:00'
    },
    {
        id: 9,
        pincode: '141001',
        city: 'Ludhiana',
        state: 'Punjab',
        country: 'India',
        createdBy: 'user7',
        createdAt: '2023-09-01T11:25:00',
        modifiedBy: 'user8',
        modifiedAt: '2023-09-10T13:40:00'
    },
    {
        id: 10,
        pincode: '400707',
        city: 'Navi Mumbai',
        state: 'Maharashtra',
        country: 'India',
        createdBy: 'user9',
        createdAt: '2023-09-15T15:15:00',
        modifiedBy: 'user10',
        modifiedAt: '2023-09-30T11:30:00'
    }
]


export const headers = [
    {
        id: 1,
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
        id: 0,
        label: 'Pin/Zip Code',
        align: 'center',
        search: true,
        sort: true,
        stick: true,
        key: 'pincode',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'City',
        align: 'center',
        search: true,
        sort: true,
        stick: true,
        key: 'city',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'State',
        align: 'center',
        search: true,
        sort: true,
        stick: false,
        key: 'state',
        visible: true,
        minWidth: 8,
        maxWidth: 8  
    },
    {
        id: 4,
        label: 'Country',
        align: 'center',
        search: true,
        sort: true,
        stick: false,
        key: 'country',
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
        id: 6,
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
        id: 7,
        label: 'Modified At',
        align: 'center',
        search: true,
        sort: true,
        stick: false,
        key: 'updated_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8  
    }
]