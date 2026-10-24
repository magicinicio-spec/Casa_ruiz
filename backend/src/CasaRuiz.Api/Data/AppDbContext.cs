using CasaRuiz.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CasaRuiz.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Articulo> Articulos => Set<Articulo>();

    public DbSet<Cliente> Clientes => Set<Cliente>();

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
    }
}
