import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  ArrowRight
} from "lucide-react";
import { Translation } from "@/components/orders/types";
import { WizardHeader } from "@/components/orders/WizardHeader";
import { WizardStepper } from "@/components/orders/WizardStepper";
import { CustomerStep } from "@/components/orders/CustomerStep";
import { ProductsStep } from "@/components/orders/ProductsStep";
import { PricingStep } from "@/components/orders/PricingStep";
import { DeliveryStep } from "@/components/orders/DeliveryStep";
import { ReviewStep } from "@/components/orders/ReviewStep";
import { useWizardState } from "@/components/orders/useWizardState";
import { STEPS } from "@/components/orders/constants";

export default function OrderCreationWizard() {
  const {
    lang,
    setLang,
    currentStep,
    customerOpen,
    setCustomerOpen,
    productOpen,
    setProductOpen,
    formData,
    setFormData,
    t,
    companies,
    companiesError,
    refetchCompanies,
    products,
    filteredBoms,
    selectedBom,
    materialCalculations,
    estimatedProductionTime,
    sufficientCount,
    insufficientCount,
    createOrderMutation,
    handleNext,
    handleBack,
    handleSubmit,
    handleProductSelect,
  } = useWizardState();

  if (companiesError) {
    return (
      <div className="container mx-auto p-6 bg-surface min-h-screen">
        <ErrorState onRetry={refetchCompanies} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-surface min-h-full">
      <WizardHeader t={t} lang={lang} setLang={setLang} onSaveDraft={() => {}} />

      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-surface-container-lowest border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-4 bg-surface-container-low/50">
            <WizardStepper steps={STEPS} currentStep={currentStep} />
            <div className="mt-4">
              <h2 className="text-xl font-bold text-on-surface">
                {t[`step${currentStep}` as keyof Translation]}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {t[`step${currentStep}Desc` as keyof Translation]}
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            {currentStep === 1 && (
              <CustomerStep 
                formData={formData} 
                setFormData={setFormData} 
                t={t} 
                companies={companies} 
                products={products}
                customerOpen={customerOpen}
                setCustomerOpen={setCustomerOpen}
                productOpen={productOpen}
                setProductOpen={setProductOpen}
                handleProductSelect={handleProductSelect}
              />
            )}
            {currentStep === 2 && (
              <ProductsStep 
                formData={formData} 
                setFormData={setFormData} 
                t={t} 
                filteredBoms={filteredBoms} 
              />
            )}
            {currentStep === 3 && (
              <PricingStep 
                formData={formData} 
                t={t} 
                materialCalculations={materialCalculations} 
              />
            )}
            {currentStep === 4 && (
              <DeliveryStep 
                t={t} 
                materialCalculations={materialCalculations} 
                sufficientCount={sufficientCount} 
                insufficientCount={insufficientCount} 
                estimatedProductionTime={estimatedProductionTime} 
              />
            )}
            {currentStep === 5 && (
              <ReviewStep 
                formData={formData} 
                t={t} 
                selectedBom={selectedBom} 
                insufficientCount={insufficientCount} 
              />
            )}
          </CardContent>

          <Separator className="bg-outline-variant" />
          
          <div className="flex justify-between p-8 bg-surface-container-low/30">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="rounded-lg border-outline-variant text-on-surface"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t.back}
            </Button>
            
            <div className="flex gap-3">
              {currentStep < 5 ? (
                <Button onClick={handleNext} className="bg-primary text-white rounded-lg px-6 hover:shadow-lg transition-all">
                  {t.next}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createOrderMutation.isPending}
                  className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-8 shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.creating}
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      {t.submit}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
