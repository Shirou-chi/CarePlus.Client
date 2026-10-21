import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { AccountPage } from "@/pages/user-side/account-page";
import { AboutPage } from "@/pages/user-side/about-page";
import { BookingPage } from "@/pages/user-side/booking-page";
import { ForgotPasswordPage } from "@/pages/user-side/forgot-password-page";
import { HealthRecordsPage } from "@/pages/user-side/health-records-page";
import { HomePage } from "@/pages/user-side/home-page";
import { LandingPage } from "@/pages/user-side/landing-page";
import { LoginPage } from "@/pages/user-side/login-page";
import { ClinicRecordsPage } from "@/pages/user-side/clinic-records-page";
import { NotFound } from "@/pages/user-side/not-found";
import { OrderHistoryPage } from "@/pages/user-side/order-history-page";
import { PrescribedMedicineBrowsePage } from "@/pages/user-side/prescribed-medicine-browse-page";
import { PrescribedMedicinePage } from "@/pages/user-side/prescribed-medicine-page";
import { CartPage } from "@/pages/user-side/cart-page";
import { ContactPage } from "@/pages/user-side/contact-page";
import { DoctorDetailPage } from "@/pages/user-side/doctor-detail-page";
import { DoctorsPage } from "@/pages/user-side/doctors-page";
import { ChatPage } from "@/pages/user-side/chat-page";
import { NotificationsPage } from "@/pages/user-side/notifications-page";
import { RegisterPage } from "@/pages/user-side/register-page";
import { AuthProvider } from "@/providers/auth-provider";
import { CartProvider } from "@/providers/cart-provider";
import { ChatProvider } from "@/providers/chat-provider";
import { LocaleProvider } from "@/providers/locale-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ChatWidget } from "@/components/marketing/chat/chat-widget";
import { BackToTop } from "@/components/marketing/back-to-top";
import "@/assets/styles/globals.css";

const AppRoutes = () => {
    const location = useLocation();
    const bookStickyBar = location.pathname === "/book";

    return (
        <>
            <div key={location.pathname} className="careplus-page">
                <Routes location={location}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/book" element={<BookingPage />} />
                    <Route path="/records" element={<HealthRecordsPage />} />
                    <Route path="/medicine" element={<PrescribedMedicineBrowsePage />} />
                    <Route path="/medicine/:id" element={<PrescribedMedicinePage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/orders" element={<OrderHistoryPage />} />
                    <Route path="/clinic-records" element={<ClinicRecordsPage />} />
                    <Route path="/doctors" element={<DoctorsPage />} />
                    <Route path="/doctors/:id" element={<DoctorDetailPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
            {location.pathname === "/chat" ? null : <ChatWidget liftAboveStickyBar={bookStickyBar} />}
            <BackToTop offsetForChat={location.pathname !== "/chat"} liftAboveStickyBar={bookStickyBar} />
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
                            <CartProvider>
                                <NotificationProvider>
                                    <ChatProvider>
                                        <AppRoutes />
                                    </ChatProvider>
                                </NotificationProvider>
                            </CartProvider>
                        </AuthProvider>
                    </RouteProvider>
                </BrowserRouter>
            </LocaleProvider>
        </ThemeProvider>
    </StrictMode>,
);
