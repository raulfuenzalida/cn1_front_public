# PrintWorks - Frontend Público

Frontend público de PrintWorks para visualizar el catálogo de productos disponibles. Este proyecto consume exclusivamente los endpoints públicos existentes de `cn1_ms_products` a través de API Gateway.

## Objetivo

Proporcionar una interfaz web pública y moderna que permita a los clientes explorar el catálogo de productos de impresión 3D de PrintWorks, con visualización de productos, filtrado, paginación y navegación detallada.

## Tecnologías

- **React 19.2.8** - Framework de JavaScript para construir interfaces de usuario
- **Vite 8.3.0** - Herramienta de build y desarrollo rápida
- **JavaScript** - Lenguaje de programación principal
- **React Router 7.18.3** - Enrutamiento client-side con HashRouter para GitHub Pages
- **Bootstrap 5.3.8** - Framework CSS para diseño responsive
- **CSS Variables** - Sistema de temas light/dark
- **Vitest 5.0.0** - Framework de testing
- **React Testing Library 16.3.3** - Testing de componentes React

## Arquitectura

El proyecto sigue una estructura feature-first organizada:

```
src/
├── assets/              # Archivos estáticos
├── components/          # Componentes React
│   ├── common/         # Componentes reutilizables (Navbar, Footer)
│   ├── layout/         # Componentes de layout (MainLayout)
│   └── products/       # Componentes específicos de productos (ProductCard)
├── config/             # Configuraciones
├── context/            # Contextos React (ThemeContext)
├── layouts/            # Layouts principales
├── pages/              # Páginas de la aplicación
│   ├── Home/          # Página de inicio
│   ├── Catalog/       # Catálogo de productos
│   ├── ProductDetail/ # Detalle de producto
│   └── NotFound/      # Página 404
├── routes/             # Configuración de rutas
├── services/           # Servicios de API
│   ├── apiClient.js   # Cliente HTTP centralizado
│   └── productService.js # Servicio de productos
├── styles/             # Estilos globales y variables CSS
├── test/               # Configuración de tests
├── utils/              # Utilidades (formatPrice)
├── App.jsx             # Componente principal
└── main.jsx            # Punto de entrada
```

## Instalación

1. Clonar el repositorio
2. Navegar al directorio del proyecto:
   ```bash
   cd cn1_front_public
   ```
3. Instalar dependencias:
   ```bash
   npm install
   ```

## Ejecución Local

### Desarrollo

Para ejecutar el proyecto en modo desarrollo:

```bash
npm run dev
```

El servidor de desarrollo se iniciará en `http://localhost:5174`

### Proxy Local

En desarrollo local, el frontend utiliza un proxy de Vite para redirigir las requests de `/api/v1/products` al microservicio `cn1_ms_products` en `http://localhost:8081`.

No es necesario configurar `VITE_API_BASE_URL` en desarrollo local.

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto (ya existe un `.env.example` de referencia):

```env
VITE_API_BASE_URL=
```

**Desarrollo Local:**
- Dejar `VITE_API_BASE_URL` vacío para utilizar el proxy de Vite hacia `http://localhost:8081`

**Producción:**
- Configurar `VITE_API_BASE_URL=https://1335t86sik.execute-api.us-east-1.amazonaws.com`

## Endpoints Consumidos

Este frontend consume exclusivamente endpoints públicos de `cn1_ms_products`:

### Catálogo de Productos
- **GET** `/api/v1/products`
- **Parámetros:**
  - `page` - Número de página (default: 0)
  - `size` - Tamaño de página (default: 12)
  - `sort` - Ordenamiento (ej: `finalPrice,asc`, `name,desc`)
  - `name` - Búsqueda por nombre
  - `minPrice` - Precio mínimo
  - `maxPrice` - Precio máximo
- **Respuesta:** Objeto paginado con:
  - `content` - Array de productos
  - `totalElements` - Total de elementos
  - `totalPages` - Total de páginas
  - `number` - Página actual
  - `size` - Tamaño de página

