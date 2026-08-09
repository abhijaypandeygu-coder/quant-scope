import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Activity, 
  Layers, 
  Newspaper, 
  FileText, 
  Bot, 
  Database, 
  Settings 
} from "lucide-react";

export function Sidebar() {
  const navItems = [
    { icon: BarChart3, label: "Overview", path: "/" },
    { icon: LineChart, label: "Markets", path: "/markets" },
    { icon: Activity, label: "Research", path: "/research" },
    { icon: PieChart, label: "Portfolio", path: "/portfolio" },
    { icon: Layers, label: "Risk", path: "/risk" },
    { icon: Activity, label: "Microstructure", path: "/microstructure" },
    { icon: Newspaper, label: "News", path: "/news" },
    { icon: FileText, label: "Fundamentals", path: "/fundamentals" },
    { icon: Bot, label: "AI Analyst", path: "/ai-analyst" },
    { icon: Database, label: "Data", path: "/data" },
  ];
  
  const location = useLocation();

  return (
    <div className="w-64 h-screen border-r bg-background flex flex-col">
      <div className="h-16 flex items-center px-6 border-b">
        <h1 className="text-xl font-bold tracking-tight">QuantScope</h1>
      </div>
      <div className="flex-1 py-4 flex flex-col gap-1 px-3">
        {navItems.map((item, i) => {
          const isActive = location.pathname === item.path || 
                           (location.pathname.startsWith("/market") && item.label === "Markets") ||
                           (location.pathname.startsWith("/research") && item.label === "Research");
          return (
            <Link 
              key={i} 
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 hover:text-accent-foreground text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t">
        <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </div>
  );
}
