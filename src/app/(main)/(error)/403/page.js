"use client";

import ErrorPage from '@/components/ErrorPage';

export default function ForbiddenPage() {
  return (
    <ErrorPage
      statusCode={403}
      title="Oops! You're Not Supposed to Be Here"
      description={[
        "Looks like you've wandered into the VIP section without a backstage pass!",
        "Don't worry, even the best hackers get rejected sometimes. (Though we're not saying you're a hacker...)",
        "Maybe try knocking next time? 🚪"
      ]}
      iconType="forbidden"
    />
  );
}
