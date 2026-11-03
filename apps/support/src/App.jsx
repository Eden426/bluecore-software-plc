import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import { RequireStaff } from "./auth/RequireStaff.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import ClientsPage from "./pages/admin/ClientsPage.jsx";
import ClientDetailPage from "./pages/admin/ClientDetailPage.jsx";
import ProductsPage from "./pages/admin/ProductsPage.jsx";
import StaffPage from "./pages/admin/StaffPage.jsx";
import TicketsPage from "./pages/admin/TicketsPage.jsx";
import TicketDetailPage from "./pages/admin/TicketDetailPage.jsx";
import NewTicketPage from "./pages/admin/NewTicketPage.jsx";
import { CenteredMessage } from "./components/CenteredMessage.jsx";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireStaff>
            <AdminLayout />
          </RequireStaff>
        }
      >
        <Route index element={<Navigate to="tickets" replace />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/new" element={<NewTicketPage />} />
        <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:clientId" element={<ClientDetailPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="staff" element={<StaffPage />} />
      </Route>
      <Route path="*" element={<CenteredMessage title="Page not found" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
