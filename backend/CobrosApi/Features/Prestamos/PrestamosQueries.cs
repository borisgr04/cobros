using CobrosApi.Features.Shared;
using CobrosApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Features.Prestamos;

public static class PrestamosQueries
{
    /// <summary>Eager-load cuotas en la query.</summary>
    public static IQueryable<Prestamo> WithCuotas(this IQueryable<Prestamo> q)
        => q.Include(p => p.Cuotas);

    /// <summary>
    /// Filtra préstamos activos cuyo saldo (calculado desde cuotas) es menor al valor total.
    /// Equivale a: préstamos activos con al menos una cuota pendiente de pago.
    /// </summary>
    public static IQueryable<Prestamo> GetActivosConSaldo(this IQueryable<Prestamo> q)
        => q.Where(p => p.Estado == PrestamoEstados.Prestamo.Activo)
            .Include(p => p.Cuotas)
            .Where(p => p.Cuotas.Sum(c => c.SaldoPagado) < p.ValorTotal);
}
