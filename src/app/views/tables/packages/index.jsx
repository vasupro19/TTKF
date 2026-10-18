import { useCallback, useMemo, useRef, useState } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { EventNote } from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import ListPage from '@core/listing/ListPage'
import CustomButton from '@core/components/extended/CustomButton'
import { getPackageClients, useDeletePackageClientMutation } from '@/app/store/slices/api/packageSlice'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { BackToCampaigns, CatalogRowActions, DeleteConfirm } from '../campaignCatalog/catalogParts'
import {
    STATUS_FILTER,
    columnsForCampaign,
    scopedSubtitle,
    useCampaignName,
    useDeleteFlow
} from '../campaignCatalog/catalogFacts'
import { headers } from './helper'

const FILTERS = [
    STATUS_FILTER,
    {
        key: 'plan',
        label: 'Day-by-day plan',
        width: 170,
        options: [
            { value: 'planned', label: 'Has days planned' },
            { value: 'empty', label: 'No days yet' }
        ]
    }
]

// ? the ready-made packages of a campaign; a package's name opens its day-by-day plan
function MasterPackagesTable() {
    const { id: campaignId } = useParams()
    const navigate = useNavigate()
    const hasCreateAccess = useUiAccess('create')
    const campaignName = useCampaignName(campaignId)
    const removing = Boolean(useSelector(state => state.loading?.deletePackageClientLKey))
    const [deletePackage] = useDeletePackageClientMutation()
    const [reload, setReload] = useState(0)

    const goTo = useRef(navigate)
    goTo.current = navigate
    const openPlan = useCallback(
        row => {
            const owner = row?.campaignId || campaignId
            if (owner && row?.id) goTo.current(`/package/activities/${owner}/${row.id}`)
        },
        [campaignId]
    )
    // ? the package name is a link to its day-by-day plan
    const columns = useMemo(
        () =>
            columnsForCampaign(headers, campaignId).map(column =>
                column.key === 'name' ? { ...column, onClick: row => openPlan(row) } : column
            ),
        [openPlan, campaignId]
    )

    const wizard = useCallback(
        () => navigate('/master/packages/wizard', { state: { campaignId } }),
        [navigate, campaignId]
    )
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) wizard()
    })

    const { ask, confirmProps } = useDeleteFlow({
        noun: 'Package',
        nameOf: row => row?.name,
        loading: removing,
        remove: id => deletePackage(id).unwrap(),
        done: () => setReload(count => count + 1)
    })

    return (
        <>
            <ListPage
                title='Packages'
                subtitle={scopedSubtitle(
                    'The ready-made packages you quote from. Click a name to open its day-by-day plan.',
                    campaignName
                )}
                eyebrow={<BackToCampaigns />}
                noun='packages'
                searchPlaceholder='Search package or campaign name'
                headers={columns}
                endpoint={getPackageClients}
                baseParams={{ campaignId }}
                reqKey='getPackagesListKey'
                filters={FILTERS}
                csvName='packages'
                canAdd
                addLabel='Quick Wizard'
                onAdd={wizard}
                reloadSignal={reload}
                emptyText='Build a package with the Quick Wizard: pick the destinations and day plans, and it is ready to quote.'
                extraActions={
                    <UiAccessGuard type='create'>
                        <CustomButton
                            variant='outlined'
                            onClick={() => navigate('/master/packages/add', { state: { campaignId } })}
                        >
                            Classic Add
                        </CustomButton>
                    </UiAccessGuard>
                }
                renderAction={row => (
                    <CatalogRowActions
                        label={row.name}
                        onEdit={() => navigate(`/master/packages/edit/${row.id}`)}
                        onDelete={() => ask(row)}
                        before={
                            <UiAccessGuard type='edit'>
                                <Tooltip title='Day-by-day plan'>
                                    <IconButton
                                        size='small'
                                        aria-label={`Day-by-day plan of ${row.name}`}
                                        onClick={() => openPlan(row)}
                                    >
                                        <EventNote fontSize='small' sx={{ fill: '#60498a' }} />
                                    </IconButton>
                                </Tooltip>
                            </UiAccessGuard>
                        }
                    />
                )}
            />
            <DeleteConfirm flow={confirmProps} />
        </>
    )
}

export default MasterPackagesTable
