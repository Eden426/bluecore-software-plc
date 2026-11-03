import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import { RequireStaff } from "./auth/RequireStaff.jsx";
import HelpLayout from "./pages/help/HelpLayout.jsx";
import HelpHome from "./pages/help/HelpHome.jsx";
import SearchPage from "./pages/help/SearchPage.jsx";
import KbIndexPage from "./pages/help/KbIndexPage.jsx";
import FaqPage from "./pages/help/FaqPage.jsx";
import DocsPage from "./pages/help/DocsPage.jsx";
import UpdatesPage from "./pages/help/UpdatesPage.jsx";
import ArticlePage from "./pages/help/ArticlePage.jsx";
import ChatsPage from "./pages/admin/ChatsPage.jsx";
import KbListPage from "./pages/admin/KbListPage.jsx";
import KbEditorPage from "./pages/admin/KbEditorPage.jsx";
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
      <Route element={<HelpLayout />}>
        <Route path="/" element={<HelpHome />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/kb" element={<KbIndexPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/:productSlug" element={<DocsPage />} />
        <Route path="/updates" element={<UpdatesPage />} />
        <Route path="/articles/:slug" element={<ArticlePage />} />
      </Route>
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
        <Route path="chats" element={<ChatsPage />} />
        <Route path="chats/:chatId" element={<ChatsPage />} />
        <Route path="kb" element={<KbListPage />} />
        <Route path="kb/new" element={<KbEditorPage />} />
        <Route path="kb/:articleId" element={<KbEditorPage />} />
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
