# Tabla de Mareas

Web estática para consultar horarios de pleamar y bajamar, gráfico diario y calendario mensual por puerto.

## Tecnologías

- React + TypeScript + Vite
- Diseño responsive con Tailwind CSS
- Despliegue estático en Vercel

No requiere cuentas de usuarios, servidor propio, claves de API ni servicios de IA.

## Ejecutar en tu ordenador

Necesitas tener instalado Node.js.

```bash
npm install
npm run dev
```

Abre la dirección que muestre la terminal, normalmente `http://localhost:5173`.

## Publicar con GitHub y Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. En Vercel, selecciona **Add New → Project** e importa el repositorio.
3. Vercel detectará Vite automáticamente.
4. Pulsa **Deploy**.

Cada cambio que subas a la rama principal de GitHub generará un nuevo despliegue en Vercel.

## Comprobaciones antes de publicar

```bash
npm run build
```

Vercel ejecuta esa misma compilación durante el despliegue.

## Nota sobre los datos

La aplicación actual muestra una predicción orientativa. Antes de presentar mareas como oficiales se integrarán fuentes españolas autorizadas y se indicará siempre la fuente y la hora de actualización.
