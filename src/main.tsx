import { type ComponentType, StrictMode, Suspense, lazy, useEffect, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { useAuth } from "@/providers/auth-provider";
import { MobileBottomNav, shouldHideMobileBottomNav } from "@/components/marketing/header-navigation/mobile-bottom-nav";
import { NotificationToasts } from "@/components/marketing/notifications/notification-toasts";
import { HomePage } from "@/pages/user-side/home-page";
import { LandingPage } from "@/pages/user-side/landing-page";
import { AuthProvider } from "@/providers/auth-provider";

// Every other page is its own chunk, so the first visit only downloads Landing/Home.
const page = <K extends string>(loader: () => Promise<Record<K, ComponentType>>, name: K) =>
    lazy(() => loader().then((module) => ({ default: module[name] })));

const staffPageLoaders = [
    () => import("@/pages/staff-side/StaffHomePage"),
    () => import("@/pages/staff-side/login/StaffLoginPage"),
    () => import("@/pages/staff-side/appointments/AppointmentsPage"),
    () => import("@/pages/staff-side/audit/AuditLogsPage"),
    () => import("@/pages/staff-side/leave/LeavePage"),
    () => import("@/pages/staff-side/notifications/NotificationsPage"),
    () => import("@/pages/staff-side/patients/PatientsPage"),
    () => import("@/pages/staff-side/queue/StaffQueuePage"),
    () => import("@/pages/staff-side/rooms/ClinicRoomsPage"),
    () => import("@/pages/staff-side/medicine/MedicinePage"),
    () => import("@/pages/staff-side/medicine-batches/MedicineBatchPage"),
    () => import("@/pages/staff-side/prescriptions/PrescriptionsPage"),
    () => import("@/pages/staff-side/schedule/SchedulePage"),
    () => import("@/pages/staff-side/staff/StaffManagementPage"),
    () => import("@/pages/staff-side/settings/SettingsPage"),
    () => import("@/pages/staff-side/medical-records/MedicalRecordsPage"),
] as const;

const prefetchStaffPages = () => {
    for (const load of staffPageLoaders) void load();
};

const patientPageLoaders = [
    () => import("@/pages/user-side/account/account-page"),
    () => import("@/pages/user-side/about-page"),
    () => import("@/pages/user-side/bills/invoice-payment-page"),
    () => import("@/pages/user-side/bills/outstanding-invoices-page"),
    () => import("@/pages/user-side/bills/payment-history-page"),
    () => import("@/pages/user-side/visits/booking-page"),
    () => import("@/pages/user-side/visits/upcoming-visits-page"),
    () => import("@/pages/user-side/visits/visit-history-page"),
    () => import("@/pages/user-side/visits/queue-page"),
    () => import("@/pages/user-side/auth/forgot-password-page"),
    () => import("@/pages/user-side/family/family-page"),
    () => import("@/pages/user-side/records/health-records-page"),
    () => import("@/pages/user-side/auth/login-page"),
    () => import("@/pages/user-side/records/clinic-records-page"),
    () => import("@/pages/user-side/not-found"),
    () => import("@/pages/user-side/medicine/order-history-page"),
    () => import("@/pages/user-side/medicine/prescribed-medicine-browse-page"),
    () => import("@/pages/user-side/medicine/prescribed-medicine-page"),
    () => import("@/pages/user-side/medicine/cart-page"),
    () => import("@/pages/user-side/medicine/checkout-page"),
    () => import("@/pages/user-side/contact-page"),
    () => import("@/pages/user-side/doctors/doctor-detail-page"),
    () => import("@/pages/user-side/doctors/doctors-page"),
    () => import("@/pages/user-side/chat/chat-page"),
    () => import("@/pages/user-side/announcements/announcements-page"),
    () => import("@/pages/user-side/notifications/notifications-page"),
    () => import("@/pages/user-side/auth/register-page"),
] as const;

const prefetchPatientPages = () => {
    for (const load of patientPageLoaders) void load();
};

const StaffHomePage = page(() => import("@/pages/staff-side/StaffHomePage"), "StaffHomePage");
const StaffLoginPage = page(() => import("@/pages/staff-side/login/StaffLoginPage"), "StaffLoginPage");
const StaffAppointmentsPage = page(() => import("@/pages/staff-side/appointments/AppointmentsPage"), "AppointmentsPage");
const AuditLogsPage = page(() => import("@/pages/staff-side/audit/AuditLogsPage"), "AuditLogsPage");
const LeavePage = page(() => import("@/pages/staff-side/leave/LeavePage"), "LeavePage");
const StaffNotificationsPage = page(() => import("@/pages/staff-side/notifications/NotificationsPage"), "NotificationsPage");
const PatientsPage = page(() => import("@/pages/staff-side/patients/PatientsPage"), "PatientsPage");
const StaffQueuePage = page(() => import("@/pages/staff-side/queue/StaffQueuePage"), "StaffQueuePage");
const ClinicRoomsPage = page(() => import("@/pages/staff-side/rooms/ClinicRoomsPage"), "ClinicRoomsPage");
const MedicinePage = page(() => import("@/pages/staff-side/medicine/MedicinePage"), "MedicinePage");
const MedicineBatchPage = page(() => import("@/pages/staff-side/medicine-batches/MedicineBatchPage"), "MedicineBatchPage");
const PrescriptionsPage = page(() => import("@/pages/staff-side/prescriptions/PrescriptionsPage"), "PrescriptionsPage");
const SchedulePage = page(() => import("@/pages/staff-side/schedule/SchedulePage"), "SchedulePage");
const StaffManagementPage = page(() => import("@/pages/staff-side/staff/StaffManagementPage"), "StaffManagementPage");
const SettingsPage = page(() => import("@/pages/staff-side/settings/SettingsPage"), "SettingsPage");
const MedicalRecordsPage = page(() => import("@/pages/staff-side/medical-records/MedicalRecordsPage"), "MedicalRecordsPage");
const AccountPage = page(() => import("@/pages/user-side/account/account-page"), "AccountPage");
const AboutPage = page(() => import("@/pages/user-side/about-page"), "AboutPage");
const InvoicePaymentPage = page(() => import("@/pages/user-side/bills/invoice-payment-page"), "InvoicePaymentPage");
const StripeReturnPage = page(() => import("@/pages/user-side/bills/stripe-return-page"), "StripeReturnPage");
const OutstandingInvoicesPage = page(() => import("@/pages/user-side/bills/outstanding-invoices-page"), "OutstandingInvoicesPage");
const PaymentHistoryPage = page(() => import("@/pages/user-side/bills/payment-history-page"), "PaymentHistoryPage");
const BookingPage = page(() => import("@/pages/user-side/visits/booking-page"), "BookingPage");
const UpcomingVisitsPage = page(() => import("@/pages/user-side/visits/upcoming-visits-page"), "UpcomingVisitsPage");
const VisitHistoryPage = page(() => import("@/pages/user-side/visits/visit-history-page"), "VisitHistoryPage");
const QueuePage = page(() => import("@/pages/user-side/visits/queue-page"), "QueuePage");
const ForgotPasswordPage = page(() => import("@/pages/user-side/auth/forgot-password-page"), "ForgotPasswordPage");
const FamilyPage = page(() => import("@/pages/user-side/family/family-page"), "FamilyPage");
const HealthRecordsPage = page(() => import("@/pages/user-side/records/health-records-page"), "HealthRecordsPage");
const LoginPage = page(() => import("@/pages/user-side/auth/login-page"), "LoginPage");
const ClinicRecordsPage = page(() => import("@/pages/user-side/records/clinic-records-page"), "ClinicRecordsPage");
const NotFound = page(() => import("@/pages/user-side/not-found"), "NotFound");
const OrderHistoryPage = page(() => import("@/pages/user-side/medicine/order-history-page"), "OrderHistoryPage");
const PrescribedMedicineBrowsePage = page(() => import("@/pages/user-side/medicine/prescribed-medicine-browse-page"), "PrescribedMedicineBrowsePage");
const PrescribedMedicinePage = page(() => import("@/pages/user-side/medicine/prescribed-medicine-page"), "PrescribedMedicinePage");
const CartPage = page(() => import("@/pages/user-side/medicine/cart-page"), "CartPage");
const CheckoutPage = page(() => import("@/pages/user-side/medicine/checkout-page"), "CheckoutPage");
const ContactPage = page(() => import("@/pages/user-side/contact-page"), "ContactPage");
const DoctorDetailPage = page(() => import("@/pages/user-side/doctors/doctor-detail-page"), "DoctorDetailPage");
const DoctorsPage = page(() => import("@/pages/user-side/doctors/doctors-page"), "DoctorsPage");
const ChatPage = page(() => import("@/pages/user-side/chat/chat-page"), "ChatPage");
const AnnouncementsPage = page(() => import("@/pages/user-side/announcements/announcements-page"), "AnnouncementsPage");
const NotificationsPage = page(() => import("@/pages/user-side/notifications/notifications-page"), "NotificationsPage");
const RegisterPage = page(() => import("@/pages/user-side/auth/register-page"), "RegisterPage");
import { OutstandingInvoicesProvider, useOutstandingInvoices } from "@/providers/outstanding-invoices";
import { CartProvider } from "@/providers/cart-provider";
import { MedicineCatalogProvider } from "@/providers/medicine-catalog";
import { ChatProvider } from "@/providers/chat-provider";
import { LocaleProvider } from "@/providers/locale-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ChatWidget } from "@/components/marketing/chat/chat-widget";
import { BackToTop } from "@/components/marketing/back-to-top";
import { PatientPageTransition } from "@/components/marketing/page-transition";
import "@/assets/styles/globals.css";

type StaffRole = "Admin" | "Doctor" | "Pharmacist";

function isStaffRole(value: string | undefined): value is StaffRole {
    return value === "Admin" || value === "Doctor" || value === "Pharmacist";
}

function StaffRouteGuard({ roles }: { roles?: StaffRole[] }) {
    const { user, isReady } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (isReady && user && isStaffRole(user.role)) prefetchStaffPages();
    }, [isReady, user]);

    if (!isReady) {
        return <div className="staff-route-fallback" aria-hidden />;
    }

    if (!user) {
        return <Navigate replace state={{ from: location.pathname }} to="/staff/login" />;
    }

    if (!isStaffRole(user?.role)) {
        return <Navigate replace to="/home" />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate replace to="/staff" />;
    }

    return <Outlet />;
}

