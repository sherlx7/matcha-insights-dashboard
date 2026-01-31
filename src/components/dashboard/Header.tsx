import { Leaf } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Matsu Matcha</h1>
            <p className="text-sm text-muted-foreground">B2B Dashboard</p>
          </div>
        </div>
      </div>
    </header>
  );
}
