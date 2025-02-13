const sequelizeController = require("../sequelize_controller");

const GetAllInvoiceData = async (req, res) => {
  try {
    // Fetch the AceFeedMasterData model
    const InvoicesData = sequelizeController.getModel("InvoiceData");
    
    // Fetch all AceFeedMasterData entries from the database
    const data = await InvoicesData.findAll();

    console.log("Data for Invoices",data);

    // Send success response
    res.status(200).json({
      message: "Data fetched successfully",
      data,
    });

  } catch (error) {
    console.error("Error fetching AceFeedMasterData:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = GetAllInvoiceData;
