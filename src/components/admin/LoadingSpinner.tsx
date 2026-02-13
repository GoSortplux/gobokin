import React from 'react';
import CustomLoader from '../CustomLoader';

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <CustomLoader size={128} />
    </div>
  );
};

export default LoadingSpinner;
