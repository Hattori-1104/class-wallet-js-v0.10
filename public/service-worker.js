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
	
	let title = "通知";
	let body = "新しい通知があります";
	
	if (e.data) {
		try {
			const data = e.data.json();
			title = data.title || title;
			body = data.body || body;
		} catch (error) {
			// JSON形式でない場合はテキストとして処理
			body = e.data.text() || body;
		}
	}
	
	const options = {
		body: body,
		icon: "/icon-192px.png",
		badge: "/icon-128px.png",
		tag: String(Date.now()),
		requireInteraction: false,
		actions: []
	};
	
	e.waitUntil(
		self.registration.showNotification(title, options)
	);
})
