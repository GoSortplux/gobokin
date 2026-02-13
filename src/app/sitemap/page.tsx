import React from 'react';
import { Map, ArrowRight } from 'lucide-react';

const SitemapPage = () => {
  const sections = [
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "/support/help-center" },
        { label: "Safety Information", href: "/support/safety" },
        { label: "Cancellation Options", href: "/support/cancellation" }
      ]
    },
    {
      title: "Community",
      links: [
        { label: "Disaster Relief Listing", href: "/community/disaster-listing" }
      ]
    },
    {
      title: "Hosting",
      links: [
        { label: "Try Listing", href: "/hosting/try-listing" },
        { label: "Protection for Venue", href: "/hosting/protection" },
        { label: "Explore Listing Resources", href: "/hosting/resources" },
        { label: "Apply to be a Hall Owner", href: "/apply-hall-owner" }
      ]
    },
    {
      title: "About",
      links: [
        { label: "Newsroom", href: "/about/newsroom" },
        { label: "Learn about new features", href: "/about/features" },
        { label: "Careers", href: "/about/careers" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" }, // These open modals in the real app
        { label: "Terms of Service", href: "#" }
      ]
    },
    {
      title: "Explore",
      links: [
        { label: "Home", href: "/" },
        { label: "Find Venues", href: "/search" },
        { label: "Login", href: "/auth/login" },
        { label: "Register", href: "/auth/register" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/5 rounded-full text-primary mb-6">
              <Map size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Navigation Guide</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Sitemap
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Find everything you&apos;re looking for on Gobokin. A complete map of our platform&apos;s resources and pages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-20">
            {sections.map((section, index) => (
              <div key={index} className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-3">
                  <span className="w-8 h-1 bg-primary rounded-full" />
                  <span>{section.title}</span>
                </h2>
                <ul className="space-y-4 ml-11">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href={link.href}
                        className="group flex items-center space-x-2 text-gray-500 hover:text-primary transition-colors font-medium"
                      >
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -ml-5 transition-all" />
                        <span>{link.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="p-12 bg-gray-50 rounded-[3rem] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-50">
                <Map size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Need more help?</h3>
                <p className="text-gray-500">Contact our support team 24/7 for any assistance.</p>
              </div>
            </div>
            <a href="/support/help-center" className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/20">
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitemapPage;
