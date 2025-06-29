import React from 'react';

const BoltBadge: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <a
        href="https://bolt.new/"
        target="_blank"
        rel="noopener noreferrer"
        className="group block transition-all duration-200 hover:scale-105"
        title="Built with Bolt.new"
      >
        <img
          src="/black_circle_360x360.png"
          alt="Built with Bolt.new"
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-200"
        />
      </a>
    </div>
  );
};

export default BoltBadge;