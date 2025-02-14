const fs = require("fs");
const csvParser = require("csv-parser");
const sequelizeController = require("../sequelize_controller");

const saveAcefeedMasterData = async (req, res) => {
    try {
        const AcefeedMasterData = sequelizeController.getModel("AceFeedMasterData");
        const SupplierMasterData = sequelizeController.getModel("Supplier");

        const csvFilePath = "C:\\Users\\mohan.amrutham\\Desktop\\YgtTravels\\src\\controllers\\core\\aceFeed.csv"; // Path to your CSV file
        const rows = [];

        // Read and parse CSV file into rows (JSON format)
        fs.createReadStream(csvFilePath)
            .pipe(csvParser())
            .on("data", (row) => {
                rows.push(row);
            })
            .on("end", async () => {
                console.log("CSV file successfully processed:", rows);

                for (const row of rows) {
                    const {
                        data__bookingRef: bookingRef,
                        data__bookingDate: bookingDate,
                        data__departureDate: departureDate,
                        data__noOfPax: noOfPax,
                        data__leadPax: leadPax,
                        data__Suppliers__supplierCode: supplierCode,
                        data__Suppliers__details__status: status,
                        data__Suppliers__details__arrivalDate: arrivalDate,
                        data__Suppliers__details__leaveDate: leaveDate,
                        data__Suppliers__details__Currency: currency,
                        data__Suppliers__details__ExchangeRate: exchangeRate,
                        data__Suppliers__details__TotalCost: totalCostLocal,
                    } = row;

                    // Validate supplier code exists in SupplierMasterData
                    const retrievedSupplier = await SupplierMasterData.findOne({
                        where: { supplierCode },
                    });

                    if (!retrievedSupplier) {
                        console.warn(`Invalid supplier code: ${supplierCode}`);
                        return res.status(400).json({
                            message: `Invalid supplier code: ${supplierCode}`,
                        });
                    }

                    // Insert data into AcefeedMasterData
                    await AcefeedMasterData.create({
                        exportDate: new Date(), // Current date
                        supplier: supplierCode,
                        status: status || "N",
                        description: retrievedSupplier.supplierName, // Default description
                        bookingRef,
                        leadPax,
                        noOfPax,
                        bookingDate,
                        departureDate,
                        arrivalDate: arrivalDate || new Date(), // Default to today
                        leaveDate: leaveDate || new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), // Default 5 days later
                        currency: currency || "USD", // Default USD
                        exchangeRate: exchangeRate || 1, // Default 1
                        totalCostLocal: totalCostLocal || 0, // Default 0
                    });
                }

                res.status(201).json({
                    message: "Acefeed master data saved successfully.",
                });
            })
            .on("error", (error) => {
                console.error("Error reading the CSV file:", error);
                res.status(500).json({
                    message: "Failed to process the CSV file.",
                    error: error.message,
                });
            });
    } catch (error) {
        console.error("Error saving Acefeed master data:", error, error.message);

        res.status(500).json({
            message: "Failed to save Acefeed master data.",
            error: error.message,
        });
    }
};

module.exports = saveAcefeedMasterData;
