import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart2, Award, User, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Leaderboard', path: '/leaderboard', icon: Award },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Desktop Navigation */}
      <div className={`hidden md:flex space-x-1 ${className}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.name}
              onClick={() => handleNavigate(item.path)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-blue-500/10 to-emerald-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
      
      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-all duration-300 ease-in-out">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Menu</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigate(item.path)}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg mb-2 text-left ${
                      active
                        ? 'bg-gradient-to-r from-blue-500/10 to-emerald-500/10 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;