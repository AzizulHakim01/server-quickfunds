const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const pdfkit = require('pdfkit');
const { Readable } = require('stream');
const dotenv = require('dotenv').config();
const puppeteer = require('puppeteer');

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

app.post('/send-email', upload.array('files', 20), async (req, res) => {
  try {
    const files = req.files;
    const formData = JSON.parse(req.body.formData);

    const pdfBuffer = await generatePDF(formData);
    const ccEmails = ['azizulhakimgps@gmail.com', 'erijohnfon.12@gmail.com', 'igal.henson@gmail.com', 'mikimor63@gmail.com',"teletech.georgia@gmail.com","arkfundingkft@gmail.com","avid@isr-hu.com"];
    const mailOptions = {
      from: process.env.AUTH_USER,
      to: process.env.RECIEPIENT,
      cc: ccEmails.join(','), // Adding CC recipients
      subject: `Merchant Funding Request Received for ${formData.business_name}.`,
      text: `Check the Attachments for ${formData.business_name}. They are doing business as ${formData.business_type}, Their email is ${formData.business_email}, Their business number is ${formData.business_number}, They are looking for ${formData.amount_asking}, Their business start date is ${formData.business_date}, Their business address is ${formData.address}, Their business city is ${formData.city}, Their state is ${formData.state}, their business industry in ${formData.industry}, their Fico is ${formData.fico}, Their current month revenue is ${formData.current_month}, Their last month revenue is ${formData.last_month}, The purpose of the capital is ${formData.purpose_capital} and their monthly revenue is ${formData.monthly_revenue}`, // Your email text here with formData values
      attachments: [{
        filename: `Application_${formData.business_name}_${formData.date}.pdf`,
        content: pdfBuffer,
      }],
    };

    // Attach at least 4 files
    for (let i = 0; i < files.length; i++) {
      if (files[i]) {
        const fileBuffer = files[i].buffer;
        const attachmentName = files[i].originalname;
        mailOptions.attachments.push({
          filename: attachmentName,
          content: fileBuffer,
        });
      }
    }
    

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function generatePDF(formData) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(`
  <img src="https://i.imgur.com/NsxvjpT.png" alt="Company Logo" style="display: block; margin: 0 auto; max-width: 30%; height: auto; margin-bottom: 20px;">

  <h2 style="color: rgb(82, 82, 91); text-align:center">${formData.business_name}</h2>
  <h1 style="color: rgb(82, 82, 91); text-align:center">Merchant Funding Request Application</h1>
  
  <h2 style="text-align:center; margin-top:20px; margin-bottom-20px; color: #00d1a9; font-size:1.5em;">BUSINESS DETAILS</h2>
  <table style="width: 80%; margin: 0 auto; border-collapse: collapse;">
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Application Date:</th>
      <td style="color: rgb(82, 82, 91); text-align: left; ">${formData.date}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Business Name:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.business_name}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Doing Business As:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.business_type}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Business Email:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.business_email}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Funding amount Required:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.amount_asking}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Business Start Date:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.business_date}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Business Address:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.address}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Business City:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.city}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Business State:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.state}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Business Industry:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.industry}</td>
    </tr>
    </table><br/><br/>
    <h2 style="text-align:center; margin-top:20px; margin-bottom-20px; color: #00d1a9; font-size:1.5em;">ECONOMIC PROFILE</h2>
    <table style="width: 80%; margin: 0 auto; border-collapse: collapse;">
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Business Monthly Revenue:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.monthly_revenue}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Fico Score:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.fico}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Current Month Revenue:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.current_month}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Last Month Revenue:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.last_month}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Before Last Month Revenue:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.before_last_month}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">MCA History:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.history}</td>
    </tr>
    <tr>
      <th style="color: #00d1a9; text-align: left; padding-right: 20px;">Purpose of the Capital:</th>
      <td style="color: rgb(82, 82, 91); text-align: left;">${formData.purpose_capital}</td>
    </tr>
  </table>
  `);

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
}

app.listen(PORT, () => {
  console.log(`Server is running`);
});
