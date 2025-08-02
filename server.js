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

// Lưu trạng thái đơn hàng đơn giản trong RAM
const orders = {};

// API tạo thanh toán MoMo
app.post("/momo-payment", async (req, res) => {
  const { amount, orderId } = req.body;
  const requestId = Date.now().toString();
  const orderInfo = `Thanh toan don hang ${orderId}`;
  const redirectUrl = "https://webhook.site/e4e171e7-9432-4386-8b2e-4d6cac309aa6";
  const ipnUrl = "https://momo-node-server.onrender.com/momo-ipn"; // ✅ IPN về chính server của bạn

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

    // Lưu trạng thái đơn hàng ban đầu
    orders[orderId] = { status: "PENDING", amount, createdAt: Date.now() };

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Lỗi khi gọi MoMo API", detail: error.response?.data || error.message });
  }
});

// API nhận IPN từ MoMo
app.post("/momo-ipn", (req, res) => {
  console.log("📩 IPN từ MoMo:", req.body);

  const { orderId, resultCode } = req.body;
  if (orders[orderId]) {
    orders[orderId].status = (resultCode === 0) ? "SUCCESS" : "FAILED";
  }

  res.status(200).json({ message: "IPN received" });
});

// API check trạng thái đơn
app.get("/check-status", (req, res) => {
  const { orderId } = req.query;
  const order = orders[orderId];
  if (!order) return res.status(404).json({ status: "NOT_FOUND" });
  res.json({ status: order.status });
});

app.listen(4242, () => console.log("✅ Server chạy tại http://localhost:4242"));
