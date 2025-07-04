const Listing = require("../models/listing.js");

// Escape special characters in search input
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// ✅ Show all listings (with optional search + category filter)
module.exports.index = async (req, res) => {
  const { search, category } = req.query;
  let query = {};

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [{ title: regex }, { location: regex }, { country: regex }];
  }

  if (category) {
    query.category = category;
  }

  const allListings = await Listing.find(query);

  res.render("listings/index.ejs", {
    allListings,
    query: search || "",
    selectedCategory: category || "",
  });
};

// ✅ Render form for new listing
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// ✅ Show individual listing
module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", {
    listing,
    mapToken: process.env.MAP_TOKEN,
  });
};

// ✅ Create new listing
module.exports.createListing = async (req, res, next) => {
  try {
    const { location, country } = req.body.listing;

    const geoResponse = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(
        location + "," + country
      )}.json?key=${process.env.MAP_TOKEN}`
    );
    const geoData = await geoResponse.json();

    if (!geoData.features || geoData.features.length === 0) {
      req.flash("error", "Invalid location provided.");
      return res.redirect("/listings/new");
    }

    const [lng, lat] = geoData.features[0].center;
    const url = req.file.path;
    const filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.coordinates = [lng, lat];

    await newListing.save();

    req.flash("success", "New listing Created!");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
};

// ✅ Render edit form
module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  let orignalImageUrl = listing.image.url;
  orignalImageUrl = orignalImageUrl.replace("/upload", "/upload/w_250");

  res.render("listings/edit.ejs", { listing, orignalImageUrl });
};

// ✅ Update listing
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

// ✅ Delete listing
module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
