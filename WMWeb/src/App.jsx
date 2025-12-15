import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddEditDailyWorklogs from "./pages/AddEditDailyWorklogs";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      {/* Header */}
      <Header onMenuClick={toggleSidebar} />
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      {/* Main content */}
      <main className="p-4">
        <BrowserRouter>
          <Routes>
            {/* add-edit-daily-worklogs */}
            <Route path="/" element={<AddEditDailyWorklogs />} />
          </Routes>
        </BrowserRouter>
      </main>
    </>
  );
}

export default App;
