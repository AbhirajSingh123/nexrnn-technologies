// Set this URL in Cashfree Dashboard → Developers → Webhooks:
//   https://<your-project-ref>.supabase.co/functions/v1/cashfree-webhook
// Must be deployed with "Verify JWT" turned OFF, since Cashfree's servers call
// this directly with no Supabase auth header.
//
// This file is self-contained (no imports from a shared folder) so it can be
// pasted directly into the Supabase Dashboard's "Create new edge function" editor.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifySignature(rawBody: string, timestamp: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp + rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  return computed === signature;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') ?? '';
    const timestamp = req.headers.get('x-webhook-timestamp') ?? '';
    const secret = Deno.env.get('CASHFREE_WEBHOOK_SECRET') ?? '';

    // If a webhook secret is configured, reject anything that doesn't verify —
    // this stops anyone from faking a "payment successful" call to this URL.
    if (secret) {
      const valid = await verifySignature(rawBody, timestamp, signature, secret);
      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid signature.' }), { status: 401, headers: corsHeaders });
      }
    }

    const payload = JSON.parse(rawBody);
    const orderId = payload?.data?.order?.order_id;
    const paymentStatus = payload?.data?.payment?.payment_status; // SUCCESS | FAILED | ...
    const cfPaymentId = payload?.data?.payment?.cf_payment_id;
    const paymentMethod = payload?.data?.payment?.payment_group;

    if (!orderId) {
      return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const status = paymentStatus === 'SUCCESS' ? 'paid' : paymentStatus === 'FAILED' ? 'failed' : 'pending';

    await supabase
      .from('payments')
      .update({
        status,
        cf_payment_id: String(cfPaymentId ?? ''),
        payment_method: paymentMethod ?? '',
        raw_response: payload,
      })
      .eq('cashfree_order_id', orderId);

    const { data: lead } = await supabase
      .from('leads_course')
      .select('*')
      .eq('cashfree_order_id', orderId)
      .maybeSingle();

    if (lead) {
      const updates: Record<string, unknown> = {
        payment_status: status === 'paid' ? 'paid' : lead.payment_status,
      };
      if (status === 'paid' && ['pending', 'on_call'].includes(lead.enrollment_status)) {
        updates.enrollment_status = 'payment_received';
      }
      await supabase.from('leads_course').update(updates).eq('id', lead.id);
    }

    return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
