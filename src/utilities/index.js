/**
 *
 * @param {*} dateStr
 * @returns DD/MM/YYYY, HH:mm AM/PM
 */
export const dateTimeFormatter = dateStr => {
    if (!dateStr) return '-'
    const hasTime = dateStr.includes(':')
    const date = new Date(dateStr.replace(' ', 'T'))

    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(hasTime && { hour: 'numeric', minute: '2-digit', hour12: true })
    }

    const formatter = new Intl.DateTimeFormat('en-GB', options)
    return formatter.format(date)
}

/**
 *
 * @param {*} str
 * @returns Boolean
 */
export const isValidDateString = str => {
    if (typeof str !== 'string') return false

    // Replace space with 'T' if needed to make it ISO-compatible
    const isoStr = str.includes(' ') ? str.replace(' ', 'T') : str

    // Valid formats:
    // - YYYY-MM-DD
    // - YYYY-MM-DDTHH:mm
    // - YYYY-MM-DDTHH:mm:ss
    const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/

    if (!isoRegex.test(isoStr)) return false

    const date = new Date(isoStr)
    return !Number.isNaN(date.getTime())
}

export function createQueryString(params) {
    return Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&')
}

export function getObjectKeys(object) {
    return Object.keys(object)
}

export function getObjectValues(object) {
    return Object.values(object)
}

/**
 * Calculates the number of own enumerable properties in an object.
 * @param {object} object - The object whose keys will be counted.
 * @returns {number} - The number of keys in the object.
 * @throws {TypeError} - If the input is not an object.
 */
export function objectLength(object) {
    if (object === null || typeof object !== 'object') {
        throw new TypeError('Input must be an object')
    }
    return Object.keys(object).length
}

/**
 * Maps over an object's key-value pairs and applies a callback function to each.
 * @param {object} object - The object to iterate over.
 * @param {function} callback - A function to apply to each key-value pair. Receives (key, value) as arguments.
 * @returns {any[]} - An array of results from applying the callback to each key-value pair.
 * @throws {TypeError} - If the input is not an object or the callback is not a function.
 */
export function objectMap(object, callback) {
    if (object === null || typeof object !== 'object') {
        throw new TypeError('Input must be an object')
    }
    if (typeof callback !== 'function') {
        throw new TypeError('Callback must be a function')
    }

    return Object.keys(object).map(key => callback(key, object[key]))
}

/**
 * Converts a string to capitalized words. Handles camelCase, snake_case, and other formats.
 * @param {string} str - The input string to transform.
 * @returns {string} - The transformed string with capitalized words.
 * @throws {TypeError} - If the input is not a string.
 */
export function toCapitalizedWords(str) {
    if (typeof str !== 'string') {
        throw new TypeError('Input must be a string')
    }

    return (
        str
            // Replace camelCase with space before each capital letter
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            // Replace snake_case or kebab-case with spaces
            .replace(/[_-]/g, ' ')
            // Capitalize the first letter of each word
            .replace(/\b\w/g, char => char.toUpperCase())
            // Trim extra spaces
            .trim()
    )
}

/**
 * Finds the index of the last column with the `stick` property set to `true` in a list of columns.
 *
 * @param {Array<Object>} columns - An array of column objects, where each column can have a `stick` property.
 * @returns {number} The index of the last column that has the `stick` property set to `true`. Returns -1 if no such column is found.
 */
export const findLastStickColumnIndex = columns =>
    columns.reduce((lastIndex, column, index) => (column.stick ? index : lastIndex), -1)

/**
 * Description
 * @param {object} params
 * @param {any} prefix=''
 * @returns {any}
 */
export const buildQuery = (params, prefix = '') =>
    Object.keys(params)
        .map(key => {
            console.log(params, prefix)
            const value = params[key]
            const paramKey = prefix ? `${prefix}[${key}]` : key

            if (value === undefined || value === '') return ''

            if (typeof value === 'object' && value !== null) {
                return buildQuery(value, paramKey)
            }

            return `${encodeURIComponent(paramKey)}=${encodeURIComponent(value)}`
        })
        .filter(Boolean)
        .join('&')

