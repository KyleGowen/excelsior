import Stripe from 'stripe';

export interface StripeSupporterClient {
  retrievePrice(priceId: string): Promise<Stripe.Price>;
  createCustomer(idempotencyKey: string): Promise<Stripe.Customer>;
  createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams,
    idempotencyKey: string
  ): Promise<Stripe.Checkout.Session>;
  createPortalSession(
    params: Stripe.BillingPortal.SessionCreateParams
  ): Promise<Stripe.BillingPortal.Session>;
  retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
  cancelSubscription(subscriptionId: string, idempotencyKey: string): Promise<Stripe.Subscription>;
  retrieveInvoice(invoiceId: string): Promise<Stripe.Invoice>;
  retrieveCharge(chargeId: string): Promise<Stripe.Charge>;
  constructWebhookEvent(rawBody: Buffer, signature: string, secret: string): Stripe.Event;
}

export class StripeSdkSupporterClient implements StripeSupporterClient {
  private readonly stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-08-26.dahlia',
      appInfo: {
        name: 'Excelsior Supporter',
        version: '1.0.0'
      }
    });
  }

  retrievePrice(priceId: string): Promise<Stripe.Price> {
    return this.stripe.prices.retrieve(priceId);
  }

  createCustomer(idempotencyKey: string): Promise<Stripe.Customer> {
    return this.stripe.customers.create({}, { idempotencyKey });
  }

  createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams,
    idempotencyKey: string
  ): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create(params, { idempotencyKey });
  }

  createPortalSession(
    params: Stripe.BillingPortal.SessionCreateParams
  ): Promise<Stripe.BillingPortal.Session> {
    return this.stripe.billingPortal.sessions.create(params);
  }

  retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product', 'latest_invoice']
    });
  }

  cancelSubscription(subscriptionId: string, idempotencyKey: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.cancel(
      subscriptionId,
      { invoice_now: false, prorate: false },
      { idempotencyKey }
    );
  }

  retrieveInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    return this.stripe.invoices.retrieve(invoiceId);
  }

  retrieveCharge(chargeId: string): Promise<Stripe.Charge> {
    return this.stripe.charges.retrieve(chargeId);
  }

  constructWebhookEvent(rawBody: Buffer, signature: string, secret: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }
}
