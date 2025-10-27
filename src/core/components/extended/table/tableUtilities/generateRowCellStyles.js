import { determinePosition } from '../../../../../utilities'

/* eslint-disable no-nested-ternary */
const generateRowCellStyles = (
    column,
    row,
    isSelected,
    stickyLeftRow,
    rowCellSX,
    indexVal,
    showStripes,
    value,
    isLoading
) => {
    const isRowSelected = isLoading ? false : isSelected(row.id)
    const isSticky = column.stick
    const isEvenRow = indexVal % 2 === 0

    const backgroundColor = showStripes
        ? isRowSelected
            ? '#E3E3E3'
            : isEvenRow
              ? '#f5f5f5'
              : '#ffffff'
        : isRowSelected && isSticky
          ? '#E3E3E3'
          : isSticky
            ? '#fff'
            : 'rgba(44, 44, 44, 0.009)'

    const cellStyles = {
        minWidth: `${column?.minWidth}rem`,
        maxWidth: `${column?.maxWidth}rem`,
        position: { xs: 'static', sm: isSticky ? 'sticky' : 'static' },
        left: { xs: 'static', sm: isSticky ? `${stickyLeftRow}rem` : undefined },
        zIndex: { xs: 'static', sm: isSticky ? 2 : 'auto' },
        background: backgroundColor,
        padding: '0px 8px',
        '& .MuiTableCell-root': {
            minWidth: `${column?.minWidth}rem`,
            maxWidth: `${column?.maxWidth}rem`,
            '&:first-of-type': {
                minWidth: '32px',
                width: '32px'
            }
        },
        '.MuiTableRow-hover:hover &': {
            backgroundColor: '#ECECEC'
        },
        // note::use align for specific column because for specific column data types standards has been set string:"left", object(component):"center", number, date : right
        textAlign: column?.align ? column?.align : determinePosition(value),
        borderRight: '0.2px solid #dddddd', // Adjust color as needed
        ...rowCellSX
    }

    return cellStyles
}

export default generateRowCellStyles