### Detalle de Producto
- **GET** `/api/v1/products/{id}`
- **Respuesta:** Objeto producto completo

## Contrato Público de Productos

El frontend trabaja exclusivamente con los campos públicos de `ProductPublicResponse`:

- `id` - Identificador del producto
- `name` - Nombre del producto
- `description` - Descripción del producto
- `finalPrice` - Precio final (CLP)
- `tags` - Array de etiquetas
- `images` - Array de URLs de imágenes

**No se utilizan campos administrativos** como: `status`, `priceStatus`, `idFilament`, `filamentGrams`, `printingHours`, `profitPercentage`, etc.

## Regla de Disponibilidad

El backend (`cn1_ms_products`) garantiza que el catálogo público solo exponga productos con estado `ACTIVE` y `CURRENT`. Por lo tanto, el frontend **no filtra manualmente** estos estados - la fuente de verdad es el microservicio.

## Funcionalidades

### Home Page
- Hero section con branding de PrintWorks
- Productos destacados (primeros 3 productos)
- CTA para ver el catálogo completo
- Navegación intuitiva

### Catálogo
- Visualización de productos en cards responsive
- Filtrado por:
  - Nombre (búsqueda textual)
  - Precio mínimo
  - Precio máximo
  - Ordenamiento (precio ascendente/descendente, nombre A-Z/Z-A)
- Paginación con navegación entre páginas
- Estados de carga, error y vacío
- Responsive design (móvil, tablet, escritorio)

### Detalle de Producto
- Imagen principal con placeholder CSS (sin emoji)
- Manejo de error de carga de imagen
- Información completa del producto
- Precio formateado en CLP
- Tags del producto
- Navegación de breadcrumb
- Botón para volver al catálogo

### Temas
- Soporte completo para modo claro y oscuro
- Switch visual en el navbar (sin emojis)
- Persistencia en localStorage
- Variables CSS para consistencia
- Tema aplicado a: body, navbar, hero, cards, inputs, selects, botones, paginación, mensajes de error, estado vacío, footer, placeholders de imagen

## Testing

### Ejecutar Tests

```bash
npm test
```

### Tests Implementados

- **productService.test.js** - Tests del servicio de productos
  - Fetch de productos sin parámetros
  - Fetch con paginación
  - Fetch con filtros
  - Fetch de producto por ID
  - Manejo de errores de API
  - Manejo de respuestas vacías

- **formatUtils.test.js** - Tests de utilidades de formato
  - Formato de precios en CLP
  - Manejo de valores nulos
  - Manejo de números grandes

- **ProductCard.test.jsx** - Tests del componente de card de producto
  - Renderizado de información
  - Renderizado de imágenes
  - Fallback para imágenes (placeholder CSS)
  - Manejo de imágenes nulas/vacías
  - Manejo de error de carga de imagen
  - Renderizado de tags
  - Botón de navegación

- **Catalog.test.jsx** - Tests de la página de catálogo
  - Estado de carga
  - Visualización de productos
  - Estado vacío
  - Estado de error
  - Aplicación de filtros
  - Paginación

- **ProductDetail.test.jsx** - Tests de la página de detalle
  - Estado de carga
  - Visualización de producto
  - Estado de error
  - Producto no encontrado
  - Manejo de imágenes nulas/vacías
  - Navegación breadcrumb
  - Botón de regreso

- **Home.test.jsx** - Tests de la página de inicio
  - Estado de carga
  - Sección hero
  - Productos destacados
  - Estado vacío
  - Estado de error
  - Fetch de 3 productos
  - Enlace a catálogo completo

## Build

Para crear una versión de producción:

```bash
npm run build
```

Los archivos optimizados se generarán en el directorio `dist/`.

## Despliegue

### GitHub Pages

El proyecto está configurado para desplegarse en GitHub Pages utilizando:

