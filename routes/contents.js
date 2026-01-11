const express = require("express");
const verifyFireBaseToken = require("../middlewares/verifyFirebaseToken");
const verifyAdmin = require("../middlewares/verifyAdmin");
const contentsController = require("../controllers/contentsController");

module.exports = (collections) => {
  const router = express.Router();

  // GET routes
  router.get("/banner-section", (req, res) => contentsController.getBannerSection(req, res, collections));
  router.get("/about-section", (req, res) => contentsController.getAboutSection(req, res, collections));
  router.get("/globe-section", (req, res) => contentsController.getGlobeSection(req, res, collections));
  router.get("/features-section", (req, res) => contentsController.getFeaturesSection(req, res, collections));
  router.get("/how-it-works-section", (req, res) => contentsController.getHowItWorksSection(req, res, collections));

  // PATCH routes (admin only)
  router.patch("/banner-section", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    contentsController.updateBannerSection(req, res, collections)
  );
  router.patch("/about-section", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    contentsController.updateAboutSection(req, res, collections)
  );
  router.patch("/globe-section", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    contentsController.updateGlobeSection(req, res, collections)
  );
  router.patch("/features-section", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    contentsController.updateFeaturesSection(req, res, collections)
  );
  router.patch("/how-it-works-section", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    contentsController.updateHowItWorksSection(req, res, collections)
  );

  return router;
};
