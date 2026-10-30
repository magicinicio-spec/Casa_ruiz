// Bloques que pulsan mientras llegan los datos, en lugar de un texto fijo.
export function Cargando() {
  return (
    <div className="cargando-bloques" aria-busy="true" aria-label="Cargando">
      <span className="esqueleto esqueleto--ancho" />
      <span className="esqueleto" />
      <span className="esqueleto esqueleto--corto" />
    </div>
  );
}
