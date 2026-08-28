// Reverb valuation proxy (AWS Lambda–style handler).
//
// Holds the Reverb personal access token server-side (NEVER ship it in the app)
// and turns active Reverb listings into a low/median/high value range. Deploy as
// a Lambda behind API Gateway, or an Amplify/Expo API function, then point the
// app at it via EXPO_PUBLIC_VALUATION_URL (see utils/valuation.js).
//
// Env:
//   REVERB_TOKEN  — a Reverb personal access token with the 'public' scope.
//
// Request:  GET /?type=Guitar&brand=Fender&model=Stratocaster&year=2015
// Response: { currency, low, median, high, count, source, asOf, query, estimated }

const REVERB_LISTINGS = 'https://api.reverb.com/api/listings';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Content-Type': 'application/json',
};

function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return null;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.floor((p / 100) * sortedAsc.length)));
  return sortedAsc[idx];
}

exports.handler = async (event = {}) => {
  if ((event.requestContext?.http?.method || event.httpMethod) === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  const q = event.queryStringParameters || {};
  const { brand, model, year } = q;

  if (!brand || !model) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'brand and model are required' }) };
  }
  if (!process.env.REVERB_TOKEN) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'REVERB_TOKEN not configured' }) };
  }

  const query = [brand, model, year].filter(Boolean).join(' ');
  const url = `${REVERB_LISTINGS}?query=${encodeURIComponent(query)}&per_page=50`;

  try {
    const resp = await fetch(url, {
      headers: {
        'Accept-Version': '3.0',
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.REVERB_TOKEN}`,
      },
    });
    if (!resp.ok) throw new Error(`Reverb API returned ${resp.status}`);
    const data = await resp.json();
    const listings = data.listings || [];

    const prices = listings
      .map((l) => parseFloat(l?.price?.amount))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);

    const currency = listings[0]?.price?.currency || 'USD';
    const average = prices.length
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : null;
    const body = {
      currency,
      low: prices.length ? Math.round(percentile(prices, 10)) : null,
      median: prices.length ? Math.round(percentile(prices, 50)) : null,
      average,
      high: prices.length ? Math.round(percentile(prices, 90)) : null,
      count: prices.length,
      source: 'Reverb (active listings)',
      asOf: new Date().toISOString(),
      query,
      estimated: true,
    };
    return { statusCode: 200, headers: CORS, body: JSON.stringify(body) };
  } catch (e) {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
