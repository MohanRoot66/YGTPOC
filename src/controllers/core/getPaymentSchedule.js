const sequelizeController = require("../sequelize_controller");

const GetPaymentSchedule = async (req, res) => {
  try {
    // Fetch the AceFeedMasterData model
    const PaymentSchedularModel = sequelizeController.getModel("PaymentSchedular");
    
    // Fetch all AceFeedMasterData entries from the database
    const data = await PaymentSchedularModel.findAll();

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

module.exports = GetPaymentSchedule;
