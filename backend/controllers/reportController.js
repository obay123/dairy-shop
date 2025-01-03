const Report = require('../models/reportSchema');
const Item = require('../models/itemSchema');




exports.createReport = async (req, res) => {
  try {
    const { soldItems = [] } = req.body; // Default to an empty array if soldItems is undefined
    const shopId = req.shopId; // Extracted from authMiddleware

    if (!shopId) {
      return res.status(400).json({ message: 'shopId is required but not provided' });
    }

    let totalAmount = 0;
    const reportSoldItems = [];

    // Populate `reportSoldItems` with item details and calculate `totalAmount`
    if (soldItems.length > 0) {
      for (const soldItem of soldItems) {
        const item = await Item.findById(soldItem.itemId);
        if (!item) {
          return res.status(404).json({ message: `Item with ID ${soldItem.itemId} not found` });
        }

        const itemTotal = item.price * soldItem.quantitySold;
        totalAmount += itemTotal;

        reportSoldItems.push({
          itemId: soldItem.itemId,
          quantitySold: soldItem.quantitySold,
          total: itemTotal,
        });
      }
    }

    // Create the new report
    const newReport = new Report({ shopId, soldItems: reportSoldItems, totalAmount });
    const savedReport = await newReport.save();

    res.status(201).json(savedReport);
  } catch (error) {
    res.status(500).json({ message: 'Error creating report', error });
  }
};


// Delete an entire report and its sold items
exports.deleteReport = async (req, res) => {
  const { reportId } = req.params;

  const shopId = req.shopId; // Extracted from authMiddleware
  if (!shopId) {
    return res.status(400).json({ message: 'shopId is required but not provided' });
  }
  
  try {
    const report = await Report.findByIdAndDelete(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.status(200).json({ message: 'Report and associated sold items deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting report', error });
  }
};

exports.getReports = async (req,res) => {
  const shopId = req.shopId; // Extracted from authMiddleware
  if (!shopId) {
    return res.status(400).json({ message: 'shopId is required but not provided' });
  }
  try{
    const reports = await Report.find()
    if (reports.length === 0) {
      return res.status(404).json({ message: "لم يتم العثور على تقارير" })
    }
    res.status(200).json(reports)
  }catch(error){
    return res.status(500).json({message: error.message || 'خطأ في جلب التقارير'})
  }
}

// Get a report by date
exports.getReportByDate = async (req, res) => {
  const { date } = req.params;

  const shopId = req.shopId; // Extracted from authMiddleware
  if (!shopId) {
    return res.status(400).json({ message: 'shopId is required but not provided' });
  }

  try {
    // Parse the date parameter
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // Start of the day
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1); // Start of the next day

    // Find reports within the date range
    const reports = await Report.find({
      shopId,
      date: { $gte: targetDate, $lt: nextDate }
    });

    if (reports.length === 0) {
      return res.status(404).json({ message: 'No report found for this date' });
    }

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report', error });
  }
};


