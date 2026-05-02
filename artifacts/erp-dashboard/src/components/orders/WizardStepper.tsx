import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Step } from "./types";

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      {(Array.isArray(steps) ? steps : []).map((step, index) => {
        const Icon = step.icon;
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-center flex-1">
            <div
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                isCompleted && "bg-primary border-primary text-white shadow-primary/20",
                isCurrent && "border-primary text-primary bg-surface-container-high",
                !isCompleted && !isCurrent && "border-outline-variant text-on-surface-variant bg-surface-container-low"
              )}
              data-testid={`step-indicator-${step.id}`}
            >
              {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-3 rounded-full transition-all duration-500",
                  isCompleted ? "bg-primary" : "bg-outline-variant"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
