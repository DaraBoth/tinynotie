"use client";

import {
  Calendar,
  ChevronDown,
  Home,
  Inbox,
  Search,
  LucidePersonStanding,
  Settings,
  LogOut,
  Moon,
  Sun,
  Languages,
} from "lucide-react";

import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import DinnerDiningIcon from "@mui/icons-material/DinnerDining";
import CoffeeIcon from "@mui/icons-material/Coffee";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";
import Link from "next/link";
import { useTheme } from "next-themes";
import SparklesText from "./magicui/sparkles-text";
import clsx from "clsx";
import { usePathname } from "next/navigation";

const featureMenuGroup = [
  {
    title: "Translate",
    url: "/translate",
    icon: Languages,
    isPending: true,
  },
];

const moneyManagementMenuGroup = [
  {
    title: "Trips",
    url: "/trips",
    icon: TravelExploreIcon,
    isPending: false,
  },
  {
    title: "Restuarants",
    url: "/restaurants",
    icon: DinnerDiningIcon,
    isPending: true,
  },
  {
    title: "Coffee",
    url: "/coffee",
    icon: CoffeeIcon,
    isPending: true,
  },
];

export function AppSidebar() {
  const { theme, setTheme } = useTheme(); // Using next-themes to toggle themes
  const { open } = useSidebar();
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {open && <SparklesText className="text-sm" text="Welcome to Tiny Notie" />}
              {theme === "dark" ? (
                <Sun className="ml-auto text-yellow-500" />
              ) : (
                <Moon className="ml-auto" />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Feature</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {featureMenuGroup.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className={clsx(item.isPending && "disabled")} aria-disabled={item.isPending} tabIndex={item.isPending ? -1 : undefined}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Money Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {moneyManagementMenuGroup.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className={clsx(item.isPending && "disabled")} aria-disabled={item.isPending} tabIndex={item.isPending ? -1 : undefined}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem key={"logout"}>
            <SidebarMenuButton asChild>
              <Button onClick={() => signOut()}>
                <LogOut />
                <span>Logout</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
