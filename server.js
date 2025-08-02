const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const partnerCode = "MOMO";
const accessKey = "F8BBA842ECF85";
const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";

// Dùng link thật webhook.site
const redirectUrl = "https://webhook.site/e4e171e7-9432-4386-8b2e-4d6cac309aa6";
const ipnUrl = "https://webhook.site/e4e171e7-9432-4386-8b2e-4d6cac309aa6";

app.post("/momo-payment", async (req, res) => {
  const { amount, orderId } = req.body;
  const requestId = Date.now().toString();
  const orderInfo = `Thanh toán đơn hàng ${orderId}`;

  const rawSignature =
    `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;

  const signature = crypto.createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode,
    requestId,
    amount: `${amount}`,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData: "",
    requestType: "captureWallet",
    signature,
    lang: "vi",
  };

  try {
    const response = await axios.post(endpoint, requestBody, {
      headers: { "Content-Type": "application/json" },
    });
    res.json(response.data);
  } catch (error) {
    console.error("❌ MoMo API error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Lỗi khi gọi MoMo API",
      detail: error.response?.data || error.message,
    });
  }
});

app.listen(4242, () => console.log("✅ Server chạy tại http://localhost:4242"));
