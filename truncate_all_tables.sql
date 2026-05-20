-- Script para borrar todos los datos y reiniciar los IDs
-- Ejecutar en Supabase SQL Editor

TRUNCATE TABLE
    "Pagos",
    "Prestamos",
    "Clientes",
    "Zonas",
    "Usuarios"
RESTART IDENTITY CASCADE;
