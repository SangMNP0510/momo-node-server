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

const orderStatus = {};

// Tạo đơn thanh toán
app.post("/momo-payment", async (req, res) => {
  const { amount, orderId } = req.body;
  const requestId = Date.now().toString();
  const orderInfo = `Thanh toan don hang ${orderId}`;
  const redirectUrl = "https://webhook.site/e4e171e7-9432-4386-8b2e-4d6cac309aa6";
  const ipnUrl = "https://momo-node-server.onrender.com/ipn";

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

    orderStatus[orderId] = "PENDING";

    res.json({
      ...response.data,
      qrCodeUrl: response.data.qrCodeUrl,
      payUrl: response.data.payUrl,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Lỗi khi gọi MoMo API" });
  }
});

// IPN từ MoMo
app.post("/ipn", (req, res) => {
  const { orderId, resultCode } = req.body;
  orderStatus[orderId] = resultCode === 0 ? "SUCCESS" : "FAILED";
  console.log("📩 IPN nhận từ MoMo:", req.body);
  res.status(200).json({ message: "IPN received" });
});

// Check trạng thái
app.get("/check-status", (req, res) => {
  const { orderId } = req.query;
  res.json({ status: orderStatus[orderId] || "NOT_FOUND" });
});

// ✅ Mô phỏng thanh toán thành công
app.post("/simulate-success", (req, res) => {
  const { orderId } = req.body;
  orderStatus[orderId] = "SUCCESS";
  console.log(`✅ Đơn ${orderId} mô phỏng thanh toán thành công`);
  res.json({ orderId, resultCode: 0, message: "Simulate success" });
});

app.listen(4242, () => console.log("Server chạy http://localhost:4242"));
