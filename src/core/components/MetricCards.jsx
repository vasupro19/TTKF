import React from 'react'
import { Card, CardContent, Typography, Box, Grid, Icon, Skeleton } from '@mui/material'
import PropTypes from 'prop-types'

// Color palette mapping
const getColorPalette = colorType => {
    const palettes = {
        success: { bgColor: '#E6F4EA', textColor: '#2E7D32' },
        danger: { bgColor: '#FFE4E4', textColor: '#E74C3C' },
        info: { bgColor: '#D9E4FF', textColor: '#0025A1' },
        alert: { bgColor: '#FFF3CD', textColor: '#856404' },
        warning: { bgColor: '#FFF3E0', textColor: '#F57C00' },
        primary: { bgColor: '#E3F2FD', textColor: '#1976D2' },
        secondary: { bgColor: '#F3E5F5', textColor: '#7B1FA2' }
    }

    return palettes[colorType] || { bgColor: '#FFFFFF', textColor: '#000000' }
}

function MetricCards({ cards = [], data = {}, loading = false, gridSpacing = 1.5, onCardClick }) {
    if (!cards || cards.length === 0) {
        return null
    }

    return (
        <Grid container spacing={gridSpacing} justifyContent='center'>
            {cards.map((card, index) => {
                const colors = getColorPalette(card.colorType)
                const cardValue = data[card.dataKey] || card.fallbackValue || 0
                const formattedValue = typeof card.formatter === 'function' ? card.formatter(cardValue) : cardValue

                return (
                    <Grid
                        item
                        xs={card.gridSize?.xs || 12}
                        sm={card.gridSize?.sm || 6}
                        md={card.gridSize?.md || 3}
                        lg={card.gridSize?.lg}
                        xl={card.gridSize?.xl}
                        key={card.id || index}
                    >
                        <Card
                            onClick={onCardClick ? () => onCardClick(card, cardValue) : undefined}
                            sx={{
                                backgroundColor: '#FFFFFF',
                                boxShadow: 3,
                                borderRadius: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                borderLeft: `4px solid ${colors.textColor}`,
                                cursor: onCardClick ? 'pointer' : 'default',
                                // Responsive height adjustments
                                minHeight: { xs: 80, sm: 100, md: 100 }
                            }}
                        >
                            <CardContent
                                sx={{
                                    padding: { xs: '8px', sm: '12px', md: '12px' },
                                    '&:last-child': {
                                        paddingBottom: {
                                            xs: '8px !important',
                                            sm: '12px !important',
                                            md: '12px !important'
                                        }
                                    }
                                }}
                            >
                                {loading ? (
                                    // Loading skeleton
                                    <>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                marginBottom: 0.5
                                            }}
                                        >
                                            <Skeleton variant='text' width='60%' height={20} />
                                            <Skeleton variant='circular' width={42} height={42} />
                                        </Box>
                                        <Skeleton variant='text' width='40%' height={32} />
                                    </>
                                ) : (
                                    <>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                marginBottom: 0.5
                                            }}
                                        >
                                            {/* Label - can be string or React node */}
                                            {React.isValidElement(card.label) ? (
                                                <Box sx={{ marginRight: 1, flexGrow: 1 }}>{card.label}</Box>
                                            ) : (
                                                <Typography
                                                    variant='body2'
                                                    color='text.secondary'
                                                    sx={{
                                                        marginRight: 1,
                                                        flexGrow: 1,
                                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                        lineHeight: 1.2
                                                    }}
                                                >
                                                    {card.label}
                                                </Typography>
                                            )}

                                            {/* Icon */}
                                            {card.icon && (
                                                <Box
                                                    sx={{
                                                        width: { xs: 36, sm: 42 },
                                                        height: { xs: 36, sm: 42 },
                                                        borderRadius: '50%',
                                                        backgroundColor: colors.bgColor,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <Icon
                                                        component={card.icon}
                                                        sx={{
                                                            fontSize: { xs: 18, sm: 20 },
                                                            color: colors.textColor
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Value */}
                                        {typeof formattedValue === 'string' ? (
                                            <Typography
                                                variant='h5'
                                                component='div'
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: colors.textColor,
                                                    lineHeight: 1.2,
                                                    marginTop: 0.5,
                                                    fontSize: { xs: '1.25rem', md: '1.25rem' }
                                                }}
                                            >
                                                {formattedValue}
                                            </Typography>
                                        ) : (
                                            formattedValue
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                )
            })}
        </Grid>
    )
}

MetricCards.propTypes = {
    cards: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
            dataKey: PropTypes.string.isRequired,
            icon: PropTypes.elementType,
            colorType: PropTypes.oneOf(['success', 'danger', 'info', 'alert', 'warning', 'primary', 'secondary']),
            gridSize: PropTypes.shape({
                xs: PropTypes.number,
                sm: PropTypes.number,
                md: PropTypes.number,
                lg: PropTypes.number,
                xl: PropTypes.number
            }),
            fallbackValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
            formatter: PropTypes.func,
            description: PropTypes.string
        })
    ).isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    data: PropTypes.object,
    loading: PropTypes.bool,
    gridSpacing: PropTypes.number,
    onCardClick: PropTypes.func
}

export default MetricCards
