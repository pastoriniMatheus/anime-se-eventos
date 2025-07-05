
import React from 'react';
import { Check } from 'lucide-react';
import { InstallationStep } from '@/types/database';

interface ProgressIndicatorProps {
  currentStep: InstallationStep;
}

const STEPS: InstallationStep[] = ['config', 'verify', 'install', 'complete'];

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === step ? 'bg-blue-600 text-white' :
            currentIndex > index ? 'bg-green-600 text-white' :
            'bg-gray-200 text-gray-600'
          }`}>
            {currentIndex > index ? (
              <Check className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < STEPS.length - 1 && <div className="w-16 h-1 bg-gray-200 mx-2" />}
        </div>
      ))}
    </div>
  );
};

export default ProgressIndicator;
