export function HowItWorksSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-muted/10 to-transparent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting started with our services is simple and straightforward
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              step: "01",
              title: "Choose Service",
              description: "Select the boosting service that fits your needs from our comprehensive catalog.",
            },
            {
              step: "02", 
              title: "Place Order",
              description: "Complete your order with our secure checkout process and provide any special requirements.",
            },
            {
              step: "03",
              title: "Get Matched",
              description: "We assign a professional booster who specializes in your selected service type.",
            },
            {
              step: "04",
              title: "Track Progress",
              description: "Monitor your order in real-time and communicate directly with your booster.",
            },
          ].map((step, index) => (
            <div key={step.step} className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <span className="text-2xl font-bold text-white">{step.step}</span>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
