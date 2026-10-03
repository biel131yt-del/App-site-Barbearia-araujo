// Service Worker só de PUSH — FASE 6 (Web Push para o dono)
// Registrado com escopo /push/ para NÃO conflitar com o SW do next-pwa (escopo /).
// Arquivo estático: nunca importar nada aqui, só APIs do worker.

self.addEventListener("push", (event) => {
  let dados = { titulo: "Barbearia Araujo", corpo: "Novo agendamento!", url: "/admin" };
  try {
    if (event.data) dados = { ...dados, ...event.data.json() };
  } catch {
    /* usa padrão */
  }
  event.waitUntil(
    self.registration.showNotification(dados.titulo, {
      body: dados.corpo,
      icon: "/icon-notify.png",
      badge: "/icon-notify.png",
      data: { url: dados.url || "/admin" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      for (const j of janelas) {
        if (j.url.includes(url)) return j.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
