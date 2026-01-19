import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Box, Typography, Card, CardContent, Stack, Grid } from '@mui/material'
import { useDispatch } from 'react-redux'
import { getPackageClientItenaryById } from '@/app/store/slices/api/packageItenarySlice'
// import CustomLoader from '@/core/components/Loader'

export default function PackageItenaryView() {
    const params = useParams()
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [itenaryData, setItenaryData] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        try {
            setLoading(true)

            // const queryString = `?filters[packageId]=${id}`

            const { data: response } = await dispatch(getPackageClientItenaryById.initiate(params.packageId, false))

            setItenaryData(response?.data || [])
        } catch (err) {
            console.error('Error fetching itinerary:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [params.packageId])

    // if (loading) return <CustomLoader />

    return (
        <Box p={3}>
            <Grid container item md={5}>
                <Typography variant='h3' mb={2}>
                    Package Itinerary
                </Typography>
                <Button onClick={() => navigate(-1)} variant='contained' color='primary' size='small'>
                    Back
                </Button>
            </Grid>

            {itenaryData.length === 0 ? (
                <Typography>No Itinerary Found</Typography>
            ) : (
                itenaryData.map(item => (
                    <Card key={item.id} sx={{ mb: 3, p: 2, borderRadius: 3, boxShadow: 2 }}>
                        <CardContent>
                            <Stack spacing={1}>
                                <Typography variant='h5' fontWeight={600}>
                                    {item.package?.name || 'Untitled Package'}
                                </Typography>

                                <Typography variant='h6' color='primary' fontWeight={600}>
                                    Itinerary: {item.itenary?.title}
                                </Typography>

                                <Typography variant='subtitle1' fontWeight={600}>
                                    Destination: {item.destination?.name}
                                </Typography>

                                {/* IMAGES */}
                                {/* {item.images?.length > 0 && ( */}
                                <Box mt={2}>
                                    <Typography variant='subtitle2' mb={1}>
                                        Images
                                    </Typography>

                                    <Grid container spacing={2}>
                                        {/* {item.images.map((img, index) => ( */}

                                        <Grid item xs={6} sm={4} md={3}>
                                            <Card
                                                sx={{
                                                    height: 120,
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                    boxShadow: 1
                                                }}
                                            >
                                                <img
                                                    src={item.image}
                                                    alt='itenary img'
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            </Card>
                                        </Grid>
                                        {/* ))} */}
                                    </Grid>
                                </Box>
                                {/* )} */}
                            </Stack>
                        </CardContent>
                    </Card>
                ))
            )}
        </Box>
    )
}
