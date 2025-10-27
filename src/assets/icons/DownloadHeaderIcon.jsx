/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react'

function DownloadHeaderIcon(props) {
    return (
        <svg
            width='32px'
            height='32px'
            viewBox='0 0 16 16'
            xmlns='http://www.w3.org/2000/svg'
            xmlnsXlink='http://www.w3.org/1999/xlink'
            {...props}
        >
            <path fill='currentColor' d='M16 10h-5.5l-2.5 2.5-2.5-2.5h-5.5v6h16v-6zM4 14h-2v-2h2v2z' />
            <path fill='currentColor' d='M10 6v-6h-4v6h-3l5 5 5-5z' />
        </svg>
    )
}
export default DownloadHeaderIcon
