"use client";

import { useEffect, useState } from "react";

const EMPTY_TRACKING_SUMMARY = {
  totalVisits: 0,
  uniqueVisitors: 0,
  pageViews: 0,
  conversions: 0,
  avgSession: "00:00",
  bounceRate: 0,
  recentActivity: [{ label: "Loading analytics...", type: "page", time: "Please wait" }],
  topPages: [],
  trafficSources: [],
};

export default function AdminAnalyticsPage() {
  const [trackingData, setTrackingData] = useState(EMPTY_TRACKING_SUMMARY);
  const [trackingStatus, setTrackingStatus] = useState("loading");

  useEffect(() => {
    const loadTrackingData = async () => {
      try {
        setTrackingStatus("loading");
        const response = await fetch("/api/admin/analytics");
        const result = await response.json();

        if (!response.ok || !result.success || !result.data) {
          setTrackingData(result?.data || EMPTY_TRACKING_SUMMARY);
          setTrackingStatus(result?.configured === false ? "not-configured" : "error");
          return;
        }

        setTrackingData(result.data);
        setTrackingStatus("ready");
      } catch (error) {
        console.error("Live tracking fetch failed:", error);
        setTrackingData(EMPTY_TRACKING_SUMMARY);
        setTrackingStatus("error");
      }
    };

    void loadTrackingData();
    const intervalId = setInterval(() => {
      void loadTrackingData();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-xl border border-orange-100 bg-linear-to-br from-orange-50 via-white to-orange-100 p-4 shadow-sm sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 sm:text-sm">
              Website tracking data
            </p>
            <h2 className="mt-2 text-xl font-bold text-orange-800 sm:text-2xl">
              Visitor insights overview
            </h2>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 self-start rounded-full border px-2 py-1 text-[9px] font-semibold tracking-wide sm:text-xs ${
              trackingStatus === "not-configured"
                ? "border-red-200 bg-red-50 text-red-600"
                : trackingStatus === "error"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-orange-200 bg-white text-orange-700"
            }`}
          >
            <span
              className={`inline-flex h-1.5 w-1.5 rounded-full animate-pulse ${
                trackingStatus === "not-configured"
                  ? "bg-red-500"
                  : trackingStatus === "error"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
            />
            <span>
              {trackingStatus === "ready"
                ? "Live data sync"
                : trackingStatus === "not-configured"
                  ? "Setup required"
                  : trackingStatus === "error"
                    ? "Refresh data"
                    : "Loading data"}
            </span>
          </div>
        </div>

        {trackingStatus === "not-configured" && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Add VERCEL_TOKEN and VERCEL_PROJECT_ID in the deployment environment to pull live analytics into this dashboard.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
          {[
            { label: "Total visits", value: trackingData.totalVisits.toLocaleString(), accent: "bg-orange-600" },
            { label: "Unique visitors", value: trackingData.uniqueVisitors.toLocaleString(), accent: "bg-amber-500" },
            { label: "Page views", value: trackingData.pageViews.toLocaleString(), accent: "bg-yellow-500" },
            { label: "Conversions", value: trackingData.conversions.toLocaleString(), accent: "bg-emerald-500" },
            { label: "Avg. session", value: trackingData.avgSession, accent: "bg-cyan-500" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-orange-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-xl sm:p-4">
              <div className={`mb-2 h-1.5 w-10 rounded-full sm:mb-3 sm:h-2 sm:w-12 ${item.accent}`} />
              <p className="text-xs text-gray-500 sm:text-sm">{item.label}</p>
              <p className="mt-1.5 text-lg font-bold text-gray-900 sm:mt-2 sm:text-xl lg:text-2xl">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-orange-100 bg-white p-3 shadow-sm sm:rounded-xl sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-gray-800 sm:text-lg">Recent activity</h3>
              <span className="text-[10px] font-medium text-gray-500 sm:text-xs">Last 24 hours</span>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {trackingData.recentActivity.map((activity, index) => (
                <div key={`${activity.label}-${index}`} className="flex items-center justify-between gap-2 rounded-md bg-orange-50 px-2.5 py-2 sm:rounded-lg sm:px-3 sm:py-2.5">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={`inline-flex h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${activity.type === "action" ? "bg-emerald-500" : "bg-orange-500"}`} />
                    <span className="text-xs font-medium text-gray-700 sm:text-sm">{activity.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 sm:text-xs">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-orange-100 bg-white p-3 shadow-sm sm:rounded-xl sm:p-4">
            <h3 className="text-base font-semibold text-gray-800 sm:text-lg">Engagement</h3>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm text-gray-600">
                  <span>Bounce rate</span>
                  <span className="font-semibold text-gray-800">{trackingData.bounceRate}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-orange-100">
                  <div className="h-full rounded-full bg-orange-600" style={{ width: `${trackingData.bounceRate}%` }} />
                </div>
              </div>

              <div className="rounded-lg bg-linear-to-r from-orange-100 to-amber-100 p-3">
                <p className="text-sm text-gray-600">Top pages</p>
                <div className="mt-3 space-y-2">
                  {trackingData.topPages.length > 0 ? (
                    trackingData.topPages.map((page) => (
                      <div key={page.label}>
                        <div className="mb-1 flex items-center justify-between text-xs text-gray-700">
                          <span>{page.label}</span>
                          <span>{page.value}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/70">
                          <div className="h-full rounded-full bg-orange-500" style={{ width: `${page.value}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No page stats yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-linear-to-r from-emerald-100 to-green-100 p-3">
                <p className="text-sm text-gray-600">Traffic sources</p>
                <div className="mt-3 space-y-2">
                  {trackingData.trafficSources.length > 0 ? (
                    trackingData.trafficSources.map((source) => (
                      <div key={source.label}>
                        <div className="mb-1 flex items-center justify-between text-xs text-gray-700">
                          <span>{source.label}</span>
                          <span>{source.value}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/70">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${source.value}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No traffic sources yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
