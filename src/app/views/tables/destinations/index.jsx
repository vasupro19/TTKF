import { useCallback, useMemo, useState } from 'react'
import { Button } from '@mui/material'
import * as XLSX from 'xlsx'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import ListPage from '@core/listing/ListPage'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    getDestinationClients,
    useDeleteDestinationClientMutation,
    useUploadDestinationsMutation
} from '@/app/store/slices/api/destinationSlice'
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
        key: 'hotels',
        label: 'Hotels',
        width: 170,
        options: [
            { value: 'complete', label: 'All 4 categories named' },
            { value: 'incomplete', label: 'Some category empty' }
        ]
    },
    {
        key: 'usage',
        label: 'Used in packages',
        width: 170,
        options: [
            { value: 'used', label: 'Used in a package' },
            { value: 'unused', label: 'Not used yet' }
        ]
    }
]

// ? the places a campaign visits, with the hotel the agency uses in each category
function MasterDestinationTable() {
    const { id: campaignId } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const hasCreateAccess = useUiAccess('create')
    const campaignName = useCampaignName(campaignId)
    const removing = Boolean(useSelector(state => state.loading?.deleteDestinationClientLKey))
    const [uploadDestinations, { isLoading: uploading }] = useUploadDestinationsMutation()
    const [deleteDestination] = useDeleteDestinationClientMutation()
    const [reload, setReload] = useState(0)
    const columns = useMemo(() => columnsForCampaign(headers, campaignId), [campaignId])

    const add = useCallback(
        () => navigate('/master/destinations/add', { state: { campaignId } }),
        [navigate, campaignId]
    )
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) add()
    })

    const tell = (message, color) =>
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: { color },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )

    const { ask, confirmProps } = useDeleteFlow({
        noun: 'Destination',
        nameOf: row => row?.name,
        loading: removing,
        remove: id => deleteDestination(id).unwrap(),
        done: () => setReload(count => count + 1)
    })

    const handleFileUpload = event => {
        const file = event.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = async loaded => {
            const workbook = XLSX.read(loaded.target.result, { type: 'binary' })
            const parsed = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
            const formatted = parsed.map(row => ({
                name: row['Destination Name'] || row.name,
                delux_hotel: row['Deluxe Hotel'] || row.delux_hotel,
                super_delux_hotel: row['Super Deluxe Hotel'] || row.super_delux_hotel,
                luxury_hotel: row['Luxury Hotel'] || row.luxury_hotel,
                premium_hotel: row['Premium Hotel'] || row.premium_hotel
            }))
            try {
                await uploadDestinations({ destinations: formatted, campaignId }).unwrap()
                tell('Destinations uploaded successfully!', 'success')
                setReload(count => count + 1)
            } catch (error) {
                tell(error?.data?.message || 'Upload failed. Please check the file and try again.', 'error')
            }
        }
        reader.readAsBinaryString(file)
        event.target.value = ''
    }

    return (
        <>
            <ListPage
                title='Destinations'
                subtitle={scopedSubtitle(
                    'The places this trip visits, with the hotel used in each category.',
                    campaignName
                )}
                eyebrow={<BackToCampaigns />}
                noun='destinations'
                searchPlaceholder='Search destination, campaign or hotel'
                headers={columns}
                endpoint={getDestinationClients}
                baseParams={{ campaignId }}
                reqKey='getDestinationsListKey'
                filters={FILTERS}
                csvName='destinations'
                canAdd
                addLabel='Add Destination'
                onAdd={add}
                reloadSignal={reload}
                emptyText='Add the places this campaign visits and the hotels you use there, then pick them when you build packages.'
                extraActions={
                    <UiAccessGuard type='create'>
                        <Button variant='outlined' component='label' disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Upload Excel'}
                            <input type='file' hidden accept='.xlsx, .xls' onChange={handleFileUpload} />
                        </Button>
                    </UiAccessGuard>
                }
                renderAction={row => (
                    <CatalogRowActions
                        label={row.name}
                        onEdit={() => navigate(`/master/destinations/edit/${row.id}`)}
                        onDelete={() => ask(row)}
                    />
                )}
            />
            <DeleteConfirm flow={confirmProps} />
        </>
    )
}

export default MasterDestinationTable
