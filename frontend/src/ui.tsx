import type { ReactNode } from "react";

export function Aviso({ tipo = "error", children }: { tipo?: "error" | "info"; children: ReactNode }) {
  return (
    <div className={`aviso aviso--${tipo}`} role={tipo === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function Encabezado({ titulo, accion }: { titulo: string; accion?: ReactNode }) {
  return (
    <div className="encabezado-seccion">
      <h1 className="titulo-heading-lg">{titulo}</h1>
      {accion}
    </div>
  );
}

export function Campo({
  etiqueta,
  children,
  className = "",
}: {
  etiqueta: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`campo ${className}`}>
      <span className="campo__etiqueta">{etiqueta}</span>
      {children}
    </label>
  );
}

export function Casilla({ etiqueta, checked, onChange }: { etiqueta: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="casilla">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{etiqueta}</span>
    </label>
  );
}

export function Vacio({ children }: { children: ReactNode }) {
  return <p className="texto-lead">{children}</p>;
}
