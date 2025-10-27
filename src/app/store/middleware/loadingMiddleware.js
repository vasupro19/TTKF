import {
    setActiveRequests,
    removeActiveRequests,
    incrementGlobalActiveRequest,
    decrementGlobalActiveRequest
} from '../slices/loading'

const loadingMiddleware = storeAPI => next => action => {
    const isPendingAction = action.type.endsWith('/pending')
    const isFulfilledOrRejectedAction = action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected')

    const disableLoader = action?.meta?.disableLoader || action?.meta?.arg?.meta?.disableLoader || false
    const key = action?.meta?.key || action?.meta?.arg?.meta?.key || false

    // if (disableLoader) return next(action) // no-loader for this request, add meta in request

    // if (key) {
    //     if (isPendingAction) {
    //         storeAPI.dispatch(setActiveRequests({ key, value: true }))
    //     } else if (isFulfilledOrRejectedAction) {
    //         storeAPI.dispatch(removeActiveRequests({ key, value: false }))
    //     }
    // } else if (isPendingAction) {
    //     storeAPI.dispatch(incrementGlobalActiveRequest())
    // } else if (isFulfilledOrRejectedAction) {
    //     storeAPI.dispatch(decrementGlobalActiveRequest())
    // }

    return next(action)
}

export default loadingMiddleware
