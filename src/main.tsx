import { StrictMode, useEffect, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { useAuth } from "@/providers/auth-provider";
import { StaffHomePage } from "@/pages/staff-side/StaffHomePage";
import { StaffLoginPage } from "@/pages/staff-side/login/StaffLoginPage";
import { AppointmentsPage as StaffAppointmentsPage } from "@/pages/staff-side/appointments/AppointmentsPage";
import { AuditLogsPage } from "@/pages/staff-side/audit/AuditLogsPage";
import { LeavePage } from "@/pages/staff-side/leave/LeavePage";
import { NotificationsPage as StaffNotificationsPage } from "@/pages/staff-side/notifications/NotificationsPage";
import { PatientsPage } from "@/pages/staff-side/patients/PatientsPage";
import { SchedulePage } from "@/pages/staff-side/schedule/SchedulePage";
import { StaffManagementPage } from "@/pages/staff-side/staff/StaffManagementPage";
import { SettingsPage } from "@/pages/staff-side/settings/SettingsPage";
import { AccountPage } from "@/pages/user-side/account/account-page";
import { AboutPage } from "@/pages/user-side/about-page";
import { InvoicePaymentPage } from "@/pages/user-side/bills/invoice-payment-page";
import { OutstandingInvoicesPage } from "@/pages/user-side/bills/outstanding-invoices-page";
import { PaymentHistoryPage } from "@/pages/user-side/bills/payment-history-page";
import { BookingPage } from "@/pages/user-side/visits/booking-page";
import { UpcomingVisitsPage } from "@/pages/user-side/visits/upcoming-visits-page";
import { VisitHistoryPage } from "@/pages/user-side/visits/visit-history-page";
import { ForgotPasswordPage } from "@/pages/user-side/auth/forgot-password-page";
import { FamilyPage } from "@/pages/user-side/family/family-page";
import { ConsultationNotesPage } from "@/pages/user-side/records/consultation-notes-page";
import { HealthRecordsPage } from "@/pages/user-side/records/health-records-page";
import { LabResultsPage } from "@/pages/user-side/records/lab-results-page";
import { HomePage } from "@/pages/user-side/home-page";
import { LandingPage } from "@/pages/user-side/landing-page";
import { LoginPage } from "@/pages/user-side/auth/login-page";
import { ClinicRecordsPage } from "@/pages/user-side/records/clinic-records-page";
import { NotFound } from "@/pages/user-side/not-found";
import { OrderHistoryPage } from "@/pages/user-side/medicine/order-history-page";
import { PrescribedMedicineBrowsePage } from "@/pages/user-side/medicine/prescribed-medicine-browse-page";
import { PrescribedMedicinePage } from "@/pages/user-side/medicine/prescribed-medicine-page";
import { CartPage } from "@/pages/user-side/medicine/cart-page";
import { CheckoutPage } from "@/pages/user-side/medicine/checkout-page";
import { ContactPage } from "@/pages/user-side/contact-page";
import { DoctorDetailPage } from "@/pages/user-side/doctors/doctor-detail-page";
import { DoctorsPage } from "@/pages/user-side/doctors/doctors-page";
import { ChatPage } from "@/pages/user-side/chat/chat-page";
import { AnnouncementsPage } from "@/pages/user-side/announcements/announcements-page";
import { NotificationsPage } from "@/pages/user-side/notifications/notifications-page";
import { RegisterPage } from "@/pages/user-side/auth/register-page";
import { AuthProvider } from "@/providers/auth-provider";
import { getClinicRecords } from "@/utils/clinic-records";
import { hasOverdueInvoice } from "@/utils/invoices";
import { CartProvider } from "@/providers/cart-provider";
import { MedicineCatalogProvider } from "@/providers/medicine-catalog";
import { ChatProvider } from "@/providers/chat-provider";
import { LocaleProvider } from "@/providers/locale-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ChatWidget } from "@/components/marketing/chat/chat-widget";
import { BackToTop } from "@/components/marketing/back-to-top";
import "@/assets/styles/globals.css";

type StaffRole = "Admin" | "Doctor" | "Pharmacist";

function isStaffRole(value: string | undefined): value is StaffRole {
    return value === "Admin" || value === "Doctor" || value === "Pharmacist";
}

function StaffRouteGuard({ roles }: { roles?: StaffRole[] }) {
    const { user, isReady } = useAuth();
    const location = useLocation();

    if (!isReady) {
        return null;
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
    ["/home", "/book", "/visits", "/history", "/payments", "/records", "/notes", "/labs", "/family", "/medicine", "/cart", "/checkout", "/orders", "/clinic-records", "/doctors", "/chat", "/notifications"].some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
    );

const AppRoutes = () => {
    const location = useLocation();
    const { profile, isReady } = useAuth();
    const [paidTick, setPaidTick] = useState(0);
    const bookStickyBar = location.pathname === "/book";
    const isStaffRoute = location.pathname.startsWith("/staff");
    const overdue = isReady && profile ? hasOverdueInvoice(getClinicRecords("en")) : false;

    useEffect(() => {
        const refresh = () => setPaidTick((tick) => tick + 1);
        window.addEventListener("careplus-invoices", refresh);
        return () => window.removeEventListener("careplus-invoices", refresh);
    }, []);

    useLayoutEffect(() => {
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        const hashId = decodeURIComponent(location.hash.slice(1));
        const target = hashId ? document.getElementById(hashId) : null;
        if (target) {
            target.scrollIntoView({ behavior, block: "start" });
            return;
        }
        window.scrollTo({ top: 0, behavior });
    }, [location.pathname, location.hash, location.key]);

    if (isReady && profile && location.pathname === "/") return <Navigate to="/home" replace />;
    if (isReady && !profile && location.pathname === "/home") return <Navigate to="/" replace />;
    if (overdue && featurePath(location.pathname)) return <Navigate to="/invoices" replace />;

    return (
        <>
            <div key={`${location.pathname}-${paidTick}`} className="careplus-page">
                <Routes location={location}>
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
                    <Route path="/invoices" element={<OutstandingInvoicesPage />} />
                    <Route path="/invoices/:id/pay" element={<InvoicePaymentPage />} />
                    <Route path="/payments" element={<PaymentHistoryPage />} />
                    <Route path="/records" element={<HealthRecordsPage />} />
                    <Route path="/notes" element={<ConsultationNotesPage />} />
                    <Route path="/labs" element={<LabResultsPage />} />
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
                        <Route path="/staff/schedules" element={<SchedulePage />} />
                        <Route path="/staff/leave" element={<LeavePage />} />
                        <Route path="/staff/notifications" element={<StaffNotificationsPage />} />
                        <Route path="/staff/settings" element={<SettingsPage />} />
                    </Route>
                    <Route element={<StaffRouteGuard roles={["Admin"]} />}>
                        <Route path="/staff/staff" element={<StaffManagementPage />} />
                        <Route path="/staff/patients" element={<PatientsPage />} />
                        <Route path="/staff/audit-logs" element={<AuditLogsPage />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
            {!isStaffRoute && location.pathname !== "/chat" && !overdue ? <ChatWidget liftAboveStickyBar={bookStickyBar} /> : null}
            {!isStaffRoute ? <BackToTop offsetForChat={location.pathname !== "/chat"} liftAboveStickyBar={bookStickyBar} /> : null}
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
                            <MedicineCatalogProvider>
                            <CartProvider>
                                <NotificationProvider>
                                    <ChatProvider>
                                        <AppRoutes />
                                    </ChatProvider>
                                </NotificationProvider>
                            </CartProvider>
                            </MedicineCatalogProvider>
                        </AuthProvider>
                    </RouteProvider>
                </BrowserRouter>
            </LocaleProvider>
        </ThemeProvider>
    </StrictMode>,
);
