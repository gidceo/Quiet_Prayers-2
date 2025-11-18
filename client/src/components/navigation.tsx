import { Link, useLocation } from "wouter";
import { Home, MessageCircleQuestion, Bookmark } from "lucide-react";
import { Button } from "./ui/button";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Prayer Requests", icon: Home },
    { path: "/q-and-a", label: "Q&A", icon: MessageCircleQuestion },
    { path: "/bookmarks", label: "Saved", icon: Bookmark },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
