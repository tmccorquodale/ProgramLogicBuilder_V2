
import React from 'react';

export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-nsw-grey-100 overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-nsw-blue/5 rounded-full blur-[80px]" />
      <div className="absolute bottom-[5%] left-[-5%] w-[350px] h-[350px] bg-nsw-teal/5 rounded-full blur-[70px]" />
      <div className="absolute top-[40%] left-[10%] w-[200px] h-[200px] bg-nsw-blue/3 rounded-full blur-[50px]" />
    </div>
  );
};
