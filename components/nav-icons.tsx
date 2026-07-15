const s = { xmlns: "http://www.w3.org/2000/svg", width: 20,
  height: 20, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const };

export const icons: Record<string, React.ReactNode> = {
  LayoutDashboard: (
    <svg {...s}><rect width="7" height="9" x="3" y="3" rx="1"/>
    <rect width="7" height="5" x="14" y="3" rx="1"/>
    <rect width="7" height="9" x="14" y="12" rx="1"/>
    <rect width="7" height="5" x="3" y="16" rx="1"/></svg>
  ),
  Users: (
    <svg {...s}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  FolderKanban: (
    <svg {...s}>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2
      2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0
      0-2 2v13c0 1.1.9 2 2 2Z"/>
    <path d="M8 10v4"/><path d="M12 10v2"/>
    <path d="M16 10v6"/></svg>
  ),
  MessageSquare: (
    <svg {...s}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1
      2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  CheckCircle: (
    <svg {...s}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <path d="m9 11 3 3L22 4"/></svg>
  ),
  Search: (
    <svg {...s}><circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/></svg>
  ),
  Tag: (
    <svg {...s}>
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94
      3.42 0l6.58-6.58c.94-.94.94-2.48
      0-3.42L12 2Z"/>
    <path d="M7 7h.01"/></svg>
  ),
};
