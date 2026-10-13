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
        borderRight: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        '&:first-of-type': {
            borderLeft: 'none' // Remove left border for the first column
        },
        ...headerCellSX
    }
    return cellStyles
}

export default generateSecondaryHeaderCellStyles
