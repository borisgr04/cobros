// ========================================
// Parámetros para el despliegue
// ========================================

using './main.bicep'

param appName = 'cobrosv2'
param environment = 'dev'
param storageSku = 'Standard_LRS'
param enableCdn = false
