const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv').config()

const app = express();
app.use(express.json({ limit: '100mb' })); // Increase payload limit
app.use(cors());

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 1024 * 1024 * 100, // Example: 100 MB for field size
  },
});

const corsOptions = {
  origin: '*', // Update this to the appropriate origin in production
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 204,
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

const PORT = 3000;

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: process.env.BREVO_SMTP_PORT,
  secure: false, // Set true if using TLS
  auth: {
    user: process.env.AUTH_USER,
    pass: process.env.AUTH_PASS,
  },
});
app.post('/send-email', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files;
    const pdfDataUrl = req.body.pdfDataUrl;
    const formData = JSON.parse(req.body.formData);
    const pdfBuffer = Buffer.from(pdfDataUrl.split(',')[1], 'base64');
    // const ccEmails = ['azizulhakimgps@gmail.com', 'erijohnfon.12@gmail.com', 'igal.henson@gmail.com', 'mikimor63@gmail.com',]; // Replace with your desired CC emails
    const mailOptions = {
      from: process.env.AUTH_USER,
      to: process.env.RECIEPIENT,
      subject: `Merchant Funding Request Received for ${formData.business_name}.`,
      text: `Check the Attachments for ${formData.business_name}. They are doing business as ${formData.business_type}, Their email is ${formData.business_email}, Their business number is ${formData.business_number}, They are looking for ${formData.amount_asking}, Their business start date is ${formData.business_date}, Their business address is ${formData.address}, Their business city is ${formData.city}, Their state is ${formData.state}, their business industry in ${formData.industry}, their Fico is ${formData.fico}, Their current month revenue is ${formData.current_month}, Their last month revenue is ${formData.last_month}, The purpose of the capital is ${formData.purpose_capital} and their monthly revenue is ${formData.monthly_revenue}`,
      attachments: [],
      // cc: ccEmails.join(','), // Adding CC recipients
    };

    // Attach PDF
    const fileName = `Application_${formData.business_name}_${formData.date}.pdf`;
    console.log(fileName)
    mailOptions.attachments.push({
      filename: fileName,
      content: pdfBuffer,
    });

    // Attach at least 4 files
    for (let i = 0; i < Math.min(4, files.length); i++) {
      if (files[i]) {
        const fileBuffer = files[i].buffer;
        const attachmentName = files[i].originalname;
        console.log(attachmentName)
        mailOptions.attachments.push({
          filename: attachmentName,
          content: fileBuffer,
        });
      }
    }
    res.setHeader('Content-Type', 'application/pdf');

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running`);
});
