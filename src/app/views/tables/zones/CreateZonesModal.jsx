import React from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'

import MasterZoneForm from '../../forms/zones'

function CreateZonesModal({ editId = null }) {
    return (
        <Box sx={{ width: { lg: '500px', sm: '440px', xs: '300px' } }}>
            <MasterZoneForm editId={editId} />
        </Box>
    )
}

export default CreateZonesModal
CreateZonesModal.propTypes = {
    editId: PropTypes.number
}
