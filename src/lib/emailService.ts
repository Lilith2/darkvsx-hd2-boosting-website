interface SendEmailParams {
  to: string;
  subject: string;
  message: string;
  ticketId: string;
  customerName: string;
}

interface SendOrderConfirmationParams {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  orderTotal: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  paymentId?: string;
  isCustomOrder?: boolean;
}

interface EmailResponse {
  success: boolean;
  message: string;
  emailData?: {
    to: string;
    subject: string;
    sentAt: string;
  };
  error?: string;
  details?: string;
}

export async function sendTicketReplyEmail(
  params: SendEmailParams,
): Promise<EmailResponse> {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      // Try to get error details from response, but handle if body is already read
      let errorMessage = "Failed to send email";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (jsonError) {
        // If we can't read the response body, use status text
        errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
      }
      throw new Error(errorMessage);
    }

    const data: EmailResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error("Email service error:", error);
    throw new Error(error.message || "Failed to send email");
  }
}

export async function sendOrderConfirmationEmail(
  params: SendOrderConfirmationParams,
): Promise<EmailResponse> {
  try {
    console.log(
      "Attempting to send order confirmation email to:",
      params.customerEmail,
    );

    const response = await fetch("/api/send-order-confirmation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      // Try to get error details from response, but handle if body is already read
      let errorMessage = "Failed to send order confirmation email";
      let errorDetails = "";

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData.details || "";

        console.error("Email API Error Response:", {
          status: response.status,
          error: errorMessage,
          details: errorDetails,
          code: errorData.code,
        });
      } catch (jsonError) {
        // If we can't read the response body, use status text
        errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
        console.error("Failed to parse error response:", jsonError);
      }

      const fullErrorMessage = errorDetails
        ? `${errorMessage}: ${errorDetails}`
        : errorMessage;
      throw new Error(fullErrorMessage);
    }

    const data: EmailResponse = await response.json();
    console.log("Order confirmation email sent successfully:", data);
    return data;
  } catch (error: any) {
    console.error("Order confirmation email service error:", error);
    throw new Error(error.message || "Failed to send order confirmation email");
  }
}

export function generateTicketSubject(originalSubject: string): string {
  // Remove "Support:" prefix if it exists and clean up the subject
  const cleanSubject = originalSubject.replace(/^Support:\s*/, "");
  return cleanSubject;
}
