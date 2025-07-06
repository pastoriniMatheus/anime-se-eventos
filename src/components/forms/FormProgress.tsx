
import React from 'react';

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const FormProgress = ({ currentStep, totalSteps, stepTitles }: FormProgressProps) => {
  return (
    <div className="text-center">
      <div className="flex justify-center mt-4 space-x-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep ? 'bg-white text-blue-600' : 'bg-blue-400 text-white'
            }`}>
              {step}
            </div>
            {step < totalSteps && <div className={`w-8 h-0.5 ml-2 ${step < currentStep ? 'bg-white' : 'bg-blue-400'}`} />}
          </div>
        ))}
      </div>
      <p className="text-sm text-blue-100 mt-2">{stepTitles[currentStep - 1]}</p>
    </div>
  );
};

export default FormProgress;
