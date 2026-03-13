import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Search } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-zinc-950 text-white pt-20 pb-10">
      <div className="container grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
        {/* Brand Column */}
        <div className="space-y-6">
          <Link to="/" className="text-3xl font-title font-bold text-secondary">
            Avyukt
          </Link>
          <p className="text-gray-400 leading-relaxed">
            Authentic Flavours. <br /> Modern Ambience.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://g.co/kgs/SxFrLp" target="_blank" className="w-10 h-10 rounded-full flex items-center justify-center  transition-colors">
              <Search size={20} className="text-blue-400" />
            </a>
            <a href="https://www.instagram.com/avyuktrestaurant2020/" target="_blank" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors">
              <Instagram size={20} className="text-pink-500" />
            </a>
            <a href="https://www.facebook.com/avyuktrestaurant/" target="_blank" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors">
              <Facebook size={20} className="text-blue-600" />
            </a>
            <a href="https://wa.me/918319670523?text=Message%20from%20Avyukt%20Restaurant" target="_blank" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors group">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                className="w-5 h-5 text-[#25D366] group-hover:scale-110 transition-transform"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </a>
            <a href="https://www.swiggy.com/city/vidisha/avyukt-restaurant-sanchi-road-baripura-rest317832?source=sharing" target="_blank" className="w-6 h-6  rounded-full flex items-center justify-center transition-colors group">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                className="w-5 h-5 text-[#FC8019] group-hover:scale-110 transition-transform"
                fill="currentColor"
              >
                <path d="M12.034 24c-.376-.411-2.075-2.584-3.95-5.513c-.547-.916-.901-1.63-.833-1.814c.178-.48 3.355-.743 4.333-.308c.298.132.29.307.29.409c0 .44-.022 1.619-.022 1.619a.441.441 0 1 0 .883-.002l-.005-2.939c0-.255-.278-.319-.331-.329c-.511-.002-1.548-.006-2.661-.006c-2.457 0-3.006.101-3.423-.172c-.904-.591-2.383-4.577-2.417-6.819C3.849 4.964 5.723 2.225 8.362.868A8.1 8.1 0 0 1 12.026 0c4.177 0 7.617 3.153 8.075 7.209l.001.011c.084.981-5.321 1.189-6.39.904c-.164-.044-.206-.212-.206-.284L13.5 4.996a.442.442 0 0 0-.884.002l.009 3.866a.33.33 0 0 0 .268.32l3.354-.001c1.79 0 2.542.207 3.042.588c.333.254.461.739.349 1.37C18.633 16.755 12.273 23.71 12.034 24"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Links Column */}
        <div className="space-y-6 ">
          <h3 className="text-lg font-bold text-white">Quick Links</h3>
          <ul className="space-y-4 text-gray-400">
            <li><Link to="/about" className="hover:text-secondary transition-colors">About Us</Link></li>
            <li><Link to="/menu" className="hover:text-secondary transition-colors">Full Menu</Link></li>
            <li><Link to="/gallery" className="hover:text-secondary transition-colors">Gallery</Link></li>
            <li><Link to="/recipes" className="hover:text-secondary transition-colors">Recipes</Link></li>
            <li><Link to="/contact" className="hover:text-secondary transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        {/* About Column */}
        <div className="space-y-6 lg:col-span-1">
          <h3 className="text-lg font-bold text-white">About Avyukt</h3>
          <ul className="space-y-4 text-gray-400">
            <li><Link to="/about" className="hover:text-secondary transition-colors">Who We Are</Link></li>
            <li><a href="#" className="hover:text-secondary transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-secondary transition-colors">Work With Us</a></li>
            <li><a href="#" className="hover:text-secondary transition-colors">Investor Relations</a></li>
            <li><a href="#" className="hover:text-secondary transition-colors">Report Fraud</a></li>
          </ul>
        </div>
      </div>

      <div className="container mt-20 pt-8 border-t border-white/10 text-center">
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Avyukt Restaurant. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
