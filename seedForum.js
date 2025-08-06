const mongoose = require("mongoose");
const ForumPost = require("./models/ForumPost");
const ForumAnswer = require("./models/ForumAnswer");
const User = require("./models/User");

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/sece", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected for seeding"))
  .catch((err) => console.log("MongoDB connection error:", err));

const samplePosts = [
  {
    title: "How to control aphids on tomato plants naturally?",
    content:
      "I've noticed small green aphids on my tomato plants. I want to avoid using chemical pesticides and prefer natural methods. I've tried spraying with water but they keep coming back. What are some effective natural remedies for aphid control?",
    category: "pest-control",
    tags: ["tomatoes", "aphids", "organic", "natural-pesticides"],
  },
  {
    title: "Best irrigation system for small vegetable garden",
    content:
      "I have a 20x30 foot vegetable garden and I'm looking for an efficient irrigation system. Currently, I'm watering by hand which is time-consuming. I'm considering drip irrigation but would like recommendations on the best setup for my size garden.",
    category: "irrigation",
    tags: ["drip-irrigation", "vegetable-garden", "water-efficiency"],
  },
  {
    title: "Tractor won't start - troubleshooting tips needed",
    content:
      "My 10-year-old tractor suddenly won't start. The battery seems fine and the lights work. When I turn the key, I hear a clicking sound but the engine doesn't turn over. Any suggestions on what to check first?",
    category: "machinery-repair",
    tags: ["tractor", "engine", "electrical", "troubleshooting"],
  },
  {
    title: "Soil pH testing and adjustment for corn",
    content:
      "I'm planning to plant corn this season and want to ensure optimal soil conditions. How do I test my soil pH and what's the best way to adjust it if needed? What pH range is ideal for corn?",
    category: "soil-management",
    tags: ["soil-ph", "corn", "soil-testing", "fertilizer"],
  },
  {
    title: "Organic certification process for small farm",
    content:
      "I'm interested in getting organic certification for my 5-acre farm. Can someone walk me through the process? What are the requirements and how long does certification typically take?",
    category: "organic-farming",
    tags: ["organic-certification", "small-farm", "regulations"],
  },
  {
    title: "Yellow leaves on cucumber plants - disease or deficiency?",
    content:
      "My cucumber plants are developing yellow leaves, starting from the bottom. The leaves feel dry and brittle. Is this a nutrient deficiency or a disease? How can I identify and treat it?",
    category: "crop-diseases",
    tags: [
      "cucumbers",
      "yellow-leaves",
      "nutrient-deficiency",
      "plant-disease",
    ],
  },
  {
    title: "When is the best time to harvest sweet corn?",
    content:
      "This is my first time growing sweet corn and I'm unsure about the optimal harvest time. How can I tell when the corn is ready to pick? What are the signs to look for?",
    category: "harvesting",
    tags: ["sweet-corn", "harvest-timing", "ripeness-indicators"],
  },
  {
    title: "Marketing strategies for direct farm sales",
    content:
      "I'm looking to sell my produce directly to consumers this season. What are some effective marketing strategies for small farms? Should I focus on farmers markets, CSA, or online sales?",
    category: "marketing",
    tags: ["direct-sales", "farmers-market", "CSA", "marketing"],
  },
];

const sampleAnswers = [
  {
    content:
      "For natural aphid control, try these methods: 1) Introduce ladybugs to your garden - they're natural predators. 2) Mix 1 tablespoon of dish soap with 1 quart of water and spray on affected plants. 3) Plant companion plants like marigolds and garlic which repel aphids. 4) Use neem oil spray as a natural insecticide. The key is to be consistent and treat early before the infestation gets too bad.",
  },
  {
    content:
      "Drip irrigation is definitely the way to go for your garden size! I recommend a simple system with 1/2 inch mainline and 1/4 inch drip tubing with emitters every 12 inches. You can get a timer to automate watering. This will save you time and water while keeping your plants healthy.",
  },
  {
    content:
      "The clicking sound usually indicates a starter solenoid issue. Check these in order: 1) Clean battery terminals and connections 2) Test battery voltage (should be 12.6V) 3) Check starter solenoid connections 4) If those are good, the starter motor itself might need replacement. Start with the battery connections - that's often the culprit.",
  },
  {
    content:
      "Corn prefers soil pH between 6.0-6.8. You can test pH with a simple soil test kit from your local garden center. If pH is too low (acidic), add lime. If too high (alkaline), add sulfur. Apply amendments 2-3 months before planting for best results.",
  },
  {
    content:
      "The organic certification process typically takes 1-3 years. You'll need to: 1) Submit application to a certifying agency 2) Develop an organic system plan 3) Undergo annual inspections 4) Maintain detailed records. Start with your state's department of agriculture for guidance.",
  },
  {
    content:
      "This sounds like a magnesium deficiency, which is common in cucumbers. Try spraying with Epsom salt solution (1 tablespoon per gallon of water) every 2 weeks. Also check if your soil is too wet or too dry, as both can cause yellowing.",
  },
  {
    content:
      "Sweet corn is ready when: 1) Silks turn brown and dry 2) Kernels are plump and milky when pierced 3) Ear feels firm when squeezed. Harvest in the morning when sugar content is highest. Don't wait too long - corn loses sweetness quickly after peak ripeness.",
  },
  {
    content:
      "I've had success with a combination approach: 1) Start with farmers markets to build customer base 2) Offer CSA shares for steady income 3) Use social media to promote your farm 4) Consider online ordering with pickup/delivery. Focus on quality and building relationships with customers.",
  },
];

const seedForum = async () => {
  try {
    // Clear existing data
    await ForumPost.deleteMany({});
    await ForumAnswer.deleteMany({});
    console.log("Cleared existing forum data");

    // Get some users for authors
    const users = await User.find().limit(3);
    if (users.length === 0) {
      console.log("No users found. Please create some users first.");
      return;
    }

    // Create posts
    const createdPosts = [];
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i];
      const author = users[i % users.length]; // Cycle through users

      const post = new ForumPost({
        ...postData,
        author: author._id,
        views: Math.floor(Math.random() * 100) + 10,
        votes: {
          upvotes: [],
          downvotes: [],
        },
        answersCount: 0,
      });

      const savedPost = await post.save();
      createdPosts.push(savedPost);
      console.log(`Created post: ${postData.title}`);
    }

    // Create answers
    for (let i = 0; i < sampleAnswers.length; i++) {
      const answerData = sampleAnswers[i];
      const post = createdPosts[i];
      const author = users[(i + 1) % users.length]; // Different author than post

      const answer = new ForumAnswer({
        content: answerData.content,
        post: post._id,
        author: author._id,
        votes: {
          upvotes: [],
          downvotes: [],
        },
      });

      await answer.save();

      // Update post answers count
      post.answersCount += 1;
      await post.save();

      console.log(`Created answer for post: ${post.title}`);
    }

    // Mark some posts as resolved
    const firstPost = createdPosts[0];
    const firstAnswer = await ForumAnswer.findOne({ post: firstPost._id });
    if (firstAnswer) {
      firstAnswer.isBestAnswer = true;
      firstAnswer.isAccepted = true;
      await firstAnswer.save();

      firstPost.isResolved = true;
      firstPost.bestAnswer = firstAnswer._id;
      await firstPost.save();
      console.log("Marked first post as resolved");
    }

    console.log("Forum seeding completed successfully!");
    console.log(
      `Created ${createdPosts.length} posts and ${sampleAnswers.length} answers`
    );
  } catch (error) {
    console.error("Error seeding forum data:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding
seedForum();
