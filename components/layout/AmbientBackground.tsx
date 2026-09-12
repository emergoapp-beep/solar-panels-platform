/**
 * Sfondo fisso, dietro a tutto il contenuto (vedi -z-10 in globals.css e stacking order).
 * Puramente decorativo: nessuna interazione, nessun impatto sulla leggibilità del testo.
 */
export default function AmbientBackground() {
  return (
    <div className="ambient-background" aria-hidden="true">
      <div className="ambient-grid" />
      <div className="ambient-blob ambient-blob-sun" />
      <div className="ambient-blob ambient-blob-energy" />
    </div>
  )
}
