import { store } from '@store'
import { setPermissionExpired, logout } from '@store/slices/auth'
import { openSnackbar } from '@store/slices/snackbar'
import { removeActiveRequests, setActiveRequests } from '../slices/loading'

/**
 *
 * @param {String} key
 * @param {Boolean} value
 */
export const dispatchLoaderEvent = (key, value = true) => {
    if (value) store.dispatch(setActiveRequests({ key, value }))
    else store.dispatch(removeActiveRequests({ key, value }))
}

/**
 * Handles a custom API response, optionally dispatching a loader event.
 *
 * @param {Object} param0 - The configuration object.
 * @param {Object} param0.result - The raw response object returned from the API call.
 * @param {string} [param0.requestKey=''] - A unique key to identify and manage the loader state.
 * @param {boolean} [param0.removeLoader=true] - Determines whether to remove the loader after handling the response.
 * @returns {Object} - The processed response object (typically parsed JSON or custom formatted response).
 */
export const customResponseHandler = async ({ result, requestKey = '', removeLoader = true }) => {
    console.log(result, 'res')
    if (result.status === 403) store.dispatch(setPermissionExpired()) // ? to fetch new permissions
    if (result.status === 401) store.dispatch(logout()) // ? to logout user manually if user logged out from server
    if (result.status >= 500)
        store.dispatch(
            openSnackbar({
                open: true,
                message: "We're currently experiencing an issue. Please try again later.",
                variant: 'alert',
                alert: { color: 'error' },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )
    if (requestKey && removeLoader) dispatchLoaderEvent(requestKey, false) // ? remove loader
    const contentType = result.headers.get('Content-Type')
    if (contentType && contentType.includes('application/json')) {
        return result.json() // Return JSON success response as-is
    }

    // ? remove if html response are required
    if (contentType.includes('text/html')) {
        store.dispatch(
            openSnackbar({
                open: true,
                message: 'received invalid response!',
                variant: 'alert',
                alert: { color: 'error' },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )
        return null
    }

    const filename =
        result.headers.get('x-filename') || result.headers.get('X-Filename') || `Cerebrum: file ${new Date()}`
    const message =
        result.headers.get('x-message') || result.headers.get('X-Message') || 'please open the file to see errors'

    // auto file download handler
    const fileBlob = await result.blob()
    const fileUrl = URL.createObjectURL(fileBlob)
    const a = document.createElement('a')
    a.href = fileUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(fileUrl)

    return { message }
}

export default customResponseHandler
