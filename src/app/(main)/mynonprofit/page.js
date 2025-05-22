"use client";

import { Card } from "flowbite-react";
import Link from "next/link";
import { HiUsers, HiOfficeBuilding, HiAcademicCap, HiCalendar, HiDocumentText } from "react-icons/hi";
import { useEffect, useState } from "react";
import { useAuth } from "@/utils/auth/AuthContext";
import { fetchOrganizationById } from "@/utils/crudOrganizations";
import { useRouter } from "next/navigation";

export default function MyNonProfitDashboard() {
  const { claims } = useAuth();
  const router = useRouter();
  const [orgData, setOrgData] = useState({
    totalOnlineActivities: 0,
    totalLocalActivities: 0,
    totalEvents: 0,
    totalNewApplications: 0,
    totalParticipants: 0
  });
  const [loading, setLoading] = useState(true);

  const handleActivityClick = (type) => {
    router.push(`/mynonprofit/activities?type=${type}`);
  };

  useEffect(() => {
    const fetchKpiData = async () => {
      if (claims && claims.npoId) {
        try {
          const orgData = await fetchOrganizationById(claims.npoId);
          if (orgData) {
            setOrgData(orgData);
          }
        } catch (error) {
          console.error("Error fetching KPI data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchKpiData();
  }, [claims]);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-8">My Non-Profit Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          {/* Online Activities Card */}
          <Card 
            className="w-36 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleActivityClick('online')}
          >
            <div className="flex flex-col items-center p-2">
              <div className="bg-blue-100 p-2 rounded-full mb-2">
                <HiOfficeBuilding className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-sm font-semibold mb-1 text-center">Online Activities</h2>
              <p className="text-2xl font-bold text-blue-600 text-center">{orgData.totalOnlineActivities}</p>
            </div>
          </Card>

          {/* Local Activities Card */}
          <Card 
            className="w-36 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleActivityClick('local')}
          >
            <div className="flex flex-col items-center p-2">
              <div className="bg-green-100 p-2 rounded-full mb-2">
                <HiOfficeBuilding className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-sm font-semibold mb-1 text-center">Local Activities</h2>
              <p className="text-2xl font-bold text-green-600 text-center">{orgData.totalLocalActivities}</p>
            </div>
          </Card>

          {/* Total Events Card */}
          <Card className="w-36 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center p-2">
              <div className="bg-purple-100 p-2 rounded-full mb-2">
                <HiCalendar className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-sm font-semibold mb-1 text-center">Total Events</h2>
              <p className="text-2xl font-bold text-purple-600 text-center">{orgData.totalEvents}</p>
            </div>
          </Card>

          {/* New Applications Card */}
          <Card className="w-36 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center p-2">
              <div className="bg-yellow-100 p-2 rounded-full mb-2">
                <HiDocumentText className="h-6 w-6 text-yellow-600" />
              </div>
              <h2 className="text-sm font-semibold mb-1 text-center">New Applications</h2>
              <p className="text-2xl font-bold text-yellow-600 text-center">{orgData.totalNewApplications}</p>
            </div>
          </Card>

          {/* Total Participants Card */}
          <Card className="w-36 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center p-2">
              <div className="bg-red-100 p-2 rounded-full mb-2">
                <HiUsers className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-sm font-semibold mb-1 text-center">Total Participants</h2>
              <p className="text-2xl font-bold text-red-600 text-center">{orgData.totalParticipants}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
