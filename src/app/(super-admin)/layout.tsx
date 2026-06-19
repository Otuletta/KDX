import { SidebarProvider } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/super-admin/super-admin-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="flex bg-[#F3F4F6] min-h-screen w-full relative">
                {/* 1) Fixed Sidebar */}
                <div className="hidden md:flex flex-col w-[280px] fixed inset-y-0 z-50">
                    <SuperAdminSidebar />
                </div>

                {/* 2) Main Content Area pushes right by sidebar width on desktop */}
                <main className="flex-1 flex flex-col min-w-0 md:pl-[280px]">
                    <AppHeader isSuperAdminView={true} />
                    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 mt-16 md:mt-0">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
