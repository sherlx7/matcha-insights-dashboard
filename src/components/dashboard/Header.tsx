import { useNavigate } from "react-router-dom";
import { Leaf, BarChart3, Boxes, FlaskConical, Shield, LogOut, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCount?: number;
}

export function Header({
  activeTab,
  onTabChange,
  pendingCount = 0,
}: HeaderProps) {
  const navigate = useNavigate();
  const { user, profile, isAdmin, permissions, signOut } = useAuth();

  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Check if user can access each tab
  const canAccessFinancials = isAdmin || permissions?.can_access_financials;
  const canAccessOperations = isAdmin || permissions?.can_access_operations;
  const canAccessSandbox = isAdmin || permissions?.can_access_sandbox;

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight">Matsu Matcha</h1>
              <p className="text-xs text-muted-foreground">B2B Dashboard</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList className="h-10 bg-muted/50 p-1">
              {canAccessFinancials && (
                <TabsTrigger 
                  value="financials" 
                  className={cn(
                    "flex items-center gap-2 px-4 transition-all",
                    "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  )}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Financials</span>
                </TabsTrigger>
              )}
              {canAccessOperations && (
                <TabsTrigger 
                  value="operations" 
                  className={cn(
                    "flex items-center gap-2 px-4 transition-all",
                    "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  )}
                >
                  <Boxes className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Operations</span>
                  {pendingCount > 0 && (
                    <span className="ml-1 flex items-center justify-center min-w-5 h-5 rounded-full bg-amber-500 text-amber-50 px-1.5 text-xs font-semibold">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
              )}
              {canAccessSandbox && (
                <TabsTrigger 
                  value="sandbox" 
                  className={cn(
                    "flex items-center gap-2 px-4 transition-all",
                    "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  )}
                >
                  <FlaskConical className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Sandbox</span>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(profile?.full_name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
