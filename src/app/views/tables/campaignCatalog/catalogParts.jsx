import PropTypes from 'prop-types'
import { Box, Button, IconButton, Tooltip } from '@mui/material'
import { ArrowBack, Delete, Edit } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'

/** @description a small "All campaigns" link above a list's title that goes back to the campaign list */
export function BackToCampaigns() {
    const navigate = useNavigate()
    return (
        <Button
            size='small'
            startIcon={<ArrowBack fontSize='small' />}
            onClick={() => navigate('/master/campaigns')}
            sx={{ ml: -1, mb: 0.5, textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
        >
            All campaigns
        </Button>
    )
}

/** @description the "are you sure" box of a row's delete; its props come from `useDeleteFlow` */
export function DeleteConfirm({ flow }) {
    const { noun, name, onConfirm, loading } = flow
    return (
        <ConfirmModal
            title={`Delete ${noun}`}
            message={
                <>
                    Are you sure you want to delete this {noun.toLowerCase()}: <strong>{name}</strong>?
                </>
            }
            icon='warning'
            confirmText='Yes, Delete'
            customStyle={{ width: { xs: '300px', sm: '456px' } }}
            onConfirm={onConfirm}
            isLoading={loading}
        />
    )
}

DeleteConfirm.propTypes = {
    flow: PropTypes.shape({
        noun: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        onConfirm: PropTypes.func.isRequired,
        loading: PropTypes.bool
    }).isRequired
}

/** @description edit and delete buttons for a row, each shown only to people who may edit; `before` holds extra buttons */
export function CatalogRowActions({ label, onEdit, onDelete, before = null, after = null }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            {before}
            <UiAccessGuard type='edit'>
                <Tooltip title='Edit'>
                    <IconButton size='small' aria-label={`Edit ${label}`} onClick={onEdit}>
                        <Edit fontSize='small' sx={{ fill: '#60498a' }} />
                    </IconButton>
                </Tooltip>
            </UiAccessGuard>
            <UiAccessGuard type='edit'>
                <Tooltip title='Delete'>
                    <IconButton
                        size='small'
                        aria-label={`Delete ${label}`}
                        sx={{ color: 'error.main' }}
                        onClick={onDelete}
                    >
                        <Delete fontSize='small' />
                    </IconButton>
                </Tooltip>
            </UiAccessGuard>
            {after}
        </Box>
    )
}

CatalogRowActions.propTypes = {
    label: PropTypes.string.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    before: PropTypes.node,
    after: PropTypes.node
}
