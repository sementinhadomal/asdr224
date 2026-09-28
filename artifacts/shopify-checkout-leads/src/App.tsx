import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, Show, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, Ticket } from 'lucide-react';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import Dashboard from '@/pages/dashboard';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
setBaseUrl(apiBaseUrl || null);
const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: true, retry: 2 } },
});

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: 'bottom' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: '#202640',
    colorForeground: '#202640',
    colorMutedForeground: '#737881',
    colorDanger: '#b74d45',
    colorBackground: '#fbfaf6',
    colorInput: '#f5f3ed',
    colorInputForeground: '#202640',
    colorNeutral: '#dedbd1',
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: '6px',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fbfaf6] rounded-lg w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#202640] !font-bold',
    headerSubtitle: 'text-[#737881]',
    socialButtonsBlockButtonText: 'text-[#202640] !font-semibold',
    formFieldLabel: 'text-[#30374b] !font-semibold',
    footerActionLink: 'text-[#202640] !font-bold',
    footerActionText: 'text-[#737881]',
    dividerText: 'text-[#737881]',
    identityPreviewEditButton: 'text-[#202640]',
    formFieldSuccessText: 'text-[#416f56]',
    alertText: 'text-[#713e35]',
    logoBox: 'mb-3',
    logoImage: 'h-9 w-auto max-w-[170px]',
    socialButtonsBlockButton: '!bg-[#f5f3ed] !border-[#dedbd1]',
    formButtonPrimary: '!bg-[#202640] !text-[#fbfaf6] !shadow-none',
    formFieldInput: '!bg-[#f5f3ed] !text-[#202640] !border-[#dedbd1]',
    footerAction: '!bg-transparent',
    dividerLine: '!bg-[#dedbd1]',
    alert: '!bg-[#f7e8e2] !border-[#e6c9bd]',
    otpCodeFieldInput: '!bg-[#f5f3ed] !text-[#202640]',
    formFieldRow: 'text-[#202640]',
    main: '!text-[#202640]',
  },
};

function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`brand ${light ? '' : 'public-brand'}`} data-testid="link-home-brand"><span className="brand-mark"><span /></span><span className="brand-word">ticketmaker<span className="brand-dot">.</span></span></Link>;
}

function Home() {
  return <div className="public-page">
    <header className="public-header"><Brand/><nav className="public-nav"><span>INTERNAL OPERATIONS</span><Link href="/sign-in" className="public-signin" data-testid="link-header-sign-in">Team sign in <ArrowRight size={16}/></Link></nav></header>
    <main>
      <section className="public-hero">
        <div><div className="public-eyebrow"><i/> TICKETMAKER / OPERATIONS</div><h1>Every click.<br/><em>In context.</em></h1><p>One focused workspace for Shopify ticket checkout starts. See which events people are exploring, what they selected, and when they clicked through.</p><Link href="/sign-in" className="public-cta" data-testid="link-open-workspace">Open operations workspace <ArrowRight size={17}/></Link><div className="public-support">PRIVATE ACCESS · FOR THE TICKETMAKER TEAM</div></div>
        <div className="hero-art" aria-hidden="true"><div className="art-top"><span>CHECKOUT ACTIVITY / LIVE</span><span>● ACTIVE</span></div><div className="art-chart"><i style={{height:'35%'}}/><i style={{height:'57%'}}/><i style={{height:'43%'}}/><i style={{height:'70%'}}/><i style={{height:'54%'}}/><i style={{height:'80%'}}/><i style={{height:'63%'}}/><i style={{height:'95%'}}/><i style={{height:'74%'}}/><i style={{height:'100%'}}/></div><div className="art-bottom"><small>THE SIGNAL BEFORE THE SALE</small><strong>Intent, made visible.</strong><p>Event by event. Click by click.</p></div><div className="art-sticker"><Ticket size={37} strokeWidth={1.5}/></div></div>
      </section>
      <div className="public-strip"><span>CHECKOUT STARTS</span><span>EVENT BREAKDOWN</span><span>TICKET SELECTIONS</span></div>
      <section className="public-details"><div><div className="public-eyebrow"><i/> A BETTER OPERATIONS PICTURE</div><h2>Know what happens<br/>before checkout.</h2><p>Built for the team behind the tickets. No noise, no inflated sales numbers — just the actions visitors take when they're ready to head to Shopify.</p></div><div><div className="public-feature"><span>01</span><div><strong>See every checkout start</strong><p>A chronological activity log with event, ticket type, quantity, seats, and source.</p></div></div><div className="public-feature"><span>02</span><div><strong>Follow event-level interest</strong><p>Understand which events are driving clicks and how many tickets visitors selected.</p></div></div><div className="public-feature"><span>03</span><div><strong>Keep the definition clear</strong><p>These are button clicks, not confirmed orders. The distinction is front and centre.</p></div></div></div></section>
    </main><footer className="public-footer"><span>© {new Date().getFullYear()} TICKETMAKER</span><span>INTERNAL OPERATIONS · SHOPIFY CHECKOUT LEADS</span></footer>
  </div>;
}

