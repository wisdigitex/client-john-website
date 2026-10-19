
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const recipient = process.env.NOTIFY_EMAIL;
    const from = process.env.FROM_EMAIL;

    if (!apiKey || !recipient || !from) {
      console.error("Email configuration is incomplete.", {
        hasApiKey: Boolean(apiKey),
        hasRecipient: Boolean(recipient),
        hasSender: Boolean(from),
      });

      return Response.json(
        { error: "Email service is not fully configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const fullname = String(body.fullname ?? "").trim();
    const email = String(body.email ?? "").trim();
    const service = String(body.service ?? "").trim();
    const budget = String(body.budget ?? "").trim();
    const timeframe = String(body.timeframe ?? "").trim();
    const contract = String(body.contract ?? "").trim();
    const details = String(body.details ?? "").trim();

    if (
      !fullname ||
      !email ||
      !service ||
      !budget ||
      !timeframe ||
      !contract ||
      details.length < 10
    ) {
      return Response.json(
        { error: "Please complete all required fields correctly." },
        { status: 400 }
      );
    }

    if (
      fullname.length > 120 ||
      email.length > 254 ||
      details.length > 10000 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return Response.json(
        { error: "Please check the length and format of your details." },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from,
      to: [recipient],
      replyTo: email,
      subject: `New Project Request: ${service}`,
      text: [
        "NEW PROJECT REQUEST — ALLANDEXPERTS",
        "",
        `Client: ${fullname}`,
        `Email: ${email}`,
        `Service: ${service}`,
        `Budget: ${budget}`,
        `Timeframe: ${timeframe}`,
        `Working arrangement: ${contract}`,
        "",
        "PROJECT DETAILS:",
        details,
      ].join("\n"),
    });

    if (error) {
      // Log the provider's actual error in the server logs.
      console.error("Resend rejected the email:", error);

      return Response.json(
        {
          error:
            "Resend could not send this email. Check the server logs and verify your sender domain and recipient permissions.",
        },
        { status: 502 }
      );
    }

    return Response.json(
      { success: true, id: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email route failed:", error);

    return Response.json(
      { error: "Unable to send the email. Please try again later." },
      { status: 500 }
    );
  }
}
