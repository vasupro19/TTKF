/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'

import AuthGuard from '@app/guards/AuthGuard'
import ClientGuard from '@app/guards/ClientGuard'
import UrlAccessGuard from '@app/guards/UrlPermissionGuard'
// eslint-disable-next-line import/no-cycle
import AppLayout from '@app/layouts/AppLayout'
import Loader from '@/core/components/extended/Loader'

const UserProfilePage = lazy(() => import('@views/pages/userprofilePage'))
const AdminDashboard = lazy(() => import('@views/dashboard/admin/Home'))
const ComponentsView = lazy(() => import('@views/pages/ComponentView'))
const MasterUserForm = lazy(() => import('@views/forms/user/MasterUserForm'))
const MasterClient = lazy(() => import('@views/masters/client'))
const MasterClientForm = lazy(() => import('@views/masters/client/create'))
const MasterAccount = lazy(() => import('@views/masters/account'))
const MasterAccountForm = lazy(() => import('@views/masters/account/create'))
const MasterLocationForm = lazy(() => import('@/app/views/masters/campaign/create'))
const MasterLocation = lazy(() => import('@/app/views/masters/campaign'))

const AccountsTable = lazy(() => import('@views/tables/accounts/AccountsTable'))
const PinCodeMasterTable = lazy(() => import('@/app/views/masters/pincode/PinCodeMasterTable'))
const CountryMasterTable = lazy(() => import('@/app/views/masters/country/CountryMasterTable'))
const StateMasterTable = lazy(() => import('@/app/views/masters/state/StateMasterTable'))
const CityMasterTable = lazy(() => import('@/app/views/masters/city/CityMasterTable'))
const CreateRoleManagement = lazy(() => import('@views/setup/role/create'))
const ViewRoleManagement = lazy(() => import('@views/setup/role'))
const ViewGoodsReceiptNote = lazy(() => import('@views/pages/goodsReceiptNote/ViewGoodsReceiptNote'))
const CreateGoodsReceiptNote = lazy(() => import('@views/pages/goodsReceiptNote/createGoodsReceiptNote'))
const InboundGoodsReceiptNoteDetails = lazy(() => import('@views/pages/goodsReceiptNote/view'))
const MasterCustomerForm = lazy(() => import('@views/masters/customer/create'))
const MasterCustomer = lazy(() => import('@views/masters/customer'))
const ViewMasterCustomer = lazy(() => import('@views/masters/customer/view'))
const MasterVendor = lazy(() => import('@views/masters/vendor'))
const MasterVendorForm = lazy(() => import('@views/masters/vendor/create'))
const ViewMasterVendor = lazy(() => import('@views/masters/vendor/view'))
const SetupUserForm = lazy(() => import('@views/setup/user/create'))
const SetupUserTable = lazy(() => import('@views/setup/user'))
const MasterBinsTable = lazy(() => import('@views/masters/bins'))
const MapBinStorageLocation = lazy(() => import('@/app/views/masters/bins/mapBinStorageLoc/index'))
const MasterPalletsTable = lazy(() => import('@views/masters/pallets'))
const MapPalletStorageLocation = lazy(() => import('@/app/views/masters/pallets/mapPalletStorageLoc/index'))
const MasterZonesTable = lazy(() => import('@views/masters/zones'))
const MasterLocationCodesTable = lazy(() => import('@views/masters/locationCode'))
const MasterItemCategoryMappingTable = lazy(() => import('@views/masters/itemCategoryMapping'))
const MasterBucketConfigTable = lazy(() => import('@views/masters/bucketConfig'))
const MasterSerialTable = lazy(() => import('@views/masters/serial'))
const MasterSerialImportMappingForm = lazy(() => import('@views/masters/serialImportMapping'))
const UserPermissions = lazy(() => import('@views/setup/user/permissions'))
const ManageAdminTable = lazy(() => import('@views/adminDec/admin'))
const AddAdmin = lazy(() => import('@views/adminDec/admin/create'))
const UserLogs = lazy(() => import('@views/adminDec/userLogs'))
const MasterDefinePropertiesTable = lazy(() => import('@views/masters/defineProperties'))
const MasterDefineCatalogueFormat = lazy(() => import('@views/masters/formatCatalogue'))
const MasterCatalogueTable = lazy(() => import('@views/masters/catalogue'))
const MasterCatalogueForm = lazy(() => import('@views/masters/catalogue/create'))
const GateEntryTable = lazy(() => import('@views/inbound/gateEntry'))
const GateEntryForm = lazy(() => import('@views/inbound/gateEntry/create'))
const ViewGateEntryForm = lazy(() => import('@views/inbound/gateEntry/view'))
const MapBoxIds = lazy(() => import('@views/inbound/gateEntry/mapBoxIds'))
const ClientLocationTable = lazy(() => import('@views/pages/clientLocation'))
const PurchaseOrderTable = lazy(() => import('@views/inbound/purchaseOrder'))
const PurchaseOrderForm = lazy(() => import('@views/inbound/purchaseOrder/create'))
const ASNTable = lazy(() => import('@views/inbound/advancedShippingNotes'))
const ASNForm = lazy(() => import('@views/inbound/advancedShippingNotes/create'))
const InboundPutAwayTable = lazy(() => import('@views/inbound/putAway'))
const InboundPutAwayDetails = lazy(() => import('@views/inbound/putAway/view'))
const InboundPutAwayCreate = lazy(() => import('@views/inbound/putAway/create'))
const PutAwayConfig = lazy(() => import('@views/inbound/putAway/PutAwayConfig'))
const InboundPutAwayMngJobs = lazy(() => import('@/app/views/inbound/putAway/manageJobs'))
const InboundPutAwayMngJobsCreate = lazy(() => import('@/app/views/inbound/putAway/manageJobs/create'))
const InboundPutAwayMngJobsView = lazy(() => import('@/app/views/inbound/putAway/manageJobs/view'))
const InboundPutAwayAssignedJobs = lazy(() => import('@/app/views/inbound/putAway/manageJobs/viewAssignedJobs'))
const ViewPickList = lazy(() => import('@views/outbound/pick'))
const CreatePickList = lazy(() => import('@views/outbound/pick/create'))
const ViewDetailsPickList = lazy(() => import('@views/outbound/pick/view'))

