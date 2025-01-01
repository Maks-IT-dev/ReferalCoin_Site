const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'https://your-vercel-url.vercel.app',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Логування запитів
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Підключення до MongoDB з async/await
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Підключено до MongoDB');
}).catch((err) => {
  console.error('Помилка підключення до MongoDB:', err);
  process.exit(1);
});



// Схема транзакції
const transactionSchema = new mongoose.Schema({
  nickname: String,
  phone: String,
  amount: Number,
  address: String,
  cardNumber: String,
  timestamp: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Налаштування Nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Або інший поштовий сервіс
  auth: {
    user: process.env.EMAIL_USER, // Ваша електронна пошта
    pass: process.env.EMAIL_PASS  // Пароль або токен додатка
  }
});

// Маршрут для створення транзакції
app.post('/transaction', (req, res) => {
  console.log('Запит на транзакцію отримано:', req.body); // Додано для діагностики

  const { nickname, phone, amount, address, cardNumber } = req.body;

  // Перевірка мінімальної суми
  if (amount < 30) {
    return res.status(400).json({ message: 'Мінімальна сума виводу 30' });
  }

  const transaction = new Transaction({ nickname, phone, amount, address, cardNumber });

  transaction.save((err, savedTransaction) => {
    if (err) {
      console.error('Помилка при збереженні транзакції:', err);
      return res.status(500).json({ message: 'Помилка при збереженні транзакції' });
    }

    // Формуємо лист
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'recipient_email@example.com',
      subject: 'Нова транзакція',
      text: `
        Нікнейм: ${nickname}
        Телефон: ${phone}
        Сума: ${amount}
        Адреса: ${address}
        Номер картки: ${cardNumber}
      `
    };

    // Надсилаємо лист
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Помилка при надсиланні листа:', error);
        return res.status(500).json({ message: 'Помилка при надсиланні пошти' });
      }

      res.status(200).json({ message: 'Транзакція успішно збережена та надіслана на пошту' });
    });
  });
});


// Маршрут для очищення транзакцій старше 24 годин
app.delete('/cleanup', (req, res) => {
  const expiryDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

  Transaction.deleteMany({ timestamp: { $lt: expiryDate } }, (err, result) => {
    if (err) {
      console.error('Помилка при очищенні старих транзакцій:', err);
      return res.status(500).json({ message: 'Помилка при очищенні старих транзакцій' });
    }

    res.status(200).json({ message: 'Старі транзакції очищено', deletedCount: result.deletedCount });
  });
});

// Обробка помилок маршрутизації
app.use((req, res) => {
  res.status(404).json({ message: 'Маршрут не знайдено' });
});

// Глобальна обробка помилок
app.use((err, req, res, next) => {
  console.error('Неочікувана помилка:', err);
  res.status(500).json({ message: 'Внутрішня помилка сервера' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер працює на порту ${PORT}`);
});
