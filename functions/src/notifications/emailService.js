import {defineString} from "firebase-functions/params";

// Define Mailgun configuration parameters
const mailgunApiKey = defineString("MAILGUN_API_KEY");
const mailgunDomain = defineString("MAILGUN_DOMAIN");
const mailgunBaseUrl = defineString("MAILGUN_BASE_URL", {
  default: "https://api.mailgun.net/v3",
});
const mailgunFrom = defineString("MAILGUN_FROM");

/**
 * Send an email via Mailgun API
 * @param {Object} params
 * @param {string|string[]} params.to - Recipient email address(es).
 *   Can be a single email or array of emails
 * @param {string} params.subject - Email subject
 * @param {string} params.text - Email body (plain text)
 * @param {string} [params.html] - Email body (HTML, optional)
 * @return {Promise<void>}
 */
export async function sendMailgunEmail({to, subject, text, html}) {
  try {
    console.log("sendMailgunEmail called with:", {
      to,
      subject,
      textLength: text?.length,
    });

    // Get Mailgun configuration from environment parameters
    const apiKey = mailgunApiKey.value();
    const domain = mailgunDomain.value();
    const baseUrl = mailgunBaseUrl.value();
    const from = mailgunFrom.value();

    console.log("Mailgun config found, checking values...");

    if (!apiKey || !domain || !baseUrl || !from) {
      console.error("Missing required Mailgun configuration:", {
        hasApiKey: !!apiKey,
        hasDomain: !!domain,
        hasBaseUrl: !!baseUrl,
        hasFrom: !!from,
        domain: domain,
        baseUrl: baseUrl,
        from: from,
      });
      return;
    }

    console.log("Mailgun config validated, preparing API request...");

    const url = `${baseUrl}/${domain}/messages`;

    // Create Basic Auth header
    const auth = Buffer.from(`api:${apiKey}`).toString("base64");

    // Handle multiple recipients - Mailgun accepts comma-separated emails
    const recipients = Array.isArray(to) ? to.join(",") : to;

    // Prepare form data
    const formData = new URLSearchParams();
    formData.append("from", from);
    formData.append("to", recipients);
    formData.append("subject", subject);
    formData.append("text", text);

    // Add HTML if provided
    if (html) {
      formData.append("html", html);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Mailgun API error (${response.status}):`, errorText);
      return;
    }

    const result = await response.json();
    console.log("Mailgun email sent successfully:", {
      to,
      subject,
      messageId: result.id || result.message || "unknown",
      result: result,
    });
  } catch (error) {
    // Log error but don't throw - email failure shouldn't break the main flow
    console.error("Failed to send Mailgun email:", error);
  }
}

