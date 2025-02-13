const fs = require("fs");
const processDocument = require("./documentParser");

const enhancedProcessDocument = async (req, res) => {
    try {
      // Pass the file path from the middleware to the processDocument function
      const filePath = req.filePath;
      await processDocument(req, res, filePath);
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      // Clean up the temporary file
      if (req.filePath && fs.existsSync(req.filePath)) {
        fs.unlinkSync(req.filePath);
      }
    }
  };

module.exports=enhancedProcessDocument