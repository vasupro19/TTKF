import { useSelector } from 'react-redux'

// eslint-disable-next-line react-refresh/only-export-components
const TYPES = ['create', 'export', 'edit', 'view']

function useUiAccess(type) {
    if (!TYPES.includes(type)) {
        throw new Error('Unknown TYPE input for useUiAccess')
    }

    const { moduleAccess } = useSelector(state => state.auth)
    return moduleAccess.size === 0 || moduleAccess.has(type)
}

export default useUiAccess
