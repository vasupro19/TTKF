const generateSecondaryHeaderCellStyles = (column, stickyLeftHeaderSearchRow, index, headerCellSX, hasData) => {
    const cellStyles = {
        minWidth: `${column?.minWidth}rem`,
        padding: '2px 8px',
        position: { xs: 'static', sm: column.stick && hasData ? 'sticky' : 'static' },
        left: { xs: 'static', sm: column.stick && hasData ? `${stickyLeftHeaderSearchRow}rem` : undefined },
        zIndex: { xs: 'static', sm: column.stick && hasData ? 3 : 'auto' },
        background: '#fff',
        '& .MuiTableCell-root': {
            backgroundColor: '#fff',
            '&:first-of-type': {
                minWidth: '32px',
                width: '32px'
            }
        },
        borderRight: '0.2px solid #dddddd', // Adjust color as needed
        '&:first-of-type': {
            borderLeft: 'none' // Remove left border for the first column
        },
        ...headerCellSX
    }
    return cellStyles
}

export default generateSecondaryHeaderCellStyles
