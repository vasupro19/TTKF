import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'

import AuthGuard from '@app/guards/AuthGuard'
import ClientGuard from '@app/guards/ClientGuard'
import UrlAccessGuard from '@app/guards/UrlPermissionGuard'
// eslint-disable-next-line import/no-cycle
import AppLayout from '@app/layouts/AppLayout'
import Loader from '@/core/components/extended/Loader'

/**
 * ============================================================================
 *  APPLICATION ROUTES
 * ============================================================================
 *
 *  WHAT CHANGED
 *  ------------
 *  This file declared 115 `lazy()` imports and wired 32 of them into `children`.
 *  The other 83 pointed at the warehouse management system this codebase was
 *  forked from: gate entry, purchase orders, advanced shipping notes, put-away
 *  job management, pick lists and waves, B2B/B2C packing, pigeonhole sorting,
 *  storage- and UID-wise inventory, plus masters for bins, pallets, zones,
 *  location codes, serials and catalogues.
 *
 *  Those 83 imports and the ~82,000 lines behind them are gone. None of it was
 *  reachable, none of it has a backend endpoint in this product, and it made up
 *  the majority of the frontend — so anyone doing technical due diligence
 *  opened the repository and saw a logistics application.
 *
 *  ROUTE GROUPS, in the order a tour operator actually works:
 *      Masters     campaigns -> destinations -> itineraries -> package templates
 *      Partners    suppliers (hotels, transporters) and referral agents
 *      Pipeline    leads -> guest requirements -> quotes -> confirmed bookings
 *      Money       the transactions ledger
 *      Setup       workspace users, roles, channel integrations
 *      Platform    tenant management (vendor staff only)
 *
 *  Access is checked by UrlAccessGuard against the permissions the API reports,
 *  and again by the API itself on every request.
 * ============================================================================
 */

// ---- shell ----
const AdminDashboard = lazy(() => import('@views/dashboard/admin/Home'))
const UserProfilePage = lazy(() => import('@views/pages/userprofilePage'))

// ---- platform administration (vendor staff) ----
const MasterClient = lazy(() => import('@views/masters/client'))
const MasterClientForm = lazy(() => import('@views/masters/client/create'))

// ---- workspace setup ----
const SetupUserTable = lazy(() => import('@views/setup/user'))
const SetupUserForm = lazy(() => import('@views/setup/user/create'))
const ViewRoleManagement = lazy(() => import('@views/setup/role'))
const CreateRoleManagement = lazy(() => import('@views/setup/role/create'))
const UserMenuAccess = lazy(() => import('@views/forms/role/NewPermission'))
const UserMenuAccessClient = lazy(() => import('@views/forms/role/NewClientUserPermission'))

// ---- product catalogue ----
const MasterCampaignTable = lazy(() => import('@views/masters/campaign'))
const CampaignsForm = lazy(() => import('@views/masters/campaign/create'))
const MasterDestinationTable = lazy(() => import('@views/masters/destinations'))
const DestinationForm = lazy(() => import('@views/masters/destinations/create'))
const MasterItenaryTable = lazy(() => import('@views/masters/itenary'))
const ItenaryClientsForm = lazy(() => import('@views/masters/itenary/create'))
const MasterPackagesTable = lazy(() => import('@views/masters/packages'))
const PackagesClientForm = lazy(() => import('@views/masters/packages/create'))
const PackageCreationWizard = lazy(() => import('@views/forms/packages/PackageCreationWizard'))
const PackageItenary = lazy(() => import('@views/forms/packageItenary'))
const PackageItenaryView = lazy(() => import('@views/forms/packageItenary/actitvityPackage'))

// ---- partners ----
const MasterSupplierTable = lazy(() => import('@views/masters/supplier'))
const SupplierForm = lazy(() => import('@views/masters/supplier/create'))
const MasterAgentTable = lazy(() => import('@views/masters/agent'))
const AgentForm = lazy(() => import('@views/masters/agent/create'))

// ---- sales pipeline ----
const MasterLeadsTable = lazy(() => import('@views/masters/leads'))
const LeadsForm = lazy(() => import('@views/masters/leads/create'))
const GuestForm = lazy(() => import('@views/forms/guestDetailsForm'))
const FinalPackageTable = lazy(() => import('@views/masters/finalPackage'))
const BookingWorkspace = lazy(() => import('@views/bookings/BookingWorkspace'))
const ServiceLedgerTable = lazy(() => import('@views/masters/transactions'))

