import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { KeyboardBackspace, Launch } from '@mui/icons-material'
import { Box, ButtonBase, IconButton, Tooltip, Typography } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedZone } from '@/app/store/slices/pickDataSlice'
import QuantityBinInfo from './PickingHeader'
import ChangeBinModal from './ChangeBinModal'

function ZonesList() {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const { zones, currentPick } = useSelector(state => state.pickData)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const { id: pickListId } = useParams()

    // const sampleItems = [
    //     { label: 'Picked Qty', value: 14 },
    //     { label: 'Pending Qty', value: 86 }
    // ]

    const handleChangeClick = () => {
        setIsModalOpen(true)
    }

    useEffect(() => {
        if (!currentPick.pickId) navigate('/outbound/pickList/pick')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPick])

    return (
        <Box sx={{ padding: 1, position: 'relative', minHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <Tooltip title='Go back'>
                <IconButton
                    sx={{ position: 'absolute', top: 0, left: 0 }}
                    size='large'
                    onClick={() => {
                        navigate('/outbound/pickList/pick')
                    }}
                >
                    <KeyboardBackspace />
                </IconButton>
            </Tooltip>
            <QuantityBinInfo
                items={currentPick}
                pickListId={currentPick.pickNo}
                onChangeClick={handleChangeClick}
                pickBinId={currentPick.bin} // get this from the API using pickListId
            />
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1, // Allows it to take the remaining space
                    height: '100%', // Ensures it covers full available height
                    minHeight: 0, // Prevents unwanted height overflow
                    overflowY: 'auto', // Allows scrolling if needed
                    p: 1,
                    backgroundColor: 'grey.bgLighter',
                    border: '1px solid',
                    borderColor: 'grey.borderLight',
                    borderRadius: '8px',
                    flexGrow: 1
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 'bold',
                        p: 1,
                        borderBottom: '1px solid',
                        borderColor: 'grey.300'
                    }}
                >
                    <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                        Zones
                    </Typography>
                    <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                        Pending Qty
                    </Typography>
                </Box>

                {/* Data Rows */}
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    {zones?.map((row, index) => (
                        <ButtonBase
                            key={row?.zone_id}
                            sx={{
                                width: '100%', // Makes the entire row clickable
                                display: 'flex',
                                justifyContent: 'space-between',
                                p: 1,
                                alignItems: 'center',
                                textAlign: 'left',
                                borderBottom: index !== zones.length - 1 ? '1px solid' : 'none',
                                borderColor: 'grey.300',
                                borderRadius: '4px',
                                transition: 'background 0.2s',
                                '&:hover': {
                                    backgroundColor: 'grey.200' // Light hover effect
                                }
                            }}
                            onClick={() => {
                                dispatch(setSelectedZone(row))
                                setTimeout(() => navigate(`/outbound/pickList/pick/picking/${pickListId}`), 180)
                            }}
                        >
                            <Typography
                                sx={{
                                    color: 'blue !important',
                                    textDecoration: 'underline',
                                    position: 'relative'
                                }}
                            >
                                {row.zone}
                                <Box
                                    component='span'
                                    sx={{
                                        position: 'absolute',
                                        top: '-2px',
                                        right: '-1rem',
                                        fontSize: '1rem',
                                        color: 'blue !important'
                                    }}
                                >
                                    <Launch fontSize='8px' />
                                </Box>
                            </Typography>
                            <Typography sx={{ fontWeight: 'bold' }}>{row?.qty}</Typography>
                        </ButtonBase>
                    ))}
                </Box>
                <ChangeBinModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} pickListId={pickListId} />
            </Box>
        </Box>
    )
}

export default ZonesList
