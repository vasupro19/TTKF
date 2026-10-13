const generatePrimaryHeaderCellStyles = (column, stickyLeft, index, headerCellSX, hasData) => {
    const cellStyles = {
        minWidth: `${column?.minWidth}rem`,
        position: { xs: 'static', sm: column.stick && hasData ? 'sticky' : 'static' },
        left: { xs: 'static', sm: column.stick && hasData ? `${stickyLeft}rem` : undefined },
        zIndex: { xs: 'static', sm: column.stick && hasData ? 3 : 'auto' },
        background: '#f8fafc',
        '& .MuiTableCell-root': {
            backgroundColor: '#f8fafc',
            minWidth: `${column?.minWidth}rem`,
            '&:first-of-type': {
                minWidth: '32px',
                width: '32px'
            }
        },
        padding: '0px',
        borderBottom: '1px solid #e2e8f0',
        borderRight: '1px solid #e2e8f0',
        ...headerCellSX
    }
    return cellStyles
}

export default generatePrimaryHeaderCellStyles
