import React from 'react';
import {
  LayoutDashboard,
  Volleyball,
  Radio,
  BarChart3,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Star,
  Trophy,
  Flame,
  Target,
  DollarSign,
  Check,
  CheckCircle,
  X,
  XCircle,
  Edit,
  Edit2,
  Camera,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  MapPin,
  Filter,
  RefreshCw,
  Monitor,
  Smartphone,
  Shield,
  Zap,
  Bolt,
  Activity,
  Award,
  Gift,
  Heart,
  Bookmark,
  Share,
  Copy,
  ExternalLink,
  Download,
  Upload,
  ArrowUp,
  ArrowDown,
  Menu,
  Home,
  List,
  Grid,
  Columns,
  Layers,
  Database,
  Cloud,
  Wifi,
  WifiOff,
  Globe,
  Link,
  Unlink,
  Key,
  Unlock,
  UserPlus,
  UserMinus,
  Users,
  UserCheck,
  UserX,
  LogIn,
  Circle,
  Square,
  Triangle,
  Hexagon,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon mapping from material symbols names to lucide icons
const iconMap: Record<string, LucideIcon> = {
  // Navigation
  dashboard: LayoutDashboard,
  sports_basketball: Volleyball,
  sports_football: Volleyball,
  sports_baseball: Volleyball,
  sports_soccer: Volleyball,
  sports_mma: Volleyball,
  sensors: Radio,
  leaderboard: BarChart3,
  person: User,
  settings: Settings,
  logout: LogOut,
  notifications: Bell,
  search: Search,
  add: Plus,
  chevron_right: ChevronRight,
  chevron_left: ChevronLeft,
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,

  // Stats
  trending_up: TrendingUp,
  trending_down: TrendingDown,
  star: Star,
  star_filled: Star,
  workspace_premium: Trophy,
  local_fire_department: Flame,
  monitoring: Activity,
  target: Target,
  attach_money: DollarSign,
  insights: Activity,

  // Status
  check_circle: CheckCircle,
  check: Check,
  cancel: X,
  close: X,
  error: XCircle,
  verified: CheckCircle,

  // Actions
  edit: Edit,
  edit_note: Edit2,
  camera_alt: Camera,
  photo_camera: Camera,

  // Form
  mail: Mail,
  email: Mail,
  lock: Lock,
  visibility: Eye,
  visibility_off: EyeOff,

  // Content
  calendar_today: Calendar,
  schedule: Clock,
  location_on: MapPin,
  filter_list: Filter,
  filter_alt: Filter,
  refresh: RefreshCw,
  sync: RefreshCw,

  // Tech
  monitor: Monitor,
  smartphone: Smartphone,
  api: Database,
  lock_open: Unlock,
  key: Key,

  // Features
  shield: Shield,
  bolt: Bolt,
  zap: Zap,
  trophy: Trophy,
  award: Award,
  gift: Gift,
  favorite: Heart,
  bookmark: Bookmark,
  share: Share,
  content_copy: Copy,
  open_in_new: ExternalLink,
  download: Download,
  upload: Upload,

  // Navigation
  arrow_upward: ArrowUp,
  arrow_downward: ArrowDown,
  arrow_forward_ios: ArrowRight,
  menu: Menu,
  home: Home,

  // Layout
  view_list: List,
  view_module: Grid,
  view_column: Columns,
  layers: Layers,

  // Network
  cloud: Cloud,
  wifi: Wifi,
  wifi_off: WifiOff,
  language: Globe,
  link: Link,
  link_off: Unlink,

  // Users
  person_add: UserPlus,
  person_remove: UserMinus,
  group: Users,
  how_to_reg: UserCheck,
  person_off: UserX,
  login: LogIn,

  // Social
  google: Globe,
  apple: Globe,
  discord: Globe,

  // Shapes
  circle: Circle,
  square: Square,
  change_history: Triangle,
  hexagon: Hexagon,

  // Sports specific
  stadium: Volleyball,
  school: Volleyball,
  sports: Volleyball,
};

// Emoji mapping for sports (fallback)
export const sportEmoji: Record<string, string> = {
  nba: '🏀',
  nfl: '🏈',
  mlb: '⚾',
  soccer: '⚽',
  ufc: '🥊',
  'college-football': '🏟️',
  'college-basketball': '🎓',
  'womens-basketball': '👩‍🏀',
};

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  filled?: boolean;
  fallback?: string;
}

export function Icon({ name, size = 24, className, filled = false, fallback }: IconProps) {
  const LucideIcon = iconMap[name];

  if (LucideIcon) {
    return (
      <LucideIcon
        size={size}
        className={cn(className)}
        strokeWidth={filled ? 2.5 : 2}
        fill={filled ? 'currentColor' : 'none'}
      />
    );
  }

  // Fallback to emoji or text
  if (fallback) {
    return <span className={cn('text-base', className)}>{fallback}</span>;
  }

  // Default fallback
  return <Circle size={size} className={className} />;
}

// Sport Icon component with emoji
interface SportIconProps {
  sport: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SportIcon({ sport, size = 'md', className }: SportIconProps) {
  const emoji = sportEmoji[sport] || '🏀';
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <span className={cn(sizeClasses[size], className)} role="img">
      {emoji}
    </span>
  );
}
