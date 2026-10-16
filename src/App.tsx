import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { SessionProvider, useSession } from "@/hooks/useSession";
import { ToastProvider } from "@/components/ui/overlay";
import { SignInProvider } from "@/components/auth/SignIn";
import { AppShell } from "@/components/layout/AppShell";
import { GridSkeleton } from "@/components/ui/states";
import { useTheme } from "@/hooks/useTheme";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";

const Browse = lazy(() => import("@/pages/Browse"));
const ListingPage = lazy(() => import("@/pages/ListingPage"));
const Sell = lazy(() => import("@/pages/Sell"));
const MyListings = lazy(() => import("@/pages/MyListings"));
const Messages = lazy(() => import("@/pages/Messages"));
const Saved = lazy(() => import("@/pages/Saved"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderDetail = lazy(() => import("@/pages/OrderDetail"));
const Profile = lazy(() => import("@/pages/profile/Profile"));
const Wallet = lazy(() => import("@/pages/profile/Wallet"));
const Alerts = lazy(() => import("@/pages/profile/Alerts"));
const LittleOnes = lazy(() => import("@/pages/profile/LittleOnes"));
const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Pro = lazy(() => import("@/pages/Pro"));
const Admin = lazy(() => import("@/pages/admin/Admin"));
const LegalPage = lazy(() => import("@/pages/legal/LegalPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function HomeRoute() {
  const { user, ready } = useSession();
  if (!ready) return <div className="page"><GridSkeleton count={4} /></div>;
  return user ? <Home /> : <Landing />;
}

export function App() {
  useTheme();
  return (
    <SessionProvider>
      <ToastProvider>
        <SignInProvider>
          <ScrollToTop />
          <AppShell>
            <Suspense fallback={<div className="page"><GridSkeleton count={4} /></div>}>
              <Routes>
                <Route path="/" element={<HomeRoute />} />
                <Route path="/welcome" element={<Landing />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/listing/:id" element={<ListingPage />} />
                <Route path="/sell" element={<Sell />} />
                <Route path="/sell/:id" element={<Sell />} />
                <Route path="/my-listings" element={<MyListings />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:id" element={<Messages />} />
                <Route path="/saved" element={<Saved />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/wallet" element={<Wallet />} />
                <Route path="/profile/alerts" element={<Alerts />} />
                <Route path="/profile/little-ones" element={<LittleOnes />} />
                <Route path="/u/:id" element={<PublicProfile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/pro" element={<Pro />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/:slug" element={<LegalPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AppShell>
        </SignInProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
