"use client";

import { Card } from "flowbite-react";
import Link from "next/link";
import { HiUsers, HiOfficeBuilding, HiAcademicCap } from "react-icons/hi";

export default function AdminDashboard() {
  // These would typically come from your database or API
  const stats = {
    members: 42,
    organizations: 15,
    skills: 78
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Members Card */}
        <Link href="/main/admin/members">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex flex-col items-center p-4">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <HiUsers className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Members</h2>
              <p className="text-3xl font-bold text-blue-600">{stats.members}</p>
            </div>
          </Card>
        </Link>

        {/* Organizations Card */}
        <Link href="/main/admin/organizations">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex flex-col items-center p-4">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <HiOfficeBuilding className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Organizations</h2>
              <p className="text-3xl font-bold text-green-600">{stats.organizations}</p>
            </div>
          </Card>
        </Link>

        {/* Skills Card */}
        <Link href="/main/admin/skills">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex flex-col items-center p-4">
              <div className="bg-purple-100 p-3 rounded-full mb-4">
                <HiAcademicCap className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Skills</h2>
              <p className="text-3xl font-bold text-purple-600">{stats.skills}</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
