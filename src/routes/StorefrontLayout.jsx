/* Storefront Shell */
import { Outlet } from "react-router-dom";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/Footer";
import FloatingActions from "@/components/layout/FloatingActions";
import CookieConsent from "@/components/layout/CookieConsent";

export default function StorefrontLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-ivory-50 text-espresso">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FloatingActions />
      <CookieConsent />
    </div>
  );
}
