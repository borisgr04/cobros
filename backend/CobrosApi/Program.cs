using System.Text;
using CobrosApi.Data;
using CobrosApi.Services;
using Fido2NetLib;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ─── Database ───────────────────────────────────────────────────────────────
// UseInMemoryDb: true  → base de datos en memoria (sin PostgreSQL requerido)
// UseInMemoryDb: false → PostgreSQL con la ConnectionString DefaultConnection
var useInMemory = builder.Configuration.GetValue<bool>("UseInMemoryDb");

builder.Services.AddDbContext<CobrosDbContext>(opts =>
{
    if (useInMemory)
        opts.UseInMemoryDatabase("CobrosDb");
    else
        opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// ─── CORS ───────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? ["http://localhost:4200"];

builder.Services.AddCors(opts =>
    opts.AddPolicy("CobrosPolicy", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

// ─── JWT Authentication ─────────────────────────────────────────────────────
var jwtSecret  = builder.Configuration["Jwt:Secret"]   ?? throw new InvalidOperationException("Jwt:Secret no configurado");
var jwtIssuer  = builder.Configuration["Jwt:Issuer"]   ?? "CobrosApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "CobrosApp";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtIssuer,
            ValidAudience            = jwtAudience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew                = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ─── Services ───────────────────────────────────────────────────────────────
builder.Services.AddScoped<TokenService>();

// ─── Distributed Cache (in-memory; swap for Redis in production) ────────────
builder.Services.AddDistributedMemoryCache();

// ─── Fido2 / WebAuthn ───────────────────────────────────────────────────────
var fido2Origin   = builder.Configuration["Fido2:Origin"]     ?? "https://localhost:4200";
var fido2RpId     = builder.Configuration["Fido2:RpId"]       ?? "localhost";
var fido2RpName   = builder.Configuration["Fido2:ServerName"] ?? "Cobros";
builder.Services.AddSingleton(new Fido2(new Fido2.Configuration
{
    Origin     = fido2Origin,
    ServerDomain = fido2RpId,
    ServerName = fido2RpName
}));
builder.Services.AddControllers();

// ─── Swagger / OpenAPI ──────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opts =>
{
    opts.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "CobrosApi",
        Version     = "v1",
        Description = "API REST para gestión de préstamos, clientes, pagos y zonas"
    });

    // Soporte para JWT en Swagger UI
    opts.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        Description  = "Ingresá el JWT token (sin el prefijo 'Bearer')"
    });
    opts.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            []
        }
    });
});

// ─── JSON: camelCase + fechas sin timezone offset ───────────────────────────
builder.Services.ConfigureHttpJsonOptions(opts =>
{
    opts.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});
builder.Services.AddControllers().AddJsonOptions(opts =>
{
    opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// ────────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ─── Inicialización de BD ───────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CobrosDbContext>();
    if (db.Database.IsInMemory())
        db.Database.EnsureCreated();   // Crea schema + seed en InMemory
    else
        db.Database.Migrate();         // Aplica migraciones en PostgreSQL
}

// ─── Pipeline ───────────────────────────────────────────────────────────────
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});
app.UseSwagger();
app.UseSwaggerUI(opts => opts.SwaggerEndpoint("/swagger/v1/swagger.json", "CobrosApi v1"));
// CORS debe ir antes del manejo de excepciones para que los headers
// se incluyan incluso cuando el servidor responde con un error 5xx
app.UseCors("CobrosPolicy");
app.UseExceptionHandler(errApp =>
    errApp.Run(async ctx =>
    {
        ctx.Response.StatusCode  = 500;
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsync("{\"error\":\"Error interno del servidor\"}");
    }));
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ─── Health check mínimo ────────────────────────────────────────────────────
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .AllowAnonymous();

app.Run();

// Hace visible la clase Program al proyecto de tests
public partial class Program { }
