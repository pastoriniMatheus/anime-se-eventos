
import React from 'react';

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const FormProgress = ({ currentStep, totalSteps, stepTitles }: FormProgressProps) => {
  return (
    <div className="text-center">
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              step === currentStep 
                ? 'bg-white text-pink-600 lead-form-progress-active shadow-lg scale-110' 
                : step < currentStep 
                ? 'bg-white/80 text-pink-600 lead-form-progress-completed' 
                : 'bg-white/30 text-white/70'
            }`}>
              {step < currentStep ? '✓' : step}
            </div>
            {step < totalSteps && (
              <div className={`w-6 h-1 ml-2 rounded-full transition-all duration-300 ${
                step < currentStep ? 'bg-white/80 lead-form-progress-line-active' : 'bg-white/30'
              }`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-white/90 mt-3 font-medium">{stepTitles[currentStep - 1]}</p>
    </div>
  );
};

export default FormProgress;
