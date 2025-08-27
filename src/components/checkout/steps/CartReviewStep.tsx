import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Clock,
  Star,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
} from "lucide-react";

interface CartItem {
  service: {
    id: string;
    title: string;
    price: number;
  };
  quantity: number;
}

interface CartReviewStepProps {
  cartItems: CartItem[];
  customOrder: any;
  updateQuantity: (serviceId: string, quantity: number) => void;
  removeFromCart: (serviceId: string) => void;
}

export function CartReviewStep({
  cartItems,
  customOrder,
  updateQuantity,
  removeFromCart,
}: CartReviewStepProps) {
  const handleUpdateQuantity = (serviceId: string, change: number) => {
    const currentItem = cartItems.find((item) => item.service.id === serviceId);
    if (currentItem) {
      const newQuantity = Math.max(1, currentItem.quantity + change);
      updateQuantity(serviceId, newQuantity);
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
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
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Review Your Cart</h2>
          <p className="text-muted-foreground text-lg">
            Review your selected services and adjust quantities as needed
          </p>
        </div>
      </motion.div>

      <div className="space-y-4">
        {cartItems.map((item, index) => (
          <motion.div
            key={item.service.id}
            custom={index}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="border border-border/50 bg-gradient-to-r from-muted/20 to-muted/10 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg">
                      {item.service.title}
                    </h4>
                    <div className="flex items-center space-x-3 mt-2">
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

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateQuantity(item.service.id, -1)}
                      disabled={item.quantity <= 1}
                      className="w-10 h-10 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>

                    <div className="w-16 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <span className="font-semibold text-lg">
                        {item.quantity}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateQuantity(item.service.id, 1)}
                      className="w-10 h-10 p-0 hover:bg-primary/10 hover:text-primary"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-xl text-primary">
                      ${(item.service.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${item.service.price} each
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.service.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 w-10 h-10 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Custom Order Display */}
        {customOrder && (
          <motion.div
            custom={cartItems.length}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="border border-primary/50 bg-gradient-to-r from-primary/10 to-blue-600/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-primary" />
                  Custom Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {customOrder.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.item_name} x{item.quantity}
                    </span>
                    <span className="font-medium">
                      ${(item.price_per_unit * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-primary/20">
                  <div className="flex justify-between font-semibold">
                    <span>Custom Order Total:</span>
                    <span className="text-primary">
                      ${customOrder.total?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {cartItems.length === 0 && !customOrder && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground">
            Add some services to continue with checkout
          </p>
        </motion.div>
      )}
    </div>
  );
}
