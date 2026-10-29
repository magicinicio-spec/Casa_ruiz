using CasaRuiz.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CasaRuiz.Api.Data;

/// <summary>Configuración de las tablas de cotizaciones.</summary>
public static class AppDbContextCotizaciones
{
    public static void Configurar(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cotizacion>(entity =>
        {
            entity.ToTable("cotizaciones");
            entity.Property(c => c.FechaHoraEntrega).HasColumnType("timestamp without time zone");
            entity.Property(c => c.DireccionEntrega).HasMaxLength(400).IsRequired();
            entity.HasOne(c => c.Cliente)
                .WithMany()
                .HasForeignKey(c => c.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CotizacionLinea>(entity =>
        {
            entity.ToTable("cotizacion_lineas", t =>
            {
                t.HasCheckConstraint("ck_cotizacion_lineas_cantidad_positiva", "\"Cantidad\" > 0");
                t.HasCheckConstraint("ck_cotizacion_lineas_un_tipo",
                    "(\"ArticuloId\" IS NULL) <> (\"PaqueteId\" IS NULL)");
            });
            entity.Property(l => l.Descripcion).HasMaxLength(200).IsRequired();
            entity.Property(l => l.PrecioUnitario).HasPrecision(12, 2);
            entity.HasOne(l => l.Cotizacion)
                .WithMany(c => c.Lineas)
                .HasForeignKey(l => l.CotizacionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CotizacionArticulo>(entity =>
        {
            entity.ToTable("cotizacion_articulos", t =>
                t.HasCheckConstraint("ck_cotizacion_articulos_cantidad_positiva", "\"Cantidad\" > 0"));
            entity.Property(a => a.Descripcion).HasMaxLength(200).IsRequired();
            entity.HasOne(a => a.CotizacionLinea)
                .WithMany(l => l.Articulos)
                .HasForeignKey(a => a.CotizacionLineaId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
