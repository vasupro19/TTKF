const generatePrimaryHeaderCellStyles = (column, stickyLeft, index, headerCellSX, hasData) => {
    const cellStyles = {
        minWidth: `${column?.minWidth}rem`,
        position: { xs: 'static', sm: column.stick && hasData ? 'sticky' : 'static' },
        left: { xs: 'static', sm: column.stick && hasData ? `${stickyLeft}rem` : undefined },
        zIndex: { xs: 'static', sm: column.stick && hasData ? 3 : 'auto' },
        background: 'primary.main',
        '& .MuiTableCell-root': {
            backgroundColor: 'primary.main',
            minWidth: `${column?.minWidth}rem`,
            '&:first-of-type': {
                minWidth: '32px',
                width: '32px'
            }
        },
        padding: '0px',
        borderBottom: '1px solid #BCC1CAFF',
        borderRight: '0.2px solid #dddddd', // Adjust color as needed
        ...headerCellSX
    }
    return cellStyles
}

export default generatePrimaryHeaderCellStyles
