import React from 'react';
import { BookOpen, Camera, Tag, MessageCircle, BarChart, Settings, ExternalLink } from 'lucide-react';

const ResourcesPage = () => {
  const resourceCategories = [
    {
      icon: <Camera size={24} />,
      title: "Photography Guide",
      description: "Learn how to take professional-quality photos that showcase your venue's best features.",
      link: "#"
    },
    {
      icon: <Tag size={24} />,
      title: "Pricing Strategy",
      description: "Understand market trends and learn how to price your venue competitively to maximize bookings.",
      link: "#"
    },
    {
      icon: <MessageCircle size={24} />,
      title: "Guest Communication",
      description: "Tips and templates for clear, professional communication with potential and confirmed guests.",
      link: "#"
    },
    {
      icon: <BarChart size={24} />,
      title: "Analytics & Growth",
      description: "Use your dashboard data to understand your venue's performance and find ways to grow.",
      link: "#"
    },
    {
      icon: <Settings size={24} />,
      title: "Dashboard Tutorial",
      description: "A comprehensive guide on how to use all the features of your venue owner dashboard.",
      link: "#"
    },
    {
      icon: <BookOpen size={24} />,
      title: "Local Regulations",
      description: "Resources to help you understand local rules and regulations for event hosting.",
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Listing Resources
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Everything you need to succeed as a venue owner on Gobokin. From photography tips to pricing strategies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {resourceCategories.map((item, index) => (
              <a key={index} href={item.link} className="group p-8 bg-gray-50 border border-gray-100 rounded-[2.5rem] hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300">
                <div className="mb-6 w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-50 group-hover:bg-primary group-hover:text-white transition-all">
                  {item.icon}
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight flex items-center justify-between">
                  <span>{item.title}</span>
                  <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">
                  {item.description}
                </p>
              </a>
            ))}
          </div>

          <div className="bg-primary/5 rounded-[3rem] p-12 md:p-16 flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">Community Forum</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Connect with other venue owners, share experiences, and learn best practices from a global community of hosts.
              </p>
              <button className="px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/20">
                Join the Discussion
              </button>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 gap-4">
              <div className="aspect-video bg-white rounded-3xl shadow-sm border border-gray-100" />
              <div className="aspect-video bg-white rounded-3xl shadow-sm border border-gray-100 mt-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
