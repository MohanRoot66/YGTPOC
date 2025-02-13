require("dotenv").config();
const sequelizeController = require("../sequelize_controller");
const { DocumentProcessorServiceClient } = require("@google-cloud/documentai").v1;
const fs = require("fs");
const path = require("path");

// Set the path to the credentials file
const credentialsPath = path.join(__dirname, "grand-practice-450211-k3-fd655f6f0a5f.json");
process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

// Document AI processing function
async function processDocument(req, res,filePath) {


  console.log(filePath);

  try {
    // Check if the credentials file exists
    if (!fs.existsSync(credentialsPath)) {
      throw new Error("Google Application Credentials file not found.");
    }

    const InvoiceDataModel = sequelizeController.getModel("InvoiceData");
    const SupplierModel = sequelizeController.getModel("Supplier");
    const PaymentSchedularModel = sequelizeController.getModel("PaymentSchedular");

    // Initialize Document AI client
    const client = new DocumentProcessorServiceClient();

    // Define project details
    const projectId = "grand-practice-450211-k3";
    const location = "us";
    const processorId = "468738d329345a07";
    // const filePath = path.join(__dirname, "example.pdf");
    const mimeType = "application/pdf";

    // Construct the processor name
    const processorName = `projects/${projectId}/locations/${location}/processors/${processorId}`;

    // Read the file
    if (!fs.existsSync(filePath)) {
      throw new Error("Input file not found.");
    }
    const fileContent = fs.readFileSync(filePath);

    // Prepare the request payload
    const request = {
      name: processorName,
      rawDocument: {
        content: fileContent.toString("base64"),
        mimeType: mimeType,
      },
    };

    // Process the document
    const [result] = await client.processDocument(request);
    const { document } = result;

    // Extract all fields from the document
    const extractedData = {};
    document.entities.forEach((entity) => {
      extractedData[entity.type] = entity.normalizedValue?.text || entity.mentionText || "";
    });

    // Perform validations
    if (!extractedData?.bookingRef) {
      throw new Error("Booking reference (bookingRef) is missing in the extracted data.");
    }
    
    // Validate supplierName against the supplier table
    const supplier = await SupplierModel.findOne({ where: { supplierName: extractedData?.supplierName } });
    if (!supplier) {
      throw new Error(`Supplier '${extractedData?.supplierName}' not found in the supplier table.`);
    }
    
    // Match bookingRef with the PaymentSchedular table
    const paymentSchedule = await PaymentSchedularModel.findOne({
      where: { bookingRef: extractedData?.bookingRef },
    });
    
    if (!paymentSchedule) {
      throw new Error(
        `Booking reference '${extractedData?.bookingRef}' not found in the PaymentSchedular table.`
      );
    }
    
    // Validate payment details
    const extractedAmount = parseFloat(extractedData?.amount);
    const scheduledAmount = parseFloat(paymentSchedule.amount);
    
    // Check supplier name match
    if (extractedData?.supplierName !== paymentSchedule.supplierName) {
      throw new Error(
        `Supplier name '${extractedData?.supplierName}' does not match the scheduled supplier name '${paymentSchedule.supplierName}'.`
      );
    }
    
    // Check amount match
    if (isNaN(extractedAmount) || extractedAmount !== scheduledAmount) {
      throw new Error(
        `Extracted amount (${extractedAmount}) does not match the scheduled amount (${scheduledAmount}).`
      );
    }
    
    // If all validations pass, prepare invoice data
    const isMatched = true; // Both supplier name and amount match
    const invoiceData = {
      id: extractedData?.id || undefined, // Optional, as Sequelize generates it
      supplierName: extractedData?.supplierName,
      email: extractedData?.email || null,
      dateReceived: extractedData?.dateReceived || null,
      bookingRef: extractedData?.bookingRef,
      invNumber: extractedData?.invNumber || null,
      invoiceTotal: extractedData?.invoiceTotal || null,
      invoiceDate: extractedData?.invoiceDate || null,
      leadPax: extractedData?.leadPax || null,
      currency: extractedData?.currency || null,
      amount: extractedData?.amount || null,
      documentLink: extractedData?.documentLink || null,
      ismatched: isMatched, // Set to true because both validations passed
      isFinanceMatched: extractedData?.isFinanceMatched || false,
      isSystemGenerated: extractedData?.isSystemGenerated || false,
    };
    
    console.log("Extracted Invoice Data:", invoiceData);
    
    // Insert data into the invoice table
    const insertedData = await InvoiceDataModel.create(invoiceData);
    
    console.log("Data successfully inserted:", insertedData.toJSON());
    
    res.status(200).json({
      message: "Data inserted successfully",
      insertedData,
    });
             

  } catch (error) {
    console.error("Error:", error.message);
    res.status(400).json({ error: error.message });
  }
}



// Run the document processing function
module.exports=processDocument
