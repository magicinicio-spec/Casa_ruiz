import { useEffect, useState } from "react";

// Gráficas en SVG propio: monocromas, con un solo degradado violeta como acento.
// Se animan al aparecer. Con "reducir movimiento" activado aparecen ya dibujadas (ver styles.css).

export function GraficaDias({ dias }: { dias: { dia: string; pedidos: number; ingresos: number }[] }) {
  const ancho = 700;
  const alto = 240;
  const base = 200;
  const maximo = Math.max(1, ...dias.map((d) => d.pedidos));
  const paso = ancho / dias.length;
  const grosor = paso * 0.46;

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="grafica" role="img" aria-label="Pedidos por día de la semana">
      <defs>
        <linearGradient id="degradado-barra" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ededed" />
          <stop offset="100%" stopColor="#6b62f2" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={0} x2={ancho} y1={base - (base - 20) * f} y2={base - (base - 20) * f} className="grafica__guia" />
      ))}

      {dias.map((d, i) => {
        const altura = (d.pedidos / maximo) * (base - 30);
        const x = i * paso + (paso - grosor) / 2;
        return (
          <g key={d.dia}>
            <rect
              x={x}
              y={base - altura}
              width={grosor}
              height={Math.max(altura, d.pedidos > 0 ? 6 : 2)}
              rx={10}
              fill={d.pedidos > 0 ? "url(#degradado-barra)" : "#262626"}
              className="grafica__barra"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <title>{`${d.dia}: ${d.pedidos} pedidos`}</title>
            </rect>
            <text x={x + grosor / 2} y={base - altura - 10} textAnchor="middle" className="grafica__valor">
              {d.pedidos}
            </text>
            <text x={x + grosor / 2} y={base + 26} textAnchor="middle" className="grafica__eje">
              {d.dia}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Dona({ segmentos }: { segmentos: { etiqueta: string; valor: number; color: string }[] }) {
  const total = segmentos.reduce((suma, s) => suma + s.valor, 0);
  const radio = 80;
  const longitud = 2 * Math.PI * radio;
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMontado(true), 50);
    return () => window.clearTimeout(t);
  }, []);

  let acumulado = 0;

  return (
    <div className="dona">
      <svg viewBox="0 0 220 220" role="img" aria-label="Estado de los pedidos de la semana">
        <circle cx="110" cy="110" r={radio} className="dona__base" />
        {total > 0 &&
          segmentos.map((s) => {
            const largo = (s.valor / total) * longitud;
            const desplazamiento = -acumulado;
            acumulado += largo;
            return (
              <circle
                key={s.etiqueta}
                cx="110"
                cy="110"
                r={radio}
                fill="none"
                stroke={s.color}
                strokeWidth={22}
                strokeLinecap="round"
                strokeDasharray={montado ? `${Math.max(largo - 6, 0)} ${longitud}` : `0 ${longitud}`}
                strokeDashoffset={desplazamiento}
                transform="rotate(-90 110 110)"
                className="dona__segmento"
              >
                <title>{`${s.etiqueta}: ${s.valor}`}</title>
              </circle>
            );
          })}
      </svg>
      <div className="dona__centro">
        <span className="dona__total">{total}</span>
        <span className="texto-caption">pedidos</span>
      </div>
    </div>
  );
}

export function BarrasHorizontales({ items }: { items: { nombre: string; enRenta: number; disponible: number }[] }) {
  const maximo = Math.max(1, ...items.map((i) => i.enRenta + i.disponible));

  return (
    <ul className="barras-h">
      {items.map((i, idx) => {
        const total = i.enRenta + i.disponible;
        return (
          <li key={i.nombre} className="barras-h__fila">
            <div className="barras-h__texto">
              <span>{i.nombre}</span>
              <span className="texto-caption">
                {i.enRenta} en renta · {i.disponible} disponibles
              </span>
            </div>
            <div className="barras-h__pista" aria-hidden>
              <span
                className="barras-h__relleno"
                style={{ width: `${(i.enRenta / maximo) * 100}%`, animationDelay: `${idx * 90}ms` }}
              />
              <span className="barras-h__libre" style={{ width: `${(i.disponible / maximo) * 100}%` }} />
            </div>
            <span className="barras-h__total">{total}</span>
          </li>
        );
      })}
    </ul>
  );
}
