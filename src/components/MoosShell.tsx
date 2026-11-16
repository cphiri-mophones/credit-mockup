// Recreation of the Mo.OS shell (DoubleSidebarLayout + DomainSidebar in
// mophones-ui) so the mockup shows how the screen sits inside Mo.OS.
import {
  Activity,
  Banknote,
  BadgeDollarSign,
  Bell,
  Calculator,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Coins,
  Command,
  CreditCard,
  FileText,
  FlaskConical,
  Headset,
  Kanban,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  Map as MapIcon,
  Package,
  Phone,
  PhoneCall,
  PhoneOutgoing,
  RotateCcw,
  Search,
  Settings,
  ShieldAlert,
  ShieldOff,
  ShoppingCart,
  Sun,
  Tags,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { navigate } from '../navigation';
import { useReview } from '../state/review';

interface Domain {
  id: string;
  label: string;
  icon: LucideIcon;
}

const ANALYTICS: Domain[] = [{ id: 'realtime-metrics', label: 'Realtime Metrics', icon: Activity }];

const CRM: Domain[] = [
  { id: 'orders', label: 'Orders & Sales', icon: ShoppingCart },
  { id: 'partners', label: 'Partners & Agents', icon: Users },
  { id: 'underwriting', label: 'Underwriting', icon: Coins },
  { id: 'credit', label: 'Credit', icon: Coins },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'customer-support', label: 'Customer Support', icon: Headset },
];

const OPERATIONS: Domain[] = [
  { id: 'loans', label: 'Loans Management', icon: Banknote },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'mo-prices', label: 'Mo Prices', icon: BadgeDollarSign },
  { id: 'price-plans', label: 'Price Plans', icon: Tags },
  { id: 'admin', label: 'Admin', icon: Settings },
  { id: 'territory', label: 'Territory', icon: MapIcon },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'playground', label: 'Playground', icon: FlaskConical },
];

interface SubNavItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  isNew?: boolean;
  removed?: boolean;
}

// Credit sub-nav as it would look after the change: "Credit work" replaces
// Scoring, Calling and Decisioning (shown struck through when "show changes" is on).
const CREDIT_SUBNAV: SubNavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Applications', icon: FileText },
  { label: 'Pre-Screening', icon: ClipboardCheck },
  { label: 'Credit work', icon: ListChecks, active: true, isNew: true },
  { label: 'Scoring', icon: Calculator, removed: true },
  { label: 'Calling', icon: Phone, removed: true },
  { label: 'Decisioning', icon: CheckCircle, removed: true },
  { label: 'Risk Records', icon: ShieldAlert },
  { label: 'Exemptions', icon: ShieldOff },
  { label: 'Queue', icon: Kanban },
  { label: 'Returns', icon: RotateCcw },
  { label: 'Courtesy Calls', icon: PhoneCall },
  { label: 'Default Calls', icon: PhoneOutgoing },
  { label: 'Shift Roster', icon: Clock },
  { label: 'Support', icon: Wrench },
];

const COLLAPSE_KEY = 'domainSidebarCollapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === 'true';
  } catch {
    return false;
  }
}

