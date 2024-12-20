import { AppSidebar } from "@/components/app-sidebar";
import Navbar from "@/components/custom/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex h-full w-full flex-col p-4">
        <Navbar />
        {children}
      </main>
    </SidebarProvider>
  );
}
