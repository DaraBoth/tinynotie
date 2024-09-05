import { useEffect, useState } from "react";

const PUBLIC_VAPID_KEY =
  "BGfjmqSQgx7J6HXnvhxAGSOJ2h5W7mwrWYN8Cqa0Nql5nkoyyhlc49v_x-dIckFRm0rIeAgNxgfAfekqCwX8TNo";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const useServiceWorker = () => {
  const [registration, setRegistration] = useState(null);

  const registerServiceWorker = () => {
    if ("serviceWorker" in navigator) {
      // Register the service worker
      navigator.serviceWorker
        .register("/sw.js") // Ensure your service worker file is in the public folder
        .then((reg) => {
          console.log("Service worker registered: ", reg.scope);
          setRegistration(reg);
        })
        .catch((error) => {
          console.error("Service worker registration failed: ", error);
        });
    }
  };

  const requestNotificationPermission = (userInfo) => {
    if (registration) {
      const isPWA = window.matchMedia("(display-mode: standalone)").matches;
      if (!isPWA || !("Notification" in window)) return;
      Notification.requestPermission()
        .then((permission) => {
          console.log(`Notification permission status: ${permission}`);
          if (permission === "granted") {
            console.log("Notification permission granted.");
            subscribeUserToPush(registration, userInfo); // Subscribe user to push notifications
          } else {
            console.log("Notification permission denied.");
          }
        })
        .catch((error) => {
          console.error("Error requesting notification permission:", error);
        });
    }
  };

  const subscribeUserToPush = (reg, userInfo) => {
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
    };

    console.log(
      "Subscribing to push notifications with options:",
      subscribeOptions
    );

    reg.pushManager
      .subscribe(subscribeOptions)
      .then((pushSubscription) => {
        console.log(
          "Received PushSubscription: ",
          JSON.stringify(pushSubscription)
        );

        const deviceId = getOrCreateDeviceId();
        const deviceInfo = {
          deviceId: deviceId,
          userAgent: navigator.userAgent,
          subscription: pushSubscription,
          userInfo,
        };

        console.log("Device info to be sent to backend:", deviceInfo);
        sendDeviceInfoToBackend(deviceInfo);
      })
      .catch((error) => {
        console.error("Failed to subscribe the user: ", error);
      });
  };

  const getOrCreateDeviceId = () => {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = generateUUID();
      localStorage.setItem("device_id", deviceId);
      console.log("Generated new device ID:", deviceId);
    } else {
      console.log("Existing device ID found:", deviceId);
    }
    return deviceId;
  };

  const generateUUID = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  };

  const sendDeviceInfoToBackend = (deviceInfo) => {
    console.log("Sending device info to backend:", deviceInfo);
    fetch("https://tinynotie-api.vercel.app/openai/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deviceInfo),
    })
      .then((response) => {
        if (response.ok) {
          console.log(
            "Device info and subscription sent to server successfully."
          );
        } else {
          console.error(
            "Failed to send device info to server.",
            response.statusText
          );
        }
      })
      .catch((error) =>
        console.error("Error sending device info to server:", error)
      );
  };

  return { registerServiceWorker, requestNotificationPermission };
};

export default useServiceWorker;