// ---- integrations & careers ----
const GmailIntegrationForm = lazy(() => import('@views/forms/integrations/gmailIntegration'))
const FacebookIntegrationForm = lazy(() => import('@views/forms/integrations/facebookIntegration'))
const JobCandidates = lazy(() => import('@views/masters/JobCandidates/JobCandidates'))

/**
 * Wraps a lazily-loaded screen in its Suspense boundary. Every route used to
 * repeat this five-line block inline, which is most of why the file ran to 500
 * lines for 32 routes.
 *
 * @param {React.ComponentType} Component
 * @returns {JSX.Element}
 */
const page = Component => (
    <Suspense fallback={<Loader />}>
        <Component />
    </Suspense>
)

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
        // ---- shell ----
        { path: '/dashboard', element: page(AdminDashboard) },
        { path: '/userprofile', element: page(UserProfilePage) },
        // legacy link target inherited from the warehouse build
        { path: '/select-client-location', element: <Navigate to='/dashboard' replace /> },

        // ---- platform administration ----
        { path: '/master/client', element: page(MasterClient) },
        { path: '/master/client/create', element: page(MasterClientForm) },
        { path: '/master/client/edit/:id', element: page(MasterClientForm) },
        { path: '/master/client/permissions/:id/:email', element: page(UserMenuAccess) },
        { path: '/master/client/permissions/user/:id/:email', element: page(UserMenuAccessClient) },

        // ---- workspace users & roles ----
        { path: '/master/user', element: page(SetupUserTable) },
        { path: '/master/user/edit/:id', element: page(SetupUserForm) },
        { path: '/userManagement/user/create', element: page(SetupUserForm) },
        { path: '/userManagement/role', element: page(ViewRoleManagement) },
        { path: '/userManagement/role/create', element: page(CreateRoleManagement) },
        { path: '/userManagement/role/:id', element: page(CreateRoleManagement) },

        // ---- campaigns ----
        { path: '/master/campaigns', element: page(MasterCampaignTable) },
        { path: '/master/campaigns/add', element: page(CampaignsForm) },
        { path: '/master/campaigns/edit/:id', element: page(CampaignsForm) },

        // ---- destinations ----
        { path: '/master/destinations/:id', element: page(MasterDestinationTable) },
        { path: '/master/destinations/add', element: page(DestinationForm) },
        { path: '/master/destinations/edit/:id', element: page(DestinationForm) },

        // ---- itineraries ----
        { path: '/master/itenary/:id', element: page(MasterItenaryTable) },
        { path: '/master/itenary/add', element: page(ItenaryClientsForm) },
        { path: '/master/itenary/edit/:id', element: page(ItenaryClientsForm) },

        // ---- package templates ----
        { path: '/master/packages/:id', element: page(MasterPackagesTable) },
        { path: '/master/packages/add', element: page(PackagesClientForm) },
        { path: '/master/packages/edit/:id', element: page(PackagesClientForm) },
        { path: '/master/packages/wizard', element: page(PackageCreationWizard) },
        { path: '/package/activities/:campaignId/:packageId', element: page(PackageItenary) },
        { path: '/package/activities/:packageId', element: page(PackageItenaryView) },

        // ---- partners ----
        { path: '/master/supplier', element: page(MasterSupplierTable) },
        { path: '/master/supplier/add', element: page(SupplierForm) },
        { path: '/master/supplier/edit/:id', element: page(SupplierForm) },
        { path: '/master/agent', element: page(MasterAgentTable) },
        { path: '/master/agent/add', element: page(AgentForm) },
        { path: '/master/agent/edit/:id', element: page(AgentForm) },

        // ---- sales pipeline ----
        { path: '/process/leads', element: page(MasterLeadsTable) },
        { path: '/process/leads/add', element: page(LeadsForm) },
        { path: '/process/leads/edit/:id', element: page(LeadsForm) },
        { path: '/process/guest/add/:leadId', element: page(GuestForm) },
        { path: '/process/packages', element: page(FinalPackageTable) },
        { path: '/process/packages/:leadId', element: page(BookingWorkspace) },
        { path: '/process/transactions', element: page(ServiceLedgerTable) },

        // ---- integrations & careers ----
        { path: '/integration/gmail', element: page(GmailIntegrationForm) },
        { path: '/integration/facebook', element: page(FacebookIntegrationForm) },
        { path: '/process/candidates', element: page(JobCandidates) }
    ]
}

export default protectedRoutes
