# Edge Function: `translate` (Traducción Regulatoria Segura con Google Gemini)

Esta función intermediaria serverless corre en la infraestructura segura de **Supabase (Deno runtime)** y protege la clave privada de Google Gemini (`GEMINI_API_KEY`) para que **nunca se exponga al frontend del navegador ni al repositorio público de GitHub**.

---

## 🔒 Flujo de Seguridad

```
[ Navegador Admin ]
        |
        | 1. POST /functions/v1/translate con Bearer <JWT>
        v
[ Supabase Edge Function ]
        |
        | 2. Valida sesión JWT y rol ('administrador' o 'editor')
        | 3. Lee secreto de entorno GEMINI_API_KEY (servidor)
        v
[ Google Gemini API ]
        |
        | 4. Devuelve traducción JSON sanitizada
        v
[ Navegador Admin ]
```

---

## 🚀 Despliegue en Supabase

### Opción 1: Mediante Supabase CLI (Línea de Comandos)

1. **Configurar el Secreto de Gemini en Supabase**:
   ```bash
   supabase secrets set GEMINI_API_KEY="<tu-clave-de-gemini>" --project-ref mugtfugfabhrqcomynrs
   ```

2. **Desplegar la Función**:
   ```bash
   supabase functions deploy translate --project-ref mugtfugfabhrqcomynrs
   ```

---

### Opción 2: Desde el Dashboard de Supabase (Web UI)

1. Iniciar sesión en [https://supabase.com/dashboard/project/mugtfugfabhrqcomynrs](https://supabase.com/dashboard/project/mugtfugfabhrqcomynrs).
2. En el menú lateral, ir a **Edge Functions**.
3. Hacer clic en **"Create a new function"** y asignarle el nombre `translate`.
4. Pegar el contenido del archivo `index.ts`.
5. En la pestaña **Secrets** de las Edge Functions (o en **Project Settings -> Edge Functions -> Secrets**), agregar:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `<tu-clave-de-gemini>`
6. Guardar y desplegar.
