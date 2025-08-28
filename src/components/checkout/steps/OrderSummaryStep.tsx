import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  DollarSign,
  Trophy,
  CheckCircle,
  FileText,
  Clock,
  Star,
  Sparkles,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

interface CartItem {
  service: {
    id: string;
    title: string;
    price: number;
  };
  quantity: number;
}

interface OrderSummaryStepProps {
  cartItems: CartItem[];
  customOrder: any;
  stepData: {
    orderNotes: string;
    promoCode: string;
    promoDiscount: number;
    agreeToTerms: boolean;
    discordUsername: string;
  };
  subtotal: number;
  tax: number;
  total: number;
}

export function OrderSummaryStep({
  cartItems,
  customOrder,
  stepData,
  subtotal,
  tax,
  total,
}: OrderSummaryStepProps) {
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1] as const, // Cubic bezier for easeOut
      },
    }),
  };

  const summaryVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Review Your Order</h2>
          <p className="text-muted-foreground text-lg">
            Confirm all details before proceeding to payment
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Items */}
        <div className="space-y-4">
          <motion.div
            variants={summaryVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Trophy className="w-6 h-6 mr-3 text-primary" />
                  Order Items
                  <Badge variant="secondary" className="ml-auto">
                    {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.service.id}
                    custom={index}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.service.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Professional
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        ${(item.service.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${item.service.price} × {item.quantity}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Custom Order */}
                {customOrder && (
                  <motion.div
                    custom={cartItems.length}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="p-3 bg-primary/10 rounded-lg border border-primary/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">Custom Order</h4>
                          <p className="text-sm text-muted-foreground">
                            {customOrder.items?.length || 0} custom items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          ${customOrder.total?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Discord Username */}
          <motion.div
            variants={summaryVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                  Discord Username
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                  <p className="font-medium text-primary">
                    {stepData.discordUsername}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Our team will contact you on Discord
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Notes */}
          {stepData.orderNotes && (
            <motion.div
              variants={summaryVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="w-5 h-5 mr-2" />
                    Order Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {stepData.orderNotes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <motion.div
            variants={summaryVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <DollarSign className="w-6 h-6 mr-3 text-primary" />
                  Order Total
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base">Subtotal</span>
                    <span className="font-semibold text-lg">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  {stepData.promoDiscount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="flex items-center">
                        <Sparkles className="w-4 h-4 mr-1" />
                        Promo Discount
                      </span>
                      <span className="font-semibold">
                        -${stepData.promoDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Promo Code Applied */}
                {stepData.promoCode && stepData.promoDiscount > 0 && (
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      <strong>Code "{stepData.promoCode}" applied</strong>
                      <br />
                      You saved ${stepData.promoDiscount.toFixed(2)} on this
                      order!
                    </AlertDescription>
                  </Alert>
                )}

                {/* Terms Status */}
                <Alert
                  className={
                    stepData.agreeToTerms
                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                      : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
                  }
                >
                  {stepData.agreeToTerms ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        Terms and conditions accepted
                      </AlertDescription>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200">
                        Please accept terms in the previous step to continue
                      </AlertDescription>
                    </>
                  )}
                </Alert>

                {/* Minimum Amount Check */}
                {total < 0.5 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Minimum payment amount is $0.50. Please add more items to
                      your cart.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Next Step Info */}
          <motion.div
            variants={summaryVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
              <Package className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Next:</strong> Complete your secure payment with Stripe
                to finalize your order.
              </AlertDescription>
            </Alert>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
