import { useEffect, useMemo, useState } from 'react';
import { useClerk, useUser } from '@clerk/react';
import { Link } from 'wouter';
import { ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, CalendarDays, ChevronDown, CircleHelp, ExternalLink, FileText, FilterX, LayoutDashboard, LogOut, Menu, RefreshCw, Search, Ticket, X } from 'lucide-react';
import type { ShopifyCheckoutLead } from '@workspace/api-client-react';
import AnalyticsReport from '@/components/analytics-report';
import { Unauthorized } from '@/components/unauthorized';
import { useLeadSummary, useLeads } from '@/hooks/use-lead-data';
import TicketGenerator from '@/pages/ticket-generator';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const numberFormat = new Intl.NumberFormat('en-GB');

function formatDate(value: string | null | undefined, full = false) {
  if (!value) return 'No activity yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: full ? 'numeric' : undefined,
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}

function safeSource(url: string) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function exportCsv(leads: ShopifyCheckoutLead[]) {
  const columns = ['ID', 'Event', 'Event handle', 'Ticket type', 'Variant ID', 'Quantity', 'Block', 'Seats', 'Source URL', 'Clicked at'];
  const rows = leads.map((lead) => [
    lead.id, lead.event, lead.eventHandle, lead.ticketType, lead.variantId, lead.quantity,
    lead.block ?? '', lead.seats.join(', '), lead.sourceUrl, lead.clickedAt,
  ]);
  const csv = [columns, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
  link.download = `ticketmaker-checkout-starts-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

function LeadRow({ lead }: { lead: ShopifyCheckoutLead }) {
  const [open, setOpen] = useState(false);
  const source = safeSource(lead.sourceUrl);
  return (
    <>
      <tr className={`lead-row ${open ? 'lead-row-open' : ''}`} data-testid={`row-lead-${lead.id}`}>
        <td><button type="button" className="row-expand" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${open ? 'Hide' : 'Show'} details for lead ${lead.id}`} data-testid={`button-details-${lead.id}`}><ChevronDown size={15} /></button></td>
        <td><span className="row-event">{lead.event}</span><span className="row-handle">{lead.eventHandle}</span></td>
        <td><span className="ticket-name">{lead.ticketType}</span><span className="mobile-row-meta">{lead.block ? `Block ${lead.block}` : 'General admission'}</span></td>
        <td><span className="qty-pill">{lead.quantity}</span></td>
        <td><span className="seat-value">{lead.block ? `Block ${lead.block}` : '—'}</span></td>
        <td><span className="seat-value">{lead.seats.length ? lead.seats.join(', ') : '—'}</span></td>
        <td><span className="date-main">{formatDate(lead.clickedAt)}</span></td>
        <td>{source ? <a href={source} target="_blank" rel="noopener noreferrer" className="source-link" title={lead.sourceUrl} aria-label={`Open source for lead ${lead.id}`} data-testid={`link-source-${lead.id}`}><ArrowUpRight size={16} /></a> : <span className="muted">—</span>}</td>
      </tr>
      {open && <tr className="detail-row" data-testid={`detail-lead-${lead.id}`}><td colSpan={8}><div className="detail-grid">
        <div><span className="detail-label">LEAD ID</span><strong>#{lead.id}</strong></div>
        <div><span className="detail-label">SHOPIFY VARIANT</span><strong className="mono break-all">{lead.variantId}</strong></div>
        <div><span className="detail-label">EVENT HANDLE</span><strong className="mono">{lead.eventHandle}</strong></div>
        <div><span className="detail-label">SOURCE PAGE</span>{source ? <a className="detail-source" href={source} target="_blank" rel="noopener noreferrer" data-testid={`link-detail-source-${lead.id}`}>{lead.sourceUrl}<ExternalLink size={13} /></a> : <strong>{lead.sourceUrl || 'Not provided'}</strong>}</div>
        <div><span className="detail-label">RECORDED AT</span><strong>{formatDate(lead.clickedAt, true)}</strong></div>
      </div></td></tr>}
    </>
  );
}

