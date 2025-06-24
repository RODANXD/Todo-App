"use client"

import { useState, useEffect, useRef } from "react"
import { useauth } from "../store/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"
import { Switch } from "../components/ui/switch"
import { Separator } from "../components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import {
  User,
  Building2,
  Users,
  Settings,
  Camera,
  Mail,
  Lock,
  Globe,
  Clock,
  Shield,
  UserPlus,
  MoreHorizontal,
  Trash2,
  UserX,
  Crown,
  Eye,
  EyeOff,
  Upload,
  Save,
  X,
  AlertTriangle,
  Zap,
  Palette,
  Database,
} from "lucide-react"

import { getProfile, updateProfile, changePassword, getOrganization } from "../api/AxiosAuth"
import {
  inviteTeamMember,
  updateMemberRole,
  removeMember,
  getProjectMembers,
  directprojectinvite,
} from "../api/AxiosAuth";

const SettingsProfile = ({ onClose, project }) => {
  const { user } = useauth()
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState(null);
  const [directEmail, setDirectEmail] = useState('');
  const [directRole, setDirectRole] = useState('member');


  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    username: user?.username || "",
    bio: "",
    avatar: null,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Organization state
  const [orgData, setOrgData] = useState({
    name: "Acme Corporation",
    description: "Building the future of project management",
    logo: null,
    timezone: "America/New_York",
    website: "https://acme.com",
    industry: "Technology",
  })

  // Members state
  const [members, setMembers] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john@acme.com",
      role: "Owner",
      status: "Active",
      avatar: "/api/placeholder/32/32",
      joinedAt: "2024-01-15",
      lastActive: "2 hours ago",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@acme.com",
      role: "Admin",
      status: "Active",
      avatar: "/api/placeholder/32/32",
      joinedAt: "2024-02-01",
      lastActive: "1 day ago",
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@acme.com",
      role: "Member",
      status: "Active",
      avatar: "/api/placeholder/32/32",
      joinedAt: "2024-02-15",
      lastActive: "3 days ago",
    },
    {
      id: 4,
      name: "Sarah Wilson",
      email: "sarah@acme.com",
      role: "Member",
      status: "Suspended",
      avatar: "/api/placeholder/32/32",
      joinedAt: "2024-01-20",
      lastActive: "1 week ago",
    },
  ])

  // Feature flags state
  const [featureFlags, setFeatureFlags] = useState({
    darkMode: false,
    betaFeatures: true,
    advancedAnalytics: false,
    aiAssistant: true,
    realTimeCollaboration: true,
    customThemes: false,
    advancedNotifications: true,
    dataExport: false,
    apiAccess: true,
    webhooks: false,
  })

  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "Member",
    message: "",
  })

    useEffect(() => {
    if (project && project.id) {
      fetchMembers();
    }
  }, [project?.id]);

  const fetchMembers = async () => {
    if (!project || !project.id) return;
    try {
      const response = await getProjectMembers(project.id);
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await inviteTeamMember(project.id, { email, role });
      setEmail('');
      setRole('member');
      await fetchMembers();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to invite team member');
    } finally {
      setLoading(false);
    }
  };

  const directInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await directprojectinvite(project.id, { email: directEmail, role: directRole });
      setDirectEmail('');
      setDirectRole('member');
      await fetchMembers();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to invite team member');
    } finally {
      setLoading(false);
          }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await updateMemberRole(project.id, memberId, newRole);
      await fetchMembers();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await removeMember(project.id, memberId);
      await fetchMembers();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to remove member');
    }
  };

  
  const handleProfileUpdate = async () => {
    setLoading(true)
    try {
        const data = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        username: profileData.username,
        bio: profileData.bio,
        avatar: profileData.avatar,
      };
      await updateProfile(data);
      // Simulate API call
      if (profileData.currentPassword && profileData.newPassword && profileData.confirmPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          alert("New passwords do not match!");
        } else {
          await changePassword({
            old_password: profileData.currentPassword,
            new_password: profileData.newPassword,
          });
        }
      }
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {

 const fetchprofile = async () => {
    try {
        const profileRes = await getProfile();
        const profileData = profileRes.data;
        console.log("profile data", profileData);

        setProfileData((prev) => ({
            ...prev,
            firstName: profileData.first_name || "",
            lastName: profileData.last_name || "",
            email: profileData.email || "",
            username: profileData.username || "",
            bio: profileData.bio || "",
            avatar: profileData.avatar || null,
        }));

        const orgRes = await getOrganization();
        const orgResults = orgRes.data.results;

        if (orgResults && orgResults.length > 0) {
            const org = orgResults[0];
            console.log("org data", org);
            setOrgData((prev) => ({
                ...prev,
                id: org.id || null,
                name: org.name || "",
                description: org.description || "",
                slug: org.slug || "",
                created_at: org.created_at || "",
            }));
        } else {
            console.warn("No organization data found");
        }
    } catch (error) {
        console.error("Failed to fetch profile", error);
    }
};

fetchprofile();

  },[])

  const handleOrgUpdate = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Organization updated:", orgData)
      alert("Organization settings updated successfully!")
    } catch (error) {
      console.error("Error updating organization:", error)
      alert("Failed to update organization settings")
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteForm.email) {
      alert("Email is required")
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newMember = {
        id: members.length + 1,
        name: inviteForm.email.split("@")[0],
        email: inviteForm.email,
        role: inviteForm.role,
        status: "Pending",
        avatar: "/api/placeholder/32/32",
        joinedAt: new Date().toISOString().split("T")[0],
        lastActive: "Never",
      }

      setMembers([...members, newMember])
      setInviteForm({ email: "", role: "Member", message: "" })
      setInviteDialogOpen(false)
      alert("Invitation sent successfully!")
    } catch (error) {
      console.error("Error inviting member:", error)
      alert("Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  const handleMemberAction = async (memberId, action) => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (action === "remove") {
        setMembers(members.filter((m) => m.id !== memberId))
        alert("Member removed successfully!")
      } else if (action === "suspend") {
        setMembers(
          members.map((m) =>
            m.id === memberId ? { ...m, status: m.status === "Suspended" ? "Active" : "Suspended" } : m,
          ),
        )
        alert(`Member ${action}ed successfully!`)
      }
    } catch (error) {
      console.error(`Error ${action}ing member:`, error)
      alert(`Failed to ${action} member`)
    } finally {
      setLoading(false)
    }
  }

  const handleFeatureToggle = (feature) => {
    setFeatureFlags((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }))
  }

  const handleAvatarUpload = (event, type = "profile") => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (type === "profile") {
          setProfileData((prev) => ({ ...prev, avatar: e.target.result }))
        } else {
          setOrgData((prev) => ({ ...prev, logo: e.target.result }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case "Owner":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "Admin":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Member":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Suspended":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Settings & Profile</h2>
              <p className="text-slate-600">Manage your account and organization settings</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex w-full">
            {/* Sidebar Navigation */}
            <div className="w-64 border-r border-slate-200 bg-slate-50/50">
              <TabsList className="flex flex-col h-full w-full bg-transparent p-4 space-y-2">
                <TabsTrigger
                  value="profile"
                  className="w-full justify-start data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile Settings
                </TabsTrigger>
                <TabsTrigger
                  value="organization"
                  className="w-full justify-start data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                >
                  <Building2 className="w-4 h-4 mr-3" />
                  Organization
                </TabsTrigger>
                {/* <TabsTrigger
                  value="members"
                  className="w-full justify-start data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                >
                  <Users className="w-4 h-4 mr-3" />
                  Team Members
                </TabsTrigger>
                <TabsTrigger
                  value="features"
                  className="w-full justify-start data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                >
                  <Zap className="w-4 h-4 mr-3" />
                  Feature Flags
                </TabsTrigger> */}
              </TabsList>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Profile Settings Tab */}
              <TabsContent value="profile" className="p-6 space-y-6 m-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Profile Information</h3>

                    {/* Avatar Section */}
                    <Card className="mb-6">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-6">
                          <div className="relative">
                            <Avatar className="w-24 h-24">
                              <AvatarImage src={profileData.avatar || "/api/placeholder/96/96"} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-semibold">
                                {profileData.firstName?.charAt(0) || user?.username?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                              <Camera className="w-4 h-4" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleAvatarUpload(e, "profile")}
                              />
                            </label>
                          </div>
                          <div>
                            <h4 className="text-xl font-semibold text-slate-800">
                              {profileData.firstName} {profileData.lastName}
                            </h4>
                            <p className="text-slate-600">Username - {profileData.username}</p>
                            <p className="text-slate-600">{profileData.email}</p>
                            <Badge variant="secondary" className="mt-2">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium Member
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Personal Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your personal details and contact information</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={profileData.firstName}
                              onChange={(e) => setProfileData((prev) => ({ ...prev, firstName: e.target.value }))}
                              placeholder="Enter your first name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={profileData.lastName}
                              onChange={(e) => setProfileData((prev) => ({ ...prev, lastName: e.target.value }))}
                              placeholder="Enter your last name"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                              id="email"
                              type="email"
                              value={profileData.email}
                              onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                              className="px-8"
                              placeholder="Enter your email"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={profileData.username}
                            onChange={(e) => setProfileData((prev) => ({ ...prev, username: e.target.value }))}
                            placeholder="Enter your username"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={profileData.bio}
                            onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                            placeholder="Tell us about yourself"
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Password Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Update your password to keep your account secure</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                              id="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              value={profileData.currentPassword}
                              onChange={(e) => setProfileData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                              className="px-8"
                              placeholder="Enter current password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                              <Input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                value={profileData.newPassword}
                                onChange={(e) => setProfileData((prev) => ({ ...prev, newPassword: e.target.value }))}
                                className="px-8"
                                placeholder="Enter new password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={profileData.confirmPassword}
                              onChange={(e) => setProfileData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button onClick={handleProfileUpdate} disabled={loading}>
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Organization Settings Tab */}
              <TabsContent value="organization" className="p-6 space-y-6 m-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Organization Settings</h3>

                    {/* Organization Logo */}
                    <Card className="mb-6">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-6">
                          <div className="relative">
                            <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                              {orgData.logo ? (
                                <img
                                  src={orgData.logo || "/placeholder.svg"}
                                  alt="Organization logo"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Building2 className="w-12 h-12 text-slate-400" />
                              )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                              <Upload className="w-4 h-4" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleAvatarUpload(e, "org")}
                              />
                            </label>
                          </div>
                          <div>
                            <h4 className="text-xl font-semibold text-slate-800">{orgData.name}</h4>
                            <p className="text-slate-600">{orgData.description}</p>
                            <Badge variant="secondary" className="mt-2">
                              <Shield className="w-3 h-3 mr-1" />
                              Enterprise Plan
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Organization Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Organization Details</CardTitle>
                        <CardDescription>Manage your organization information and settings</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="orgName">Organization Name</Label>
                          <Input
                            id="orgName"
                            value={orgData.name}
                            onChange={(e) => setOrgData((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter organization name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="orgDescription">Description</Label>
                          <Textarea
                            id="orgDescription"
                            value={orgData.description}
                            onChange={(e) => setOrgData((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe your organization"
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="website">Organization ID</Label>
                            <div className="relative">
                              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                              <Input
                                id="website"
                                value={orgData.id}
                                onChange={(e) => setOrgData((prev) => ({ ...prev, id: e.target.value }))}
                                className="px-12"
                                placeholder="Organization ID"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="industry">Slug</Label>
                             <Input
                                id="website"
                                value={orgData.slug}
                                onChange={(e) => setOrgData((prev) => ({ ...prev, slug: e.target.value }))}
                                className="px-12"
                                placeholder="Organization ID"
                              />
                          </div>
                        </div>

                        {/* <div className="space-y-2">
                          <Label htmlFor="timezone">Timezone</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Select
                              value={orgData.timezone}
                              onValueChange={(value) => setOrgData((prev) => ({ ...prev, timezone: value }))}
                            >
                              <SelectTrigger className="pl-10">
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                                <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                                <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                                <SelectItem value="Asia/Shanghai">China Standard Time (CST)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div> */}
                      </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button onClick={handleOrgUpdate} disabled={loading}>
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Team Members Tab */}
              <TabsContent value="members" className="p-6 space-y-6 m-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">Team Members</h3>
                      <p className="text-slate-600">Manage your organization's team members and their roles</p>
                    </div>
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invite Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                          <DialogDescription>Send an invitation to join your organization</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="inviteEmail">Email Address</Label>
                            <Input
                              id="inviteEmail"
                              type="email"
                              value={inviteForm.email}
                              onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                              placeholder="Enter email address"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inviteRole">Role</Label>
                            <Select
                              value={inviteForm.role}
                              onValueChange={(value) => setInviteForm((prev) => ({ ...prev, role: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Member">Member</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inviteMessage">Personal Message (Optional)</Label>
                            <Textarea
                              id="inviteMessage"
                              value={inviteForm.message}
                              onChange={(e) => setInviteForm((prev) => ({ ...prev, message: e.target.value }))}
                              placeholder="Add a personal message to the invitation"
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleInviteMember} disabled={loading}>
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Sending...
                              </>
                            ) : (
                              "Send Invitation"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Last Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={member.avatar || "/placeholder.svg"} />
                                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                                      {member.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-slate-800">{member.name}</div>
                                    <div className="text-sm text-slate-600">{member.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getRoleColor(member.role)}>
                                  {member.role === "Owner" && <Crown className="w-3 h-3 mr-1" />}
                                  {member.role === "Admin" && <Shield className="w-3 h-3 mr-1" />}
                                  {member.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getStatusColor(member.status)}>
                                  {member.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-600">{member.joinedAt}</TableCell>
                              <TableCell className="text-slate-600">{member.lastActive}</TableCell>
                              <TableCell className="text-right">
                                {member.role !== "Owner" && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => handleMemberAction(member.id, "suspend")}
                                        className="text-amber-600 focus:text-amber-600"
                                      >
                                        <UserX className="w-4 h-4 mr-2" />
                                        {member.status === "Suspended" ? "Unsuspend" : "Suspend"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleMemberAction(member.id, "remove")}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Feature Flags Tab */}
              <TabsContent value="features" className="p-6 space-y-6 m-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Feature Flags</h3>
                    <p className="text-slate-600 mb-6">
                      Enable or disable experimental features and advanced functionality
                    </p>

                    <div className="grid gap-6">
                      {/* UI & Experience */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Palette className="w-5 h-5 text-blue-600" />
                            <span>UI & Experience</span>
                          </CardTitle>
                          <CardDescription>Customize your interface and user experience</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-800">Dark Mode</div>
                              <div className="text-sm text-slate-600">Switch to dark theme interface</div>
                            </div>
                            <Switch
                              checked={featureFlags.darkMode}
                              onCheckedChange={() => handleFeatureToggle("darkMode")}
                            />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-800">Custom Themes</div>
                              <div className="text-sm text-slate-600">Create and apply custom color themes</div>
                            </div>
                            <Switch
                              checked={featureFlags.customThemes}
                              onCheckedChange={() => handleFeatureToggle("customThemes")}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Collaboration */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Users className="w-5 h-5 text-green-600" />
                            <span>Collaboration</span>
                          </CardTitle>
                          <CardDescription>Team collaboration and communication features</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-800">Real-time Collaboration</div>
                              <div className="text-sm text-slate-600">See live updates from team members</div>
                            </div>
                            <Switch
                              checked={featureFlags.realTimeCollaboration}
                              onCheckedChange={() => handleFeatureToggle("realTimeCollaboration")}
                            />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-800">Advanced Notifications</div>
                              <div className="text-sm text-slate-600">
                                Enhanced notification system with smart filtering
                              </div>
                            </div>
                            <Switch
                              checked={featureFlags.advancedNotifications}
                              onCheckedChange={() => handleFeatureToggle("advancedNotifications")}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* AI & Analytics */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Zap className="w-5 h-5 text-purple-600" />
                            <span>AI & Analytics</span>
                          </CardTitle>
                          <CardDescription>Artificial intelligence and advanced analytics features</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-800">AI Assistant</div>
                              <div className="text-sm text-slate-600">Get AI-powered suggestions and insights</div>
                            </div>
                            <Switch
                              checked={featureFlags.aiAssistant}
                              onCheckedChange={() => handleFeatureToggle("aiAssistant")}
                            />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-800">Advanced Analytics</div>
                              <div className="text-sm text-slate-600">Detailed project analytics and reporting</div>
                            </div>
                            <Switch
                              checked={featureFlags.advancedAnalytics}
                              onCheckedChange={() => handleFeatureToggle("advancedAnalytics")}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Developer Features */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Database className="w-5 h-5 text-orange-600" />
                            <span>Developer Features</span>
                          </CardTitle>
                          <CardDescription>Advanced features for developers and integrations</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-800">API Access</div>
                              <div className="text-sm text-slate-600">Enable REST API access for integrations</div>
                            </div>
                            <Switch
                              checked={featureFlags.apiAccess}
                              onCheckedChange={() => handleFeatureToggle("apiAccess")}
                            />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-800">Webhooks</div>
                              <div className="text-sm text-slate-600">
                                Send real-time notifications to external services
                              </div>
                            </div>
                            <Switch
                              checked={featureFlags.webhooks}
                              onCheckedChange={() => handleFeatureToggle("webhooks")}
                            />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-800">Data Export</div>
                              <div className="text-sm text-slate-600">Export your data in various formats</div>
                            </div>
                            <Switch
                              checked={featureFlags.dataExport}
                              onCheckedChange={() => handleFeatureToggle("dataExport")}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Beta Features */}
                      <Card className="border-amber-200 bg-amber-50/50">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <span>Beta Features</span>
                          </CardTitle>
                          <CardDescription>Experimental features that are still in development</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-800 flex items-center space-x-2">
                                <span>Beta Features Access</span>
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                  Beta
                                </Badge>
                              </div>
                              <div className="text-sm text-slate-600">
                                Get early access to new features before they're released
                              </div>
                            </div>
                            <Switch
                              checked={featureFlags.betaFeatures}
                              onCheckedChange={() => handleFeatureToggle("betaFeatures")}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default SettingsProfile
