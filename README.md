# PrintWorks - Frontend Público

Frontend público de **PrintWorks** para visualizar el catálogo de productos disponibles, gestionar el carrito de compras y realizar simulaciones de pedidos integradas con `cn1_ms_orders` y autenticación mediante **AWS Cognito**.

---

## 🎯 Objetivo

Proporcionar una interfaz web pública y moderna que permita a los clientes:
- Explorar el catálogo de productos de impresión 3D de PrintWorks sin necesidad de iniciar sesión.
- Gestionar un carrito de compras interactivo con persistencia local (`localStorage`) e indicador numérico reactivo en el Navbar.
- Registrarse como nuevo cliente (`SignUp`) e ingresar el código de verificación por correo (`ConfirmSignUp`) con **inicio de sesión automático e inmediato** (sin redirecciones innecesarias).
- Consultar su perfil de usuario (`/profile`), visualizando su estado de autenticación, User Pool ID, User Sub y los roles asignados por AWS Cognito (`cognito:groups`, ej. grupo `usuarios`).
- Autenticarse mediante AWS Cognito (utilizando directamente **Email y Contraseña** con cálculo nativo de `SECRET_HASH`) para completar la simulación de compra, enviando la orden a `cn1_ms_orders` (`POST /api/v1/orders/crear`) con su Bearer Token y descargando su comprobante PDF oficial.

---

## 🛠️ Tecnologías

- **React 19.2.8** - Biblioteca de JavaScript para interfaces de usuario modernas.
- **Vite 8.3.0** - Bundler y servidor de desarrollo ultrarrápido con proxy inverso.
- **Web Crypto API (SubtleCrypto)** - Cálculo nativo de `SECRET_HASH` con HMAC-SHA256 para clientes Cognito sin librerías externas pesadas.
- **React Router 7.18.3** - Enrutamiento client-side con HashRouter para compatibilidad total con GitHub Pages y servidores estáticos.
- **Bootstrap 5.3.8** - Framework CSS responsive y componentes accesibles.
- **CSS Variables** - Sistema integral de temas Light/Dark mode.
- **Vitest 5.0.0** - Framework de testing unitario y de integración veloz.
- **React Testing Library 16.3.3** - Testing de componentes enfocado en el usuario.

---

## 🏗️ Arquitectura del Proyecto

```text
src/
├── assets/              # Archivos estáticos e imágenes
├── components/          # Componentes reutilizables
│   ├── common/         # Navbar, Footer, LoginForm (AWS Cognito con email, registro y verificación)
│   ├── layout/         # MainLayout
│   └── products/       # ProductCard (con selector de cantidad y botón "+ Carro")
├── config/             # Configuraciones
│   └── cognitoConfig.js# Configuración de AWS Cognito (User Pool, Client ID, Secret y Rol)
├── context/            # Contextos globales de React
│   ├── AuthContext.jsx # Proveedor de autenticación (login, signUp, confirm, auto-login)
│   ├── CartContext.jsx # Proveedor y persistencia en localStorage del Carrito de Compras
│   └── ThemeContext.jsx# Proveedor de tema Light/Dark
├── pages/              # Vistas de la aplicación
│   ├── Home/          # Inicio con productos destacados y avisos de estado
│   ├── Catalog/       # Catálogo público con filtros y paginación
│   ├── ProductDetail/ # Detalle del producto con selector interactivo
│   ├── Cart/          # Carrito de compras y simulación de compra integrada
│   ├── Profile/       # Perfil de usuario (login, registro, verificación / datos Cognito)
│   └── NotFound/      # Página 404
├── routes/             # Rutas: /, /catalog, /products/:id, /cart, /profile, /login, /register, /verify
├── services/           # Servicios de API
│   ├── apiClient.js    # Cliente HTTP centralizado con manejo de errores y headers
│   ├── cognitoService.js # Servicio AWS Cognito con HMAC SECRET_HASH, login, signUp y confirm
│   ├── productService.js # Catálogo público (ms_products)
│   └── orderService.js   # Creación de pedidos y comprobantes (ms_orders)
├── styles/             # Variables CSS y diseño PrintWorks
├── test/               # Configuración y mocks de Vitest
├── utils/              # Utilidades de formateo (formatPrice en CLP)
├── App.jsx             # Árbol de proveedores (Theme, Auth, Cart, Router)
└── main.jsx            # Punto de entrada de la aplicación
```

