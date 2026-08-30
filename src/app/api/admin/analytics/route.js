import { NextResponse } from "next/server";
import { google } from "googleapis";

const toNumber = (value) => Number(value ?? 0);

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, toNumber(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = Math.floor(safeSeconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatPageLabel(pagePath) {
  if (!pagePath || pagePath === "/") return "Home";
  return pagePath.replace(/^\/+|\/+$/g, "") || "Home";
}

async function getGoogleAnalyticsSummary() {
  const propertyId = process.env.GA_PROPERTY_ID;
  const serviceAccountEmail = process.env.GA_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!propertyId || !serviceAccountEmail || !privateKey) {
    return {
      configured: false,
      message: "Google Analytics service account is not configured yet.",
      data: {
        totalVisits: 0,
        uniqueVisitors: 0,
        pageViews: 0,
        conversions: 0,
        avgSession: "00:00",
        bounceRate: 0,
        recentActivity: [],
      },
    };
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });

  const analytics = google.analyticsdata({ version: "v1beta", auth });

  const summaryResponse = await analytics.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
        { name: "eventCount" },
      ],
    },
  });

  const pageResponse = await analytics.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ desc: true, metric: { metricName: "screenPageViews" } }],
      limit: 5,
    },
  });

  const summaryRow = summaryResponse.data.rows?.[0];
  const summaryValues = summaryRow?.metricValues || [];
  const metricMap = {};

  (summaryResponse.data.metricHeaders || []).forEach((header, index) => {
    metricMap[header.name] = summaryValues[index]?.value || "0";
  });

  const topPages = (pageResponse.data.rows || []).slice(0, 5).map((row) => {
    const dimensionValue = row.dimensionValues?.[0]?.value || "/";
    const metricValue = row.metricValues?.[0]?.value || "0";

    return {
      label: formatPageLabel(dimensionValue),
      type: "page",
      time: `${toNumber(metricValue).toLocaleString()} views`,
    };
  });

  return {
    configured: true,
    data: {
      totalVisits: toNumber(metricMap.sessions),
      uniqueVisitors: toNumber(metricMap.activeUsers),
      pageViews: toNumber(metricMap.screenPageViews),
      conversions: toNumber(metricMap.eventCount),
      avgSession: formatDuration(metricMap.averageSessionDuration),
      bounceRate: Math.round(toNumber(metricMap.bounceRate)),
      recentActivity: topPages.length ? topPages : [{ label: "Home", type: "page", time: "No data yet" }],
    },
  };
}

export async function GET() {
  try {
    const result = await getGoogleAnalyticsSummary();

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
    console.error("GA analytics error:", error);

    return NextResponse.json(
      {
        success: false,
        configured: true,
        message: "Failed to load stats from Google Analytics.",
        error: error.message,
        data: {
          totalVisits: 0,
          uniqueVisitors: 0,
          pageViews: 0,
          conversions: 0,
          avgSession: "00:00",
          bounceRate: 0,
          recentActivity: [],
        },
      },
      { status: 500 },
    );
  }
}
