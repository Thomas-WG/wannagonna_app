"use client";

import ErrorPage from '@/components/ErrorPage';

export default function NotFoundPage() {
  return (
    <ErrorPage
      statusCode={404}
      title="Oops! Page Not Found"
      description={[
        "(╯°□°）╯︵ ┻━┻",
        "Looks like this page went on a vacation without leaving a forwarding address!",
        "Don't worry, even the best explorers get lost sometimes. (Though we're not saying you're lost...)",
        "Maybe try using a map? 🗺️"
      ]}
      iconType="notFound"
    />
  );
}
