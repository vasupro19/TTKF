/* eslint-disable */
import React from 'react'
import { Breadcrumbs as MuiBreadcrumbs, Typography, Link } from '@mui/material'

function Breadcrumbs({ breadcrumb, onBreadcrumbClick }) {
    return (
        <MuiBreadcrumbs aria-label='breadcrumb'>
            {breadcrumb.map((item, index) =>
                index < breadcrumb.length - 1 ? (
                    <Link
                        key={item.id}
                        color='inherit'
                        href={item.path}
                        onClick={() => onBreadcrumbClick(item, index)}
                        sx={{ cursor: 'pointer', textTransform:"capitalize" }}
                        variant='h3'
                    >
                        {item.label}
                    </Link>
                ) : (
                    <Typography key={item.id} variant='h3' color='#fff' sx={{ fontWeight: 'bold', textTransform:"capitalize" }}>
                        {item.label}
                    </Typography>
                )
            )}
        </MuiBreadcrumbs>
    )
}

export default Breadcrumbs
