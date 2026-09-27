/* Root Application */
import { BrowserRouter, Routes } from "react-router-dom";

import AppProviders from "./AppProviders";
import ScrollToTop from "./components/layout/ScrollToTop";
import DraftDock from "./components/ui/DraftDock";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import LiquidPress from "./components/ui/LiquidPress";
import RouteSeo from "./components/seo/RouteSeo";
import authRoutes from "./routes/AuthRoutes";
import dashboardRoutes from "./routes/DashboardRoutes";
import storefrontRoutes from "./routes/StorefrontRoutes";

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <ScrollToTop />
        {/* Draft dock renders app-wide */}
        <DraftDock />
        {/* The liquid press on icon buttons, for touch as well as mouse. */}
        <LiquidPress />
        {/* Title, description and canonical per route; before <Routes> so a page's own <Seo> wins. */}
        <RouteSeo />
        {/* Inside the router so it can clear itself on navigation, and around
            <Routes> only — a page that throws during render should not take the
            header, footer or draft dock down with it. */}
        <ErrorBoundary>
          <Routes>
            {authRoutes()}
            {dashboardRoutes()}
            {storefrontRoutes()}
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
