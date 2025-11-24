const PAYPAL_BASE =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
const PAYPAL_BRAND_NAME = 'Cetcor AI';

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error('PAYPAL_CLIENT_ID 或 PAYPAL_CLIENT_SECRET 未配置');
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('PayPal auth failed:', text);
    throw new Error('获取 PayPal Access Token 失败');
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

interface SubscriptionOptions {
  subscriberEmail?: string | null;
  subscriberName?: {
    given_name?: string;
    surname?: string;
  };
}

type PayPalLink = { href: string; rel: string; method: string };

type PayPalSubscriptionResponse = {
  id: string;
  status: string;
  links?: PayPalLink[];
};

type PayPalErrorResponse = {
  name?: string;
  message?: string;
  details?: unknown;
  debug_id?: string;
};

export async function createPaypalSubscription(
  paypalPlanId: string,
  returnUrl: string,
  cancelUrl: string,
  options?: SubscriptionOptions
) {
  const token = await getAccessToken();

  const paypalResponse = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: paypalPlanId,
      subscriber: options?.subscriberEmail
        ? {
            email_address: options.subscriberEmail,
            name: options?.subscriberName,
          }
        : undefined,
      application_context: {
        brand_name: PAYPAL_BRAND_NAME,
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });

  console.log('=== PayPal API 响应详情 ===');
  console.log('HTTP状态码:', paypalResponse.status);
  console.log('HTTP状态文本:', paypalResponse.statusText);

  const responseText = await paypalResponse.text();
  console.log('原始响应文本:', responseText);

  let json: PayPalSubscriptionResponse | PayPalErrorResponse | null = null;
  try {
    json = JSON.parse(responseText);
    console.log('解析后的JSON响应:', JSON.stringify(json, null, 2));
  } catch {
    console.log('响应不是有效的JSON:', responseText);
  }

  if (!paypalResponse.ok) {
    console.error('=== PayPal API 调用失败 ===');
    console.error('错误状态:', paypalResponse.status);
    console.error('错误响应:', json || responseText);

    if (json && 'name' in json) {
      console.error('PayPal错误名称:', json.name);
      console.error('PayPal错误信息:', json.message);
      console.error('PayPal错误详情:', json.details);
      console.error('PayPal调试ID:', json.debug_id);
    }

    throw new Error('创建 PayPal 订阅失败');
  }

  if (!json || !('id' in json)) {
    throw new Error('PayPal 返回的响应不是合法 JSON');
  }

  return json;
}

interface OrderOptions {
  payerEmail?: string | null;
}

export async function createPaypalOrder(
  amount: string,
  currency: string,
  returnUrl: string,
  cancelUrl: string,
  options?: OrderOptions
) {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount,
          },
        },
      ],
      payer: options?.payerEmail
        ? {
            email_address: options.payerEmail,
          }
        : undefined,
      application_context: {
        brand_name: PAYPAL_BRAND_NAME,
        landing_page: 'BILLING',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error('Create PayPal order failed:', json);
    throw new Error('创建 PayPal 订单失败');
  }

  return json as {
    id: string;
    status: string;
    links?: { href: string; rel: string; method: string }[];
  };
}

export async function capturePaypalOrder(orderId: string) {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();

  if (!res.ok) {
    console.error('Capture PayPal order failed:', json);
    throw new Error('捕获 PayPal 订单失败');
  }

  return json;
}

export async function getPaypalSubscriptionDetails(subscriptionId: string) {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();

  if (!res.ok) {
    console.error('Fetch PayPal subscription failed:', json);
    throw new Error('获取 PayPal 订阅详情失败');
  }

  return json as { id: string; status: string; plan_id?: string };
}

export async function getPaypalOrderDetails(orderId: string) {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();

  if (!res.ok) {
    console.error('Fetch PayPal order failed:', json);
    throw new Error('获取 PayPal 订单详情失败');
  }

  return json as {
    id: string;
    status: string;
    purchase_units?: Array<{
      amount?: {
        value?: string;
        currency_code?: string;
      };
    }>;
  };
}

/**
 * 调用 PayPal 的 Webhook 签名验证接口，验证本次回调是否合法
 */
export async function verifyPaypalWebhookSignature(params: {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookId: string;
  rawBody: string;
}): Promise<boolean> {
  const {
    transmissionId,
    transmissionTime,
    certUrl,
    authAlgo,
    transmissionSig,
    webhookId,
    rawBody,
  } = params;

  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });

  const json = (await res.json()) as { verification_status?: string };

  if (!res.ok) {
    console.error('Verify PayPal webhook signature failed:', json);
    throw new Error('验证 PayPal Webhook 签名失败');
  }

  return json.verification_status === 'SUCCESS';
}


