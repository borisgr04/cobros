# Infraestructura Azure - Cobros v2

Este directorio contiene los archivos de Infrastructure as Code (IaC) usando Bicep para desplegar la aplicación Angular en Azure Storage Account como sitio web estático.

## 📋 Prerrequisitos

1. **Azure CLI** instalado y autenticado
   ```powershell
   az login
   az account set --subscription "Visual Studio Professional Subscription"
   ```

2. **Node.js y npm** para compilar la aplicación Angular

3. **Permisos en Azure**:
   - Contribuidor en el grupo de recursos
   - Permisos para crear Storage Accounts

## 🚀 Despliegue Rápido

### Opción 1: Script PowerShell (Recomendado)

```powershell
# Despliegue básico en ambiente dev
.\infra\deploy.ps1

# Despliegue con CDN habilitado
.\infra\deploy.ps1 -EnableCdn

# Despliegue en producción
.\infra\deploy.ps1 -Environment prod -EnableCdn

# Despliegue en un grupo de recursos específico
.\infra\deploy.ps1 -ResourceGroupName "RG-COBROS-PROD" -Location "eastus2"
```

### Opción 2: Azure CLI Manual

```powershell
# 1. Crear grupo de recursos (si no existe)
az group create --name RG-AI-DEV --location eastus

# 2. Previsualizar cambios
az deployment group what-if `
  --resource-group RG-AI-DEV `
  --template-file infra/main.bicep `
  --parameters infra/main.bicepparam

# 3. Desplegar infraestructura
az deployment group create `
  --resource-group RG-AI-DEV `
  --template-file infra/main.bicep `
  --parameters infra/main.bicepparam `
  --name cobrosv2-deployment

# 4. Habilitar sitio web estático
$storageAccount = az deployment group show `
  --resource-group RG-AI-DEV `
  --name cobrosv2-deployment `
  --query properties.outputs.storageAccountName.value -o tsv

az storage blob service-properties update `
  --account-name $storageAccount `
  --static-website `
  --404-document index.html `
  --index-document index.html

# 5. Compilar aplicación
npm run build

# 6. Subir archivos
az storage blob upload-batch `
  --account-name $storageAccount `
  --auth-mode login `
  --destination '$web' `
  --source dist/cobros-app/browser `
  --overwrite
```

## 📁 Estructura de Archivos

```
infra/
├── main.bicep           # Plantilla principal Bicep
├── main.bicepparam      # Parámetros de configuración
├── deploy.ps1           # Script de despliegue automatizado
└── README.md            # Este archivo
```

## ⚙️ Parámetros Configurables

| Parámetro | Descripción | Valores | Default |
|-----------|-------------|---------|---------|
| `appName` | Nombre de la aplicación | string | `cobrosv2` |
| `environment` | Ambiente de despliegue | `dev`, `staging`, `prod` | `dev` |
| `location` | Región de Azure | Cualquier región | `resourceGroup().location` |
| `storageSku` | SKU del Storage Account | `Standard_LRS`, `Standard_GRS`, etc. | `Standard_LRS` |
| `enableCdn` | Habilitar CDN de Azure | `true`, `false` | `false` |

## 🏗️ Recursos Creados

### Storage Account
- **Tipo**: StorageV2
- **Características**:
  - Sitio web estático habilitado
  - Solo HTTPS permitido
  - TLS 1.2 mínimo
  - Encriptación habilitada
  - Autenticación OAuth por defecto

### CDN (Opcional)
- **SKU**: Standard_Microsoft
- **Características**:
  - Compresión Gzip habilitada
  - Caché optimizado para SPA
  - Solo HTTPS

## 🌐 URLs de Acceso

Después del despliegue, obtendrás:

1. **URL del Storage Account**:
   ```
   https://{storageAccountName}.z13.web.core.windows.net/
   ```

2. **URL del CDN** (si está habilitado):
   ```
   https://{cdnEndpointName}.azureedge.net/
   ```

## 🔧 Configuración Post-Despliegue

### Configurar Dominio Personalizado

```powershell
# Agregar CNAME en tu DNS apuntando a:
# {storageAccountName}.z13.web.core.windows.net

# Configurar dominio personalizado
az storage account update `
  --name {storageAccountName} `
  --resource-group RG-AI-DEV `
  --custom-domain {tudominio.com}
```

### Configurar CORS (si es necesario)

```powershell
az storage cors add `
  --account-name {storageAccountName} `
  --services b `
  --methods GET POST OPTIONS `
  --origins '*' `
  --allowed-headers '*' `
  --exposed-headers '*' `
  --max-age 200
```

## 🔒 Seguridad

- ✅ HTTPS obligatorio
- ✅ TLS 1.2+ requerido
- ✅ Acceso por clave compartida deshabilitado
- ✅ OAuth por defecto
- ✅ Encriptación en reposo habilitada
- ✅ Acceso público controlado (solo para $web container)

## 📊 Monitoreo

### Ver logs de despliegue
```powershell
az deployment group show `
  --resource-group RG-AI-DEV `
  --name cobrosv2-deployment `
  --query properties.outputs
```

### Ver métricas del Storage Account
```powershell
az monitor metrics list `
  --resource {storageAccountId} `
  --metric "Transactions" "SuccessE2ELatency"
```

## 🗑️ Limpieza

Para eliminar todos los recursos:

```powershell
az deployment group delete `
  --resource-group RG-AI-DEV `
  --name cobrosv2-deployment

# O eliminar todo el grupo de recursos
az group delete --name RG-AI-DEV --yes
```

## 🐛 Troubleshooting

### Error: "Storage account name already taken"
El nombre del storage account debe ser único globalmente. Cambia el parámetro `appName` o espera a que el nombre sea liberado.

### Error: "Forbidden" al subir archivos
Verifica que tienes permisos de "Storage Blob Data Contributor" en el Storage Account.

### La aplicación muestra 404
Asegúrate de que:
1. Los archivos estén en el contenedor `$web`
2. El sitio web estático esté habilitado
3. `index.html` esté en la raíz

## 📚 Recursos Adicionales

- [Azure Storage Static Website](https://docs.microsoft.com/azure/storage/blobs/storage-blob-static-website)
- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure CDN](https://docs.microsoft.com/azure/cdn/)
