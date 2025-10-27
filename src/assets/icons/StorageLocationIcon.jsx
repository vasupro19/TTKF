/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react'

function StorageLocationIcon(props) {
    return (
        <svg
            width={20}
            height={20}
            fill='currentColor'
            viewBox='0 0 16 16'
            xmlns='http://www.w3.org/2000/svg'
            xmlnsXlink='http://www.w3.org/1999/xlink'
            {...props}
        >
            <path d='M16 4l-8.060-4-7.94 4v1h1v11h2v-9h10v9h2v-11h1v-1zM4 6v-1h2v1h-2zM7 6v-1h2v1h-2zM10 6v-1h2v1h-2z' />
            <path d='M6 9h-1v-1h-1v3h3v-3h-1v1z' />
            <path d='M6 13h-1v-1h-1v3h3v-3h-1v1z' />
            <path d='M10 13h-1v-1h-1v3h3v-3h-1v1z' />
        </svg>
    )
}
export default StorageLocationIcon
