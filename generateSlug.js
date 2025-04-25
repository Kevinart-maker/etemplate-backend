require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');
const Product = require('./modules/productModel');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const generateSlugs = async () => {
  const products = await Product.find();

  for (let product of products) {
    if (!product.slug) {
      product.slug = slugify(product.name, { lower: true, strict: true });
      await product.save();
      console.log(`Slug created for: ${product.name}`);
    }
  }

  console.log('✅ Done generating slugs');
  mongoose.disconnect();
};

generateSlugs();