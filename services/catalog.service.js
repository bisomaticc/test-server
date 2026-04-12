const ShopCatalog = require("../models/shopCatalog.models");

const DEFAULT_KEY = "default";

const DEFAULT_FABRICS = [
  "Silk",
  "Cotton",
  "Chiffon",
  "Georgette",
  "Banarasi",
  "Kanjivaram",
  "Mal Cotton",
  "Kota Doriya",
  "Maheshwari Silk",
  "Linen",
];

const DEFAULT_CATEGORIES = [
  "Weddings",
  "Parties",
  "Casual",
  "Festive",
  "Bridal",
  "Office Wear",
  "Summer Wear",
  "Day Party Wear",
  "Night Party Wear",
];

function normalizeName(name) {
  const s = String(name || "").trim();
  if (!s || s.length > 120) return null;
  return s;
}

async function getDoc() {
  const doc = await ShopCatalog.findOneAndUpdate(
    { key: DEFAULT_KEY },
    {
      $setOnInsert: {
        key: DEFAULT_KEY,
        fabrics: [...DEFAULT_FABRICS],
        categories: [...DEFAULT_CATEGORIES],
      },
    },
    { upsert: true, new: true }
  );
  return doc;
}

exports.getCatalog = async () => {
  const doc = await getDoc();
  return {
    fabrics: [...new Set(doc.fabrics || [])].sort((a, b) => a.localeCompare(b)),
    categories: [...new Set(doc.categories || [])].sort((a, b) => a.localeCompare(b)),
  };
};

exports.addFabric = async (rawName) => {
  const name = normalizeName(rawName);
  if (!name) throw new Error("Invalid fabric name");
  const doc = await getDoc();
  if (doc.fabrics.includes(name)) throw new Error("Fabric already exists");
  doc.fabrics.push(name);
  doc.fabrics.sort((a, b) => a.localeCompare(b));
  await doc.save();
  return exports.getCatalog();
};

exports.removeFabric = async (rawName) => {
  const name = normalizeName(rawName);
  if (!name) throw new Error("Invalid fabric name");
  await getDoc();
  await ShopCatalog.updateOne({ key: DEFAULT_KEY }, { $pull: { fabrics: name } });
  return exports.getCatalog();
};

exports.addCategory = async (rawName) => {
  const name = normalizeName(rawName);
  if (!name) throw new Error("Invalid category name");
  const doc = await getDoc();
  if (doc.categories.includes(name)) throw new Error("Category already exists");
  doc.categories.push(name);
  doc.categories.sort((a, b) => a.localeCompare(b));
  await doc.save();
  return exports.getCatalog();
};

exports.removeCategory = async (rawName) => {
  const name = normalizeName(rawName);
  if (!name) throw new Error("Invalid category name");
  await getDoc();
  await ShopCatalog.updateOne({ key: DEFAULT_KEY }, { $pull: { categories: name } });
  return exports.getCatalog();
};
