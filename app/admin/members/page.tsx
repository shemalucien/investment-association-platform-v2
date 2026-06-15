"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils/calculations"
import type { Member } from "@/lib/types"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth/auth-context"
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

const COUNTRY_CODES = [
  { code: "+250", country: "Rwanda" },
  { code: "+1",   country: "USA/Canada" },
  { code: "+44",  country: "UK" },
  { code: "+33",  country: "France" },
  { code: "+49",  country: "Germany" },
  { code: "+254", country: "Kenya" },
  { code: "+256", country: "Uganda" },
  { code: "+255", country: "Tanzania" },
  { code: "+260", country: "Zambia" },
  { code: "+263", country: "Zimbabwe" },
  { code: "+27",  country: "South Africa" },
  { code: "+234", country: "Nigeria" },
  { code: "+251", country: "Ethiopia" },
  { code: "+257", country: "Burundi" },
  { code: "+243", country: "DRC" },
]

export default function AdminMembersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [viewPendingMember, setViewPendingMember] = useState<any | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [pendingMembers, setPendingMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { hasPermission, user } = useAuth()
  const { toast } = useToast()

  const [newMember, setNewMember] = useState({
    fullName: "",
    countryCode: "+250",
    phone: "",
    nationalId: "",
    email: "",
    address: "",
  })
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editMemberData, setEditMemberData] = useState({
    fullName: "",
    email: "",
    phone: "",
    status: "active" as "active" | "inactive" | "pending",
  })
  const [deleteMember, setDeleteMember] = useState<Member | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersData, pendingData] = await Promise.all([
          apiGet<Member[]>("/api/members"),
          apiGet<any[]>("/api/members/approve"),
        ])
        setMembers(membersData)
        setPendingMembers(pendingData)
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load members",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery),
  )

  const handleAddMember = async () => {
    try {
      const payload = {
        fullName: newMember.fullName,
        email: newMember.email,
        phone: `${newMember.countryCode}${newMember.phone}`,
        nationalId: newMember.nationalId,
        address: newMember.address,
      }
      const newMemberData = await apiPost<Member>("/api/members", payload)
      setMembers([...members, newMemberData])
      setShowAddDialog(false)
      setNewMember({ fullName: "", countryCode: "+250", phone: "", nationalId: "", email: "", address: "" })
      toast({
        title: "Success",
        description: "Member added successfully",
      })
    } catch (error) {
      console.error("[v0] Error adding member:", error)
      toast({
        title: "Error",
        description: "Failed to add member",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (member: Member) => {
    setEditMember(member)
    setEditMemberData({
      fullName: member.name,
      email: member.email,
      phone: member.phone,
      status: member.status,
    })
    setShowEditDialog(true)
  }

  const handleUpdateMember = async () => {
    if (!editMember) return

    setSaving(true)
    try {
      const updatedMember = await apiPatch<Member>(`/api/members/${editMember.id}`, {
        fullName: editMemberData.fullName,
        email: editMemberData.email,
        phone: editMemberData.phone,
        status: editMemberData.status,
      })
      setMembers((current) => current.map((member) => (member.id === updatedMember.id ? updatedMember : member)))
      setShowEditDialog(false)
      setEditMember(null)
      toast({
        title: "Member updated",
        description: "Member information has been saved.",
      })
    } catch (error) {
      console.error("[v0] Error updating member:", error)
      toast({
        title: "Error",
        description: "Failed to update member",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const openDeleteDialog = (member: Member) => {
    setDeleteMember(member)
    setShowDeleteDialog(true)
  }

  const handleDeleteMember = async () => {
    if (!deleteMember) return

    setDeleting(true)
    try {
      await apiDelete<null>(`/api/members/${deleteMember.id}`)
      setMembers((current) => current.filter((member) => member.id !== deleteMember.id))
      setShowDeleteDialog(false)
      setDeleteMember(null)
      toast({
        title: "Member deleted",
        description: "Member has been removed from the association.",
      })
    } catch (error: any) {
      console.error("[v0] Error deleting member:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to delete member",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleApproveMember = async (memberId: string) => {
    try {
      await apiPatch("/api/members/approve", { memberId })
      setPendingMembers((current) => current.filter((m) => m.id !== memberId))
      toast({
        title: "Member approved",
        description: "Member has been approved and can now access the system.",
      })
      // Refresh members list
      const membersData = await apiGet<Member[]>("/api/members")
      setMembers(membersData)
    } catch (error) {
      console.error("[v0] Error approving member:", error)
      toast({
        title: "Error",
        description: "Failed to approve member",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-12">Loading members...</div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Members</h2>
              <p className="text-muted-foreground">Manage association members and their profiles</p>
            </div>
            {hasPermission("canAddMembers") && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Member</DialogTitle>
                    <DialogDescription>
                      Enter the details of the new member to add to the association.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter full name"
                        value={newMember.fullName}
                        onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="flex gap-2">
                        <Select
                          value={newMember.countryCode}
                          onValueChange={(val) => setNewMember({ ...newMember, countryCode: val })}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Code" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRY_CODES.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.code} ({c.country})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="788 000 000"
                          value={newMember.phone}
                          onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationalId">National ID *</Label>
                      <Input
                        id="nationalId"
                        placeholder="1198012345678901"
                        value={newMember.nationalId}
                        onChange={(e) => setNewMember({ ...newMember, nationalId: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="member@email.com"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input
                        id="address"
                        placeholder="Kigali, Gasabo"
                        value={newMember.address}
                        onChange={(e) => setNewMember({ ...newMember, address: e.target.value })}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleAddMember}
                      disabled={!newMember.fullName || !newMember.phone || !newMember.nationalId}
                    >
                      Add Member
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {pendingMembers.length > 0 && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
              <CardHeader>
                <CardTitle className="text-yellow-900 dark:text-yellow-200">Pending Approvals ({pendingMembers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>National ID</TableHead>
                      <TableHead>Application Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono text-sm">{member.member_number}</TableCell>
                        <TableCell className="font-medium">{member.full_name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{member.email}</div>
                            <div className="text-muted-foreground">{member.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{member.national_id}</TableCell>
                        <TableCell>{formatDate(member.join_date)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewPendingMember(member)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" onClick={() => handleApproveMember(member.id)}>
                              Approve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Pending Member Detail Dialog */}
          <Dialog open={!!viewPendingMember} onOpenChange={(open) => { if (!open) setViewPendingMember(null) }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registration Details</DialogTitle>
                <DialogDescription>Full information submitted by the applicant</DialogDescription>
              </DialogHeader>
              {viewPendingMember && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Member Number</Label>
                      <p className="font-mono font-semibold mt-0.5">{viewPendingMember.member_number}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Application Date</Label>
                      <p className="font-medium mt-0.5">{formatDate(viewPendingMember.join_date)}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</Label>
                      <p className="font-semibold text-lg mt-0.5">{viewPendingMember.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Phone Number</Label>
                      <p className="font-medium mt-0.5">{viewPendingMember.phone || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email Address</Label>
                      <p className="font-medium mt-0.5 break-all">
                        {viewPendingMember.email?.endsWith("@nomail.local") ? "—" : (viewPendingMember.email || "—")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">National ID</Label>
                      <p className="font-mono font-medium mt-0.5">{viewPendingMember.national_id || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Address</Label>
                      <p className="font-medium mt-0.5">{viewPendingMember.address || "—"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        handleApproveMember(viewPendingMember.id)
                        setViewPendingMember(null)
                      }}
                    >
                      Approve Member
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setViewPendingMember(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <CardTitle>All Members ({filteredMembers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Total Shares</TableHead>
                    <TableHead className="text-right">Total Deposits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-mono text-sm">{member.memberNumber}</TableCell>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{member.email}</div>
                          <div className="text-muted-foreground">{member.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(member.joinDate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(member.totalShares)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(member.totalDeposits)}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === "active" ? "default" : "secondary"}>{member.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedMember(member)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{member.name}</DialogTitle>
                                <DialogDescription>Member details and activity summary</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-muted-foreground">Member Number</Label>
                                    <p className="font-medium font-mono">{member.memberNumber}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Email</Label>
                                    <p className="font-medium">{member.email}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Phone</Label>
                                    <p className="font-medium">{member.phone}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Join Date</Label>
                                    <p className="font-medium">{formatDate(member.joinDate)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <Badge variant={member.status === "active" ? "default" : "secondary"}>
                                      {member.status}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="border-t pt-4">
                                  <h4 className="font-semibold mb-4">Financial Summary</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted p-4 rounded-lg">
                                      <p className="text-sm text-muted-foreground mb-1">Total Shares</p>
                                      <p className="text-2xl font-bold">{formatCurrency(member.totalShares)}</p>
                                    </div>
                                    <div className="bg-muted p-4 rounded-lg">
                                      <p className="text-sm text-muted-foreground mb-1">Total Deposits</p>
                                      <p className="text-2xl font-bold">{formatCurrency(member.totalDeposits)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {hasPermission("canEditMembers") && (
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission("canDeleteMembers") && (
                            <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(member)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Member</DialogTitle>
                  <DialogDescription>Update member details and save the changes.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full Name</Label>
                    <Input
                      id="edit-name"
                      value={editMemberData.fullName}
                      onChange={(e) => setEditMemberData({ ...editMemberData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editMemberData.email}
                      onChange={(e) => setEditMemberData({ ...editMemberData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone Number</Label>
                    <Input
                      id="edit-phone"
                      value={editMemberData.phone}
                      onChange={(e) => setEditMemberData({ ...editMemberData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <select
                      id="edit-status"
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none"
                      value={editMemberData.status}
                      onChange={(e) => setEditMemberData({
                        ...editMemberData,
                        status: e.target.value as "active" | "inactive",
                      })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setShowEditDialog(false)}>
                      Cancel
                    </Button>
                    <Button className="min-w-[120px]" onClick={handleUpdateMember} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Member</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete {deleteMember?.name}? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteMember} disabled={deleting}>
                    {deleting ? "Deleting..." : "Delete Member"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </main>
      </div>
    </ProtectedRoute>
  )
}
