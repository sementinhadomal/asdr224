import { useState } from 'react';
import { Activity, ArrowUpRight, Eye, Info, MousePointer2, RefreshCw, Users } from 'lucide-react';
import type { ShopifyAnalyticsDashboard, ShopifyAnalyticsMetric } from '@workspace/api-client-react';
import { useAnalyticsDashboard } from '@/hooks/use-analytics-data';
import { Unauthorized } from '@/components/unauthorized';

const format = new Intl.NumberFormat('en-GB');
const windows = [7, 30, 90] as const;

function ago(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Unknown';
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

function Metric({ title, value, foot, icon: Icon, testId, loading }: { title: string; value: string; foot: string; icon: typeof Users; testId: string; loading: boolean }) {
  return <div className="analytics-metric">
    <div className="analytics-metric-top"><span>{title}</span><Icon size={17} strokeWidth={1.7}/></div>
    <div className="analytics-metric-value" data-testid={testId}>{loading ? <Skeleton className="skeleton-number"/> : value}</div>
    <div className="analytics-metric-foot">{foot}</div>
  </div>;
}

function Ranking({ heading, kicker, data, testPrefix, className = '' }: { heading: string; kicker: string; data: ShopifyAnalyticsMetric[] | undefined; testPrefix: string; className?: string }) {
  const max = Math.max(...(data ?? []).map((item) => item.value), 1);
  return <section className={`analytics-panel ${className}`} data-testid={`section-${testPrefix}`}>
    <div className="analytics-panel-head"><div><div className="section-kicker">{kicker}</div><h2>{heading}<span className="heading-period">.</span></h2></div><ArrowUpRight size={17} color="#9a9c9b"/></div>
    {data?.length ? <div className="analytics-list">{data.map((item, index) => <div className="analytics-list-row" key={`${item.label}-${index}`} data-testid={`row-${testPrefix}-${index}`}><div className="analytics-list-line"><span data-testid={`text-${testPrefix}-label-${index}`}>{item.label || 'Direct / unknown'}</span><b data-testid={`text-${testPrefix}-value-${index}`}>{format.format(item.value)}</b></div><div className="analytics-track"><span style={{ transform: `scaleX(${Math.max(0, Math.min(item.value / max, 1))})` }} /></div></div>)}</div> : <div className="analytics-empty" data-testid={`status-${testPrefix}-empty`}><strong>Nothing to rank yet.</strong>Pages and sources will appear as consented visits arrive.</div>}
  </section>;
}

export default function AnalyticsReport() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const query = useAnalyticsDashboard(days);
  if (query.error?.status === 403) return <Unauthorized />;
  const data: ShopifyAnalyticsDashboard | undefined = query.data;
  const loading = query.isLoading;
  const unavailable = query.isError && !data;
  const rate = data ? `${data.checkoutStartRate.toLocaleString('en-GB', { maximumFractionDigits: 1 })}%` : '—';
  const maxFunnel = Math.max(...(data?.funnel ?? []).map((item) => item.sessions), 1);

  return <div data-testid="section-analytics-dashboard">
    <div className="page-heading analytics-heading"><div><div className="eyebrow"><span className="eyebrow-square"/> SHOPIFY / AUDIENCE SIGNAL</div><h1>Traffic & funnel<span className="heading-period">.</span></h1><p className="page-subtitle">The path from first visit to checkout intent, without mistaking intent for a sale.</p></div><div className="analytics-controls"><div className="range-control" role="group" aria-label="Analytics date range" data-testid="control-analytics-days">{windows.map((windowDays) => <button key={windowDays} type="button" aria-pressed={days === windowDays} onClick={() => setDays(windowDays)} data-testid={`button-analytics-days-${windowDays}`}>{windowDays}D</button>)}</div><button className="btn btn-outline" type="button" onClick={() => void query.refetch()} disabled={query.isFetching} data-testid="button-refresh-analytics"><RefreshCw size={15} className={query.isFetching ? 'spin-once' : ''}/> Refresh</button></div></div>

    <div className="analytics-note" data-testid="status-analytics-disclaimer"><Info size={18}/><div><strong>Anonymous, consent-aware tracking.</strong> Only eligible visitor activity is included. Checkout starts are clicks toward Shopify, not confirmed purchases; orders and payments are not verified here.</div></div>
    {unavailable && <div className="inline-error analytics-error" role="alert" data-testid="status-analytics-error"><span>Analytics could not be loaded. Your selected range is saved.</span><button type="button" onClick={() => void query.refetch()} data-testid="button-retry-analytics">Try again <ArrowUpRight size={14}/></button></div>}
    <section className="analytics-metrics" aria-label="Analytics overview" data-testid="section-analytics-metrics">
      <Metric title="LIVE VISITORS" value={data ? format.format(data.liveVisitors) : '—'} foot="Active on site now" icon={Activity} testId="text-analytics-live-visitors" loading={loading}/>
      <Metric title="SESSIONS" value={data ? format.format(data.sessions) : '—'} foot={`Last ${days} days`} icon={Users} testId="text-analytics-sessions" loading={loading}/>
      <Metric title="PAGE VIEWS" value={data ? format.format(data.pageViews) : '—'} foot="Tracked page visits" icon={Eye} testId="text-analytics-page-views" loading={loading}/>
      <Metric title="CHECKOUT STARTS" value={data ? format.format(data.checkoutStarts) : '—'} foot="Clicks, not orders" icon={MousePointer2} testId="text-analytics-checkout-starts" loading={loading}/>
      <Metric title="START RATE" value={rate} foot="Sessions reaching checkout" icon={ArrowUpRight} testId="text-analytics-checkout-start-rate" loading={loading}/>
    </section>

    <div className="analytics-grid">
      <section className="analytics-panel" data-testid="section-analytics-live">
        <div className="analytics-panel-head"><div><div className="section-kicker">01 / RIGHT NOW</div><h2>Visitors on site<span className="heading-period">.</span></h2><p>Anonymous sessions seen recently. Updates every 10 seconds.</p></div><div><span className="analytics-live-tag"><i/> LIVE</span><strong className="analytics-live-count" data-testid="text-analytics-live-count">{loading ? '—' : data?.liveVisitors ?? '—'}</strong></div></div>
        {loading ? <div className="analytics-loading-list" data-testid="status-analytics-loading">{Array.from({length: 4}, (_, i) => <Skeleton key={i}/>)}</div> : data?.live.length ? <><div className="analytics-column-head"><span>CURRENT PAGE</span><span>SOURCE</span><span>LAST SEEN</span></div><div className="analytics-live-list">{data.live.map((visitor, index) => <div className="analytics-live-row" key={visitor.sessionId} data-testid={`row-analytics-live-${index}`}><div><strong data-testid={`text-analytics-live-page-${index}`}>{visitor.pageTitle || visitor.path || 'Untitled page'}</strong><small data-testid={`text-analytics-live-path-${index}`}>{visitor.path}</small></div><span className="analytics-live-source" data-testid={`text-analytics-live-source-${index}`}>{visitor.source || 'Direct / unknown'}</span><time className="analytics-live-time" dateTime={visitor.lastSeenAt} title={new Date(visitor.lastSeenAt).toLocaleString('en-GB')} data-testid={`text-analytics-live-last-seen-${index}`}>{ago(visitor.lastSeenAt)}</time></div>)}</div></> : <div className="analytics-empty" data-testid="status-analytics-live-empty"><strong>No one in view right now.</strong>When eligible visitors are active, their current pages will appear here.</div>}
      </section>
      <section className="analytics-panel" data-testid="section-analytics-funnel">
        <div className="analytics-panel-head"><div><div className="section-kicker">02 / THE JOURNEY</div><h2>Funnel steps<span className="heading-period">.</span></h2><p>Sessions reaching each tracked step.</p></div></div>
        {loading ? <div className="analytics-loading-list">{Array.from({length: 5}, (_, i) => <Skeleton key={i}/>)}</div> : data?.funnel.length ? <div className="analytics-funnel">{data.funnel.map((step, index) => <div className="analytics-funnel-step" key={`${step.step}-${index}`} data-testid={`row-analytics-funnel-${index}`}><span className="analytics-funnel-index">{String(index + 1).padStart(2, '0')}</span><div className="analytics-funnel-body"><div className="analytics-funnel-name"><span data-testid={`text-analytics-funnel-step-${index}`}>{step.step.replaceAll('_', ' ')}</span><small>{index === 0 ? 'ENTRY' : `${data.funnel[index - 1].sessions ? Math.round(step.sessions / data.funnel[index - 1].sessions * 100) : 0}% from prior`}</small></div><div className="analytics-funnel-bar"><span style={{ transform: `scaleX(${Math.max(0, Math.min(step.sessions / maxFunnel, 1))})` }}/></div></div><strong className="analytics-funnel-value" data-testid={`text-analytics-funnel-sessions-${index}`}>{format.format(step.sessions)}</strong></div>)}</div> : <div className="analytics-empty" data-testid="status-analytics-funnel-empty"><strong>A journey is taking shape.</strong>Funnel steps appear when eligible sessions are recorded.</div>}
        <div className="analytics-panel-foot">The final step reflects checkout intent, not a paid order.</div>
      </section>
    </div>
    <div className="analytics-grid">
      {loading ? <><div className="analytics-panel analytics-loading-list"><Skeleton/><Skeleton/><Skeleton/></div><div className="analytics-panel analytics-loading-list"><Skeleton/><Skeleton/><Skeleton/></div></> : <><Ranking heading="Top pages" kicker="03 / WHAT THEY SEE" data={data?.topPages} testPrefix="analytics-top-pages"/><Ranking heading="Traffic sources" kicker="04 / WHERE THEY COME FROM" data={data?.sources} testPrefix="analytics-sources" className="analytics-sources"/></>}
    </div>
  </div>;
}