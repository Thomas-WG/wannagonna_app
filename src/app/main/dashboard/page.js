/*
 * DashboardPage.js
 *
 * Purpose:
 * This component displays user activity metrics, including the number of activities completed and applications submitted.
 * It uses Flowbite components for styling and layout.
 *
 * Flow:
 * 1. Displays a header with the title "Dashboard".
 * 2. Shows metrics for user activities.
 * 3. Uses fake fixed data for initial implementation.
 *
 * Usage:
 * - This component is accessed at `/dashboard`.
 * - Import this page as a route in your Next.js App Router.
 */

'use client'; // Marks this module for client-side rendering

import { Card } from "flowbite-react"; // Import Flowbite components

export default function DashboardPage() {



  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">temp Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <Card>
          Activities
        </Card>
        <Card>
          Application submitted
        </Card>
      </div>
    </div>
  );
}