function AuthLayout({ children, mode }: { children: ReactNode; mode: 'sign-in' | 'sign-up' }) {
  return <div className="auth-page"><aside className="auth-aside"><Brand light/><div className="auth-aside-content"><div className="public-eyebrow"><i/> TICKETMAKER / OPERATIONS</div><h2>{mode === 'sign-in' ? <>A clearer view<br/>starts <span>here.</span></> : <>Get closer to<br/>the <span>signal.</span></>}</h2><p>Checkout activity from across your events, all in one focused workspace for your team.</p></div><div className="auth-aside-foot">INTERNAL ACCESS · CHECKOUT LEADS</div><div className="auth-deco" aria-hidden="true"/></aside><main className="auth-main"><Link href="/" className="auth-back" data-testid="link-back-home"><ArrowLeft size={15}/> Back to overview</Link>{children}</main></div>;
}

function SignInPage() {
  return <AuthLayout mode="sign-in"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/dashboard`} /></AuthLayout>;
}
function SignUpPage() {
  return <AuthLayout mode="sign-up"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={`${basePath}/dashboard`} /></AuthLayout>;
}

function HomeRedirect() {
  return <><Show when="signed-in"><Redirect to="/dashboard"/></Show><Show when="signed-out"><Home/></Show></>;
}
function ProtectedDashboard() {
  return <><Show when="signed-in"><Dashboard/></Show><Show when="signed-out"><Redirect to="/"/></Show></>;
}
function ProtectedAnalytics() {
  return <><Show when="signed-in"><Dashboard view="analytics"/></Show><Show when="signed-out"><Redirect to="/"/></Show></>;
}
function ProtectedTicketGenerator() {
  return <><Show when="signed-in"><Dashboard view="ticket-generator"/></Show><Show when="signed-out"><Redirect to="/"/></Show></>;
}
function NotFound() {
  return <div className="public-page"><header className="public-header"><Brand/></header><main className="table-state" style={{minHeight:'72dvh'}}><div className="state-icon"><Ticket size={23}/></div><div className="public-eyebrow">404 / WRONG TURN</div><h2>This page isn't on the list.</h2><p>Head back to the operations entry point.</p><Link href="/" className="public-cta" data-testid="link-not-found-home">Back to overview <ArrowRight size={16}/></Link></main></div>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previous.current !== undefined && previous.current !== userId) client.clear();
      previous.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function ApiAuthBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    if (!apiBaseUrl) return;
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Routes() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={HomeRedirect}/>
    <Route path="/sign-in/*?" component={SignInPage}/>
    <Route path="/sign-up/*?" component={SignUpPage}/>
    <Route path="/dashboard" component={ProtectedDashboard}/>
    <Route path="/dashboard/analytics" component={ProtectedAnalytics}/>
    <Route path="/dashboard/ticket-generator" component={ProtectedTicketGenerator}/>
    <Route component={NotFound}/>
  </Switch></RoutedErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to Ticketmaker operations' } },
      signUp: { start: { title: 'Join the workspace', subtitle: 'Create your Ticketmaker team account' } },
    }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
   ><ApiAuthBridge/><QueryClientProvider client={queryClient}><ClerkQueryClientCacheInvalidator/><Routes/></QueryClientProvider></ClerkProvider>;
}

function App() {
  return <WouterRouter base={basePath}><ClerkProviderWithRoutes/></WouterRouter>;
}

export default App;