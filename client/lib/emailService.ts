interface SendEmailParams {
  to: string;
  subject: string;
  message: string;
  ticketId: string;
  customerName: string;
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

export async function sendTicketReplyEmail(params: SendEmailParams): Promise<EmailResponse> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data: EmailResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }

    return data;
  } catch (error: any) {
    console.error('Email service error:', error);
    throw new Error(error.message || 'Failed to send email');
  }
}

export function generateTicketSubject(originalSubject: string): string {
  // Remove "Support:" prefix if it exists and clean up the subject
  const cleanSubject = originalSubject.replace(/^Support:\s*/, '');
  return cleanSubject;
}
