import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const TYPES = ['create', 'export', 'edit', 'view']

function UiAccessGuard({ children, type = 'export' }) {
    const { moduleAccess } = useSelector(state => state.auth)
    const [isAccess, setIsAccess] = useState(false)
    if (!TYPES.includes(type)) throw new Error('Unknown TYPE input for UiAccessGuard')
    useEffect(() => {
        if (moduleAccess.has(type)) setIsAccess(true)
        else setIsAccess(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moduleAccess])
    if (moduleAccess.size > 0 && !isAccess) return null
    return children
}

export default UiAccessGuard
UiAccessGuard.propTypes = {
    children: PropTypes.node,
    type: PropTypes.string
}
