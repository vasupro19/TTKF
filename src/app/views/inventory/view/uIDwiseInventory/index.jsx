import MainCard from '@/core/components/extended/MainCard'
import { Box } from '@mui/material'
import React from 'react'
import CustomTabsView from './CustomTabsView'
import FiltersSection from './FiltersSection'

export default function UIDWiseInventory() {
    return (
        <MainCard content={false}>
            <Box sx={{ paddingY: 3 }}>
                <FiltersSection />
                <CustomTabsView />
            </Box>
        </MainCard>
    )
}
