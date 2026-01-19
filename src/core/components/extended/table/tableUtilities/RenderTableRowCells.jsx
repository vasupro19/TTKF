import { TableCell, Skeleton } from '@mui/material'
import { dateTimeFormatter, isValidDateString, findLastStickColumnIndex } from '@/utilities'
import TableBodyCellContent from './TableBodyCellContent'
import generateRowCellStyles from './generateRowCellStyles'

const RenderTableRowCells = ({ columns, row, isSelected, rowCellSX, indexVal, showStripes, isCheckbox, isLoading }) => {
    let stickyLeftRow = isCheckbox ? 2.44 : 0

    return columns
        ?.filter(column => column?.visible)
        ?.map((column, index, array) => {
            const value = isValidDateString(row[column.key]) ? dateTimeFormatter(row[column.key]) : row[column.key]

            const isClickable = typeof column?.onClick === 'function'

            const cellStyles = generateRowCellStyles(
                column,
                row,
                isSelected,
                stickyLeftRow,
                rowCellSX,
                indexVal,
                showStripes,
                value,
                isLoading
            )

            stickyLeftRow += Number(column.minWidth) || 8

            return (
                <TableCell
                    key={column.id}
                    className={`regular-height ${
                        column.stick && index === findLastStickColumnIndex(array) ? 'sticky-cell' : ''
                    }`}
                    sx={{
                        ...cellStyles,
                        cursor: isClickable ? 'pointer' : 'default',
                        color: isClickable ? '#60498a' : 'inherit',
                        fontWeight: isClickable ? 600 : 'normal',
                        textDecoration: isClickable ? 'underline' : 'none'
                    }}
                    onClick={isClickable ? () => column.onClick(row) : undefined}
                >
                    {isLoading ? <Skeleton animation='wave' /> : <TableBodyCellContent value={value} />}
                </TableCell>
            )
        })
}

export default RenderTableRowCells
