const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Thông tin Sandbox MoMo công khai
const partnerCode = "MOMO";
const accessKey = "F8BBA842ECF85";
const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";

app.post("/momo-payment", async (req, res) => {
  const { amount, orderId } = req.body;

  const requestId = Date.now().toString();
  const orderInfo = `Thanh toan don hang ${orderId}`;
  const redirectUrl = "https://webhook.site/redirect-demo"; // link giả lập
  const ipnUrl = "https://webhook.site/ipn-demo"; // link giả lập nhận callback

  // Chuỗi raw để ký
  const rawSignature =
    `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;

  // Ký HMAC SHA256
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode,
    partnerName: "Movie App",
    storeId: "MovieStore01",
    requestId,
    amount: `${amount}`,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    extraData: "",
    requestType: "captureWallet",
    signature,
  };

  try {
    const response = await axios.post(endpoint, requestBody, {
      headers: { "Content-Type": "application/json" },
    });
    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Lỗi khi gọi MoMo API" });
  }
});

app.listen(4242, () => {
  console.log("MoMo server chạy tại http://localhost:4242");
});