export default function Dashboard({ view = 'leads' }: { view?: 'leads' | 'analytics' | 'ticket-generator' }) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [event, setEvent] = useState('');
  const [limit, setLimit] = useState(100);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { signOut } = useClerk();
  const { user } = useUser();
  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  const params = useMemo(() => ({ ...(event ? { event } : {}), ...(search ? { search } : {}), limit }), [event, search, limit]);
  const leadsQuery = useLeads(params, view === 'leads');
  const summaryQuery = useLeadSummary(view === 'leads' || view === 'ticket-generator');
  const leads = leadsQuery.data ?? [];
  const pageSize = 20;
  const visibleLeads = leads.slice((page - 1) * pageSize, page * pageSize);
  const pages = Math.max(1, Math.ceil(leads.length / pageSize));
  const refreshing = leadsQuery.isFetching || summaryQuery.isFetching;
  const clearFilters = () => { setSearchInput(''); setSearch(''); setEvent(''); setPage(1); };
  const refresh = () => { void leadsQuery.refetch(); void summaryQuery.refetch(); };
  const summary = summaryQuery.data;
  if ((view === 'leads' && leadsQuery.error?.status === 403) || (view !== 'analytics' && summaryQuery.error?.status === 403)) return <Unauthorized />;

  return <div className="app-shell">
    {sidebarOpen && <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} data-testid="button-close-navigation" />}
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top">
        <Link href="/dashboard" className="brand" onClick={() => setSidebarOpen(false)} data-testid="link-dashboard-brand">
          <span className="brand-mark"><span /></span><span className="brand-word">ticketmaker<span className="brand-dot">.</span></span>
        </Link>
        <div className="workspace-label">OPERATIONS WORKSPACE <span className="workspace-line" /></div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <Link href="/dashboard" className={`side-link ${view === 'leads' ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} data-testid="link-dashboard-nav"><LayoutDashboard size={17} strokeWidth={1.8} /> Checkout leads {view === 'leads' && <span className="side-active-dot" />}</Link>
        <Link href="/dashboard/analytics" className={`side-link ${view === 'analytics' ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} data-testid="link-analytics-nav"><BarChart3 size={17} strokeWidth={1.8} /> Traffic & funnel {view === 'analytics' && <span className="side-active-dot" />}</Link>
        <Link href="/dashboard/ticket-generator" className={`side-link ${view === 'ticket-generator' ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} data-testid="link-ticket-generator-nav"><FileText size={17} strokeWidth={1.8} /> Ticket PDF generator {view === 'ticket-generator' && <span className="side-active-dot" />}</Link>
      </div>
      <div className="sidebar-bottom">
        <div className="side-info"><span className="side-info-icon"><CircleHelp size={17} /></span><div><strong>About this view</strong><p>{view === 'ticket-generator' ? 'Manual ticket issue. Holder details remain in this browser and are never saved here.' : view === 'analytics' ? 'Anonymous, consent-aware visitor activity. Checkout starts are not purchases.' : 'Activity from Shopify checkout buttons. Not order or purchase data.'}</p></div></div>
        <div className="sidebar-user"><div className="avatar" data-testid="text-user-initials">{(user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || 'T').toUpperCase()}</div><div className="user-copy"><strong data-testid="text-user-name">{user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Team member'}</strong><span>Ticketmaker team</span></div><button type="button" title="Sign out" aria-label="Sign out" onClick={() => signOut({ redirectUrl: basePath || '/' })} data-testid="button-sign-out"><LogOut size={16} /></button></div>
      </div>
    </aside>

    <main className="dashboard-main">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)} data-testid="button-open-navigation"><Menu size={20}/></button><span className="topbar-crumb">WORKSPACE</span><span className="topbar-slash">/</span><span className="topbar-current">{view === 'ticket-generator' ? 'Ticket PDF generator' : view === 'analytics' ? 'Traffic & funnel' : 'Checkout leads'}</span></div><div className="topbar-right"><span className="live-indicator"><i /> {view === 'ticket-generator' ? 'LOCAL TOOL' : 'LIVE VIEW'}</span><span className="topbar-divider" /><span className="topbar-date"><CalendarDays size={15}/>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())}</span></div></header>
      <div className="main-content">
        {view === 'ticket-generator' ? (
          summaryQuery.isSuccess ? <TicketGenerator /> : summaryQuery.isError ? <div className="table-state" role="alert" data-testid="status-ticket-generator-error"><div className="state-icon"><RefreshCw size={22}/></div><h2>Access check unavailable</h2><p>We couldn't verify your workspace permissions. The generator remains unavailable until the check succeeds.</p><button className="btn btn-dark" type="button" onClick={() => void summaryQuery.refetch()} data-testid="button-retry-ticket-generator-auth"><RefreshCw size={15}/> Try again</button></div> : <div className="ticket-auth-loading" data-testid="status-ticket-generator-loading" aria-label="Verifying workspace access"><Skeleton className="w-1/4"/><Skeleton className="w-1/2"/><Skeleton className="w-full"/><Skeleton className="w-2/3"/></div>
        ) : view === 'analytics' ? <AnalyticsReport /> : <>
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-square" /> SHOPIFY / CHECKOUT INTELLIGENCE</div><h1>Checkout leads<span className="heading-period">.</span></h1><p className="page-subtitle">A clear view of every ticket checkout button click across your events.</p></div><div className="heading-actions"><button className="btn btn-outline" type="button" onClick={refresh} disabled={refreshing} data-testid="button-refresh-leads"><RefreshCw size={16} className={refreshing ? 'spin-once' : ''}/> Refresh</button><button className="btn btn-dark" type="button" onClick={() => exportCsv(leads)} disabled={!leads.length} data-testid="button-export-csv"><ArrowDownToLine size={16}/> Export CSV</button></div></div>

        <div className="notice" data-testid="status-checkout-disclaimer"><div className="notice-symbol"><Ticket size={19} strokeWidth={1.8}/></div><div><strong>Checkout starts, not confirmed purchases.</strong><span> A lead is recorded when someone clicks a Shopify checkout button. It does not mean an order was placed or paid for.</span></div></div>

        <section className="overview" aria-label="Overview">
          <div className="metric metric-featured"><div className="metric-top"><span>TOTAL CHECKOUT STARTS</span><span className="metric-icon"><ArrowUpRight size={17}/></span></div><div className="metric-number" data-testid="text-total-leads">{summaryQuery.isLoading ? <Skeleton className="skeleton-number"/> : summaryQuery.isError ? '—' : numberFormat.format(summary?.totalLeads ?? 0)}</div><div className="metric-foot"><span className="metric-line"/><span>All time, across every event</span></div></div>
          <div className="metric"><div className="metric-top"><span>TICKETS INTENDED</span><Ticket size={17} strokeWidth={1.6}/></div><div className="metric-number" data-testid="text-total-tickets">{summaryQuery.isLoading ? <Skeleton className="skeleton-number"/> : summaryQuery.isError ? '—' : numberFormat.format(summary?.totalTickets ?? 0)}</div><div className="metric-foot"><span className="tiny-marker"/> Quantity selected at click</div></div>
          <div className="metric"><div className="metric-top"><span>STARTS TODAY</span><ArrowUpRight size={17} strokeWidth={1.6}/></div><div className="metric-number" data-testid="text-today-leads">{summaryQuery.isLoading ? <Skeleton className="skeleton-number"/> : summaryQuery.isError ? '—' : numberFormat.format(summary?.todayLeads ?? 0)}</div><div className="metric-foot"><span className="tiny-marker"/> Based on recorded activity</div></div>
          <div className="metric metric-latest"><div className="metric-top"><span>LATEST ACTIVITY</span><span className="latest-pulse"/></div><div className="latest-time" data-testid="text-latest-activity">{summaryQuery.isLoading ? <Skeleton className="skeleton-date"/> : summaryQuery.isError ? 'Unavailable' : formatDate(summary?.latestClickedAt)}</div><div className="metric-foot"><span className="tiny-marker"/> Most recent checkout click</div></div>
        </section>

        {summaryQuery.isError && <div className="inline-error" role="alert" data-testid="status-summary-error"><span>Overview could not be loaded.</span><button onClick={() => void summaryQuery.refetch()} data-testid="button-retry-summary">Try again <ArrowRight size={14}/></button></div>}

        <div className="content-grid">
          <section className="activity-panel">
            <div className="panel-header"><div><div className="section-kicker">01 / ACTIVITY LOG</div><h2>Recent activity <span className="count-badge" data-testid="text-filtered-count">{leadsQuery.isLoading ? '···' : leads.length}</span></h2></div><div className="panel-live"><span/>AUTO-UPDATES EVERY 30S</div></div>
            <div className="filters"><div className="search-wrap"><Search size={17} /><input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search event, ticket, seat..." aria-label="Search checkout leads" data-testid="input-search-leads" />{searchInput && <button type="button" aria-label="Clear search" onClick={() => setSearchInput('')} data-testid="button-clear-search"><X size={14}/></button>}</div><div className="select-wrap"><select value={event} onChange={(e) => { setEvent(e.target.value); setPage(1); }} aria-label="Filter by event" data-testid="select-event-filter"><option value="">All events</option>{summary?.byEvent.map((item) => <option key={item.event} value={item.event}>{item.event}</option>)}</select><ChevronDown size={15}/></div><div className="select-wrap limit-select"><select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} aria-label="Maximum records" data-testid="select-record-limit"><option value={50}>Latest 50</option><option value={100}>Latest 100</option><option value={250}>Latest 250</option><option value={500}>Latest 500</option></select><ChevronDown size={15}/></div>{(event || searchInput) && <button className="clear-filters" type="button" onClick={clearFilters} data-testid="button-clear-filters"><FilterX size={15}/> Clear</button>}</div>
            {leadsQuery.isLoading ? <div className="table-loading" data-testid="status-leads-loading"><div className="table-loading-head"><Skeleton className="w-1/5"/><Skeleton className="w-1/4"/><Skeleton className="w-1/6"/></div>{Array.from({ length: 7 }).map((_, i) => <div className="table-loading-row" key={i}><Skeleton className="w-1/4"/><Skeleton className="w-1/5"/><Skeleton className="w-1/6"/><Skeleton className="w-1/5"/></div>)}</div> : leadsQuery.isError ? <div className="table-state" role="alert" data-testid="status-leads-error"><div className="state-icon"><RefreshCw size={22}/></div><h3>Activity is out of reach</h3><p>We couldn't load the latest checkout starts. Your filters are safe; try the connection again.</p><button className="btn btn-dark" type="button" onClick={() => void leadsQuery.refetch()} data-testid="button-retry-leads"><RefreshCw size={15}/> Retry loading</button></div> : leads.length === 0 ? <div className="table-state" data-testid="status-leads-empty"><div className="state-icon"><Ticket size={23}/></div><h3>{event || search ? 'No matching checkout starts' : 'Waiting for the first click'}</h3><p>{event || search ? 'Try a different event or search term to widen your view.' : 'When a visitor clicks a Shopify checkout button, the activity will appear here automatically.'}</p>{(event || search) && <button className="btn btn-dark" type="button" onClick={clearFilters} data-testid="button-reset-empty-filters">Clear filters <ArrowRight size={15}/></button>}</div> : <><div className={`table-scroll ${leadsQuery.isFetching ? 'table-refreshing' : ''}`}><table className="leads-table"><thead><tr><th aria-label="Details"/><th>EVENT</th><th>TICKET TYPE</th><th>QTY</th><th>BLOCK</th><th>SEATS</th><th>CLICKED AT</th><th>SOURCE</th></tr></thead><tbody>{visibleLeads.map((lead) => <LeadRow key={lead.id} lead={lead}/>)}</tbody></table></div><div className="table-footer"><span data-testid="text-results-range">Showing {Math.min((page - 1) * pageSize + 1, leads.length)}–{Math.min(page * pageSize, leads.length)} of {leads.length}{leads.length >= limit ? ` latest records (limit ${limit})` : ' records'}</span><div className="pagination"><button type="button" disabled={page === 1} aria-label="Previous page" onClick={() => setPage(page - 1)} data-testid="button-previous-page"><ArrowLeft size={16}/></button><span data-testid="text-page-number">{page} / {pages}</span><button type="button" disabled={page >= pages} aria-label="Next page" onClick={() => setPage(page + 1)} data-testid="button-next-page"><ArrowRight size={16}/></button></div></div></>}
          </section>
          <aside className="event-panel"><div className="event-panel-top"><div className="section-kicker">02 / BREAKDOWN</div><h2>By event<span className="heading-period">.</span></h2><p>Where checkout intent is coming from.</p></div><div className="event-list">{summaryQuery.isLoading ? Array.from({length: 4}).map((_, i) => <div className="event-skeleton" key={i}><Skeleton className="w-2/3"/><Skeleton className="w-full"/></div>) : summaryQuery.isError ? <div className="event-empty">Event breakdown unavailable.</div> : !summary?.byEvent.length ? <div className="event-empty">Event activity will appear here once checkout starts are recorded.</div> : summary.byEvent.map((item, i) => { const percentage = summary.totalLeads ? Math.round((item.leads / summary.totalLeads) * 100) : 0; return <button key={item.event} className={`event-item ${event === item.event ? 'event-item-active' : ''}`} type="button" onClick={() => { setEvent(event === item.event ? '' : item.event); setPage(1); }} data-testid={`button-filter-event-${i}`}><div className="event-item-head"><span className="event-rank">{String(i + 1).padStart(2, '0')}</span><strong data-testid={`text-event-name-${i}`}>{item.event}</strong><ArrowUpRight size={15}/></div><div className="event-track"><span style={{ transform: `scaleX(${percentage / 100})` }}/></div><div className="event-item-foot"><span><b>{numberFormat.format(item.leads)}</b> starts</span><span>{numberFormat.format(item.tickets)} tickets</span></div></button>; })}</div><div className="event-panel-note"><span className="note-line" />Click an event to filter the activity log.</div></aside>
        </div>
        </>}
        <footer className="dashboard-footer"><span>© {new Date().getFullYear()} TICKETMAKER OPERATIONS</span><span>{view === 'ticket-generator' ? 'Manual issue · Local browser download' : 'Shopify checkout click data · Not a sales report'}</span></footer>
      </div>
    </main>
  </div>;
}