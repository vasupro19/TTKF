import HomeIcon from '@mui/icons-material/Home'
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
// import { useGetMenuMutation } from '@app/store/slices/api/authApiSlice'
import {
    RemoveRedEyeOutlined,
    Outbound,
    Difference,
    Settings,
    Article,
    Architecture,
    CorporateFare,
    ConnectWithoutContact,
    AssignmentReturn,
    BarChart,
    AspectRatio,
    AccountBalance,
    HelpCenter,
    Inventory,
    Person,
    SupervisorAccount,
    Create,
    RemoveRedEye,
    Warehouse,
    Explore,
    AdminPanelSettings,
    PersonSearch,
    Storefront,
    Receipt,
    FormatListNumbered,
    Publish,
    ListAlt,
    FactCheck,
    DatasetLinked,
    Public,
    Approval,
    LocationCity,
    FlagCircle,
    ShareLocation,
    SettingsEthernet,
    FormatLineSpacing,
    AddLocationAlt,
    FaceRetouchingNatural,
    SupportAgent,
    ShoppingBasket,
    AssistantDirection,
    PersonPin,
    Engineering,
    List,
    WorkOutline,
    Add,
    ShoppingBasketOutlined,
    ShoppingCartCheckoutOutlined,
    ClassOutlined,
    StorefrontOutlined,
    Person4,
    Dashboard,
    AssignmentTurnedIn,
    Tune,
    AccessAlarm,
    CategoryOutlined,
    CalendarViewMonthOutlined,
    Storage
} from '@mui/icons-material'
import {
    BigScreenIcon,
    CIMSIcon,
    InboundIcon,
    WalletIcon,
    InventoryIcon,
    MasterIcon,
    OmsIcon,
    OutboundIcon,
    SetupIcon,
    TasksIcon,
    ToolsIcon,
    HelpDesk,
    ReportsIcon,
    ReturnIcon,
    UserManagementIcon
} from '@/assets/icons/navbar'
// import BinIcon from '@assets/icons/BinIcon'
import PalletIcon from '@assets/icons/PalletIcon'
import VendorIcon from '@assets/icons/VendorIcon'
import CategoryItemMappingIcon from '@assets/icons/CategoryItemMappingIcon'
import StorageLocationIcon from '@assets/icons/StorageLocationIcon'
import BucketConfigIcon from '@assets/icons/BucketLocationIcon'
import PackIcon from '@/assets/icons/PackIcon'
import SortIcon from '@/assets/icons/SortIcon'
import PickingStickyIcon from '@/assets/icons/PickingStickyIcon'
import StorageWiseInventoryIcon from '@/assets/icons/StorageWiseInventoryIcon'
import UIDWiseInventoryIcon from '@/assets/icons/UIDWiseInventoryIcon'
import CreateGRNIcon from '@/assets/icons/CreateGRNIcon'
import GRNIcon from '@/assets/icons/GRNIcon'
import ASNIcon from '@/assets/icons/ASNIcon'
import GateEntryIcon from '@/assets/icons/GateEntryIcon'
import PutAwayIcon from '@/assets/icons/PutAwayIcon'
import PurchaseOrderIcon from '@/assets/icons/PurchaseOrderIcon'
import PackPendencyIcon from '@/assets/icons/PackPendencyIcon'
import { useEffect } from 'react'

const icons = {
    HomeIcon,
    DeveloperBoardIcon,
    ExitToAppIcon,
    RemoveRedEyeOutlined,
    Outbound,
    Difference,
    Settings,
    Article,
    Architecture,
    CorporateFare,
    ConnectWithoutContact,
    AssignmentReturn,
    BarChart,
    AspectRatio,
    AccountBalance,
    HelpCenter,
    Inventory,
    Person,
    SupervisorAccount,
    Create,
    RemoveRedEye,
    Warehouse,
    PalletIcon,
    CategoryItemMappingIcon,
    StorageLocationIcon,
    BucketConfigIcon,
    Explore,
    UserManagementIcon,
    AdminPanelSettings,
    PersonSearch,
    Storefront,
    Receipt,
    VendorIcon,
    FormatListNumbered,
    Publish,
    ListAlt,
    FactCheck,
    DatasetLinked,
    Public,
    Approval,
    LocationCity,
    FlagCircle,
    ShareLocation,
    SettingsEthernet,
    FormatLineSpacing,
    AddLocationAlt,
    FaceRetouchingNatural,
    SupportAgent,
    ShoppingBasket,
    AssistantDirection,
    PersonPin,
    Engineering,
    List,
    WorkOutline,
    Add,
    ShoppingBasketOutlined,
    ShoppingCartCheckoutOutlined,
    ClassOutlined,
    PackIcon,
    StorefrontOutlined,
    Person4,
    Dashboard,
    AssignmentTurnedIn,
    Tune,
    AccessAlarm,
    CategoryOutlined,
    CalendarViewMonthOutlined,
    SortIcon,
    PickingStickyIcon,
    Storage,
    StorageWiseInventoryIcon,
    UIDWiseInventoryIcon,
    GRNIcon,
    CreateGRNIcon,
    ASNIcon,
    GateEntryIcon,
    PutAwayIcon,
    PurchaseOrderIcon,
    PackPendencyIcon
}
// function Menu() {
//     // ✅ uppercase name
//     // const [getMenu] = useGetMenuMutation()

//     const handleMenu = async () => {
//         try {
//             await getMenu()
//         } catch (error) {
//             console.log(error)
//         }
//     }
//     useEffect(() => {
//         handleMenu()
//     }, [])
// }
// Menu()
// TODO: use isDisabled to get a backdrop and lock icon in the NavLink
export const menuItems = [
    {
        id: 'masters',
        label: 'Master',
        description: 'Check the global sailing schedules to plan your shipments.',
        icon: MasterIcon,
        type: 'collapse', // collapse || item
        children: [
            {
                id: 'warehouse',
                label: 'Admin',
                icon: icons.Warehouse,
                type: 'collapse'
            }
        ]
    }
]

export default menuItems
