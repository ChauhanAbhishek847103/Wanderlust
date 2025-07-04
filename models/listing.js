const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    url: String,
    filename: String,
  },
  price: Number,
  location: String,
  country: String,
  // ✅ Add category field for filtering
  category: {
    type: String,
    enum: [
      "trending",
      "rooms",
      "cities",
      "mountains",
      "castles",
      "pools",
      "camping",
      "farms",
      "arctic",
      "domes",
      "boats"
    ],
    required: true,
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
      default: [],
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

listingSchema.index({ geometry: "2dsphere" });

// Middleware to delete reviews when listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
