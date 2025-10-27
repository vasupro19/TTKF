/* eslint-disable */
import React from 'react'
import { Box, Card, Typography, Button, Grid, LinearProgress, useMediaQuery, Divider } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import MainCard from '@core/components/extended/MainCard'
import { useNavigate } from 'react-router-dom'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ReplayIcon from '@mui/icons-material/Replay'
import { locations, getStatusVariant } from './helper'
import CustomButton from '@/core/components/extended/CustomButton'
import { Work, WorkOutlineOutlined } from '@mui/icons-material'

const ViewPutAwayAssignedJobsTable = () => {
    const navigate = useNavigate()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    const handleStartJob = job => {
        // Navigate to the update/resume work page for the selected job
        navigate(`/inbound/putAway/create`)
    }

    return (
        <MainCard content={false}>
            <Box
                sx={{
                    p: 1,
                    position: 'relative',
                    my: { xs: 2, sm: 1 },
                    border: '1px solid',
                    borderColor: 'grey.borderLight',
                    borderRadius: '8px',
                    // backgroundColor:'#ececec'
                }}
            >
                {/* Header with title */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant='h4' sx={{ display: 'flex', alignItems: 'center', gap:0.5 }}>
                        <WorkOutlineOutlined />
                        Assigned Put Away Jobs
                    </Typography>
                    <Divider sx={{ borderColor: 'primary.main' }} />
                </Box>
                <Grid container spacing={2}>
                    {locations.map(job => (
                        <Grid item xs={12} key={job.id}>
                            <Card
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    borderRadius: 2,
                                    boxShadow: 3,
                                    p: 1,
                                    px: 2,
                                    gap: { xs: 2, sm: 0 }
                                }}
                            >
                                {/* Job Info */}
                                <Box
                                    sx={{
                                        flex: { xs: 'none', sm: 0.8 },
                                        width: { xs: '100%', sm: 'auto' },
                                        display: { xs: 'flex', sm: 'unset' },
                                        flexDirection: { xs: 'row', sm: 'unset' }
                                    }}
                                >
                                    <Typography variant='h5'>{job.job_id}</Typography>
                                    {/* For mobile view, show action button on top */}
                                    {isMobile && (
                                        <Box sx={{ width: '100%', textAlign: 'right' }}>
                                            <Button
                                                variant='contained'
                                                size='small'
                                                startIcon={job.started_at ? <ReplayIcon /> : <PlayArrowIcon />}
                                                onClick={() => handleStartJob(job)}
                                            >
                                                {job.started_at ? 'Resume' : 'Start'}
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                                {/* Progress Bar */}
                                <Box
                                    sx={{
                                        flex: { xs: 'none', sm: 1.2 },
                                        width: { xs: '100%', sm: 'auto' },
                                        display: 'flex',
                                        alignItems: 'center',
                                        px: { xs: 0, sm: 4 }
                                    }}
                                >
                                    <Typography variant='body2' sx={{ mr: 1, fontSize: '0.875rem' }}>
                                        {job.progress_bar}
                                    </Typography>
                                    <Box sx={{ flex: 1 }}>
                                        <LinearProgress
                                            variant='determinate'
                                            value={parseFloat(job.progress_bar)}
                                            sx={{ height: 8, borderRadius: 1 }}
                                        />
                                    </Box>
                                </Box>
                                {/* Details Section */}
                                {isMobile ? (
                                    <Box sx={{ width: '100%' }}>
                                        <Typography variant='body2' color='text.secondary'>
                                            <strong>Created By:</strong> {job.created_by}
                                        </Typography>
                                        <Typography variant='body2' color='text.secondary'>
                                            <strong>Created At:</strong> {job.created_at}
                                        </Typography>
                                        <Typography variant='body2' color='text.secondary'>
                                            <strong>No. of Bins:</strong> {job.no_of_bins}
                                        </Typography>
                                        <Typography variant='body2' color='text.secondary'>
                                            <strong>Total Qty:</strong> {job.total_qty}
                                        </Typography>
                                        <Typography variant='body2' color='text.secondary'>
                                            <strong>Pending Qty:</strong>{' '}
                                            <Typography component='span' color='error'>
                                                {job.pending_qty || '-'}
                                            </Typography>
                                        </Typography>
                                        <Typography variant='body2' color='text.secondary'>
                                            <strong>Started At:</strong> {job.started_at || '-'}
                                        </Typography>
                                        <Typography variant='body2' color='text.secondary'>
                                            <strong>Completed At:</strong> {job.completed_at || '-'}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <>
                                        {/* Job Details */}
                                        <Box
                                            sx={{
                                                flex: 2,
                                                width: 'auto'
                                            }}
                                        >
                                            <Typography variant='body2' color='text.secondary'>
                                                <strong>Created By:</strong> {job.created_by}
                                            </Typography>
                                            <Typography variant='body2' color='text.secondary'>
                                                <strong>Created At:</strong> {job.created_at}
                                            </Typography>
                                        </Box>
                                        {/* Bins & Quantity */}
                                        <Box
                                            sx={{
                                                flex: 1.5,
                                                width: 'auto'
                                            }}
                                        >
                                            <Typography variant='body2' color='text.secondary'>
                                                <strong>No. of Bins:</strong> {job.no_of_bins}
                                            </Typography>
                                            <Typography variant='body2' color='text.secondary'>
                                                <strong>Total Qty:</strong> {job.total_qty}
                                            </Typography>
                                            <Typography variant='body2' color='text.secondary'>
                                                <strong>Pending Qty:</strong>{' '}
                                                <Typography component='span' color='error'>
                                                    {job.pending_qty || '-'}
                                                </Typography>
                                            </Typography>
                                        </Box>
                                        {/* Timing Info */}
                                        <Box
                                            sx={{
                                                flex: 2,
                                                width: 'auto'
                                            }}
                                        >
                                            <Typography variant='body2' color='text.secondary'>
                                                <strong>Started At:</strong> {job.started_at || '-'}
                                            </Typography>
                                            <Typography variant='body2' color='text.secondary'>
                                                <strong>Completed At:</strong> {job.completed_at || '-'}
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                                {/* For desktop view, show action button on the right */}
                                {!isMobile && (
                                    <Box
                                        sx={{
                                            flexShrink: 0,
                                            width: { xs: '100%', sm: 'auto' },
                                            textAlign: { xs: 'center', sm: 'inherit' }
                                        }}
                                    >
                                        <CustomButton
                                            variant='clickable'
                                            size='small'
                                            startIcon={job.started_at ? <ReplayIcon /> : <PlayArrowIcon />}
                                            onClick={() => handleStartJob(job)}
                                            customStyles={{ minWidth: '100px', padding: '4px' }}
                                        >
                                            {job.started_at ? 'Resume' : 'Start'}
                                        </CustomButton>
                                    </Box>
                                )}
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </MainCard>
    )
}

export default ViewPutAwayAssignedJobsTable