/**
 * Creates a debounced version of a function that delays its execution until after
 * a specified delay has elapsed since the last time it was invoked.
 *
 * @function debounce
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds to wait before invoking `func`.
 * @returns {Function} - A debounced version of the provided function.
 *
 * @example
 * const debouncedLog = debounce(() => console.log('Delayed!'), 300)
 * window.addEventListener('resize', debouncedLog)
 */
export const debounce = (func, delay) => {
    let timeoutId
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
    }
}

export const makeUrl = endpoint =>
    `${import.meta.env.VITE_APP_BASE_URL}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`

/**
 * Determines the position ("left", "right", "center") based on the type of the input value.
 *
 * - Returns "left" if the value is a string.
 * - Returns "right" if the value is a date in any format or a phone number.
 * - Returns "center" if the value is an object.
 *
 * @param {*} value - The input value to evaluate.
 * @returns {string} - The position ("left", "right", "center") based on the input value.
 */
export function determinePosition(value) {
    // Check if the value is a string
    if (typeof value === 'string') {
        /* eslint-disable */
        const dateRegex =
            /^(?:\d{1,2}(?:[-\/\s]\d{1,2}){0,2}[-\/\s]\d{2,4}|\d{4}(?:[-\/\s]\d{1,2}){0,2})(?:\s\d{1,2}:\d{2})?$/
        const phoneRegex = /^\+?(\d{1,3})?[-.\s]?(\d{1,4}[-.\s]?){1,3}\d{1,4}$/
        // eslint-enable

        if (dateRegex.test(value) || phoneRegex.test(value)) {
            return 'right'
        }

        return 'left'
    }

    // Check if the value is a Date object
    if (Object.prototype.toString.call(value) === '[object Date]') {
        return 'right'
    }

    // Check if the value is an object
    if (typeof value === 'object' && value !== null) {
        return 'center'
    }

    if (typeof value === 'number' && value !== null) {
        return 'right'
    }

    // Default case
    return 'left'
}

/**
 * Formats a given date into "YYYY-MM-DD HH:mm" format.
 * If no date is provided, the current date and time will be used.
 *
 * @param {Date|string|null} dateInput - The date to format. Can be a Date object, a date string, or null/undefined.
 * @returns {string} The formatted date in "YYYY-MM-DD HH:mm" format.
 */
