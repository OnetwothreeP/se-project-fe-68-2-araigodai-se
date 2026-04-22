"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ArrowLeft, ShieldCheck } from "lucide-react";

const MOCK_USERS = [
  { _id: "1", name: "Alice Smith", email: "alice@example.com", telephone: "0811111111", role: "admin" },
  { _id: "2", name: "Bob Johnson", email: "bob@example.com", telephone: "0822222222", role: "hotel_owner" },
  { _id: "3", name: "Carol White", email: "carol@example.com", telephone: "0833333333", role: "user" },
  { _id: "4", name: "David Brown", email: "david@example.com", telephone: "0844444444", role: "user" },
];

export default function ManageRolesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-gray-900"
            onClick={() => router.push("/admin")}
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Admin Dashboard
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ShieldCheck className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Roles</h1>
              <p className="text-gray-500 text-sm">Assign or remove Hotel Owner role from users</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="size-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{MOCK_USERS.length}</p>
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
                  <p className="text-2xl font-bold">
                    {MOCK_USERS.filter((u) => u.role === "hotel_owner").length}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {MOCK_USERS.filter((u) => u.role === "user").length}
                  </p>
                  <p className="text-sm text-gray-500">Regular Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Change a user's role between <strong>User</strong> and <strong>Hotel Owner</strong>.
              Admin accounts cannot be modified here.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  {MOCK_USERS.map((user) => (
                    <TableRow key={user._id} className={user.role === "admin" ? "bg-red-50/40" : ""}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-gray-500">{user.email}</TableCell>
                      <TableCell className="text-gray-500">{user.telephone}</TableCell>
                      <TableCell>
                        {user.role === "admin" && <Badge variant="destructive">Admin</Badge>}
                        {user.role === "hotel_owner" && <Badge>Hotel Owner</Badge>}
                        {user.role === "user" && <Badge variant="secondary">User</Badge>}
                      </TableCell>
                      <TableCell>
                        {user.role === "admin" ? (
                          <span className="text-xs text-gray-400 italic">Cannot modify</span>
                        ) : (
                          <Select defaultValue={user.role} disabled>
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="hotel_owner">Hotel Owner</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
