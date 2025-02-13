require("dotenv").config();
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const fs = require("fs");
const path = require("path");

// Middleware to fetch the latest email with a .pdf attachment
const fetchLatestInvoiceMiddleware = async (req, res, next) => {
  const imap = new Imap({
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  const fetchLatestPdfEmail = () =>
    new Promise((resolve, reject) => {
      imap.once("ready", () => {
        imap.openBox("INBOX", false, (err) => {
          if (err) {
            reject(`Error opening INBOX: ${err.message}`);
            return;
          }

          // Search for recent emails (you can adjust the criteria if needed)
          imap.search(["ALL"], (err, results) => {
            if (err) {
              reject(`Search error: ${err.message}`);
              imap.end();
              return;
            }

            if (!results || results.length === 0) {
              reject("No emails found.");
              imap.end();
              return;
            }

            // Get the latest email ID
            const latestEmailId = results[results.length - 1];

            // Fetch the latest email
            const fetcher = imap.fetch(latestEmailId, { bodies: "", struct: true });

            fetcher.on("message", (msg) => {
              msg.on("body", async (stream) => {
                try {
                  const parsed = await simpleParser(stream);

                  // Check for attachments and find a PDF
                  if (parsed.attachments && parsed.attachments.length) {
                    const pdfAttachment = parsed.attachments.find(
                      (attachment) => attachment.contentType === "application/pdf"
                    );

                    if (pdfAttachment) {
                      const tempPath = path.join(
                        __dirname,
                        "invoices",
                        pdfAttachment.filename
                      );

                      // Save the PDF to a temporary path
                      fs.mkdirSync(path.dirname(tempPath), { recursive: true });
                      fs.writeFileSync(tempPath, pdfAttachment.content);

                      resolve(tempPath); // Return the file path
                      return;
                    }
                  }
                  resolve(null); // No PDF found in the latest email
                } catch (parseErr) {
                  reject(`Error parsing email: ${parseErr.message}`);
                }
              });
            });

            fetcher.on("error", (err) => reject(`Fetch error: ${err.message}`));
            fetcher.on("end", () => imap.end());
          });
        });
      });

      imap.once("error", (err) => reject(`IMAP error: ${err.message}`));
      imap.once("end", () => console.log("IMAP connection ended."));

      imap.connect();
    });

  try {
    const filePath = await fetchLatestPdfEmail();
    if (!filePath) {
      return res.status(400).json({ error: "No PDF attachment found in the latest email." });
    }
    req.filePath = filePath; // Pass the file path to the next middleware
    next();
  } catch (err) {
    console.error("Error fetching email:", err);
    res.status(500).json({ error: err });
  }
};

module.exports = fetchLatestInvoiceMiddleware;
