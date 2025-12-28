/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://yourdomain.com",
  generateRobotsTxt: true,

  // good defaults
  changefreq: "daily",
  priority: 0.7,

  // If you have a lot of pages, it splits them automatically
  sitemapSize: 5000,
};
