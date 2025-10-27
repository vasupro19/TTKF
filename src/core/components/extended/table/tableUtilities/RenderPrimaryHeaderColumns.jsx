import { TableCell } from '@mui/material'
import { findLastStickColumnIndex } from '@/utilities'
import generatePrimaryHeaderCellStyles from './generatePrimaryHeaderCellStyles'
import PrimaryHeaderCellContent from './PrimaryHeaderCellContent'

const RenderPrimaryHeaderColumns = ({ columns, stickyLeft, searchTerms, handleSort, headerCellSX, hasData }) =>
    columns
        ?.filter(column => column?.visible)
        // eslint-disable-next-line no-unused-vars
        ?.map((column, index, array) => {
            const cellStyles = generatePrimaryHeaderCellStyles(column, stickyLeft, index, headerCellSX, hasData)
            /* eslint-disable no-param-reassign */
            stickyLeft += Number(column.minWidth) || 8

            return (
                <TableCell
                    sx={cellStyles}
                    key={column.id}
                    align={column.align}
                    className={`regular-height ${column.stick && index === findLastStickColumnIndex(array) ? 'sticky-primary-header-cell' : ''}`}
                >
                    <PrimaryHeaderCellContent column={column} handleSort={handleSort} searchTerms={searchTerms} />
                </TableCell>
            )
        })

export default RenderPrimaryHeaderColumns