const PickSetup = lazy(() => import('@views/outbound/pick/setup'))
const Picking = lazy(() => import('@views/outbound/pick/picking'))
const ManageWaves = lazy(() => import('@/app/views/outbound/pick/setup/manageWaves'))
const ManageWavesCreate = lazy(() => import('@/app/views/outbound/pick/setup/createWaves'))
const PendencyTable = lazy(() => import('@/app/views/outbound/pick/pendency'))
const ZonesList = lazy(() => import('@/app/views/outbound/pick/picking/ZonesList'))
const ScanItems = lazy(() => import('@/app/views/outbound/pick/picking/ScanItems'))

const UploadDownloadManagement = lazy(() => import('@views/tables/uploadDownloadManagement'))
const ViewOutboundOrders = lazy(() => import('@views/outbound/orders'))
const CreateOutboundOrder = lazy(() => import('@views/outbound/orders/create'))
const OutboundOrderDetails = lazy(() => import('@views/outbound/orders/view'))
const ArchivedOrdersTable = lazy(() => import('@views/outbound/orders/archivedOrders'))

const ViewOutboundPack = lazy(() => import('@views/outbound/pack'))
const ViewB2BDetailsPack = lazy(() => import('@/app/views/outbound/pack/b2b/view'))
const ViewB2CDetailsPack = lazy(() => import('@/app/views/outbound/pack/b2c/view'))
const B2CPacking = lazy(() => import('@views/outbound/pack/b2c'))
const B2BPacking = lazy(() => import('@views/outbound/pack/b2b'))
const PackSetup = lazy(() => import('@views/outbound/pack/setup'))
const PackPendency = lazy(() => import('@views/outbound/pack/packPendency'))

const ViewOutboundSorting = lazy(() => import('@views/outbound/sorting'))
const SortingProcess = lazy(() => import('@views/outbound/sorting/sort'))
const PigeonholePicking = lazy(() => import('@views/outbound/sorting/pigeonholePicking'))

const FullInventoryView = lazy(() => import('@views/inventory/view/fullInventory'))
const StorageWiseInventory = lazy(() => import('@views/inventory/view/storageWiseInventory'))
const UIDwiseInventory = lazy(() => import('@views/inventory/view/uIDwiseInventory'))
const UserMenuAccess = lazy(() => import('@/app/views/forms/role/NewPermission'))
const UserMenuAccessClient = lazy(() => import('@/app/views/forms/role/NewClientUserPermission'))
const MasterCampaignTable = lazy(() => import('@/app/views/masters/campaign'))
const CampaignsForm = lazy(() => import('@views/masters/campaign/create'))
const MasterDestinationTable = lazy(() => import('@/app/views/masters/destinations'))
const DestinationForm = lazy(() => import('@views/masters/destinations/create'))
const MasterItenaryTable = lazy(() => import('@/app/views/masters/itenary'))
const ItenaryClientsForm = lazy(() => import('@views/masters/itenary/create'))
const MasterPackagesTable = lazy(() => import('@/app/views/masters/packages'))
const PackagesClientForm = lazy(() => import('@views/masters/packages/create'))
const PackageItenary = lazy(() => import('@views/forms/packageItenary'))
const GmailIntegrationForm = lazy(() => import('@views/forms/integrations/gmailIntegration'))

