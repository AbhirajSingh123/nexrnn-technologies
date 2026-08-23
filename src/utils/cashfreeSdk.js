let sdkPromise = null;

function loadCashfreeSdk() {
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve(window.Cashfree);
    script.onerror = () => reject(new Error('Failed to load the payment SDK. Check your connection and try again.'));
    document.body.appendChild(script);
  });
  return sdkPromise;
}

// Redirects the browser to Cashfree's hosted checkout page for the given session.
export async function startCashfreeCheckout(paymentSessionId) {
  const CashfreeCtor = await loadCashfreeSdk();
  const cashfree = CashfreeCtor({ mode: import.meta.env.VITE_CASHFREE_MODE || 'sandbox' });
  cashfree.checkout({
    paymentSessionId,
    redirectTarget: '_self',
  });
}
