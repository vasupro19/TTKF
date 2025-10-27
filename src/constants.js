import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const TIME_ZONE = 'Asia/Kolkata'

export const IST_TIME_STRING = string => dayjs(string).tz(TIME_ZONE).format('HH:mm')

export const IST_STRING_TIME_TO_DATE = string => dayjs(`${dayjs().tz(TIME_ZONE).format('YYYY-MM-DD')} ${string}`)

export const expressions = {
    tin: /^[0-3][0-7]\d{9}$/,
    cin: /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    fssai: /^\d{14}$/,
    gst: /^([0][1-9]|[1-2][0-9]|3[0-8])[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    lat: /^-?([1-8]?[0-9](\.\d+)?|90(\.0+)?)$/,
    long: /^-?(1[0-7][0-9](\.\d+)?|[1-9]?[0-9](\.\d+)?|180(\.0+)?)$/
}

export const strToArray = (str, separator) => {
    if (!str) return []
    return str.split(separator)
}

export const TOGGLE_ALL = 'toggleAll'

export const isExcelQuery = query => {
    const excelStr = '&export=true&ext=csv'
    return query.endsWith(excelStr)
}

export const isEdit = id => id && parseInt(id, 10)

export const TRANSPORTERS = [
    { value: 'transporter1', label: 'Transporter 1' },
    { value: 'transporter2', label: 'Transporter 2' }
]

export const INBOUND_STATUS = {
    0: {
        label: 'Closed',
        color: 'danger',
        id: 0
    },
    1: {
        label: 'Open',
        color: 'info',
        id: 1
    },
    2: {
        label: 'Gate Entry',
        color: 'success',
        id: 2
    },
    3: {
        label: 'GRN',
        color: 'success',
        id: 3
    },
    4: {
        label: 'Partial GRN',
        color: 'success',
        id: 4
    },
    5: {
        label: 'ASN',
        color: 'success',
        id: 5
    },
    6: {
        label: 'Partial Asn',
        color: 'alert',
        id: 6
    },
    7: {
        label: 'Created',
        color: 'success',
        id: 7
    },
    8: {
        label: 'Global Count',
        color: 'success',
        id: 8
    },
    9: {
        label: 'Part Put Away',
        color: 'success',
        id: 9
    }
}

export const OUTBOUND_STATUS = {
    0: {
        label: 'CLOSED',
        color: 'danger',
        variant: 'red',
        id: 0,
        value: 0
    },
    1: {
        label: 'OPEN',
        color: 'info',
        variant: 'blue',
        id: 1,
        value: 1
    },
    2: {
        label: 'PENDING',
        color: 'danger',
        variant: 'red',
        id: 2,
        value: 2,
        type: ['PICK', 'Order']
    },
    3: {
        label: 'PART CONFIRM',
        color: 'success',
        variant: 'green',
        id: 3,
        value: 3,
        type: ['PICK', 'Order']
    },
    4: {
        label: 'CONFIRM',
        color: 'success',
        variant: 'green',
        id: 4,
        value: 4
    },
    5: {
        label: 'PICK PENDING',
        color: 'warning',
        variant: 'yellow',
        id: 5,
        value: 5,
        type: ['PICK']
    },
    6: {
        label: 'PART PICK ASSIGNED',
        color: 'warning',
        variant: 'yellow',
        id: 6,
        value: 6,
        type: ['PICK']
    },
    7: {
        label: 'PICK ASSIGNED',
        color: 'info',
        variant: 'blue',
        id: 7,
        value: 7,
        type: ['PICK']
    },
    8: {
        label: 'PART REGISTERED',
        color: 'info',
        variant: 'blue',
        id: 8,
        value: 8,
        type: ['PICK']
    },
    9: {
        label: 'REGISTERED',
        color: 'primary',
        variant: 'blue',
        id: 9,
        value: 9
    },
    10: {
        label: 'PART PICKED',
        color: 'info',
        variant: 'blue',
        id: 10,
        value: 10,
        type: ['order']
    },
    11: {
        label: 'PICKED',
        color: 'success',
        variant: 'green',
        id: 11,
        value: 11,
        type: ['order']
    },
    12: {
        label: 'PACK STARTED',
        color: 'warning',
        variant: 'yellow',
        id: 12,
        value: 12
    },
    13: {
        label: 'PART PACKED',
        color: 'info',
        variant: 'blue',
        id: 13,
        value: 13
    },
    14: {
        label: 'PACKED',
        color: 'success',
        variant: 'green',
        id: 14,
        value: 14
    },
    15: {
        label: 'PART MANIFEST',
        color: 'info',
        variant: 'blue',
        id: 15,
        value: 15
    },
    16: {
        label: 'MANIFEST',
        color: 'primary',
        variant: 'blue',
        id: 16,
        value: 16
    },
    17: {
        label: 'PART SHIPPED',
        color: 'info',
        variant: 'blue',
        id: 17,
        value: 17
    },
    18: {
        label: 'SHIPPED',
        color: 'success',
        variant: 'green',
        id: 18,
        value: 18
    },
    19: {
        label: 'RETURNED',
        color: 'danger',
        variant: 'red',
        id: 19,
        value: 19
    },
    20: {
        label: 'PART RETURNED',
        color: 'danger',
        variant: 'red',
        id: 20,
        value: 20
    },
    21: {
        label: 'IR CREATED',
        color: 'primary',
        variant: 'blue',
        id: 21,
        value: 21
    },
    22: {
        label: 'PART IR CREATED',
        color: 'primary',
        variant: 'blue',
        id: 22,
        value: 22
    },
    23: {
        label: 'STO DELIVERED',
        color: 'success',
        variant: 'green',
        id: 23,
        value: 23
    },
    24: {
        label: 'STO PART DELIVERED',
        color: 'success',
        variant: 'green',
        id: 24,
        value: 24
    },
    25: {
        label: 'CANCELLED',
        color: 'danger',
        variant: 'red',
        id: 25,
        value: 25
    },
    26: {
        label: 'PNA',
        color: 'danger',
        variant: 'red',
        id: 26,
        value: 26,
        type: ['Pick']
    }
}

export const ORDER_TYPES = {
    B2B: ['B2B', 'Returnable Challan', 'STO', 'Non-Returnable Challan', 'Purchase Return', 'JobWork'],
    B2C: ['B2C', 'Exchange', 'Sample', 'Promotion']
}
export const ASN_TYPE = {
    po: 'PO',
    fresh: 'Fresh',
    sti: 'STI',
    rc: 'Returnable Challan'
}

export const getLocalDateTime = () => {
    const now = new Date()
    const offset = 5.5 * 60 * 60 * 1000 // Convert 5.5 hours to milliseconds
    const istTime = new Date(now.getTime() + offset).toISOString().slice(0, 16)
    return istTime
}

export const formatDateTime = date => {
    if (!date) return ''
    const d = new Date(date)
    const pad = num => String(num).padStart(2, '0') // Ensure 2-digit format

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export const ROLES = Object.freeze({
    MASTER_ADMIN: 1
})
