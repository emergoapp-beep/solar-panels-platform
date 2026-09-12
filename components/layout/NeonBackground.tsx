/**
 * Sfondo fisso, dietro a tutto il contenuto (vedi -z-10 in globals.css e stacking order).
 * Puramente decorativo: nessuna interazione, nessun impatto sulla leggibilità del testo.
 */
export default function NeonBackground() {
  return (
    <div className="neon-background" aria-hidden="true">
      <div className="neon-grid" />
      <div className="neon-blob neon-blob-blue" />
      <div className="neon-blob neon-blob-cyan" />
      <div className="neon-blob neon-blob-green" />
      <div className="neon-scanline" />
    </div>
  )
}
