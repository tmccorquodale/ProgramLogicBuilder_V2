import React from 'react';

export const Background: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-white"
      style={{
        backgroundImage: 'url("/background.svg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      id="app-background"
    />
  );
};
