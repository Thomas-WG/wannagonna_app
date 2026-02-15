"use client";

import { useState, useEffect } from "react";
import { Card, Spinner } from "flowbite-react";
import Link from "next/link";
import { HiUsers, HiOfficeBuilding, HiAcademicCap, HiBadgeCheck, HiCalendar, HiQuestionMarkCircle } from "react-icons/hi";
import { fetchMembers } from "@/utils/crudMemberProfile";
import { fetchOrganizations } from "@/utils/crudOrganizations";
import { fetchSkills } from "@/utils/crudSkills";
import { fetchBadgeCategories, fetchAllBadges } from "@/utils/crudBadges";
import { fetchActivities } from "@/utils/crudActivities";
import { fetchFaqs } from "@/utils/crudFaq";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    members: 0,
    organizations: 0,
    skills: 0,
    badges: 0,
    activities: 0,
    faqs: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all counts in parallel
        const [membersData, organizationsData, skillsData, badgesData, activitiesData, faqsData] = await Promise.all([
          fetchMembers(),
          fetchOrganizations(),
          fetchSkills(),
          fetchAllBadges(),
          fetchActivities(),
          fetchFaqs()
        ]);

        setStats({
          members: membersData?.length || 0,
          organizations: organizationsData?.length || 0,
          skills: skillsData?.length || 0,
          badges: badgesData?.length || 0,
          activities: activitiesData?.length || 0,
          faqs: faqsData?.length || 0
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
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 bg-background-page dark:bg-background-page min-h-dvh">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-text-primary dark:text-text-primary">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
        {/* Members Card */}
        <Link href="/admin/members">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
            <div className="flex flex-col items-center p-4 sm:p-6">
              <div className="bg-semantic-info-100 dark:bg-semantic-info-900 p-3 rounded-full mb-4">
                <HiUsers className="h-6 w-6 sm:h-8 sm:w-8 text-semantic-info-600 dark:text-semantic-info-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2 text-text-primary dark:text-text-primary">Members</h2>
              {isLoading ? (
                <Spinner size="lg" className="text-semantic-info-600 dark:text-semantic-info-400" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-semantic-info-600 dark:text-semantic-info-400">{stats.members}</p>
              )}
            </div>
          </Card>
        </Link>

        {/* Organizations Card */}
        <Link href="/admin/organizations">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
            <div className="flex flex-col items-center p-4 sm:p-6">
              <div className="bg-semantic-success-100 dark:bg-semantic-success-900 p-3 rounded-full mb-4">
                <HiOfficeBuilding className="h-6 w-6 sm:h-8 sm:w-8 text-semantic-success-600 dark:text-semantic-success-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2 text-text-primary dark:text-text-primary">Organizations</h2>
              {isLoading ? (
                <Spinner size="lg" className="text-semantic-success-600 dark:text-semantic-success-400" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-semantic-success-600 dark:text-semantic-success-400">{stats.organizations}</p>
              )}
            </div>
          </Card>
        </Link>

        {/* Skills Card */}
        <Link href="/admin/skills">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
            <div className="flex flex-col items-center p-4 sm:p-6">
              <div className="bg-activityType-event-100 dark:bg-activityType-event-900 p-3 rounded-full mb-4">
                <HiAcademicCap className="h-6 w-6 sm:h-8 sm:w-8 text-activityType-event-600 dark:text-activityType-event-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2 text-text-primary dark:text-text-primary">Skills</h2>
              {isLoading ? (
                <Spinner size="lg" className="text-activityType-event-600 dark:text-activityType-event-400" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-activityType-event-600 dark:text-activityType-event-400">{stats.skills}</p>
              )}
            </div>
          </Card>
        </Link>

        {/* Badges Card */}
        <Link href="/admin/badges">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
            <div className="flex flex-col items-center p-4 sm:p-6">
              <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-full mb-4">
                <HiBadgeCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2 text-text-primary dark:text-text-primary">Badges</h2>
              {isLoading ? (
                <Spinner size="lg" className="text-primary-600 dark:text-primary-400" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">{stats.badges}</p>
              )}
            </div>
          </Card>
        </Link>

        {/* Activities Card */}
        <Link href="/admin/activities">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
            <div className="flex flex-col items-center p-4 sm:p-6">
              <div className="bg-activityType-online-100 dark:bg-activityType-online-900 p-3 rounded-full mb-4">
                <HiCalendar className="h-6 w-6 sm:h-8 sm:w-8 text-activityType-online-600 dark:text-activityType-online-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2 text-text-primary dark:text-text-primary">Activities</h2>
              {isLoading ? (
                <Spinner size="lg" className="text-activityType-online-600 dark:text-activityType-online-400" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-activityType-online-600 dark:text-activityType-online-400">{stats.activities}</p>
              )}
            </div>
          </Card>
        </Link>

        {/* FAQs Card */}
        <Link href="/admin/faq">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
            <div className="flex flex-col items-center p-4 sm:p-6">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full mb-4">
                <HiQuestionMarkCircle className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2 text-text-primary dark:text-text-primary">FAQs</h2>
              {isLoading ? (
                <Spinner size="lg" className="text-purple-600 dark:text-purple-400" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.faqs}</p>
              )}
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
