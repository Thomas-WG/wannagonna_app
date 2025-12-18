"use client";

import { useState, useEffect } from "react";
import { Card, Spinner } from "flowbite-react";
import Link from "next/link";
import { HiUsers, HiOfficeBuilding, HiAcademicCap, HiBadgeCheck, HiCalendar } from "react-icons/hi";
import { fetchMembers } from "@/utils/crudMemberProfile";
import { fetchOrganizations } from "@/utils/crudOrganizations";
import { fetchSkills } from "@/utils/crudSkills";
import { fetchBadgeCategories, fetchAllBadges } from "@/utils/crudBadges";
import { fetchActivities } from "@/utils/crudActivities";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    members: 0,
    organizations: 0,
    skills: 0,
    badges: 0,
    activities: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all counts in parallel
        const [membersData, organizationsData, skillsData, badgesData, activitiesData] = await Promise.all([
          fetchMembers(),
          fetchOrganizations(),
          fetchSkills(),
          fetchAllBadges(),
          fetchActivities()
        ]);

        setStats({
          members: membersData?.length || 0,
          organizations: organizationsData?.length || 0,
          skills: skillsData?.length || 0,
          badges: badgesData?.length || 0,
          activities: activitiesData?.length || 0
        });
      } catch (error) {
        console.error('Error loading admin stats:', error);
        // Keep default values (0) on error
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        {/* Members Card */}
        <Link href="/admin/members">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="flex flex-col items-center p-4 sm:p-6">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <HiUsers className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Members</h2>
              {isLoading ? (
                <Spinner size="lg" className="text-blue-600" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.members}</p>
              )}
            </div>
          </Card>
        </Link>

        {/* Organizations Card */}
        <Link href="/admin/organizations">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="flex flex-col items-center p-4 sm:p-6">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <HiOfficeBuilding className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Organizations</h2>
              {isLoading ? (
                <Spinner size="lg" className="text-green-600" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.organizations}</p>
              )}
            </div>
          </Card>
        </Link>

        {/* Skills Card */}
        <Link href="/admin/skills">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="flex flex-col items-center p-4 sm:p-6">
              <div className="bg-purple-100 p-3 rounded-full mb-4">
                <HiAcademicCap className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Skills</h2>
              {isLoading ? (
                <Spinner size="lg" className="text-purple-600" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.skills}</p>
              )}
            </div>
          </Card>
        </Link>

        {/* Badges Card */}
        <Link href="/admin/badges">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="flex flex-col items-center p-4 sm:p-6">
              <div className="bg-orange-100 p-3 rounded-full mb-4">
                <HiBadgeCheck className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Badges</h2>
              {isLoading ? (
                <Spinner size="lg" className="text-orange-600" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.badges}</p>
              )}
            </div>
          </Card>
        </Link>

        {/* Activities Card */}
        <Link href="/admin/activities">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="flex flex-col items-center p-4 sm:p-6">
              <div className="bg-indigo-100 p-3 rounded-full mb-4">
                <HiCalendar className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Activities</h2>
              {isLoading ? (
                <Spinner size="lg" className="text-indigo-600" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{stats.activities}</p>
              )}
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
