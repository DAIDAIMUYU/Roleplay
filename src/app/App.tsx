import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../features/auth";
import { AppRouter } from "./router";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