export function formatDate(dateInput) {
    const date = dateInput ? new Date(dateInput) : new Date()

    if (isNaN(date.getTime())) {
        throw new Error('Invalid date provided')
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * Generates a random alphanumeric string in uppercase.
 *
 * @param {string} [prefix=''] - Optional prefix to add at the beginning of the generated string.
 * @param {number} [length=10] - Optional length of the random part of the string (excluding the prefix). Default is 10.
 * @returns {string} The generated random alphanumeric string in uppercase.
 *
 * @example
 * generateRandomString() // "A1B2C3D4E5"
 * generateRandomString("ID_", 8) // "ID_XYZ9AB12"
 */
export function generateRandomString(prefix = '', length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let randomStr = ''

    for (let i = 0; i < length; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return prefix.toUpperCase() + randomStr
}

/**
 * Recursively flattens a nested array of route objects into a Map keyed by their path.
 * Each route object may contain a 'path' and optionally a 'children' array.
 *
 * @param {Array<Object>} routes - The nested array of route objects.
 * @returns {Map<string, Object>} A Map where keys are route paths and values are the route objects.
 */
export function flattenRoutes(routes) {
    const flatRoutesMap = new Map()

    function traverse(routeList) {
        routeList.forEach(route => {
            // Add the current route to the map if it has a path
            if (route.path) {
                flatRoutesMap.set(route.path, route)
            }

            // Recursively traverse children if they exist
            if (route.children) {
                traverse(route.children)
            }
        })
    }

    traverse(routes)
    return flatRoutesMap
}

/**
 * Generates breadcrumb navigation data for a given route using a flattened route Map.
 *
 * The function splits the current route into segments and accumulates the path for each segment.
 * For each accumulated path, it checks if the route exists in the map.
 * If it exists, it sets 'isAvailable' to false if the route has children (i.e. it's not a terminal route);
 * otherwise, 'isAvailable' is true.
 *
 * @param {string} currentRoute - The current route path (e.g. '/master/warehouse/bins/mapStorageLocation').
 * @param {Map<string, Object>} flatRoutesMap - A Map of flattened routes keyed by their path.
 * @returns {Object} An object where keys are the accumulated route segments and values contain breadcrumb info.
 *
 * @example
 * // Assuming a routes structure as follows:
 * const protectedRoutes = {
 *   children: [
 *     {
 *       path: '/master',
 *       children: [
 *         {
 *           path: '/master/warehouse',
 *           children: [
 *             { path: '/master/warehouse/bins' },
 *             { path: '/master/warehouse/bins/mapStorageLocation' }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * const flatRoutesMap = flattenRoutes(protectedRoutes.children)
 * const currentRoute = '/master/warehouse/bins/mapStorageLocation'
 * const breadcrumbs = generateBreadcrumbs(currentRoute, flatRoutesMap)
 * console.log(breadcrumbs)
 *
 * // Expected sample output:
 * // {
 * //   '/master': {
 * //     isAvailable: false, // Because it has children
 * //     path: '/master'
 * //   },
 * //   '/master/warehouse': {
 * //     isAvailable: false, // Because it has children
 * //     path: '/master/warehouse'
 * //   },
 * //   '/master/warehouse/bins': {
 * //     isAvailable: true, // Because it does NOT have children
 * //     path: '/master/warehouse/bins'
 * //   },
 * //   '/master/warehouse/bins/mapStorageLocation': {
 * //     isAvailable: true, // Because it does NOT have children
 * //     path: '/master/warehouse/bins/mapStorageLocation'
 * //   }
 * // }
 */
export function generateBreadcrumbs(currentRoute, flatRoutesMap) {
    const breadcrumbs = {}
    const routeSegments = currentRoute.split('/').filter(Boolean)
    let accumulatedPath = ''

    // Build breadcrumbs for each segment of the route
    for (let i = 0; i < routeSegments.length; i++) {
        accumulatedPath += `/${routeSegments[i]}`

        // Check if this accumulated path exists in the Map
        if (flatRoutesMap.has(accumulatedPath)) {
            const routeData = flatRoutesMap.get(accumulatedPath)
            // Determine if the route has children (and if the first child is not an index route)
            const hasChildren = routeData && routeData.children && !routeData?.children[0]?.index
            breadcrumbs[accumulatedPath] = {
                isAvailable: !hasChildren,
                path: accumulatedPath
            }
        } else {
            breadcrumbs[accumulatedPath] = {
                isAvailable: false,
                path: accumulatedPath
            }
        }
    }

    return breadcrumbs
}

// -------------------
// Sample usage:

// Example routes structure
// const protectedRoutes = {
//   children: [
//     {
//       path: '/master',
//       children: [
//         {
//           path: '/master/warehouse',
//           children: [
//             { path: '/master/warehouse/bins' },
//             { path: '/master/warehouse/bins/mapStorageLocation' }
//           ]
//         }
//       ]
//     }
//   ]
// }

// // Flatten the routes into a Map
// const flatRoutesMap = flattenRoutes(protectedRoutes.children)
// // Define a current route
// const currentRoute = '/master/warehouse/bins/mapStorageLocation'
// // Generate breadcrumbs based on the current route and flattened routes
// const breadcrumbs = generateBreadcrumbs(currentRoute, flatRoutesMap)
// console.log(breadcrumbs)

/**
 * Returns a custom style object for MUI components
 *
 * @returns {object} Custom styles for MUI components
 */
export function getCustomSx() {
    return {
        '& input': {
            backgroundColor: '#fff'
        },
        // '& .MuiInputBase-input': {
        //     backgroundColor: 'transparent' // Keeps background normal
        // },
        '& .MuiInputBase-root.MuiOutlinedInput-root': {
            backgroundColor: 'white'
        },
        '& .MuiInputBase-root-MuiOutlinedInput-root': {
            backgroundColor: '#fff'
        }
    }
}

export const getReadOnlyInputSx = () => ({
    '& input': {
        backgroundColor: '#fff',
        padding: '10px 6px',
        height: '20px'
    },
    '& .MuiOutlinedInput-root': {
        '&:hover': {
            borderColor: 'transparent'
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            border: '1px solid #000'
        }
    },
    '& .MuiInputBase-input': {
        cursor: 'default',
        userSelect: 'text',
        backgroundColor: 'transparent',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        backgroundColor: 'white'
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'gray'
    },
    flexGrow: 1
})

/**
 * Downloads a file from a given URL or path.
 *
 * @param {string} url - The URL or path to the file to download
 * @param {string} [filename] - Optional filename to save the file as
 */
export function downloadFile(url, filename) {
    const link = document.createElement('a')
    link.href = url

    // Set the download attribute only if filename is provided
    if (filename) {
        link.download = filename
    } else {
        // fallback to filename from URL
        const parts = url.split('/')
        link.download = parts[parts.length - 1] || 'download'
    }

    // Append to the DOM to trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

export const getScannableInputSx = () => ({
    '& input': {
        backgroundColor: '#fff',
        padding: '12px 8px',
        height: '14px',
        borderRight: '1px solid',
        borderColor: 'gray',
        borderRadius: '8px 0px 0px 8px'
    },
    // Change borderRight color on hover
    '& input:hover': {
        borderRightColor: 'primary.main'
    },
    // Change borderRight color when focused
    '& input:focus': {
        borderRight: '2px solid',
        borderRightColor: 'primary.main'
    }
})

/**
 * Masks a portion of the given string by replacing the middle part with asterisks (*).
 * Keeps a specified number of characters at the beginning (`front`) and end (`back`) unchanged.
 * If the string is too short to mask (length <= front + back), returns the original string.
 * If input is invalid, returns an empty string.
 *
 * @param {string} itemId - The input string to be masked.
 * @param {number} [front=5] - Number of characters to keep unmasked at the start.
 * @param {number} [back=0] - Number of characters to keep unmasked at the end.
 * @returns {string} - The masked string, original string if too short, or empty string on invalid input.
 */
export const maskItemId = (itemId, front = 5, back = 0) => {
    if (typeof itemId !== 'string') return ''
    if (!Number.isInteger(front) || front < 0) return ''
    if (!Number.isInteger(back) || back < 0) return ''

    const len = itemId.length
    if (len <= front + back) return itemId

    const start = itemId.slice(0, front)
    const end = itemId.slice(len - back)
    const middleMask = '*'.repeat(len - front - back)

    return start + middleMask + end
}

import jsPDF from 'jspdf'
import QRCode from 'qrcode'

export const handleQRGeneration = async (values, name) => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: [50 * 2.83465, 25 * 2.83465] // 50mm x 25mm dimensions
    })
    // Label dimensions in points (for 25mm x 50mm)
    const labelWidth = 50 * 2.83465 // Convert 50mm to points
    const labelHeight = 25 * 2.83465 // Convert 25mm to points

    const fontSize = 8 // Font size for the text
    // const fontBold = 'bold' // Font weight for bold text
    const qrCodeSize = 40 // Size of the QR code in the PDF
    const gapBetweenQrAndText = 10 // Gap between QR code and ID text
    const gapBetweenTextAndTopText = 0 // Gap between "wms.cerebrum.io" and the QR code/text area

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < values.length; i++) {
        const id = values[i]

        // Generate QR code as a base64 image
        // eslint-disable-next-line no-await-in-loop
        const qrCodeImage = await QRCode.toDataURL(id, {
            width: 100, // Width of the QR code
            margin: 0 // No margin around the QR code
        })

        // Define QR code position and dimensions
        const qrCodeX = (labelWidth - qrCodeSize) / 2 // Center QR code horizontally
        const qrCodeY = 15 + gapBetweenTextAndTopText // Add some spacing from the top for "wms.cerebrum.io" text

        // Add the QR code image to the PDF
        doc.addImage(qrCodeImage, 'PNG', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize)

        // Add ID text below the QR code
        const idTextY = qrCodeY + qrCodeSize + gapBetweenQrAndText // Place text below the QR code
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', 'bold') // Set font weight to bold
        doc.text(id, labelWidth / 2, idTextY, { align: 'center' }) // Center-align the text

        // Add the "wms.cerebrum.io" text at the top of the label
        const topTextY = 10 // Text near the top of the label
        doc.setFontSize(6)
        doc.setFont('helvetica', 'normal') // Set top text to normal font
        doc.text(import.meta.env.VITE_APP_URI || '', labelWidth / 2, topTextY, { align: 'center' })

        // Add a new page for the next label unless it's the last label
        if (i < values.length - 1) {
            doc.addPage([labelWidth, labelHeight]) // Set page size for the label
        }
    }

    doc.save(`${name}_qrcodes.pdf`)
}
