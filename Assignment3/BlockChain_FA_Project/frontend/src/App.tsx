import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { Layout } from "./components/Layout";
import { Architecture } from "./pages/Architecture";
import { CreateProject } from "./pages/CreateProject";
import { Explorer } from "./pages/Explorer";
import { Home } from "./pages/Home";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Regulator } from "./pages/Regulator";
import { Analytics } from "./pages/Analytics";

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/create" element={<CreateProject />} />
            <Route path="/regulator" element={<Regulator />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
}
