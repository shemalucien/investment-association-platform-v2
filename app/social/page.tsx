"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Calendar, Users, DollarSign, TrendingUp, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth/auth-context"
import { StatCard } from "@/components/ui/stat-card"
import type { SocialContribution, SocialActivity, Member } from "@/lib/types"

export default function SocialContributionsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [contributions, setContributions] = useState<SocialContribution[]>([])
  const [activities, setActivities] = useState<SocialActivity[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [balance, setBalance] = useState<any>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false)
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)

  const canManageContributions = user?.permissions.canManageDeposits || user?.role === "admin"

  useEffect(() => {
    fetchData()
  }, [selectedYear])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [contribsRes, activitiesRes, membersRes, summaryRes, balanceRes] = await Promise.all([
        fetch(`/api/social-contributions?year=${selectedYear}`),
        fetch("/api/social-activities"),
        fetch("/api/members"),
        fetch(`/api/social-contributions/summary?year=${selectedYear}`),
        fetch("/api/social-activities?action=balance"),
      ])

      if (contribsRes.ok) setContributions(await contribsRes.json())
      if (activitiesRes.ok) setActivities(await activitiesRes.json())
      if (membersRes.ok) {
        const membersJson = await membersRes.json()
        setMembers(membersJson?.data ?? membersJson)
      }
      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (balanceRes.ok) setBalance(await balanceRes.json())
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load social contributions data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRecordContribution = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch("/api/social-contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: formData.get("memberId"),
          contributionYear: Number.parseInt(formData.get("contributionYear") as string),
          amount: Number.parseFloat(formData.get("amount") as string),
          paymentMethod: formData.get("paymentMethod"),
          receiptNumber: formData.get("receiptNumber"),
          notes: formData.get("notes"),
          status: "paid",
        }),
      })

      if (!response.ok) throw new Error("Failed to record contribution")

      toast({
        title: "Success",
        description: "Social contribution recorded successfully",
      })
      setIsContributionDialogOpen(false)
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record social contribution",
        variant: "destructive",
      })
    }
  }

  const handleCreateActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch("/api/social-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityName: formData.get("activityName"),
          activityDate: formData.get("activityDate"),
          description: formData.get("description"),
          totalBudget: Number.parseFloat(formData.get("totalBudget") as string),
          status: "planned",
        }),
      })

      if (!response.ok) throw new Error("Failed to create activity")

      toast({
        title: "Success",
        description: "Social activity created successfully",
      })
      setIsActivityDialogOpen(false)
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create social activity",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Social Contributions</h1>
            <p className="text-muted-foreground mt-2">
              Annual contributions of RWF 50,000 per member for social activities
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number.parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {summary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard title="Total Members" value={summary.totalMembers} icon={Users} description="Active members" />
            <StatCard
              title="Contributing Members"
              value={summary.contributingMembers}
              icon={TrendingUp}
              description={`${summary.pendingMembers} pending`}
            />
            <StatCard
              title="Total Collected"
              value={`RWF ${summary.totalCollected.toLocaleString()}`}
              icon={DollarSign}
              description={`Expected: RWF ${summary.expectedTotal.toLocaleString()}`}
            />
            <StatCard
              title="Available Balance"
              value={balance ? `RWF ${balance.availableBalance.toLocaleString()}` : "RWF 0"}
              icon={Activity}
              description={balance ? `Spent: RWF ${balance.totalSpent.toLocaleString()}` : "No spending yet"}
            />
          </div>
        )}

        <Tabs defaultValue="contributions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="activities">Social Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="contributions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Contribution Records ({selectedYear})</CardTitle>
                    <CardDescription>Track member contributions for social activities</CardDescription>
                  </div>
                  {canManageContributions && (
                    <Dialog open={isContributionDialogOpen} onOpenChange={setIsContributionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Record Contribution
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Record Social Contribution</DialogTitle>
                          <DialogDescription>Record a member's social contribution payment</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleRecordContribution} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="memberId">Member</Label>
                            <Select name="memberId" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select member" />
                              </SelectTrigger>
                              <SelectContent>
                                {members.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contributionYear">Year</Label>
                            <Input
                              id="contributionYear"
                              name="contributionYear"
                              type="number"
                              defaultValue={selectedYear}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount (RWF)</Label>
                            <Input id="amount" name="amount" type="number" defaultValue={50000} step="1000" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="paymentMethod">Payment Method</Label>
                            <Select name="paymentMethod" defaultValue="cash">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiptNumber">Receipt Number</Label>
                            <Input id="receiptNumber" name="receiptNumber" placeholder="Optional" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" placeholder="Optional notes" />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsContributionDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">Record Contribution</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Member</th>
                        <th className="text-left p-4 font-medium">Year</th>
                        <th className="text-left p-4 font-medium">Amount</th>
                        <th className="text-left p-4 font-medium">Payment Date</th>
                        <th className="text-left p-4 font-medium">Method</th>
                        <th className="text-left p-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contributions.map((contribution) => (
                        <tr key={contribution.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">{contribution.memberName}</td>
                          <td className="p-4">{contribution.contributionYear}</td>
                          <td className="p-4 font-medium">RWF {contribution.amount.toLocaleString()}</td>
                          <td className="p-4">{new Date(contribution.paymentDate).toLocaleDateString()}</td>
                          <td className="p-4 capitalize">{contribution.paymentMethod.replace("_", " ")}</td>
                          <td className="p-4">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs ${
                                contribution.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : contribution.status === "partial"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {contribution.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Social Activities</CardTitle>
                    <CardDescription>Plan and track social activities funded by member contributions</CardDescription>
                  </div>
                  {canManageContributions && (
                    <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Plan Activity
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Plan Social Activity</DialogTitle>
                          <DialogDescription>Create a new social activity for the association</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateActivity} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="activityName">Activity Name</Label>
                            <Input
                              id="activityName"
                              name="activityName"
                              required
                              placeholder="e.g., Annual General Meeting"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="activityDate">Activity Date</Label>
                            <Input id="activityDate" name="activityDate" type="date" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="totalBudget">Budget (RWF)</Label>
                            <Input id="totalBudget" name="totalBudget" type="number" step="1000" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" rows={3} placeholder="Activity details" />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsActivityDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">Create Activity</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(activity.activityDate).toLocaleDateString()}
                              </span>
                              <span
                                className={`ml-2 inline-flex px-2 py-1 rounded-full text-xs ${
                                  activity.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : activity.status === "ongoing"
                                      ? "bg-blue-100 text-blue-800"
                                      : activity.status === "planned"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {activity.status}
                              </span>
                            </div>
                            <h3 className="font-semibold text-lg">{activity.activityName}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Budget</div>
                            <div className="text-xl font-bold">RWF {activity.totalBudget.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Spent: RWF {activity.amountSpent.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