- **Base path:** `/cn1_front_public/`
- **Router:** HashRouter (compatible con GitHub Pages)
- **GitHub Actions:** Workflow configurado en `.github/workflows/deploy-pages.yml`

El despliegue consiste en:
1. Build del proyecto con Vite
2. Ejecución de tests antes del build
3. Deploy del directorio `dist/` a GitHub Pages
4. Inyección de `VITE_API_BASE_URL` desde GitHub Secrets durante el build

**Variables de entorno para producción:**
- `VITE_API_BASE_URL`: URL de API Gateway (configurada en GitHub Secrets)

## Seguridad

Este frontend es público y **no implementa autenticación**:

- ❌ No almacena credenciales
- ❌ No incluye secretos
- ❌ No utiliza Client Secret
- ❌ No utiliza tokens administrativos
- ❌ No incluye MSAL/Entra ID
- ❌ No incluye Cognito
- ❌ No accede a endpoints `/admin`
- ❌ No accede directamente a RDS o ECS

**Arquitectura de comunicación:**
```
front_cliente → API Gateway → ms_products → products_db
```

Toda la comunicación ocurre a través de API Gateway utilizando endpoints públicos.

## Integración con ms_products

- **Dependencia:** El frontend depende exclusivamente de la API pública de `cn1_ms_products`
- **Sin modificaciones:** No se requiere modificar ningún microservicio existente
- **CORS:** API Gateway debe permitir CORS para el origen donde se publique el frontend
- **Versión:** Compatible con la versión actual de `cn1_ms_products`

## Limitaciones Actuales

Las siguientes funcionalidades **no están implementadas** en esta etapa:

- ❌ Carrito de compras
- ❌ Checkout/proceso de compra
- ❌ Creación de pedidos
- ❌ Historial de pedidos
- ❌ Login de clientes
- ❌ Autenticación (MSAL, Entra ID, Cognito)
- ❌ Pagos
- ❌ Comprobante PDF
- ❌ Panel administrativo

Estas funcionalidades se evaluarán en etapas posteriores.

## Identidad Visual

### Paleta de Colores PrintWorks

- **Primary:** `#606c38` - Verde oliva
- **Secondary:** `#283618` - Verde oscuro
- **Background:** `#fefae0` - Crema
- **Accent:** `#dda15e` - Dorado
- **Accent Dark:** `#bc6c25` - Naranja oscuro

### Diseño

- Limpio y moderno
- Responsive design
- Navegación superior apropiada para clientes
- Coherente con la identidad PrintWorks
- No replica el sidebar administrativo

## Criterios de Aceptación

La tarea se considera completada cuando:

1. ✅ El proyecto compila correctamente
2. ✅ `npm run dev` funciona en puerto 5174
3. ✅ GET `/api/v1/products` muestra productos reales
4. ✅ Solo aparecen productos que `ms_products` entrega públicamente
5. ✅ No existen productos mock en el flujo real
6. ✅ Se puede abrir el detalle de un producto
7. ✅ Las imágenes tienen placeholder CSS (sin emoji)
8. ✅ Manejo de error de carga de imagen
9. ✅ Los precios se muestran en CLP
10. ✅ La paginación funciona
11. ✅ Los filtros implementados consultan al backend
12. ✅ La interfaz funciona en móvil y escritorio
13. ✅ Light/Dark mode funciona correctamente en todos los componentes
14. ✅ Los estados loading/error/empty funcionan
15. ✅ `npm test` pasa (todos los tests)
16. ✅ `npm run build` termina correctamente
17. ✅ README y `.env.example` están actualizados
18. ✅ GitHub Actions workflow configurado
19. ✅ No existe dependencia de autenticación
20. ✅ No se modificó ningún microservicio
21. ✅ No se duplican reglas del backend en el frontend

## Licencia

Este proyecto es parte del desarrollo cloud native de PrintWorks.
