import { Routes, Route } from "react-router-dom";
import { AppShell } from "./AppShell";
import { LandingPage } from "../pages/LandingPage";
import { DemoPage } from "../pages/DemoPage";
import { LoginPage } from "../pages/LoginPage";
import { ChatRoomPage } from "../pages/ChatRoomPage";
import { StudioPage } from "../pages/StudioPage";
import { SettingsPage } from "../pages/SettingsPage";
import { DataManagementPage } from "../pages/DataManagementPage";
import { AdminPage } from "../pages/AdminPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/roleplay" element={<ChatRoomPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/data" element={<DataManagementPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
