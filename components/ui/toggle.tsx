"use client"

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-smooth ${
        checked ? "bg-primary" : "bg-card-border"
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-smooth ${
          checked ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  )
}