---

## ⚙️ Instalación y Ejecución Local

### 1. Clonar el repositorio e instalar dependencias:
```bash
git clone <url-del-repositorio>
cd cn1_front_public
npm install
```

### 2. Configurar variables de entorno (`.env`):
Copia `.env.example` a `.env`:
```env
# En desarrollo local dejar vacío para usar el proxy de Vite:
VITE_API_BASE_URL=

# Configuración oficial de AWS Cognito:
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_COGNITO_CLIENT_SECRET=
VITE_REQUIRED_ROLE=
```

### 3. Iniciar el servidor de desarrollo:
```bash
npm run dev
```
El servidor se iniciará en `http://localhost:5174`.

### Proxy Local de Vite
En desarrollo local, Vite redirige automáticamente las peticiones a los microservicios correspondientes:
- `/api/v1/products` ➔ `http://localhost:8081` (`cn1_ms_products`)
- `/api/v1/orders` ➔ `http://localhost:8082` (`cn1_ms_orders`)

---

## 🔐 Configuración Requerida en AWS Cognito

Para que la autenticación directa con email y contraseña funcione correctamente sin Hosted UI, deben cumplirse las siguientes configuraciones en la consola de AWS Cognito:

### 1. Habilitar el Flujo `ALLOW_USER_PASSWORD_AUTH` (Obligatorio)
Por defecto, AWS Cognito deshabilita el flujo de usuario/contraseña directo en nuevos App Clients. Para activarlo:
1. En **AWS Cognito Console**, entra a tu User Pool: **`User pool - dv-psb`** (`us-east-1_KtdUxURf6`).
2. Ve a la pestaña **App integration** *(Integración de la aplicación)*.
3. Baja a **App clients and analytics** *(Clientes de aplicaciones y análisis)* y selecciona tu App Client: **`5r7v7nnaqhkjp8gs5muaovked2`**.
4. En la sección **Authentication flows** *(Flujos de autenticación)*, haz clic en **Edit** *(Editar)*.
5. Marca la casilla:
   - ☑ **`ALLOW_USER_PASSWORD_AUTH`** *(User password-based authentication)*.
6. Guarda los cambios.

### 2. Política de Contraseñas de Cognito (5 Factores)
El User Pool exige de forma estricta los siguientes requisitos:
- **Mínimo 8 caracteres**.
- Al menos **1 letra mayúscula** (`A-Z`).
- Al menos **1 letra minúscula** (`a-z`).
- Al menos **1 número** (`0-9`).
- Al menos **1 símbolo especial** (`!@#$%&*...`).

*La interfaz valida estos 5 requisitos en tiempo real con indicadores visuales antes de enviar el formulario.*

### 3. Asignación del Grupo / Rol (`usuarios`)
1. En el User Pool, ve a **User management** ➔ **Groups** *(Grupos)*.
2. Asegúrate de tener creado el grupo **`usuarios`**.
3. En la pestaña **Users** *(Usuarios)*, selecciona el correo del usuario y haz clic en **Add to group** seleccionando `usuarios`.
4. Al autenticarse, el token JWT contendrá el claim `"cognito:groups": ["usuarios"]`, el cual se refleja como rol activo en la vista de **Perfil**.

---

## 🚀 Flujos y Funcionalidades de la Aplicación

