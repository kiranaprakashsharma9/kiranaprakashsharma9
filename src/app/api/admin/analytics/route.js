import { NextResponse } from "next/server";

const DEFAULT_DATA = {
  totalVisits: 0,
  uniqueVisitors: 0,
  pageViews: 0,
  conversions: 0,
  avgSession: "00:00",
  bounceRate: 0,
  recentActivity: [{ label: "No traffic yet", type: "page", time: "Waiting for data" }],
  topPages: [],
  trafficSources: [],
};

function buildAnalyticsUrl(path, params) {
  const url = new URL(`https://api.vercel.com/v1/query/web-analytics/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

function toNumber(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

async function fetchVercelAnalytics(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vercel Analytics request failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

function normalizeTopPages(rows = []) {
  return rows
    .slice(0, 4)
    .map((row) => {
      const path = row?.requestPath || row?.route || "/";
      const views = toNumber(row?.pageviews ?? row?.count ?? 0);
      return {
        label: path === "/" ? "Home" : path.replace(/^\/+|\/+$/g, "") || "Home",
        value: views,
      };
    })
    .filter((item) => item.label);
}

function normalizeTrafficSources(rows = []) {
  return rows
    .slice(0, 4)
    .map((row) => {
      const label = row?.referrerHostname || row?.country || row?.deviceType || "Direct";
      const value = toNumber(row?.pageviews ?? row?.count ?? 0);
      return { label, value };
    })
    .filter((item) => item.label);
}

async function getAnalyticsData() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID || process.env.PROJECT_ID || process.env.NEXT_PUBLIC_VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID || process.env.VERCEL_TEAM_SLUG;

  if (!token || !projectId) {
    return {
      configured: false,
      message: "Set VERCEL_TOKEN and VERCEL_PROJECT_ID in your environment to enable live tracking.",
      data: DEFAULT_DATA,
    };
  }

  const today = new Date();
  const since = new Date(today);
  since.setDate(today.getDate() - 30);

  const visitsCountParams = {
    projectId,
    teamId,
    since: since.toISOString().slice(0, 10),
    until: today.toISOString().slice(0, 10),
  };

  const topPagesParams = {
    projectId,
    teamId,
    since: since.toISOString().slice(0, 10),
    until: today.toISOString().slice(0, 10),
    by: "requestPath",
    limit: 5,
  };

  const sourcesParams = {
    projectId,
    teamId,
    since: since.toISOString().slice(0, 10),
    until: today.toISOString().slice(0, 10),
    by: "referrerHostname",
    limit: 5,
  };

  const [visitCountResult, pageAggregateResult, sourcesResult, eventCountResult] = await Promise.all([
    fetchVercelAnalytics(buildAnalyticsUrl("visits/count", visitsCountParams), token),
    fetchVercelAnalytics(buildAnalyticsUrl("visits/aggregate", topPagesParams), token),
    fetchVercelAnalytics(buildAnalyticsUrl("visits/aggregate", sourcesParams), token),
    fetchVercelAnalytics(buildAnalyticsUrl("events/count", { ...visitsCountParams, filter: "eventName ne ''" }), token).catch(() => ({ data: { count: 0 } })),
  ]);

  const totalPageviews = toNumber(visitCountResult?.data?.pageviews);
  const uniqueVisitors = toNumber(visitCountResult?.data?.visitors);
  const conversions = toNumber(eventCountResult?.data?.count ?? eventCountResult?.data?.visitors ?? 0);
  const topPages = normalizeTopPages(pageAggregateResult?.data ?? []);
  const trafficSources = normalizeTrafficSources(sourcesResult?.data ?? []);

  const activity = topPages.length
    ? topPages.map((page) => ({
        label: `${page.label} page viewed`,
        type: "page",
        time: `${page.value.toLocaleString()} views`,
      }))
    : [{ label: "No traffic yet", type: "page", time: "Waiting for data" }];

  return {
    configured: true,
    data: {
      totalVisits: totalPageviews,
      uniqueVisitors,
      pageViews: totalPageviews,
      conversions,
      avgSession: "00:00",
      bounceRate: 0,
      recentActivity: activity,
      topPages: topPages.map((page) => ({ label: page.label, value: Math.min(100, Math.max(10, Math.round((page.value / Math.max(totalPageviews, 1)) * 100))) })),
      trafficSources: trafficSources.map((source) => ({
        label: source.label,
        value: Math.min(100, Math.max(10, Math.round((source.value / Math.max(totalPageviews, 1)) * 100))),
      })),
    },
  };
}

export async function GET() {
  try {
    const result = await getAnalyticsData();

    if (!result.configured) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: result.message,
        data: result.data,
      });
    }

    return NextResponse.json({
      success: true,
      configured: true,
      data: result.data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        configured: true,
        message: "Failed to load live analytics data.",
        error: error.message,
        data: DEFAULT_DATA,
      },
      { status: 500 }
    );
  }
}
