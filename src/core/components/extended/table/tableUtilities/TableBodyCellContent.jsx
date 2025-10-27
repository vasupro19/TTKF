import React from 'react'
import PropTypes from 'prop-types' // Import PropTypes
import DoubleClickToCopy from '../../../DoubleClickToCopy'

// Change to function declaration
function TableBodyCellContent({ value }) {
    return React.isValidElement(value) ? (
        value
    ) : (
        <DoubleClickToCopy
            // eslint-disable-next-line no-nested-ternary
            value={value ? value.toString() : typeof value === 'number' ? 0 : ''}
            typographySx={{
                color: 'text.dark',
                fontWeight: '500',
                fontSize: '12px'
            }}
        />
    )
}

// Define PropTypes
TableBodyCellContent.propTypes = {
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.element // Allow React elements
    ])
}

export default TableBodyCellContent
