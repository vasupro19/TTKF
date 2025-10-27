import React from 'react'
import { Box } from '@mui/material'
import MasterBucketConfigForm from '../../forms/bucketConfig'

// eslint-disable-next-line react/prop-types
function CreateBucketModal({ editId }) {
    return (
        <Box sx={{ width: { lg: '600px', sm: '500px', xs: '300px' } }}>
            <MasterBucketConfigForm editId={editId} />
        </Box>
    )
}

export default CreateBucketModal
