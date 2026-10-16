import { useCallback, useState } from 'react'
import { Button, CircularProgress, IconButton, Menu, MenuItem, Tooltip } from '@mui/material'
import { CloudUpload, Download, MoreVert } from '@mui/icons-material'
import * as XLSX from 'xlsx'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import ListPage from '@core/listing/ListPage'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    getCampaigns,
    removeLocationMaster,
    useUploadCampaignsExcelMutation
} from '@/app/store/slices/api/campaignSlice'
import { rememberCampaign } from '@/app/layouts/sidebar/navModel'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { CatalogRowActions, DeleteConfirm } from '../campaignCatalog/catalogParts'
import { STATUS_FILTER, useDeleteFlow } from '../campaignCatalog/catalogFacts'
import { headers } from './helper'

const FILTERS = [STATUS_FILTER]

const SAMPLE = [
    {
        title: 'Manali Summer 2026',
        description: '6 Days in Hills',
        inclusions: 'Hotel | Cab | Breakfast',
        exclusions: 'Flight | Personal Expenses',
        importantNote: 'Check-in is at 12 PM. Carry valid ID proof.',
        bankDetails: 'Bank: SBI | A/C: 123456789 | IFSC: SBIN0001'
    }
]

const downloadSample = () => {
    const worksheet = XLSX.utils.json_to_sheet(SAMPLE)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Campaigns')
    worksheet['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 40 }, { wch: 40 }]
    XLSX.writeFile(workbook, 'Campaign_Upload_Sample.xlsx')
}

// ? the trips the agency sells; each opens its destinations, itineraries and packages
function MasterCampaignTable() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const hasCreateAccess = useUiAccess('create')
    const authUser = useSelector(state => state.auth?.user)
    const removing = Boolean(useSelector(state => state.loading?.removeLocationMasterLKey))
    const [uploadCampaigns, { isLoading: uploading }] = useUploadCampaignsExcelMutation()
    const [reload, setReload] = useState(0)
    const [menu, setMenu] = useState(null)

    const add = useCallback(() => navigate('/master/campaigns/add'), [navigate])
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) add()
    })

    const tell = (message, color) => dispatch(openSnackbar({ open: true, message, variant: 'alert', alert: { color } }))

    const { ask, confirmProps } = useDeleteFlow({
        noun: 'Campaign',
        nameOf: row => row?.title,
        loading: removing,
        remove: id => dispatch(removeLocationMaster.initiate(id)).unwrap(),
        done: () => setReload(count => count + 1)
    })

    const handleFileUpload = event => {
        const file = event.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = async evt => {
            try {
                const workbook = XLSX.read(evt.target.result, { type: 'binary' })
                const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
                if (rawData.length === 0) throw new Error('Excel file is empty')
                const formatted = rawData.map(row => ({
                    title: row.title || '',
                    description: row.description || '',
                    inclusions: row.inclusions || '',
                    exclusions: row.exclusions || '',
                    importantNote: row.importantNote || '',
                    bankDetails: row.bankDetails || ''
                }))
                const response = await uploadCampaigns(formatted).unwrap()
                tell(`${response.data.count} Campaigns imported!`, 'success')
                setReload(count => count + 1)
            } catch (error) {
                tell(error.data?.message || error.message || 'Invalid Excel Format', 'error')
            }
        }
        reader.readAsBinaryString(file)
        event.target.value = ''
    }

    // ? a row's Destinations / Itinerary / Packages also make that campaign the sidebar's chosen trip
    const openCampaignList = base => {
        const { row } = menu
        rememberCampaign(authUser, { id: row.id, title: row.title || '' })
        setMenu(null)
        navigate(`${base}/${row.id}`)
    }

    return (
        <>
            <ListPage
                title='Campaigns'
                subtitle='The trips you sell. Open one to manage its destinations, itineraries and packages.'
                noun='campaigns'
                searchPlaceholder='Search campaign title or description'
                headers={headers}
                endpoint={getCampaigns}
                reqKey='getCampaignsListKey'
                filters={FILTERS}
                csvName='campaigns'
                canAdd
                addLabel='Add Campaign'
                onAdd={add}
                reloadSignal={reload}
                emptyText='Add a campaign (a trip you sell, like "Manali Summer 2026"), then give it destinations, itineraries and packages.'
                extraActions={
                    <UiAccessGuard type='create'>
                        <Button size='small' variant='outlined' startIcon={<Download />} onClick={downloadSample}>
                            Sample file
                        </Button>
                        <Button
                            size='small'
                            variant='outlined'
                            component='label'
                            disabled={uploading}
                            startIcon={uploading ? <CircularProgress size={16} color='inherit' /> : <CloudUpload />}
                            sx={{ ml: 1 }}
                        >
                            {uploading ? 'Uploading...' : 'Upload Excel'}
                            <input type='file' hidden accept='.xlsx, .xls' onChange={handleFileUpload} />
                        </Button>
                    </UiAccessGuard>
                }
                renderAction={row => (
                    <CatalogRowActions
                        label={row.title}
                        onEdit={() => navigate(`/master/campaigns/edit/${row.id}`)}
                        onDelete={() => ask(row)}
                        after={
                            <Tooltip title='Destinations, itinerary and packages'>
                                <IconButton
                                    size='small'
                                    sx={{ color: 'primary.main' }}
                                    aria-label={`More for ${row.title}`}
                                    onClick={event => setMenu({ anchor: event.currentTarget, row })}
                                >
                                    <MoreVert fontSize='small' />
                                </IconButton>
                            </Tooltip>
                        }
                    />
                )}
            />
            <Menu
                anchorEl={menu?.anchor}
                open={Boolean(menu)}
                onClose={() => setMenu(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={() => openCampaignList('/master/destinations')}>Destinations</MenuItem>
                <MenuItem onClick={() => openCampaignList('/master/itenary')}>Itinerary</MenuItem>
                <MenuItem onClick={() => openCampaignList('/master/packages')}>Packages</MenuItem>
            </Menu>
            <DeleteConfirm flow={confirmProps} />
        </>
    )
}

export default MasterCampaignTable
