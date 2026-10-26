// El sistema guarda y muestra las fechas como dd-MM-yyyy (y dd-MM-yyyy HH:mm). Los campos del navegador usan formato ISO.

/** "2026-11-14T10:30" (campo fecha y hora) -> "14-11-2026 10:30" */
export function aFechaHora(valor: string): string {
  if (!valor) return "";
  const [dia, hora] = valor.split("T");
  const [anio, mes, d] = dia.split("-");
  return `${d}-${mes}-${anio} ${hora ?? "00:00"}`;
}

/** "14-11-2026 10:30" -> "2026-11-14T10:30" */
export function desdeFechaHora(valor: string): string {
  const [dia, hora = "00:00"] = valor.split(" ");
  const [d, mes, anio] = dia.split("-");
  return `${anio}-${mes}-${d}T${hora}`;
}

/** "2026-11-14" (campo fecha) -> "14-11-2026" */
export function aFecha(valor: string): string {
  if (!valor) return "";
  const [anio, mes, dia] = valor.split("-");
  return `${dia}-${mes}-${anio}`;
}

/** "14-11-2026" -> "2026-11-14" */
export function desdeFecha(valor: string): string {
  const [dia, mes, anio] = valor.split("-");
  return `${anio}-${mes}-${dia}`;
}
