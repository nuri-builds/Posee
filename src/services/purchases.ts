import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import type { Entitlement } from '../state/store';

/**
 * In-app purchases through RevenueCat, a wrapper over StoreKit and Google Play
 * Billing.
 *
 * Why this is safe:
 *  - Payment runs entirely in Apple's or Google's native sheet. Posee never
 *    sees card or UPI details.
 *  - Receipts are validated by the store and RevenueCat on the server, not
 *    trusted from the client.
 *  - Cancel and refund are handled by the store, and the paywall links to them.
 *
 * Store setup (App Store Connect and Play Console), then map in RevenueCat:
 *  - posee_monthly_149   Auto-renewing monthly subscription, ₹149, with a
 *                        7-day free-trial introductory offer. Entitlement "pro".
 *  - posee_weekend_49    Weekend pass, ₹49. Create it as a consumable (or a
 *                        non-renewing subscription on iOS). It gives 72 hours
 *                        of Pro, worked out from the purchase date below.
 *  Offering "default" with packages: $rc_monthly and a custom "weekend".
 */

export const ENTITLEMENT_ID = 'pro';
export const PRODUCT_MONTHLY = 'posee_monthly_149';
export const PRODUCT_WEEKEND = 'posee_weekend_49';
export const WEEKEND_PASS_HOURS = 72;

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
});

/** With no API key in a dev build, a local mock runs so the paywall UI can be tested. */
export const MOCK_MODE = __DEV__ && !API_KEY;

export type Plan = {
  id: 'monthly' | 'weekend';
  title: string;
  priceString: string;
  subtitle: string;
  hasFreeTrial: boolean;
  pkg?: PurchasesPackage;
};

const FALLBACK_PLANS: Plan[] = [
  { id: 'monthly', title: 'Posee Pro Monthly', priceString: '₹149/month', subtitle: '7 days free, then ₹149/month. Cancel anytime.', hasFreeTrial: true },
  { id: 'weekend', title: 'Weekend Pass', priceString: '₹49', subtitle: '72 hours of everything. Perfect for one wedding or trip. No renewal.', hasFreeTrial: false },
];

let configured = false;

export function initPurchases(): void {
  if (configured || MOCK_MODE || !API_KEY) return;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
  // Anonymous app user ID: no email, phone, or name is sent to RevenueCat.
  Purchases.configure({ apiKey: API_KEY });
  configured = true;
}

export function entitlementFromCustomerInfo(info: CustomerInfo, now = Date.now()): Entitlement {
  const pro = info.entitlements.active[ENTITLEMENT_ID];
  if (pro && pro.productIdentifier === PRODUCT_MONTHLY) {
    return { tier: pro.periodType === 'TRIAL' ? 'trial' : 'monthly', expiresAt: pro.expirationDate };
  }
  const latestWeekend = info.nonSubscriptionTransactions
    .filter((t) => t.productIdentifier === PRODUCT_WEEKEND)
    .map((t) => new Date(t.purchaseDate).getTime() + WEEKEND_PASS_HOURS * 3_600_000)
    .sort((a, b) => b - a)[0];
  if (latestWeekend && latestWeekend > now) {
    return { tier: 'weekend', expiresAt: new Date(latestWeekend).toISOString() };
  }
  return { tier: 'free', expiresAt: null };
}

export async function fetchPlans(): Promise<Plan[]> {
  if (!configured) return FALLBACK_PLANS;
  try {
    const offering = (await Purchases.getOfferings()).current;
    if (!offering) return FALLBACK_PLANS;
    const monthly = offering.monthly ?? offering.availablePackages.find((p) => p.product.identifier === PRODUCT_MONTHLY);
    const weekend = offering.availablePackages.find((p) => p.product.identifier === PRODUCT_WEEKEND);
    return FALLBACK_PLANS.map((plan) => {
      const pkg = plan.id === 'monthly' ? monthly : weekend;
      if (!pkg) return plan;
      return {
        ...plan,
        pkg,
        priceString: plan.id === 'monthly' ? `${pkg.product.priceString}/month` : pkg.product.priceString,
        hasFreeTrial: plan.id === 'monthly' && pkg.product.introPrice?.price === 0,
        subtitle:
          plan.id === 'monthly'
            ? pkg.product.introPrice?.price === 0
              ? `7 days free, then ${pkg.product.priceString}/month. Cancel anytime.`
              : `${pkg.product.priceString}/month. Cancel anytime.`
            : plan.subtitle,
      };
    });
  } catch {
    return FALLBACK_PLANS;
  }
}

export type PurchaseOutcome =
  | { status: 'success'; entitlement: Entitlement }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export async function purchase(plan: Plan): Promise<PurchaseOutcome> {
  if (MOCK_MODE) {
    const hours = plan.id === 'weekend' ? WEEKEND_PASS_HOURS : 24 * 7;
    return {
      status: 'success',
      entitlement: { tier: plan.id === 'weekend' ? 'weekend' : 'trial', expiresAt: new Date(Date.now() + hours * 3_600_000).toISOString() },
    };
  }
  if (!plan.pkg) return { status: 'error', message: 'This plan is not available right now. Please try again later.' };
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    return { status: 'success', entitlement: entitlementFromCustomerInfo(customerInfo) };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; code?: string; message?: string };
    if (err.userCancelled || err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return { status: 'cancelled' };
    if (err.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
      return { status: 'error', message: 'Payment is pending. Pro unlocks automatically once it completes.' };
    }
    return { status: 'error', message: err.message ?? 'Purchase failed. You have not been charged.' };
  }
}

export async function restore(): Promise<Entitlement | null> {
  if (!configured) return null;
  return entitlementFromCustomerInfo(await Purchases.restorePurchases());
}

export async function refreshEntitlement(): Promise<Entitlement | null> {
  if (!configured) return null;
  try {
    return entitlementFromCustomerInfo(await Purchases.getCustomerInfo());
  } catch {
    return null; // Offline: keep the cached entitlement.
  }
}

export function onEntitlementChange(cb: (e: Entitlement) => void): () => void {
  if (!configured) return () => {};
  const listener = (info: CustomerInfo) => cb(entitlementFromCustomerInfo(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}
