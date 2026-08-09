import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { Dashboard } from "./pages/Dashboard";
import { MarketTerminal } from "./pages/MarketTerminal";
import { MarketsOverview } from "./pages/MarketsOverview";
import { Portfolio } from "./pages/Portfolio";
import { Risk } from "./pages/Risk";
import { Research } from "./pages/Research";
import { Microstructure } from "./pages/Microstructure";
import { AIAnalyst } from "./pages/AIAnalyst";
import { News } from "./pages/News";
import { Fundamentals } from "./pages/Fundamentals";
import { Data } from "./pages/Data";

function App() {
  return (
    <div className="flex h-screen bg-background text-foreground dark">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/markets" element={<MarketsOverview />} />
            <Route path="/market/:ticker" element={<MarketTerminal />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/risk" element={<Risk />} />
            <Route path="/research" element={<Research />} />
            <Route path="/microstructure" element={<Microstructure />} />
            <Route path="/ai-analyst" element={<AIAnalyst />} />
            <Route path="/news" element={<News />} />
            <Route path="/fundamentals" element={<Fundamentals />} />
            <Route path="/data" element={<Data />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
