const mongoose = require("mongoose");
const Product = require("./models/product.models"); // adjust path if needed

const MONGO_URI = "";

const products = [
  {
    name: "Banarasi Silk Saree",
    price: 4999,
    description: "Traditional handcrafted Banarasi silk saree",
    category: "Saree",
    imageUrl: "https://example.com/saree1.jpg",
    fabric: "Silk",
    stock: 10
  },
  {
    name: "Cotton Printed Saree",
    price: 1499,
    description: "Lightweight daily wear saree",
    category: "Saree",
    imageUrl: "https://example.com/saree2.jpg",
    fabric: "Cotton",
    stock: 25
  },
  {
    name: "Designer Lehenga",
    price: 8999,
    description: "Wedding special designer lehenga",
    category: "Lehenga",
    imageUrl: "https://example.com/lehenga.jpg",
    fabric: "Georgette",
    stock: 5
  }
];

async function seedDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");

    await Product.deleteMany(); // optional: clears old data

    await Product.insertMany(products);

    console.log("✅ Products inserted successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Error inserting products:", error);
    process.exit(1);
  }
}

seedDB();