import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export function PaymentMethodsInfo() {
  return (
    <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Info className="w-5 h-5 mr-2 text-blue-600" />
          Payment Methods Available
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Good news!</strong> Your checkout now supports all major payment methods including Google Pay, Apple Pay, and Amazon Pay.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">✅ Enabled Payment Methods:</h4>
            <div className="space-y-2">
              {[
                { name: 'Credit/Debit Cards', status: 'ready', description: 'Visa, Mastercard, Amex, JCB, UnionPay' },
                { name: 'Google Pay', status: 'ready', description: 'Available on supported devices' },
                { name: 'Apple Pay', status: 'ready', description: 'Available on Safari/iOS devices' },
                { name: 'Amazon Pay', status: 'ready', description: 'Pay with Amazon account' },
                { name: 'PayPal', status: 'ready', description: 'Classic PayPal payments' },
                { name: 'Stripe Link', status: 'ready', description: '1-click checkout' },
              ].map((method) => (
                <div key={method.name} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div>
                    <span className="font-medium text-sm">{method.name}</span>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    Ready
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">⚙️ Additional Options:</h4>
            <div className="space-y-2">
              {[
                { name: 'ACH Direct Debit', status: 'available', description: 'US bank account transfers' },
                { name: 'Cash App Pay', status: 'available', description: 'Popular mobile payments' },
                { name: 'Venmo', status: 'available', description: 'Social payments' },
                { name: 'Klarna', status: 'requires-setup', description: 'Buy now, pay later' },
                { name: 'Affirm', status: 'requires-setup', description: 'Installment payments' },
                { name: 'Custom Payment', status: 'configured', description: 'Your special payment method' },
              ].map((method) => (
                <div key={method.name} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div>
                    <span className="font-medium text-sm">{method.name}</span>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      method.status === 'configured' 
                        ? "bg-purple-100 text-purple-800 border-purple-300"
                        : method.status === 'requires-setup'
                        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                        : "bg-blue-100 text-blue-800 border-blue-300"
                    }
                  >
                    {method.status === 'configured' ? 'Custom' : 
                     method.status === 'requires-setup' ? 'Setup Needed' : 'Available'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Note:</strong> Some payment methods like Google Pay and Apple Pay will only appear when customers use compatible devices and browsers. 
            Stripe automatically shows the most relevant options to each customer.
          </AlertDescription>
        </Alert>

        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Powered by Stripe Payment Intents</span>
            <a 
              href="https://stripe.com/payments/payment-methods" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:text-primary transition-colors"
            >
              Learn more
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
