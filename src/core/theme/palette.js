// material-ui
import { createTheme } from '@mui/material/styles'

// ==============================|| DEFAULT THEME - PALETTE  ||============================== //
import theme from '@/assets/scss/_theme.colors.module.scss'

const Palette = () => {
    const colors = theme

    return createTheme({
        palette: {
            common: {
                black: colors.darkPaper
            },
            primary: {
                light: colors.primaryLight,
                main: colors.primaryMain,
                dark: colors.primaryDark,
                200: colors.primary200,
                800: colors.primary800
            },
            secondary: {
                light: colors.secondaryLight,
                main: colors.secondaryMain,
                dark: colors.secondaryDark,
                200: colors.secondary200,
                800: colors.secondary800
            },
            error: {
                light: colors.errorLight,
                main: colors.errorMain,
                dark: colors.errorDark
            },
            orange: {
                light: colors.orangeLight,
                main: colors.orangeMain,
                dark: colors.orangeDark
            },
            warning: {
                light: colors.warningLight,
                main: colors.warningMain,
                dark: colors.warningDark
            },
            success: {
                light: colors.successLight,
                200: colors.success200,
                main: colors.successMain,
                dark: colors.successDark
            },
            grey: {
                50: colors.grey50,
                100: colors.grey100,
                500: colors.grey500,
                600: colors.grey900,
                700: colors.grey700,
                900: colors.grey900,
                bgLight: colors.greyBgLight,
                borderLight: colors.greyBorderLight,
                bgLighter: colors.greyBgLighter
            },
            blue: {
                main: colors.bluePrimary,
                dark: colors.bluePrimaryDark
            },
            dark: {
                light: colors.darkTextPrimary,
                main: colors.darkLevel1,
                dark: colors.darkLevel2,
                800: colors.darkBackground,
                900: colors.darkPaper
            },
            text: {
                primary: colors.grey700,
                secondary: colors.grey500,
                dark: colors.grey900,
                hint: colors.grey100,
                paper: colors.paper
            },
            divider: colors.grey200,
            background: {
                paper: colors.paper,
                default: colors.paper
            }
        }
    })
}

export default Palette
