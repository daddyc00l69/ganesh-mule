import { Resend } from 'resend';

// Initialize Resend with the user-provided API key from environment
const resendApiKey = process.env.RESEND_API_KEY || 're_placeholder_development_key';

export const resend = new Resend(resendApiKey);

export const DEFAULT_EMAIL_FROM =
  process.env.EMAIL_FROM || 'Ganesh Mule Pure Honey <care@devtushar.uk>';

export const ORDERS_EMAIL_FROM =
  process.env.ORDERS_EMAIL_FROM || 'Ganesh Mule Orders <orders@devtushar.uk>';

export const SUPPORT_EMAIL_FROM =
  process.env.SUPPORT_EMAIL_FROM || 'Ganesh Mule Support <support@devtushar.uk>';

export const AUTH_EMAIL_FROM =
  process.env.AUTH_EMAIL_FROM || 'Ganesh Mule Security <auth@devtushar.uk>';

export const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_EMAIL || 'tushar0p.test@gmail.com';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

// In-memory audit trail of sent emails for admin diagnostics & testing
export interface EmailAuditLogItem {
  id: string;
  to: string;
  subject: string;
  type: string;
  status: 'SENT' | 'FAILED' | 'SIMULATED';
  timestamp: string;
  details?: string;
}

export const EMAIL_AUDIT_LOGS: EmailAuditLogItem[] = [];

/**
 * Enterprise-grade email dispatch wrapper with verified domain delivery.
 * Sends directly to customer email using verified domain devtushar.uk.
 * Enforces strict policy: ZERO emails to aradhyetushar; all test dispatches route to tushar0p.test@gmail.com.
 */
export async function sendEmail(
  options: SendEmailOptions,
  type = 'GENERAL'
): Promise<EmailDispatchResult> {
  const originalRecipient = Array.isArray(options.to) ? options.to.join(', ') : options.to;
  let from = options.from || DEFAULT_EMAIL_FROM;

  // Auto-route through verified domain devtushar.uk
  if (from.includes('drtushar.uk')) {
    from = from.replace('drtushar.uk', 'devtushar.uk');
  }

  // Enforce zero emails to aradhyetushar
  let actualTo: string | string[] = options.to;
  if (typeof options.to === 'string' && options.to.toLowerCase().includes('aradhyetushar')) {
    actualTo = ADMIN_NOTIFICATION_EMAIL;
  } else if (Array.isArray(options.to)) {
    actualTo = options.to.map((addr) =>
      addr.toLowerCase().includes('aradhyetushar') ? ADMIN_NOTIFICATION_EMAIL : addr
    );
  }

  try {
    const response = await resend.emails.send({
      from,
      to: actualTo,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      tags: options.tags,
    });

    if (response.error) {
      // Seamless failover if any domain validation error occurs
      if (
        (response.error.message.includes('not verified') || response.error.message.includes('validation_error')) &&
        !from.includes('devtushar.uk')
      ) {
        const fallbackFrom = from.includes('@')
          ? from.replace(/@[^>]+/, '@devtushar.uk')
          : 'Ganesh Mule Pure Honey <care@devtushar.uk>';
        const retryRes = await resend.emails.send({
          from: fallbackFrom,
          to: actualTo,
          subject: options.subject,
          html: options.html,
          replyTo: options.replyTo,
          tags: options.tags,
        });

        if (!retryRes.error && retryRes.data?.id) {
          EMAIL_AUDIT_LOGS.unshift({
            id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            to: originalRecipient,
            subject: options.subject,
            type,
            status: 'SENT',
            timestamp: new Date().toISOString(),
            details: `Dispatched successfully to ${originalRecipient} via Resend (${fallbackFrom}). Message ID: ${retryRes.data.id}`,
          });
          return {
            success: true,
            messageId: retryRes.data.id,
          };
        }
      }

      console.warn(`[Resend Email Error] ${response.error.message}`);
      EMAIL_AUDIT_LOGS.unshift({
        id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        to: originalRecipient,
        subject: options.subject,
        type,
        status: 'FAILED',
        timestamp: new Date().toISOString(),
        details: response.error.message,
      });

      return {
        success: false,
        error: response.error.message,
      };
    }

    EMAIL_AUDIT_LOGS.unshift({
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      to: originalRecipient,
      subject: options.subject,
      type,
      status: 'SENT',
      timestamp: new Date().toISOString(),
      details: `Dispatched successfully to ${originalRecipient} via Resend (${from}). Message ID: ${response.data?.id}`,
    });

    // Keep log capped at 100 items
    if (EMAIL_AUDIT_LOGS.length > 100) {
      EMAIL_AUDIT_LOGS.pop();
    }

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error: any) {
    console.error(`[Resend Dispatch Exception]`, error?.message || error);

    EMAIL_AUDIT_LOGS.unshift({
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      to: originalRecipient,
      subject: options.subject,
      type,
      status: 'FAILED',
      timestamp: new Date().toISOString(),
      details: error?.message || 'Network exception during Resend transmission',
    });

    return {
      success: false,
      error: error?.message || 'Failed to dispatch email',
    };
  }
}
