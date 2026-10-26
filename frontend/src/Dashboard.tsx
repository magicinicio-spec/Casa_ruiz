import { useEffect, useState } from "react";
import { type Dashboard as DatosDashboard, ErrorApi, obtenerDashboard } from "./api";

interface Props {
  token: string;
}

const formatoDinero = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Dashboard({ token }: Props) {
  const [datos, setDatos] = useState<DatosDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerDashboard(token)
      .then(setDatos)
      .catch((err: unknown) =>
        setError(err instanceof ErrorApi ? err.message : "No se pudo cargar el dashboard."),
      );
  }, [token]);

  if (error) {
    return <p className="login__error" role="alert">{error}</p>;
  }

  if (!datos) {
    return <p className="texto-lead">Cargando indicadores…</p>;
  }

  return (
    <section className="dashboard">
      <p className="texto-caption">
        Hoy {datos.fecha} · Semana del {datos.inicioSemana} al {datos.finSemana}
      </p>

      <div className="tarjetas">
        <Tarjeta titulo="Pedidos para hoy" cifra={datos.dia.pedidosParaHoy}>
          <Dato etiqueta="Pendientes de entregar" valor={datos.dia.pendientesDeEntregarHoy} />
        </Tarjeta>

        <Tarjeta titulo="Esta semana" cifra={datos.semana.total}>
          <Dato etiqueta="Pendientes de entregar" valor={datos.semana.pendientesDeEntregar} />
          <Dato etiqueta="Por recoger" valor={datos.semana.porRecoger} />
          <Dato etiqueta="Por revisar" valor={datos.semana.porRevisar} />
          <Dato etiqueta="Cerrados" valor={datos.semana.cerrados} />
          <Dato etiqueta="Cancelados" valor={datos.semana.cancelados} />
          <Dato etiqueta="Ingresos" valor={formatoDinero.format(datos.semana.ingresos)} />
        </Tarjeta>

        <Tarjeta titulo="Situación actual" cifra={datos.situacion.colaEntrega}>
          <Dato etiqueta="En cola de entrega" valor={datos.situacion.colaEntrega} />
          <Dato etiqueta="Por recoger" valor={datos.situacion.porRecoger} />
          <Dato etiqueta="Próximos 7 días" valor={datos.situacion.proximosSieteDias} />
          <Dato etiqueta="Con daños sin resolver" valor={datos.situacion.conDanosSinResolver} />
          <Dato etiqueta="Saldo por cobrar" valor={formatoDinero.format(datos.situacion.saldoPorCobrar)} />
        </Tarjeta>
      </div>

      <div className="tarjeta">
        <h2 className="titulo-subheading">Artículos más rentados esta semana</h2>
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
      </div>
    </section>
  );
}

function Tarjeta({
  titulo,
  cifra,
  children,
}: {
  titulo: string;
  cifra: number;
  children: React.ReactNode;
}) {
  return (
    <article className="tarjeta">
      <h2 className="texto-caption tarjeta__titulo">{titulo}</h2>
      <p className="cifra">{cifra}</p>
      <dl className="datos">{children}</dl>
    </article>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: number | string }) {
  return (
    <div className="dato">
      <dt>{etiqueta}</dt>
      <dd>{valor}</dd>
    </div>
  );
}
