import * as LucideIcons from 'lucide-react'
import { Puzzle } from 'lucide-react'

// Tool.icon is stored as a plain string (e.g. "Bot", "ShieldCheck") so the
// backend/seed data never has to import a frontend icon library. This looks
// that name up in lucide-react at render time, falling back to a generic
// icon for anything unrecognized or unset — never crashes on a bad/renamed
// icon name from the catalog.
export default function DynamicIcon({ name, className }: { name?: string | null; className?: string }) {
  const IconComponent =
    (name && (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name]) ||
    Puzzle
  return <IconComponent className={className} />
}
