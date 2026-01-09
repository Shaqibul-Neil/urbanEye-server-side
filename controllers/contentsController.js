const responseSend = require("../utilities/responseSend");
const { ObjectId } = require("mongodb");

// Get banner contents
const getBanners = async (req, res, collections) => {
  const { contentCollection } = collections;
  try {
    const banner = await contentCollection.findOne({ type: "banner" });
    //console.log(banner);
    if (!banner) return responseSend(res, 404, "Banner not found");
    responseSend(res, 200, banner);
  } catch (error) {
    console.error(error);
    responseSend(res, 500, "Failed to fetch banner");
  }
};

// Get about section contents
const getAboutSection = async (req, res, collections) => {
  const { contentCollection } = collections;
  try {
    const aboutSection = await contentCollection.findOne({ type: "about-section" });
    if (!aboutSection) {
      // Create default about section if it doesn't exist
      const defaultAboutSection = {
        type: "about-section",
        content: {
          mainHeading: "URBANi is a citizen-focused platform that lets residents",
          highlightText: "citizen-focused platform",
          paragraph1: "report public issues directly to local authorities. From potholes and broken streetlights to stray animals and pollution hazards, every report is tracked for timely resolution.",
          paragraph2: "Our mission is simple: empower communities to actively improve their neighborhoods, ensure transparency, and make cities safer and cleaner for everyone.",
          strongText: "empower communities"
        },
        styles: {
          mainHeading: {
            fontSize: "text-4xl md:text-5xl",
            fontWeight: "font-extrabold",
            textAlign: "text-right",
            color: "text-primary",
            padding: "",
            margin: ""
          },
          highlightText: {
            color: "text-secondary"
          },
          paragraph1: {
            fontSize: "",
            color: "text-gray-700",
            textAlign: "text-right",
            padding: "",
            margin: ""
          },
          paragraph2: {
            fontSize: "",
            color: "text-gray-700", 
            textAlign: "text-right",
            padding: "pl-14",
            margin: ""
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await contentCollection.insertOne(defaultAboutSection);
      return responseSend(res, 200, defaultAboutSection);
    }
    responseSend(res, 200, aboutSection);
  } catch (error) {
    console.error(error);
    responseSend(res, 500, "Failed to fetch about section");
  }
};

// Get globe section contents
const getGlobeSection = async (req, res, collections) => {
  const { contentCollection } = collections;
  try {
    const globeSection = await contentCollection.findOne({ type: "globe-section" });
    if (!globeSection) {
      const defaultGlobeSection = {
        type: "globe-section",
        content: {
          mainTitle: "Urban Issues",
          subtitle: "Shared Citizen Solutions",
          description: "URBANi empowers citizens to highlight issues, collaborate with neighbors, and see real solutions unfold. Together, we transform our city—one report, one upvote at a time."
        },
        styles: {
          mainTitle: {
            fontSize: "md:text-5xl text-4xl",
            fontWeight: "font-bold",
            color: "text-white",
            textAlign: "text-center"
          },
          subtitle: {
            fontSize: "md:text-5xl text-4xl", 
            fontWeight: "font-bold",
            color: "text-white",
            textAlign: "text-center"
          },
          description: {
            fontSize: "",
            color: "text-white/80",
            textAlign: "text-center"
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await contentCollection.insertOne(defaultGlobeSection);
      return responseSend(res, 200, defaultGlobeSection);
    }
    responseSend(res, 200, globeSection);
  } catch (error) {
    console.error(error);
    responseSend(res, 500, "Failed to fetch globe section");
  }
};

// Get features section contents
const getFeaturesSection = async (req, res, collections) => {
  const { contentCollection } = collections;
  try {
    const featuresSection = await contentCollection.findOne({ type: "features-section" });
    if (!featuresSection) {
      const defaultFeaturesSection = {
        type: "features-section",
        content: {
          mainHeading: "Build a Safer Community with Our Public Reporting System",
          highlightText: "Safer Community",
          description: "A powerful and transparent platform where citizens can report issues, track progress, and help improve their city with ease.",
          buttonText: "Report an Issue",
          features: [
            {
              title: "Verified Staff Handling",
              description: "Every report is managed by authorized municipal staff, ensuring accountability and quality response."
            },
            {
              title: "Location-Based Tracking", 
              description: "Browse reported problems around your area and monitor progress in real time."
            },
            {
              title: "Instant Status Notifications",
              description: "Get notified whenever your submitted issue is assigned, reviewed, or resolved."
            },
            {
              title: "Emergency Priority System",
              description: "Critical public safety concerns are auto-flagged and forwarded to emergency teams instantly."
            }
          ]
        },
        styles: {
          mainHeading: {
            fontSize: "text-4xl md:text-5xl",
            fontWeight: "font-extrabold",
            color: "text-primary"
          },
          highlightText: {
            color: "text-secondary"
          },
          description: {
            color: "text-gray-600"
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await contentCollection.insertOne(defaultFeaturesSection);
      return responseSend(res, 200, defaultFeaturesSection);
    }
    responseSend(res, 200, featuresSection);
  } catch (error) {
    console.error(error);
    responseSend(res, 500, "Failed to fetch features section");
  }
};

// Get how it works section contents
const getHowItWorksSection = async (req, res, collections) => {
  const { contentCollection } = collections;
  try {
    const howItWorksSection = await contentCollection.findOne({ type: "how-it-works-section" });
    if (!howItWorksSection) {
      const defaultHowItWorksSection = {
        type: "how-it-works-section",
        content: {
          mainHeading: "Our Proven Work Process",
          highlightText: "Proven",
          description: "Our platform is designed to make reporting public issues simple, transparent, and effective. From the moment you register, you gain the ability to submit detailed reports, view problems reported by others in your community, and track progress in real time.",
          steps: [
            {
              title: "Registration",
              description: "Sign up to start reporting and track issues."
            },
            {
              title: "Post an Issue",
              description: "Submit any public issue with details and location."
            },
            {
              title: "View Issues", 
              description: "See issues reported by other citizens for transparency."
            },
            {
              title: "Track Issues",
              description: "Monitor updates and see real-time progress of issues."
            }
          ]
        },
        styles: {
          mainHeading: {
            fontSize: "text-4xl md:text-5xl",
            fontWeight: "font-extrabold",
            color: "text-primary"
          },
          highlightText: {
            color: "text-secondary"
          },
          description: {
            color: "text-gray-600"
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await contentCollection.insertOne(defaultHowItWorksSection);
      return responseSend(res, 200, defaultHowItWorksSection);
    }
    responseSend(res, 200, howItWorksSection);
  } catch (error) {
    console.error(error);
    responseSend(res, 500, "Failed to fetch how it works section");
  }
};

// Update banner contents (admin only)
const updateBanners = async (req, res, collections) => {
  const { contentCollection } = collections;
  const {
    title,
    paragraph,
    ctaText,
    ctaLink,
    issueResolved,
    issuesReported,
    userStats,
    styles
  } = req.body;
  console.log(req.body);
  try {
    const query = { type: "banner" };
    const fetchBanner = await contentCollection.findOne(query);
    console.log(fetchBanner);
    const result = await contentCollection.updateOne(query, {
      $set: {
        title,
        paragraph,
        ctaText,
        ctaLink,
        issueResolved,
        issuesReported,
        userStats,
        styles,
        updatedAt: new Date(),
      },
    });
    console.log(result);
    responseSend(res, 200, result);
  } catch (err) {
    console.error(err);
    responseSend(res, 500, "Failed to update banner");
  }
};

// Update about section contents (admin only)
const updateAboutSection = async (req, res, collections) => {
  const { contentCollection } = collections;
  const { content, styles } = req.body;
  console.log("About section update:", req.body);
  try {
    const query = { type: "about-section" };
    const result = await contentCollection.updateOne(query, {
      $set: {
        content,
        styles,
        updatedAt: new Date(),
      },
    });
    console.log("About section update result:", result);
    responseSend(res, 200, result);
  } catch (err) {
    console.error(err);
    responseSend(res, 500, "Failed to update about section");
  }
};

// Update globe section contents (admin only)
const updateGlobeSection = async (req, res, collections) => {
  const { contentCollection } = collections;
  const { content, styles } = req.body;
  try {
    const query = { type: "globe-section" };
    const result = await contentCollection.updateOne(query, {
      $set: {
        content,
        styles,
        updatedAt: new Date(),
      },
    });
    responseSend(res, 200, result);
  } catch (err) {
    console.error(err);
    responseSend(res, 500, "Failed to update globe section");
  }
};

// Update features section contents (admin only)
const updateFeaturesSection = async (req, res, collections) => {
  const { contentCollection } = collections;
  const { content, styles } = req.body;
  try {
    const query = { type: "features-section" };
    const result = await contentCollection.updateOne(query, {
      $set: {
        content,
        styles,
        updatedAt: new Date(),
      },
    });
    responseSend(res, 200, result);
  } catch (err) {
    console.error(err);
    responseSend(res, 500, "Failed to update features section");
  }
};

// Update how it works section contents (admin only)
const updateHowItWorksSection = async (req, res, collections) => {
  const { contentCollection } = collections;
  const { content, styles } = req.body;
  try {
    const query = { type: "how-it-works-section" };
    const result = await contentCollection.updateOne(query, {
      $set: {
        content,
        styles,
        updatedAt: new Date(),
      },
    });
    responseSend(res, 200, result);
  } catch (err) {
    console.error(err);
    responseSend(res, 500, "Failed to update how it works section");
  }
};

module.exports = {
  getBanners,
  getAboutSection,
  getGlobeSection,
  getFeaturesSection,
  getHowItWorksSection,
  updateBanners,
  updateAboutSection,
  updateGlobeSection,
  updateFeaturesSection,
  updateHowItWorksSection
};