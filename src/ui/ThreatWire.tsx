import { useCallback, useEffect, useState } from "react";
import { fetchNews, getEndpoint, setEndpoint } from "../news/providers";
import type { NewsResult } from "../news/types";
import { CollapsiblePanel } from "./radix";

const REFRESH_MS = 5 * 60 * 1000;

export function ThreatWire() {
  const [res, setRes] = useState<NewsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(false);
  const [ep, setEp] = useState(getEndpoint());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRes(await fetchNews(14));
    } catch {
      setRes({ items: [], status: "error", via: "none", note: "Could not load the feed." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const statusLabel =
    loading && !res ? "Loading" : res?.status === "live" ? `Live · ${res.via}` : res?.status === "offline" ? "Offline sample" : "Error";
  const statusTone = res?.status === "live" ? "live" : "off";

  return (
    <CollapsiblePanel
      embedded
      className="wire"
      title="Live Threat Wire"
      sub="real cyber-attack news worldwide"
      right={
        <>
          <span className={`wire-status ${statusTone}`}>{statusLabel}</span>
          <button className="icon-btn wire-btn" onClick={load} aria-label="Refresh feed" disabled={loading}>
            ↻
          </button>
          <button className="icon-btn wire-btn" onClick={() => setSettings((s) => !s)} aria-label="Feed settings">
            ⚙
          </button>
        </>
      }
    >
        {settings && (
          <div className="wire-settings">
            <label className="hint" htmlFor="wire-ep">
              News proxy URL (a Cloudflare Worker — see <code>worker/</code>). Stored only in this browser.
            </label>
            <div className="wire-ep-row">
              <input
                id="wire-ep"
                type="url"
                placeholder="https://chokepoint-news-proxy.you.workers.dev"
                value={ep}
                onChange={(e) => setEp(e.target.value)}
              />
              <button
                className="btn"
                onClick={() => {
                  setEndpoint(ep.trim());
                  setSettings(false);
                  load();
                }}
              >
                Save
              </button>
              <button
                className="btn"
                onClick={() => {
                  setEp("");
                  setEndpoint("");
                  load();
                }}
              >
                Clear
              </button>
            </div>
            <div className="hint">
              No endpoint set → tries keyless GDELT, then an offline sample. No API key is ever
              stored in this app or the repo.
            </div>
          </div>
        )}

        {res?.note && <div className="hint wire-note">{res.note}</div>}

                  <div className="wire-list">
            {(!res || res.items.length === 0) && !loading && (
              <div className="muted" style={{ fontSize: 12 }}>No headlines right now.</div>
            )}
            {res?.items.map((it, i) => (
              <div className="wire-item" key={`${it.url}-${i}`}>
                <span className="wire-dot" />
                <div className="wire-main">
                  {it.url ? (
                    <a href={it.url} target="_blank" rel="noopener noreferrer" className="wire-title">
                      {it.title}
                    </a>
                  ) : (
                    <span className="wire-title">{it.title}</span>
                  )}
                  <div className="wire-meta">
                    <span>{it.source || "unknown source"}</span>
                    {it.country && <span> · {it.country}</span>}
                    <span> · {relTime(it.date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
    </CollapsiblePanel>
  );
}

function relTime(ms: number): string {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 90) return "just now";
  const m = s / 60;
  if (m < 90) return `${Math.round(m)}m ago`;
  const h = m / 60;
  if (h < 36) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
