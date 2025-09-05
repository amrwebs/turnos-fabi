# Sistema de Turnos — Versión Pro (Frontend demo)

- **Plantillas (pre-terminados):** cargá horarios rápidos (ej. Lun-Vie 9–15 cada 30min) y editálas o creá nuevas.
- **Sin auto-seeding:** el cliente **no ve horarios** hasta que Fabi los cargue con plantillas.
- **Precio y contacto editables:** desde el panel (WhatsApp y link de MP).
- **Tema minimalista B/N** con **fondo madera blanca** responsive.

## Cómo usar
1) Abrí `admin.html` → definí precio/WhatsApp/MP y guardá.
2) Elegí una **plantilla** o creá una nueva. Aplicala a **esta semana** o a un **rango de fechas**.
3) Revisá la sección **Hoy** y bloqueá/abrí slots si hace falta.
4) En `index.html` el cliente verá solo lo que cargaste. Sin turnos cargados, aparece el aviso.

> Este demo guarda todo en `localStorage`. Para producción: Firebase Auth + Firestore + Webhooks de Mercado Pago.


## Servicios (editable)
- En el **Panel** podés crear/editar/eliminar servicios (nombre, precio y duración).
- En la página pública el cliente elige el **Servicio** y el total se muestra con el precio del servicio seleccionado.
- (Demo) Los slots siguen siendo del tamaño que definas en la plantilla. Para producción se puede hacer que servicios de mayor duración reserven 2+ slots consecutivos automáticamente.
