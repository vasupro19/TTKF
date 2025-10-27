import { createListenerMiddleware, addListener } from '@reduxjs/toolkit'

export const listenerMiddleware = createListenerMiddleware()

export const startAppListening = listenerMiddleware.startListening
export const addAppListener = addListener