function DomainSidebar({ collapsed, onToggle, showChanges }: { collapsed: boolean; onToggle: () => void; showChanges: boolean }) {
  const [creditOpen, setCreditOpen] = useState(true);
  const subNav = CREDIT_SUBNAV.filter((item) => showChanges || !item.removed);

  const renderDomain = (domain: Domain) => {
    const Icon = domain.icon;
    const isCredit = domain.id === 'credit';

    if (collapsed) {
      return (
        <button
          key={domain.id}
          type="button"
          title={domain.label}
          aria-label={domain.label}
          onClick={isCredit ? () => navigate('queue') : undefined}
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-all ${
            isCredit ? 'bg-white text-slate-900' : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      );
    }

    return (
      <div key={domain.id}>
        <button
          type="button"
          aria-expanded={isCredit ? creditOpen : false}
          onClick={isCredit ? () => setCreditOpen((o) => !o) : undefined}
          className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-all ${
            isCredit && !creditOpen ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Icon className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="flex-1 text-[11px]">{domain.label}</span>
          <ChevronDown className={`h-2.5 w-2.5 transition-transform ${isCredit && creditOpen ? 'rotate-180' : ''}`} />
        </button>

        {isCredit && creditOpen && (
          <div className="ml-5 space-y-0.5 border-l border-white/20 py-0.5 pl-2 pr-1">
            {subNav.map((item) => {
              const SubIcon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.active ? '#/queue' : undefined}
                  aria-current={item.active ? 'page' : undefined}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] no-underline transition-all ${
                    item.active
                      ? 'bg-white/15 font-medium text-white'
                      : item.removed
                        ? 'text-white/35 line-through'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <SubIcon className="h-2.5 w-2.5" />
                  <span className="flex-1">{item.label}</span>
                  {showChanges && item.isNew && <span className="rounded bg-emerald-400/90 px-1 text-[8px] font-bold text-slate-900">NEW</span>}
                </a>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const groupLabel = (text: string, first = false) =>
    collapsed ? (
      first ? null : <div className="my-2 w-6 border-t border-white/10" />
    ) : (
      <div className={`mb-0.5 px-2 text-[8px] font-semibold uppercase tracking-wider text-white/40 ${first ? '' : 'mt-3'}`}>{text}</div>
    );

  return (
    <div
      className={`relative m-3 flex flex-col rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-xl transition-all duration-300 ${collapsed ? 'w-14' : 'w-48'}`}
      style={{ height: 'calc(100vh - 24px)' }}
    >
      <div className={`flex items-center px-3 py-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
            <LayoutGrid className="h-3.5 w-3.5 text-white" />
          </div>
          {!collapsed && <span className="text-[11px] font-semibold tracking-wide">Mo.OS</span>}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-4 flex h-6 w-6 items-center justify-center rounded-full border border-slate-600 bg-slate-700 shadow-md transition-all hover:bg-slate-600"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>

      <nav
        aria-label="Main"
        className={`flex-1 overflow-y-auto px-2 ${collapsed ? 'flex flex-col items-center' : ''}`}
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
      >
        {groupLabel('Analytics', true)}
        <div className={collapsed ? 'space-y-1' : 'space-y-0.5'}>{ANALYTICS.map(renderDomain)}</div>
        {groupLabel('CRM Systems')}
        <div className={collapsed ? 'space-y-1' : 'space-y-0.5'}>{CRM.map(renderDomain)}</div>
        {groupLabel('Operations')}
        <div className={collapsed ? 'space-y-1' : 'space-y-0.5'}>{OPERATIONS.map(renderDomain)}</div>
      </nav>

      <div className={`border-t border-white/10 p-2 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-[9px] font-bold">CP</div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-[9px] font-bold">CP</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium">Chris Phiri</p>
              <p className="truncate text-[8px] text-white/50">Credit</p>
            </div>
            <ChevronDown className="h-2.5 w-2.5 text-white/50" />
          </div>
        )}
      </div>
    </div>
  );
}

function TopBar({ showChanges, onToggleChanges }: { showChanges: boolean; onToggleChanges: () => void }) {
  const { reset } = useReview();
  return (
    <div className="flex items-center justify-between gap-3 rounded-t-2xl border-b border-gray-100 bg-white p-4">
      <div className="flex flex-1 items-center gap-2">
        <button
          type="button"
          onClick={() => {
            reset();
            navigate('queue');
          }}
          className="rounded-md border border-dashed border-amber-500 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
        >
          Reset mockup
        </button>
        <button
          type="button"
          aria-pressed={showChanges}
          onClick={onToggleChanges}
          className="rounded-md border border-dashed border-amber-500 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
        >
          {showChanges ? 'Hide' : 'Show'} menu changes
        </button>
      </div>
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
        <input
          type="search"
          aria-label="Search"
          placeholder="Search users, orders, inventory..."
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-14 text-sm placeholder:text-gray-500"
        />
        <kbd className="absolute right-2 top-1/2 hidden h-6 -translate-y-1/2 items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600 sm:inline-flex">
          <Command className="h-3 w-3" />K
        </kbd>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        <button type="button" aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100">
          <Bell className="size-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">1</span>
        </button>
        <button type="button" aria-label="Toggle theme" title="The mockup is light only" className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white">
          <Sun className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function MoosShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [showChanges, setShowChanges] = useState(true);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, String(!c));
      } catch {
        // Ignore: collapse state just won't persist.
      }
      return !c;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-sans text-gray-900">
      <DomainSidebar collapsed={collapsed} onToggle={toggle} showChanges={showChanges} />
      <main className="m-4 ml-0 flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
        <TopBar showChanges={showChanges} onToggleChanges={() => setShowChanges((s) => !s)} />
        <div id="moos-content" className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