function StaffLoginRoute() {
    const { user, isReady } = useAuth();

    if (!isReady) {
        return null;
    }

    if (user && isStaffRole(user.role)) {
        return <Navigate replace to="/staff" />;
    }

    return <StaffLoginPage />;
}

const featurePath = (pathname: string) =>
    ["/home", "/book", "/visits", "/history", "/queue", "/payments", "/records", "/family", "/medicine", "/cart", "/checkout", "/orders", "/clinic-records", "/doctors", "/chat", "/notifications"].some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
    );

const AppRoutes = () => {
    const location = useLocation();
    const { profile, isReady } = useAuth();
    const { overdue, ready: invoicesReady } = useOutstandingInvoices();
    const bookStickyBar = location.pathname === "/book";
    const isStaffRoute = location.pathname.toLowerCase().startsWith("/staff");
    const showMobileBottomNav = Boolean(profile) && !isStaffRoute && !shouldHideMobileBottomNav(location.pathname);

    useLayoutEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        // Instant jump for patient page fades; hash links can still ease into place.
        const behavior = location.hash && !reduceMotion ? "smooth" : "auto";
        const hashId = decodeURIComponent(location.hash.slice(1));
        const target = hashId ? document.getElementById(hashId) : null;
        if (target) {
            target.scrollIntoView({ behavior, block: "start" });
            return;
        }
        window.scrollTo({ top: 0, behavior: "auto" });
    }, [location.pathname, location.hash, location.key]);

    useEffect(() => {
        if (!isReady || isStaffRoute) return;
        prefetchPatientPages();
    }, [isReady, isStaffRoute]);

    if (isReady && profile && location.pathname === "/") return <Navigate to="/home" replace />;
    if (isReady && !profile && location.pathname === "/home") return <Navigate to="/" replace />;
    if (invoicesReady && overdue && featurePath(location.pathname)) return <Navigate to="/invoices" replace />;

    return (
        <>
            {/* ponytail: stable shell key keeps Suspense from blanking to black between lazy pages */}
            <div key={isStaffRoute ? "staff" : "patient"} className={showMobileBottomNav ? "careplus-page careplus-has-mobile-nav" : "careplus-page"}>
                <Suspense fallback={isStaffRoute ? <div className="staff-route-fallback" aria-hidden /> : <div className="min-h-dvh bg-primary" aria-hidden />}>
                <PatientPageTransition enabled={!isStaffRoute}>
                {(routeLocation) => (
                <Routes location={routeLocation}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/book" element={<BookingPage />} />
                    <Route path="/visits" element={<UpcomingVisitsPage />} />
                    <Route path="/history" element={<VisitHistoryPage />} />
                    <Route path="/queue" element={<QueuePage />} />
                    <Route path="/invoices" element={<OutstandingInvoicesPage />} />
                    <Route path="/invoices/:id/pay" element={<InvoicePaymentPage />} />
                    <Route path="/pay/stripe/return" element={<StripeReturnPage />} />
                    <Route path="/pay/sandbox" element={<Navigate to="/invoices" replace />} />
                    <Route path="/payments" element={<PaymentHistoryPage />} />
                    <Route path="/records" element={<HealthRecordsPage />} />
                    <Route path="/family" element={<FamilyPage />} />
                    <Route path="/medicine" element={<PrescribedMedicineBrowsePage />} />
                    <Route path="/medicine/:id" element={<PrescribedMedicinePage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/orders" element={<OrderHistoryPage />} />
                    <Route path="/clinic-records" element={<ClinicRecordsPage />} />
                    <Route path="/doctors" element={<DoctorsPage />} />
                    <Route path="/doctors/:id" element={<DoctorDetailPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/announcements" element={<AnnouncementsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/staff/login" element={<StaffLoginRoute />} />
                    <Route element={<StaffRouteGuard />}>
                        <Route path="/staff" element={<StaffHomePage />} />
                        <Route path="/staff/appointments" element={<StaffAppointmentsPage />} />
                        <Route element={<StaffRouteGuard roles={["Admin", "Doctor"]} />}>
                            <Route path="/staff/queue" element={<StaffQueuePage />} />
                        </Route>
                        <Route path="/staff/schedules" element={<SchedulePage />} />
                        <Route path="/staff/leave" element={<LeavePage />} />
                        <Route element={<StaffRouteGuard roles={["Admin", "Pharmacist"]} />}>
                            <Route path="/staff/medicine" element={<MedicinePage />} />
                        </Route>
                        <Route element={<StaffRouteGuard roles={["Admin", "Pharmacist"]} />}>
                            <Route path="/staff/medicine-batches" element={<MedicineBatchPage />} />
                        </Route>
                        <Route element={<StaffRouteGuard roles={["Admin", "Doctor", "Pharmacist"]} />}>
                            <Route path="/staff/prescriptions" element={<PrescriptionsPage />} />
                        </Route>
                        <Route path="/staff/notifications" element={<StaffNotificationsPage />} />
                        <Route path="/staff/settings" element={<SettingsPage />} />
                    </Route>
                    <Route element={<StaffRouteGuard roles={["Admin", "Doctor"]} />}>
                        <Route path="/staff/medical-records" element={<MedicalRecordsPage />} />
                    </Route>
                    <Route element={<StaffRouteGuard roles={["Admin"]} />}>
                        <Route path="/staff/staff" element={<StaffManagementPage />} />
                        <Route path="/staff/patients" element={<PatientsPage />} />
                        <Route path="/staff/rooms" element={<ClinicRoomsPage />} />
                        <Route path="/staff/audit-logs" element={<AuditLogsPage />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                </Routes>
                )}
                </PatientPageTransition>
                </Suspense>
            </div>
            {!isStaffRoute && location.pathname !== "/chat" && !overdue ? (
                <div className={profile ? "max-lg:hidden" : undefined}>
                    <ChatWidget liftAboveStickyBar={bookStickyBar} />
                </div>
            ) : null}
            {!isStaffRoute ? (
                <BackToTop
                    offsetForChat={location.pathname !== "/chat" && !profile}
                    liftAboveStickyBar={bookStickyBar}
                    liftAboveMobileNav={showMobileBottomNav}
                />
            ) : null}
            {showMobileBottomNav ? <MobileBottomNav /> : null}
            {!isStaffRoute ? <NotificationToasts /> : null}
        </>
    );
};

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider defaultTheme="light">
            <LocaleProvider>
                <BrowserRouter>
                    <RouteProvider>
                        <AuthProvider>
                            <OutstandingInvoicesProvider>
                            <MedicineCatalogProvider>
                            <CartProvider>
                                <NotificationProvider>
                                    <ChatProvider>
                                        <AppRoutes />
                                    </ChatProvider>
                                </NotificationProvider>
                            </CartProvider>
                            </MedicineCatalogProvider>
                            </OutstandingInvoicesProvider>
                        </AuthProvider>
                    </RouteProvider>
                </BrowserRouter>
            </LocaleProvider>
        </ThemeProvider>
    </StrictMode>,
);

// ponytail: tiny SW so Chrome can offer Install / Add to Home Screen
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    });
}
