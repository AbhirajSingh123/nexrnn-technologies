// Called from the enrollment-payment-status page after Cashfree redirects the
// user back. Always re-checks status directly with Cashfree's server — never
// trusts the redirect alone, since that URL is fully visible/editable by the user.
//
// This file is self-contained (no imports from a shared folder) so it can be
// pasted directly into the Supabase Dashboard's "Create new edge function" editor.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getCashfreeBaseUrl(): string {
  const env = Deno.env.get('CASHFREE_ENV') ?? 'sandbox';
  return env === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
}

function cashfreeHeaders(): HeadersInit {
  return {
    'x-client-id': Deno.env.get('CASHFREE_CLIENT_ID') ?? '',
    'x-client-secret': Deno.env.get('CASHFREE_CLIENT_SECRET') ?? '',
    'x-api-version': '2023-08-01',
    'Content-Type': 'application/json',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const cfResponse = await fetch(`${getCashfreeBaseUrl()}/orders/${orderId}`, {
      headers: cashfreeHeaders(),
    });
    const order = await cfResponse.json();

    if (!cfResponse.ok) {
      return new Response(JSON.stringify({ error: order.message || 'Order not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let status = 'pending';
    let cfPaymentId = '';
    let paymentMethod = '';

    if (order.order_status === 'PAID') {
      status = 'paid';
      const paymentsRes = await fetch(`${getCashfreeBaseUrl()}/orders/${orderId}/payments`, {
        headers: cashfreeHeaders(),
      });
      const paymentsData = await paymentsRes.json();
      const successPayment = Array.isArray(paymentsData)
        ? paymentsData.find((p: { payment_status: string }) => p.payment_status === 'SUCCESS')
        : null;
      if (successPayment) {
        cfPaymentId = String(successPayment.cf_payment_id ?? '');
        paymentMethod = successPayment.payment_group ?? '';
      }
    } else if (['EXPIRED', 'TERMINATED', 'TERMINATION_REQUESTED'].includes(order.order_status)) {
      status = 'failed';
    }

    const { data: paymentRow } = await supabase
      .from('payments')
      .select('*')
      .eq('cashfree_order_id', orderId)
      .maybeSingle();

    await supabase
      .from('payments')
      .update({ status, cf_payment_id: cfPaymentId, payment_method: paymentMethod, raw_response: order })
      .eq('cashfree_order_id', orderId);

    const leadType = paymentRow?.lead_type === 'workshop' ? 'workshop' : 'course';
    const leadTable = leadType === 'workshop' ? 'leads_workshop' : 'leads_course';
    const itemTable = leadType === 'workshop' ? 'workshops' : 'courses';
    const slugColumn = leadType === 'workshop' ? 'workshop_slug' : 'course_slug';
    const titleColumn = leadType === 'workshop' ? 'workshop_title' : 'course_title';

    const { data: lead } = await supabase
      .from(leadTable)
      .select('*')
      .eq('cashfree_order_id', orderId)
      .maybeSingle();

    let whatsappGroupLink = '';

    if (lead) {
      const updates: Record<string, unknown> = {
        payment_status: status === 'paid' ? 'paid' : 'unpaid',
      };
      if (status === 'paid' && ['pending', 'on_call'].includes(lead.enrollment_status)) {
        updates.enrollment_status = 'payment_received';
      }
      await supabase.from(leadTable).update(updates).eq('id', lead.id);

      const { data: item } = await supabase
        .from(itemTable)
        .select('whatsapp_group_link')
        .eq('slug', lead[slugColumn])
        .maybeSingle();
      whatsappGroupLink = item?.whatsapp_group_link ?? '';
    }

    return new Response(
      JSON.stringify({
        status,
        orderId,
        leadType,
        itemTitle: lead?.[titleColumn] ?? '',
        studentName: lead?.name ?? '',
        whatsappGroupLink,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