### 🛒 1. Carrito de Compras Interactivo
- **Badge reactivo en Navbar**: Muestra en tiempo real la cantidad total de unidades seleccionadas.
- **Agregar desde Catálogo o Detalle**: Botón rápido "+ Carro" y selector de cantidad con botones `+` / `-`.
- **Persistencia en `localStorage`**: El contenido del carrito se conserva entre recargas de página o reinicio del navegador.
- **Control de cantidades**: Límite de hasta 30 unidades por ítem, eliminación individual y vaciado con un clic.
- **Cálculo de subtotales**: Formato oficial de precios en pesos chilenos (CLP).

### 👤 2. Registro, Verificación y Auto-Login sin Fricción
- **Rutas directas**:
  - `#/login` o `#/profile`: Formulario de inicio de sesión.
  - `#/register`: Formulario de registro de nuevo cliente.
  - `#/verify`: Pantalla directa de confirmación con código de 6 dígitos.
- **Flujo Fluido**:
  1. El cliente llena el formulario de registro (`email`, `contraseña`, `confirmar contraseña`).
  2. Al presionar **Crear Cuenta**, el formulario pasa inmediatamente a la pantalla de **Verificar Correo Electrónico**.
  3. El cliente ingresa el código de 6 dígitos que llegó a su correo.
  4. La aplicación ejecuta `confirmSignUp` y realiza **auto-login inmediato** con sus credenciales.
  5. El usuario queda conectado al instante viendo su perfil o su carrito listo para comprar, **sin volver al login ni requerir escribir su contraseña nuevamente**.
- **Atajos para cuentas existentes**: Si el usuario intenta registrar un correo ya creado o no confirmado, la app le ofrece un botón directo para verificar el código pendiente o reenviar uno nuevo.

### 📦 3. Simulación de Compra hacia `ms_orders`
- **Requerimiento de Autenticación**: En la vista del carrito (`/cart`), si el cliente no está logueado, se despliega el formulario de login/registro sin perder los productos seleccionados.
- **Envío con Token de Cognito**:
  - Obtiene el token oficial (`Bearer <IdToken/AccessToken>`).
  - Envía la petición a `POST /api/v1/orders/crear` con el header `Authorization`.
  - **No envía precios** (respetando la regla de negocio de `ms_orders`).
  - Payload enviado:
    ```json
    {
      "customerName": "Nombre Cliente",
      "customerEmail": "usuario@printworks.cl",
      "items": [
        { "idProduct": 1, "quantity": 2 }
      ]
    }
    ```
- **Confirmación y Comprobante PDF**:
  - Al crearse la orden, se vacía el carrito automáticamente.
  - Se muestra el número visible de pedido (ej. `PW-000001`), estado `CREATED` y total oficial calculado por el backend.
  - Botón interactivo para **Descargar Comprobante PDF** consumiendo `GET /api/v1/orders/{id}/receipt` con el Token de Cognito.

---

## 🧪 Pruebas Automatizadas (Vitest)

Para ejecutar la suite completa de pruebas:
```bash
npm test -- --run
```

**Estado actual validado:**
- **13 archivos de prueba** ejecutados exitosamente.
- **84 pruebas automatizadas** pasando al 100% sin errores.
- Cobertura completa de:
  - `cognitoService` (login, signUp, confirmSignUp, resendCode, HMAC SECRET_HASH).
  - `AuthContext` y `CartContext` (persistencia y estado reactivo).
  - `orderService` y `productService`.
  - Componentes de UI: `LoginForm`, `Navbar`, `ProductCard`, `ProductDetail`, `Catalog`, `Home`, `Profile`, `Cart` y utilidades de formato.

---

## 📦 Build para Producción

```bash
npm run build
```
Genera los archivos estáticos optimizados en `dist/`, listos para ser desplegados en GitHub Pages o cualquier servidor web estático.

---

## 📄 Licencia

Este proyecto forma parte de la solución Cloud Native de **PrintWorks** (Duoc UC).
