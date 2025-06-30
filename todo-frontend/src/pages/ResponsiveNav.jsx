"use client"

import { useState } from "react"
import { Search, MessageSquare, Users, Calendar, BarChart3, Settings, LogOut, Menu, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Separator } from "../components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "../components/ui/sheet"

export default function ResponsiveNavbar({
  user,
  searchQuery,
  setSearchQuery,
  setIsChatOpen,
  setShowTeamManagement,
  navigate,
  setShowSettings,
  logout,
  selectproject,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    {
      label: "Chat",
      icon: MessageSquare,
      onClick: () => setIsChatOpen(true),
      hoverColor: "hover:text-blue-600 hover:bg-blue-50",
    },
    {
      label: "Team",
      icon: Users,
      onClick: () => setShowTeamManagement(true),
      hoverColor: "hover:text-indigo-600 hover:bg-indigo-50",
    },
    {
      label: "Calendar",
      icon: Calendar,
      onClick: () => navigate("/calender"),
      hoverColor: "hover:text-emerald-600 hover:bg-emerald-50",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      onClick: () => navigate("/analytics"),
      hoverColor: "hover:text-amber-600 hover:bg-amber-50",
    },
  ]

  const handleMobileNavClick = (onClick) => {
    onClick()
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Logo/Avatar and Title */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-blue-100">
                  <AvatarImage src="/api/placeholder/48/48" />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm sm:text-base">
                    {user?.username?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              <div className="min-w-0  max-xs:block">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-800 truncate">Project Dashboard</h1>
                <p className="text-slate-600 text-xs sm:text-sm truncate">
                  Welcome back, <span className="font-medium text-blue-600">{user?.username || "User"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation - Hidden on tablet-md and below */}
          <div className="hidden tablet-md:flex items-center space-x-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute right-3  top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10  w-64 bg-slate-50/50 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Navigation Buttons */}
            {navigationItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                onClick={item.onClick}
                className={`text-slate-600 ${item.hoverColor}`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}

            <Separator orientation="vertical" className="h-6" />

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  <Settings project ={selectproject} className="w-4 h-4 mr-2" />
                  Settings & Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu - Visible on tablet-md and below */}
          <div className="tablet-md:hidden flex items-center space-x-2">
            {/* Mobile Search - Visible on larger mobile screens */}
            <div className="relative hidden max-md:block">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-32 sm:w-40 bg-slate-50/50 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>

            {/* Mobile Menu Sheet */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-96">
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center justify-between">
                    <span>Menu</span>
                    {/* <SheetClose asChild>
                      <Button variant="ghost" size="sm" className="p-1">
                        <X className="w-4 h-4" />
                      </Button>
                    </SheetClose> */}
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  {/* Mobile Search - Always visible in sheet */}
                  <div className="relative max-md:hidden">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full bg-slate-50/50 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                    />
                  </div>

                  <Separator className="max-md:hidden" />

                  {/* User Info - Mobile */}
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg max-xs:hidden">
                    <Avatar className="h-10 w-10 ring-2 ring-blue-100">
                      <AvatarImage src="/api/placeholder/48/48" />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold">
                        {user?.username?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-800">{user?.username || "User"}</p>
                      <p className="text-sm text-slate-600">Project Dashboard</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Navigation Items */}
                  <div className="space-y-2">
                    {navigationItems.map((item) => (
                      <Button
                        key={item.label}
                        variant="ghost"
                        className="w-full justify-start text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                        onClick={() => handleMobileNavClick(item.onClick)}
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        {item.label}
                      </Button>
                    ))}
                  </div>

                  <Separator />

                  {/* Settings and Logout */}
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                      onClick={() => handleMobileNavClick(() => setShowSettings(true))}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings & Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleMobileNavClick(logout)}
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