const SupplierForm = lazy(() => import('@/app/views/masters/supplier/create'))
const MasterSupplierTable = lazy(() => import('@/app/views/masters/supplier'))
const AgentForm = lazy(() => import('@/app/views/masters/agent/create'))
const MasterAgentTable = lazy(() => import('@app/views/masters/agent'))
// const SetupUserTable = lazy(() => import('@/app/views/tables/user'))

const protectedRoutes = {
    path: '/',
    element: (
        <AuthGuard>
            <ClientGuard>
                <UrlAccessGuard>
                    <AppLayout />
                </UrlAccessGuard>
            </ClientGuard>
        </AuthGuard>
    ),
    children: [
        {
            path: '/',
            element: (
                <Suspense fallback={<Loader />}>
                    <AdminDashboard />
                </Suspense>
            )
        },
        {
            path: '/dashboard',
            element: (
                <Suspense fallback={<Loader />}>
                    <AdminDashboard />
                </Suspense>
            )
        },
        {
            path: '/master/client',
            element: (
                <Suspense fallback={<Loader />}>
                    <MasterClient />
                </Suspense>
            )
        },
        {
            path: '/master/client/create',
            element: (
                <Suspense fallback={<Loader />}>
                    <MasterClientForm />
                </Suspense>
            )
        },
        {
            path: '/master/client/permissions/:id/:email',
            element: (
                <Suspense fallback={<Loader />}>
                    <UserMenuAccess />
                </Suspense>
            )
        },
        {
            path: '/master/client/permissions/user/:id/:email',
            element: (
                <Suspense fallback={<Loader />}>
                    <UserMenuAccessClient />
                </Suspense>
            )
        },
        {
            path: '/master/user',
            element: (
                <Suspense fallback={<Loader />}>
                    <SetupUserTable />
                </Suspense>
            )
        },
        {
            path: '/userManagement/user/create',
            element: (
                <Suspense fallback={<Loader />}>
                    <SetupUserForm />
                </Suspense>
            )
        },
        {
            path: '/master/campaigns',
            element: (
                <Suspense fallback={<Loader />}>
                    <MasterCampaignTable />
                </Suspense>
            )
        },
        {
            path: '/master/campaigns/add',
            element: (
                <Suspense fallback={<Loader />}>
                    <CampaignsForm />
                </Suspense>
            )
        },
        {
            path: '/master/destinations/:id',
            element: (
                <Suspense fallback={<Loader />}>
                    <MasterDestinationTable />
                </Suspense>
            )
        },
        {
            path: '/master/destinations/add',
            element: (
                <Suspense fallback={<Loader />}>
                    <DestinationForm />
                </Suspense>
            )
        },
        {
            path: '/master/itenary/:id',
            element: (
                <Suspense fallback={<Loader />}>
                    <MasterItenaryTable />
                </Suspense>
            )
        },
        {
            path: '/master/itenary/add',
            element: (
                <Suspense fallback={<Loader />}>
                    <ItenaryClientsForm />
                </Suspense>
            )
        },
        {
            path: '/master/packages/:id',
            element: (
                <Suspense fallback={<Loader />}>
                    <MasterPackagesTable />
                </Suspense>
            )
        },
        {
            path: '/master/supplier',
            element: (
                <Suspense fallback={<Loader />}>
                    <MasterSupplierTable />
                </Suspense>
            )
        },
        {
            path: '/master/packages/add',
            element: (
                <Suspense fallback={<Loader />}>
                    <PackagesClientForm />
                </Suspense>
            )
        },
        {
            path: '/master/supplier/add',
            element: (
                <Suspense fallback={<Loader />}>
                    <SupplierForm />
                </Suspense>
            )
        },
        {
            path: '/package/activities/:campaignId/:packageId',
            element: (
                <Suspense fallback={<Loader />}>
                    <PackageItenary />
                </Suspense>
            )
        },
        {
            path: '/master/supplier/edit/:id',
            element: (
                <Suspense fallback={<Loader />}>
                    <SupplierForm />
                </Suspense>
            )
        },
        {
            path: '/integration/gmail',
            element: (
                <Suspense fallback={<Loader />}>
                    <GmailIntegrationForm />
                </Suspense>
            )
        }
        {
            path: '/master/agent',
            element: (
                <Suspense fallback={<Loader />}>
                    <MasterAgentTable />
                </Suspense>
            )
        },
        {
            path: '/master/agent/add',
            element: (
                <Suspense fallback={<Loader />}>
                    <AgentForm />
                </Suspense>
            )
        }
    ]
}

export default protectedRoutes
