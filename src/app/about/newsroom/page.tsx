import React from 'react';
import { Newspaper, ArrowRight, Share2, Calendar } from 'lucide-react';

const NewsroomPage = () => {
  const news = [
    {
      date: "May 15, 2024",
      title: "Gobokin Expands to New Markets",
      excerpt: "Following a successful year, Gobokin is excited to announce its expansion into 5 new countries, bringing more venue options to our users.",
      category: "Press Release"
    },
    {
      date: "April 10, 2024",
      title: "Introducing GoCover: Enhanced Venue Protection",
      excerpt: "Our new protection program offers industry-leading coverage for venue owners, ensuring peace of mind for every booking.",
      category: "Product Update"
    },
    {
      date: "March 22, 2024",
      title: "Gobokin Partners with Local Communities",
      excerpt: "A new initiative to support local event spaces and promote sustainable community events has been launched today.",
      category: "Community"
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Newsroom
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              The latest updates, press releases, and stories from the Gobokin community.
            </p>
          </div>

          <div className="mb-20">
            <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Latest News</h2>
              <div className="flex space-x-4">
                <button className="text-xs font-black uppercase tracking-widest text-primary flex items-center space-x-2">
                  <span>Press Kit</span>
                  <Newspaper size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-8">
              {news.map((item, index) => (
                <div key={index} className="group p-8 md:p-12 bg-gray-50 rounded-[2.5rem] border border-gray-100 hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                    <div className="flex items-center space-x-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                        {item.category}
                      </span>
                      <div className="flex items-center space-x-2 text-gray-400 text-xs font-bold">
                        <Calendar size={14} />
                        <span>{item.date}</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-primary transition-colors">
                      <Share2 size={20} />
                    </button>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 tracking-tight group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-3xl">
                    {item.excerpt}
                  </p>
                  <button className="flex items-center space-x-3 text-sm font-black uppercase tracking-widest text-gray-900 group-hover:translate-x-2 transition-transform">
                    <span>Read More</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center text-white">
            <h2 className="text-3xl font-black mb-6">Subscribe to our newsletter</h2>
            <p className="text-primary-100 mb-10 max-w-xl mx-auto">
              Get the latest news and updates delivered directly to your inbox.
            </p>
            <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <button className="px-8 py-4 bg-white text-primary rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-50 transition-all active:scale-95 shadow-xl shadow-black/10">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsroomPage;
