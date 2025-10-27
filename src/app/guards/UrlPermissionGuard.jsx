import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

import Forbidden from '@views/pages/Forbidden'
import LoadingPermissions from '@views/pages/LoadingPermissions'

const excludedPaths = ['/dashboard']

function UrlAccessGuard({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { pathAccess, menuAccess, moduleAccess } = useSelector(state => state.auth)
    const [isAccess, setIsAccess] = useState(null)
    const [moduleName, setModuleName] = useState(null)

    const cleanPath = location.pathname.split('?')[0]
    const isEditPath = /\/\d+$/.test(cleanPath)
    const isEdit = cleanPath.includes('/edit')
    const isCreate = cleanPath.includes('/create')
    const isView = cleanPath.includes('/view')
    const excludedLabels = ['Create', 'View', 'Config', 'Configuration', 'Setup']

    useEffect(() => {
        let basePath = isEditPath ? cleanPath.replace(/\/\d+$/, '') : cleanPath
        if (isView) basePath = basePath.replace('/view', '')
        if (isEdit) basePath = basePath.replace('/edit', '')
        let isAllowed = null

        if (basePath) {
            // const pathObj = pathAccess.get(`${isCreate ? basePath.replace('/create', '') : basePath}`)
            const pathObj = pathAccess.get(basePath)
            setModuleName(
                excludedLabels.includes(pathObj?.label) ? `${pathObj?.label} ${pathObj?.parentLabel}` : pathObj?.label
            )
        }

        if (
            basePath &&
            moduleAccess.has('create') &&
            menuAccess.has(pathAccess.get(`${basePath.replace('/create', '')}`)?.key)
        )
            isAllowed = true
        else if (
            (isEditPath || isEdit) &&
            moduleAccess.has('edit') &&
            menuAccess.has(pathAccess.get(`${basePath}`)?.key)
        )
            isAllowed = true
        else if (isView && moduleAccess.has('view') && menuAccess.has(pathAccess.get(`${basePath}`)?.key))
            isAllowed = true
        else if (!isEditPath && !isCreate && menuAccess.has(pathAccess.get(`${basePath}`)?.key)) isAllowed = true
        else if (excludedPaths.includes(basePath))
            isAllowed = true // TODO: confirm if dashboard permission can be changed by the user, remove in case: Permission will be changed for different user
        else if (pathAccess.size === 0 || menuAccess.size === 0) isAllowed = null
        else isAllowed = false

        setIsAccess(isAllowed)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, pathAccess, menuAccess, moduleAccess])

    // if (pathAccess.size === 0 || menuAccess.size === 0 || isAccess === null) return <LoadingPermissions />

    // if ((pathAccess.size > 0 || menuAccess.size > 0) && !isAccess)
    //     return (
    //         <Forbidden
    //             message={`You do not have permission to ${moduleName && excludedLabels.includes(moduleName) ? moduleName : `access ${moduleName}` || 'access this module'}!`}
    //         />
    //     ) // TODO: make a forbidden component
    return children
}

export default UrlAccessGuard
UrlAccessGuard.propTypes = {
    children: PropTypes.node
}
