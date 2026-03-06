const CLASS_FLOW_ICON_LABELS: Record<string, string> = {
  Sparkles: "✨",
  BookOpen: "📖",
  Target: "🎯",
  LineChart: "📈",
}

export function getClassFlowDisplayIcon(icon: string | null | undefined) {
  if (!icon) return "📚"
  return CLASS_FLOW_ICON_LABELS[icon] || icon
}
