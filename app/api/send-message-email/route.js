
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
        hasFrom: Boolean(from),
      });

      return Response.json(
        { success: false, error: "Email service is not configured correctly." },
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
        { success: false, error: "Please complete all required fields." },
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
        { success: false, error: "Please check your details and try again." },
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
        `Contract: ${contract}`,
        "",
        "PROJECT DETAILS:",
        details,
      ].join("\n"),
    });

    if (error) {
      // The detailed reason appears in your server/Vercel function logs.
      console.error("Resend rejected the email:", error);

      return Response.json(
        {
          success: false,
          error: "Resend rejected the email. Check the server logs and Resend settings.",
        },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      message: "Project request email accepted.",
      id: data?.id,
    });
  } catch (error) {
    console.error("Project request API error:", error);

    return Response.json(
      { success: false, error: "Unable to process the request. Please try again." },
      { status: 500 }
    );
  }
}
