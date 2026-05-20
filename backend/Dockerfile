# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY CobrosApi/CobrosApi.csproj CobrosApi/
RUN dotnet restore CobrosApi/CobrosApi.csproj

COPY . .
RUN dotnet publish CobrosApi/CobrosApi.csproj -c Release -o /app/publish

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "CobrosApi.dll"]
