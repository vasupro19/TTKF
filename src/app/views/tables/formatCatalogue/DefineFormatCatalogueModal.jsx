import React from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import MasterDefineCatalogueFormatForm from '@views/forms/formatCatalogue'

function DefineCatalogueFormatModal({ editId = null }) {
    return (
        <Box sx={{ width: { lg: '600px', sm: '500px', xs: '260px' } }}>
            <MasterDefineCatalogueFormatForm editId={editId} />
        </Box>
    )
}

export default DefineCatalogueFormatModal
DefineCatalogueFormatModal.propTypes = {
    editId: PropTypes.number
}
