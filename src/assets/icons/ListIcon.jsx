import * as React from 'react'
import { useTheme } from '@mui/material/styles'

function ListIcon(props) {
    const theme = useTheme()
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='1.5em'
            height='1.5em'
            fill={theme.palette.text.paper} // Uses text primary color
            stroke={theme.palette.text.paper} // Uses secondary main color
            strokeWidth='3'
            className='h-6 w-6'
            viewBox='0 0 256 256'
            /*eslint-disable*/
            {...props}
        >
            <path d='M120 64a8 8 0 0 1-8 8H40a8 8 0 0 1 0-16h72a8 8 0 0 1 8 8Zm-8 32H40a8 8 0 0 0 0 16h72a8 8 0 0 0 0-16Zm0 40H40a8 8 0 0 0 0 16h72a8 8 0 0 0 0-16Zm0 40H40a8 8 0 0 0 0 16h72a8 8 0 0 0 0-16Zm32-104h72a8 8 0 0 0 0-16h-72a8 8 0 0 0 0 16Zm72 24h-72a8 8 0 0 0 0 16h72a8 8 0 0 0 0-16Zm0 40h-72a8 8 0 0 0 0 16h72a8 8 0 0 0 0-16Zm0 40h-72a8 8 0 0 0 0 16h72a8 8 0 0 0 0-16Z'></path>
            {/* /*eslint-enable*/}
        </svg>
    )
}

export default ListIcon
