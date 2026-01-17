import * as Sentry from "@sentry/react";

/**
 * Track user actions as Sentry breadcrumbs for debugging
 * 
 * Usage:
 * trackAction('lead_stage_changed', { leadId, from: 'new_lead', to: 'meeting_done' });
 * trackAction('invoice_created', { invoiceId, amount: 50000 });
 */
export function trackAction(action: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    category: "user-action",
    message: action,
    data,
    level: "info",
  });
}

/**
 * Track page views
 */
export function trackPageView(page: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    category: "navigation",
    message: `Page view: ${page}`,
    data,
    level: "info",
  });
}

/**
 * Track API calls
 */
export function trackApiCall(endpoint: string, method: string, success: boolean, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    category: "http",
    message: `${method} ${endpoint}`,
    data: {
      ...data,
      success,
    },
    level: success ? "info" : "error",
  });
}
