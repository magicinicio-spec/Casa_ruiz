using CasaRuiz.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CasaRuiz.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Articulo> Articulos => Set<Articulo>();

    public DbSet<Cliente> Clientes => Set<Cliente>();

    public DbSet<Paquete> Paquetes => Set<Paquete>();

    public DbSet<PaqueteArticulo> PaqueteArticulos => Set<PaqueteArticulo>();

    public DbSet<Pedido> Pedidos => Set<Pedido>();

    public DbSet<PedidoLinea> PedidoLineas => Set<PedidoLinea>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Articulo>(entity =>
        {
            entity.ToTable("articulos");
            entity.Property(a => a.Descripcion).HasMaxLength(200).IsRequired();
            entity.Property(a => a.Categoria).HasMaxLength(100).IsRequired();
            entity.Property(a => a.PrecioRenta).HasPrecision(12, 2);
            entity.HasIndex(a => a.Categoria);
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("ck_articulos_precio_no_negativo", "\"PrecioRenta\" >= 0");
                t.HasCheckConstraint("ck_articulos_existencia_no_negativa", "\"ExistenciaTotal\" >= 0");
            });
        });

        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.ToTable("clientes");
            entity.Property(c => c.NombreCompleto).HasMaxLength(200).IsRequired();
            entity.Property(c => c.Telefono).HasMaxLength(30).IsRequired();
            entity.Property(c => c.Direccion).HasMaxLength(400).IsRequired();
        });

        modelBuilder.Entity<Paquete>(entity =>
        {
            entity.ToTable("paquetes");
            entity.Property(p => p.Nombre).HasMaxLength(200).IsRequired();
            entity.Property(p => p.PrecioRenta).HasPrecision(12, 2);
            entity.ToTable(t => t.HasCheckConstraint("ck_paquetes_precio_no_negativo", "\"PrecioRenta\" >= 0"));
        });

        modelBuilder.Entity<PaqueteArticulo>(entity =>
        {
            entity.ToTable("paquete_articulos", t =>
                t.HasCheckConstraint("ck_paquete_articulos_cantidad_positiva", "\"Cantidad\" > 0"));
            entity.HasKey(pa => new { pa.PaqueteId, pa.ArticuloId });
            entity.HasOne(pa => pa.Paquete)
                .WithMany(p => p.Componentes)
                .HasForeignKey(pa => pa.PaqueteId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(pa => pa.Articulo)
                .WithMany()
                .HasForeignKey(pa => pa.ArticuloId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Pedido>(entity =>
        {
            entity.ToTable("pedidos", t =>
                t.HasCheckConstraint("ck_pedidos_anticipo_no_negativo", "\"Anticipo\" >= 0"));
            entity.Property(p => p.DireccionEntrega).HasMaxLength(400).IsRequired();
            // Fecha y hora de entrega tal como la captura el usuario, sin conversión de zona horaria.
            entity.Property(p => p.FechaHoraEntrega).HasColumnType("timestamp without time zone");
            entity.Property(p => p.Anticipo).HasPrecision(12, 2);
            entity.Property(p => p.Estado).HasConversion<string>().HasMaxLength(20);
            entity.HasIndex(p => p.Estado);
            entity.HasOne(p => p.Cliente)
                .WithMany()
                .HasForeignKey(p => p.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PedidoLinea>(entity =>
        {
            entity.ToTable("pedido_lineas", t =>
            {
                t.HasCheckConstraint("ck_pedido_lineas_cantidad_positiva", "\"Cantidad\" > 0");
                t.HasCheckConstraint("ck_pedido_lineas_un_tipo",
                    "(\"ArticuloId\" IS NULL) <> (\"PaqueteId\" IS NULL)");
            });
            entity.Property(l => l.Descripcion).HasMaxLength(200).IsRequired();
            entity.Property(l => l.PrecioUnitario).HasPrecision(12, 2);
            entity.HasOne(l => l.Pedido)
                .WithMany(p => p.Lineas)
                .HasForeignKey(l => l.PedidoId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(l => l.Articulo)
                .WithMany()
                .HasForeignKey(l => l.ArticuloId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(l => l.Paquete)
                .WithMany()
                .HasForeignKey(l => l.PaqueteId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
