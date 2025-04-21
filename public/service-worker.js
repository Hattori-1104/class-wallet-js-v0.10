/// <reference lib="webworker" />


self.addEventListener("install", (e) => {
  self.skipWaiting()
  console.log("[SW] installed");
});

self.addEventListener("activate", (e) => {
  self.clients.claim()
  console.log("[SW] activated")
})

self.addEventListener("push", (e) => {
	console.log("[SW] push", e)
	self.registration.showNotification("test", {
		body: e.data.text().message,
	})
})
