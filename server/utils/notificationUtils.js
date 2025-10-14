import webPush from "web-push";
import { pool } from "./dbUtils.js";
import emailjs from "@emailjs/nodejs";
import moment from "moment";

/**
 * Send a notification to a subscription
 * @param {Object} subscription - The subscription object
 * @param {Object} data - The data to send
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const sendNotification = async  (subscription, data, req, res) => {
  return await webPush
    .sendNotification(subscription, JSON.stringify(data))
    .then((response) => {
      console.log("Notification sent successfully", response);
      res.json({
        status: true,
        message: "Notification sent successfully",
        response,
      });
    })
    .catch((error) => {
      console.error("Error sending notification", error);
      res.send({
        status: false,
        message: "Error sending notification",
        error,
      });
    });
};

export const sendNotificationToUserEachDevice = async (userId,payload) => {
  try {
    // Query to fetch all subscriptions
    const query = `
      SELECT endpoint, keys, expiration_time 
      FROM subscriptions WHERE user_id = $1;
    `;
    const client = await pool.connect();
    const result = await client.query(query, [userId]);

    if (!result.rows || result.rows.length === 0) {
      return {
        status: false,
        message: "No subscriptions found for this user to send notifications.",
      };
    }

    // Map subscription data into the format required by webPush
    const subscriptions = result.rows.map((row) => ({
      endpoint: row.endpoint,
      keys: row.keys, // Ensure keys are parsed as JSON
    }));

    // Send notifications to all subscriptions
    const notificationPromises = subscriptions.map((subscription) =>
      webPush.sendNotification(subscription, JSON.stringify(payload))
    );

    // Wait for all notifications to resolve
    const results = await Promise.allSettled(notificationPromises);

    const successful = results.filter(
      (result) => result.status === "fulfilled"
    );
    const failed = results.filter((result) => result.status === "rejected");

    return {
      status: true,
      message: "Notifications processed.",
      summary: {
        total: subscriptions.length,
        successful: successful.length,
        failed: failed.length,
      },
    };
  } catch (error) {
    console.error("Error sending batch notifications", error);
    return {
      status: false,
      message: "Error sending batch notifications",
      error,
    };
  }
};


/**
 * Send a batch notification to all subscriptions
 * @param {Object} payload - The payload to send
 * @returns {Promise<Object>} - A promise that resolves with the result
 */
export const sendBatchNotification = async (payload) => {
  console.log({ payload });
  try {
    // Query to fetch all subscriptions
    const query = `
      SELECT endpoint, keys, expiration_time 
      FROM subscriptions;
    `;
    const client = await pool.connect();
    const result = await client.query(query);

    if (!result.rows || result.rows.length === 0) {
      return {
        status: false,
        message: "No subscriptions found to send notifications.",
      };
    }

    // Map subscription data into the format required by webPush
    const subscriptions = result.rows.map((row) => ({
      endpoint: row.endpoint,
      keys: row.keys, // Ensure keys are parsed as JSON
    }));

    // Send notifications to all subscriptions
    const notificationPromises = subscriptions.map((subscription) =>
      webPush.sendNotification(subscription, JSON.stringify(payload))
    );

    // Wait for all notifications to resolve
    const results = await Promise.allSettled(notificationPromises);

    const successful = results.filter(
      (result) => result.status === "fulfilled"
    );
    const failed = results.filter((result) => result.status === "rejected");

    return {
      status: true,
      message: "Batch notifications processed.",
      summary: {
        total: subscriptions.length,
        successful: successful.length,
        failed: failed.length,
      },
    };
  } catch (error) {
    console.error("Error sending batch notifications", error);
    return {
      status: false,
      message: "Error sending batch notifications",
      error,
    };
  }
};

/**
 * Send an email notification
 * @param {string} question - The question
 * @param {string} answer - The answer
 */
export const sendEmail = (question, answer) => {
  emailjs
    .send(
      "service_1q4mqel",
      "template_nw1vp7x",
      {
        from_name: "Ask Now",
        to_name: "Vong Pich Daraboth",
        from_email: "Ask now Assist AI",
        to_email: "daraboth0331@gmail.com",
        message: `Question : ${question}

                Answer : ${answer}`,
      },
      {
        publicKey: "FTfXkTunMtI_tIlGC",
        privateKey: "FfAmlGo-tjwOoIQZjQRu2", // optional, highly recommended for security reasons
      }
    )
    .then(
      (response) => {
        console.log("SUCCESS!", response.status, response.text);
      },
      (err) => {
        console.log("FAILED...", err);
      }
    );
};

/**
 * Send a batch monitor email
 * @param {string} message - The message to send
 * @returns {Promise} - A promise that resolves with the result
 */
export const sendBatchMonitorEmail = async (message) => {
  const response = await emailjs.send(
    process.env.BATCH_SERVICE_ID,
    process.env.BATCH_TEMPLATE_ID,
    {
      from_name: "Batch Monitor",
      to_name: "Admin B2B",
      message: message,
      reply_to: "b2bbatchmonitor@gmail.com",
      current_date: moment().format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      publicKey: process.env.BATCH_PUBLIC_KEY,
      privateKey: process.env.BATCH_PRIVATE_KEY, // optional, highly recommended for security reasons
    }
  );
  return response;
};
