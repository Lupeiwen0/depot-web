import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

export const STRIPE_CONFIG = {
  currency: "hkd",
  paymentMethods: ["card"],
  billingAddressCollection: "auto" as const,
  shippingAddressCollection: {
    allowedCountries: [
      "HK",
      "CN",
      "TW",
      "MO",
    ] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
  },
};
