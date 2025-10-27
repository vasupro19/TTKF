import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { Box, Grid, Divider, TextField, CircularProgress } from '@mui/material'

import MainCard from '@core/components/extended/MainCard'
import { useDispatch, useSelector } from 'react-redux'
import ViewPicklistTable from '@/app/views/tables/pick/viewPicklistTable'
import { getReadOnlyInputSx } from '@/utilities'
import { useGetPickListByIdQuery } from '@/app/store/slices/api/pickListSlice'

const customSx = getReadOnlyInputSx()

function Index() {
    const location = useLocation()
    const { id: editId } = useParams()
    const { pickListById } = useSelector(state => state.loading)

    const path = location.pathname
    const isViewPage = path.includes('/view/')
    const isEditPage = path.includes('/edit/')
    const { data: response, error: reqError } = useGetPickListByIdQuery(editId)
    // const [activeTab, setActiveTab] = useState(0)

    const [pickData, setPickData] = useState([
        { label: 'Picklist ID', key: 'picklistId', value: '' },
        { label: 'Pick Type', key: 'pickListType', value: '' },
        { label: 'Pick Status', key: 'status_code', value: '' },
        { label: 'Pick Start', key: 'pick_start', value: '' },
        { label: 'Pick Close', key: 'pick_close', value: '' }
    ])

    // const handleTabChange = (event, newValue) => {
    //     setActiveTab(newValue)
    // }

    useEffect(() => {
        if (response) {
            const tempData = []
            pickData.map((pick, index) => {
                Object.keys(response.data).map(key => {
                    if (key === pick.key) tempData[index] = { ...pick, value: response.data[key] }
                    return key
                })
                return pick
            })
            setPickData(tempData)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [response])

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px', py: 1.5 }}>
            <Grid
                container
                gap={4}
                sx={{
                    border: '1px solid',
                    borderColor: 'grey.borderLight',
                    px: 1,
                    py: 1,
                    borderRadius: '8px'
                }}
            >
                <Grid md={12} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
                        {/* You can uncomment the Tabs component if needed */}
                        <Box sx={{ p: 1, pt: 2, width: '100%' }}>
                            <Grid container spacing={1}>
                                {pickData.map(field => (
                                    <Grid item xs={12} sm={2.4} key={field.key}>
                                        <TextField
                                            fullWidth
                                            label={field.label}
                                            value={field.value}
                                            InputProps={{
                                                readOnly: true,
                                                endAdornment: pickListById ? (
                                                    <CircularProgress color='success' size={20} />
                                                ) : null
                                            }}
                                            InputLabelProps={{ shrink: true }} // Forces label to stay on top
                                            sx={
                                                field.label === 'Pick Status'
                                                    ? {
                                                          '& input': {
                                                              backgroundColor: 'success.light',
                                                              color: 'success.dark',
                                                              fontWeight: 'bold',
                                                              padding: '10px 6px'
                                                          },
                                                          '& .MuiOutlinedInput-root': {
                                                              '&:hover': {
                                                                  borderColor: 'transparent' // Removes hover effect
                                                              },
                                                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                  border: '1px solid #000' // Removes focus border
                                                              }
                                                          },
                                                          '& .MuiInputBase-input': {
                                                              cursor: 'text', // Allows text selection cursor
                                                              userSelect: 'text' // Enables normal text selection
                                                          }
                                                      }
                                                    : customSx
                                            }
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6} lg={12}>
                    <Divider
                        sx={{
                            mt: '-2rem',
                            borderColor: '#BCC1CA',
                            mb: '1rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                    <ViewPicklistTable />
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default Index
