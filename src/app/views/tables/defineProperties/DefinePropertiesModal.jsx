import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import MasterDefinePropertiesForm from '@views/forms/defineProperties'

function DefinePropertiesModal({ editId = null }) {
    return (
        <Box>
            <MasterDefinePropertiesForm editId={editId} />
        </Box>
    )
}

export default DefinePropertiesModal
DefinePropertiesModal.propTypes = {
    editId: PropTypes.number
}
