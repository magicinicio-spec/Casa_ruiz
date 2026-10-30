import { useEffect, useState } from "react";
import { type Dashboard as DatosDashboard, ErrorApi, obtenerDashboard } from "./api";
import CifraAnimada from "./CifraAnimada";
import { BarrasHorizontales, Dona, GraficaDias } from "./Graficas";
import { Aviso } from "./ui";
import { Cargando } from "./Cargando";

interface Props {
  token: string;
}

export const formatoDinero = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export default function Dashboard({ token }: Props) {
  const [datos, setDatos] = useState<DatosDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerDashboard(token)
      .then(setDatos)
      .catch((err: unknown) => setError(err instanceof ErrorApi ? err.message : "No se pudo cargar el dashboard."));
  }, [token]);

  if (error) return <Aviso>{error}</Aviso>;
  if (!datos) return <Cargando />;

  const s = datos.semana;
  const sit = datos.situacion;
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <section className="dashboard">
      <header className="dashboard__saludo">
        <h2 className="titulo-subheading">{saludo}</h2>
        <p className="texto-caption">
          Hoy {datos.fecha} · Semana del {datos.inicioSemana} al {datos.finSemana}
        </p>
      </header>

      <div className="dash-grid animar">
        {/* Tarjeta principal: ingresos y pedidos de la semana */}
        <article className="panel dash-card dash-card--ancha dash-card--ambar">
          <div className="dash-card__cabecera">
            <div>
              <p className="tarjeta__titulo">Ingresos de la semana</p>
              <p className="dash-card__cifra-grande">{formatoDinero.format(s.ingresos)}</p>
            </div>
            <span className="estado">{s.total} pedidos</span>
          </div>
          <GraficaDias dias={datos.diasSemana} />
        </article>

        <article className="panel dash-card dash-card--cobalto">
          <p className="tarjeta__titulo">Pedidos para hoy</p>
          <p className="cifra"><CifraAnimada valor={datos.dia.pedidosParaHoy} /></p>
          <dl className="datos">
            <div className="dato"><dt>Pendientes de entregar</dt><dd>{datos.dia.pendientesDeEntregarHoy}</dd></div>
          </dl>
        </article>

        <article className="panel dash-card dash-card--violeta">
          <p className="tarjeta__titulo">Esta semana</p>
          <p className="cifra"><CifraAnimada valor={s.total} /></p>
          <dl className="datos">
            <div className="dato"><dt>Cancelados</dt><dd>{s.cancelados}</dd></div>
            <div className="dato"><dt>Cerrados</dt><dd>{s.cerrados}</dd></div>
          </dl>
        </article>

        <article className="panel dash-card dash-card--menta">
          <p className="tarjeta__titulo">Situación actual</p>
          <p className="cifra"><CifraAnimada valor={sit.colaEntrega} /></p>
          <dl className="datos">
            <div className="dato"><dt>Por recoger</dt><dd>{sit.porRecoger}</dd></div>
            <div className="dato"><dt>Próximos 7 días</dt><dd>{sit.proximosSieteDias}</dd></div>
            <div className="dato"><dt>Con daños sin resolver</dt><dd>{sit.conDanosSinResolver}</dd></div>
            <div className="dato"><dt>Saldo por cobrar</dt><dd>{formatoDinero.format(sit.saldoPorCobrar)}</dd></div>
          </dl>
        </article>

        <article className="panel dash-card dash-card--media">
          <p className="tarjeta__titulo">Estado de los pedidos de la semana</p>
          <div className="dona-fila">
            <Dona
              segmentos={[
                { etiqueta: "Por entregar", valor: s.pendientesDeEntregar, tono: 1 },
                { etiqueta: "Por recoger", valor: s.porRecoger, tono: 2 },
                { etiqueta: "Por revisar", valor: s.porRevisar, tono: 3 },
                { etiqueta: "Cerrados", valor: s.cerrados, tono: 4 },
              ]}
            />
            <ul className="leyenda">
              <li><span className="punto punto--ed" />Por entregar <strong>{s.pendientesDeEntregar}</strong></li>
              <li><span className="punto punto--b2" />Por recoger <strong>{s.porRecoger}</strong></li>
              <li><span className="punto punto--68" />Por revisar <strong>{s.porRevisar}</strong></li>
              <li><span className="punto punto--3a" />Cerrados <strong>{s.cerrados}</strong></li>
            </ul>
          </div>
        </article>

        <article className="panel dash-card dash-card--media">
          <p className="tarjeta__titulo">Piezas en renta ahora</p>
          {datos.ocupacion.length === 0 ? (
            <p className="texto-lead">No hay piezas en renta en este momento.</p>
          ) : (
            <BarrasHorizontales
              items={datos.ocupacion.map((o) => ({ nombre: o.descripcion, enRenta: o.enRenta, disponible: o.disponible }))}
            />
          )}
        </article>

        <article className="panel dash-card dash-card--ancha">
          <p className="tarjeta__titulo">Artículos más rentados esta semana</p>
          {datos.articulosMasRentados.length === 0 ? (
            <p className="texto-lead">Todavía no hay rentas esta semana.</p>
          ) : (
            <ol className="ranking">
              {datos.articulosMasRentados.map((articulo) => (
                <li key={articulo.articuloId} className="ranking__fila">
                  <span>{articulo.descripcion}</span>
                  <span className="ranking__cifra">{articulo.unidades}</span>
                </li>
              ))}
            </ol>
          )}
        </article>
      </div>
    </section>
  );
}
