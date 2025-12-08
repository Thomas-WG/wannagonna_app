import * as functions from "firebase-functions";

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
    const config = functions.config().mailgun;

    if (!config) {
      console.error("Mailgun configuration not found in functions.config()");
      console.log("Available config keys:", Object.keys(functions.config()));
      return;
    }

    console.log("Mailgun config found, checking values...");
    const {api_key: apiKey, domain, base_url: baseUrl, from} = config;

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

