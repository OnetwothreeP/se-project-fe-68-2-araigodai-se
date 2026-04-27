"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, ArrowLeft, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  telephone: string;
  role: "user" | "owner" | "admin";
}

export default function ManageRolesPage() {
  const router = useRouter();
  const [users,     setUsers]     = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState("");

  const [pendingChange, setPendingChange] = useState<{
    userId: string;
    newRole: "user" | "owner";
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setIsLoading(true);
    setError("");
    try {
      // GET /api/v1/auth/users — admin only
      const data = await apiRequest("/auth/users");
      setUsers(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }

  function handleRoleSelect(userId: string, newRole: string) {
    if (newRole === "user" || newRole === "owner") {
      setPendingChange({ userId, newRole });
    }
  }

  async function handleConfirmRoleChange() {
    if (!pendingChange) return;
    setIsSaving(true);
    try {
      // PUT /api/v1/auth/users/:userId/role — admin only
      await apiRequest(`/auth/users/${pendingChange.userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: pendingChange.newRole }),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === pendingChange.userId ? { ...u, role: pendingChange.newRole } : u
        )
      );
      setPendingChange(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
      setPendingChange(null);
    } finally {
      setIsSaving(false);
    }
  }

  const pendingUser = pendingChange ? users.find((u) => u._id === pendingChange.userId) : null;

  const roleBadgeClass = {
    admin: "bg-red-100  text-red-800",
    owner: "bg-blue-100 text-blue-800",
    user:  "bg-gray-100 text-gray-600",
  };

  const roleLabel = {
    admin: "Admin",
    owner: "Hotel Owner",
    user:  "User",
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <Button
          variant="ghost"
          className="mb-6 text-gray-600 hover:text-gray-900 -ml-2"
          onClick={() => router.push("/admin")}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Admin Dashboard
        </Button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShieldCheck className="size-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Roles</h1>
            <p className="text-gray-500 text-sm">Assign or remove Hotel Owner role from users</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="size-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-gray-500">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{users.filter((u) => u.role === "owner").length}</p>
                  <p className="text-sm text-gray-500">Hotel Owners</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-gray-400">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="size-8 text-gray-400" />
                <div>
                  <p className="text-2xl font-bold">{users.filter((u) => u.role === "user").length}</p>
                  <p className="text-sm text-gray-500">Regular Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Change a user&apos;s role between <strong>User</strong> and <strong>Hotel Owner</strong>.
              Admin accounts cannot be modified here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id} className={user.role === "admin" ? "bg-red-50/40" : ""}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-gray-500">{user.email}</TableCell>
                        <TableCell className="text-gray-500">{user.telephone}</TableCell>
                        <TableCell>
                          <Badge className={`${roleBadgeClass[user.role]} border-0 capitalize`}>
                            {roleLabel[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.role === "admin" ? (
                            <span className="text-xs text-gray-400 italic">Cannot modify</span>
                          ) : (
                            <Select
                              value={user.role}
                              onValueChange={(v) => handleRoleSelect(user._id, v)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="owner">Hotel Owner</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Confirmation Dialog (US3-1) */}
      <AlertDialog open={!!pendingChange} onOpenChange={(o) => !o && setPendingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Change <span className="font-semibold">{pendingUser?.name}</span>&apos;s role to{" "}
              <span className="font-semibold">
                {pendingChange?.newRole === "owner" ? "Hotel Owner" : "User"}
              </span>
              ?{" "}
              {pendingChange?.newRole === "owner"
                ? "They will gain access to hotel management features."
                : "They will lose hotel management access."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingChange(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRoleChange} disabled={isSaving}>
              {isSaving
                ? "Saving…"
                : pendingChange?.newRole === "owner"
                ? "Assign Owner Role"
                : "Revoke Owner Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
