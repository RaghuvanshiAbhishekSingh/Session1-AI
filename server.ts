import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies with limit for base64 image uploading
app.use(express.json({ limit: "15mb" }));

// Initialize Google Gen AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const policy_document = `
FoodFix Customer Support Policy

1. Refund Policy
Customers may be eligible for a refund if:
- The order is cancelled by the restaurant.
- The order is not delivered.
- The delivered food is spoiled, unsafe, or not edible.
- A major item is missing from the order.
- The wrong item is delivered.

Refunds are not guaranteed automatically. Final refund approval may require review by the FoodFix support team.

2. Refund Timeline
Once approved, refunds usually take 3 to 7 business days to reflect in the customer's original payment method.
Wallet refunds may reflect faster.

3. Delay Compensation Policy
If an order is delayed, the customer may be eligible for an apology coupon depending on the delay duration and order value.
A delayed order does not always mean automatic refund.
If the customer wants exact live order status, the issue should be escalated to a human agent.

4. Cancellation Policy
Customers can cancel an order before the restaurant starts preparing it.
Once preparation has started, cancellation may not be allowed.
If the order is extremely delayed, FoodFix support may review the case.

5. Coupon Policy
Only one coupon can be applied per order unless clearly mentioned in the offer.
Coupons may fail if the order does not meet minimum order value, restaurant eligibility, location eligibility, or payment method conditions.

6. Missing or Wrong Item Policy
If an item is missing or the wrong item is delivered, the customer should report it through support.
FoodFix may ask for order details or an image.
Refund or replacement depends on verification.

7. Food Quality Policy
If food is spoiled, unsafe, spilled, leaked, or packaging is damaged, the customer should upload a clear image.
FoodFix support will review the complaint.
The customer may be eligible for refund, coupon, or replacement depending on the case.

8. Human Escalation Policy
Escalate to a human agent if:
- The customer asks for a human.
- The issue needs payment verification.
- The issue needs live order tracking.
- The issue is unclear.
- The customer is very angry.
- The AI is not sure about the answer.
`;

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, image, imageMimeType } = req.body;

    const formattedHistory = (history || [])
      .map((h: { text: string; isBot: boolean }) => `${h.isBot ? "Bot" : "User"}: ${h.text}`)
      .join("\n");

    // Case 1: Image is uploaded
    if (image) {
      let base64Data = image;
      let mimeType = imageMimeType || "image/jpeg";
      
      if (image.startsWith("data:")) {
        const match = image.match(/^data:([^;]+);base64,(.*)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }

      // We use prompt 2 from request:
      const checkPrompt = `You're a helpful assistant of a food service company called food fix,
 please respond to user's query, be courteous.
 Use the following policy document -
 ${policy_document}.
 Check the food quality and if the food quality is bad- food is burnt or there is mould then tell him that refund is being processed and also apologize.
 If the food is NOT corrupt (looks perfectly fine, is edible, or doesn't show burn/mould), then apologize that we cannot confirm the issue and state clearly that you are routing them to human support agent.
 Here is the query - ${message || "Please check this food."}.
Use the following historical conversation -
${formattedHistory}`;

      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [checkPrompt, imagePart],
      });

      const reply = response.text || "I apologize, but I am unable to analyze the image right now. Routing you to human support.";
      const refundProcessed = reply.toLowerCase().includes("refund");

      return res.json({
        text: reply,
        refundProcessed,
        humanEscalated: !refundProcessed && (reply.toLowerCase().includes("human") || reply.toLowerCase().includes("routing") || reply.toLowerCase().includes("escalat")),
      });
    }

    // Case 2: Text only query
    // First, classify if it is a food quality concern that needs an image upload.
    const classificationPrompt = `Analyze the following customer message for a food support chat:
Message: "${message}"

Does this message pertain to a complaint or concern about food quality, safety, hygiene, undercooked elements, taste, hair, bugs, mould, burnt food, or spoiled food?
Answer exactly "YES" or "NO". Do not include any other text.`;

    const checkClassification = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: classificationPrompt,
    });

    const isFoodQualityComplaint = checkClassification.text?.trim().toUpperCase().includes("YES");

    if (isFoodQualityComplaint) {
      return res.json({
        text: "It looks like you're experiencing an issue with your food quality. To help us process an immediate refund or replacement, please upload a clear image of the food item using the attachment button below.",
        requestImageUpload: true,
      });
    }

    // If not a food quality concern, use Prompt 1 to answer policy queries or route to human
    const policyPrompt = `You're a helpful assistant of a food service company called food fix,
 please respond to user's query, be courteous.
 Use the following policy document -
 ${policy_document}.
 If the question is related to policy then only answer it else say that I'm routing to human support agent
 Here is the query - ${message}.
Use the following historical conversation -
${formattedHistory}`;

    const policyResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: policyPrompt,
    });

    const replyText = policyResponse.text || "I am routing your request to a human support agent.";

    res.json({
      text: replyText,
      humanEscalated: replyText.toLowerCase().includes("routing") || replyText.toLowerCase().includes("human") || replyText.toLowerCase().includes("escalat"),
    });

  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: "Sorry, I had trouble processing that request. Please try again or ask for support." });
  }
});

// Setup development environment vs production build
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
