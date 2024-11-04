export const siteConfig = {
  title: 'Wanna Gonna: Make a difference Today',
  description:
    'A free collaborative platform for volunteering, which brings together people skills and the needs of NGOs/NPOs, all around the world.',
  url: 'https://wannagonna.org',
};

export const metadata = {
  //this is to manage the metadata of the website (favicon, description...)
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon/favicon.ico',
    shortcut: '/favicon/favicon-96x96.png',
    apple: '/favicon/apple-touch-icon.png',
  },
  manifest: '/favicon/site.webmanifest',

  authors: [
    {
      name: 'Thomas BERTIN',
      url: 'https://www.wannagonna.org',
    },
  ],
};