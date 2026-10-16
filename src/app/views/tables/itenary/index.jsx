import { useCallback, useState } from 'react'
import { Button, CircularProgress } from '@mui/material'
import { CloudUpload } from '@mui/icons-material'
import * as XLSX from 'xlsx'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import ListPage from '@core/listing/ListPage'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    getItenaryClients,
    useDeleteItenaryClientMutation,
    useUploadItinerariesMutation
} from '@/app/store/slices/api/itenarySlice'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { BackToCampaigns, CatalogRowActions, DeleteConfirm } from '../campaignCatalog/catalogParts'
import { STATUS_FILTER, scopedSubtitle, useCampaignName, useDeleteFlow } from '../campaignCatalog/catalogFacts'
import { headers } from './helper'

const FILTERS = [
    STATUS_FILTER,
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

// ? the day plans of a campaign (title and description) that packages are built from
function MasterItenaryTable() {
    const { id: campaignId } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const hasCreateAccess = useUiAccess('create')
    const campaignName = useCampaignName(campaignId)
    const removing = Boolean(useSelector(state => state.loading?.deleteItenaryClientLKey))
    const [uploadTrigger, { isLoading: uploading }] = useUploadItinerariesMutation()
    const [deleteItenary] = useDeleteItenaryClientMutation()
    const [reload, setReload] = useState(0)

    const add = useCallback(() => navigate('/master/itenary/add', { state: { campaignId } }), [navigate, campaignId])
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
        noun: 'Itinerary',
        nameOf: row => row?.title,
        loading: removing,
        remove: id => deleteItenary(id).unwrap(),
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
                title: row.Title || row.title,
                description: row.Description || row.description
            }))
            try {
                await uploadTrigger({ itineraries: formatted, campaignId }).unwrap()
                tell('Itineraries uploaded successfully!', 'success')
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
                title='Itineraries'
                subtitle={scopedSubtitle('The day plans packages are built from.', campaignName)}
                noun='itineraries'
                searchPlaceholder='Search itinerary title or description'
                headers={headers}
                endpoint={getItenaryClients}
                baseParams={{ campaignId }}
                reqKey='getItinerariesListKey'
                filters={FILTERS}
                csvName='itineraries'
                canAdd
                addLabel='Add Itinerary'
                onAdd={add}
                reloadSignal={reload}
                emptyText='Add the day plans for this campaign (arrival, sightseeing, departure), then use them to build packages.'
                extraActions={
                    <>
                        <BackToCampaigns />
                        <UiAccessGuard type='create'>
                            <Button
                                size='small'
                                variant='outlined'
                                component='label'
                                disabled={uploading}
                                startIcon={uploading ? <CircularProgress size={16} color='inherit' /> : <CloudUpload />}
                            >
                                {uploading ? 'Uploading...' : 'Upload Excel'}
                                <input type='file' hidden accept='.xlsx, .xls' onChange={handleFileUpload} />
                            </Button>
                        </UiAccessGuard>
                    </>
                }
                renderAction={row => (
                    <CatalogRowActions
                        label={row.title}
                        onEdit={() => navigate(`/master/itenary/edit/${row.id}`)}
                        onDelete={() => ask(row)}
                    />
                )}
            />
            <DeleteConfirm flow={confirmProps} />
        </>
    )
}

export default MasterItenaryTable
