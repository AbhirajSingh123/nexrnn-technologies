import {
  Search, Megaphone, Share2, MapPin, Code, Layout, TrendingUp, Calendar, Palette, Gem,
  Clapperboard, Sparkles, Rocket, Compass, Target, Wrench, Cpu, Sliders, MessageCircle,
  Headphones, GraduationCap, FolderCheck, BrainCircuit, Code2, Gavel, Users, Award,
  Scroll, MessageSquare, Briefcase,
} from 'lucide-react';

export const ICONS = {
  search: Search,
  megaphone: Megaphone,
  share2: Share2,
  'map-pin': MapPin,
  code: Code,
  layout: Layout,
  'trending-up': TrendingUp,
  calendar: Calendar,
  palette: Palette,
  gem: Gem,
  clapperboard: Clapperboard,
  sparkles: Sparkles,
  rocket: Rocket,
  compass: Compass,
  target: Target,
  wrench: Wrench,
  cpu: Cpu,
  sliders: Sliders,
  'message-circle': MessageCircle,
  headphones: Headphones,
  'graduation-cap': GraduationCap,
  'folder-check': FolderCheck,
  'brain-circuit': BrainCircuit,
  'code-2': Code2,
  gavel: Gavel,
  users: Users,
  award: Award,
  scroll: Scroll,
  'message-square': MessageSquare,
  briefcase: Briefcase,
};

export function getIcon(key) {
  return ICONS[key] ?? Sparkles;
}
