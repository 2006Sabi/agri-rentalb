const mongoose = require("mongoose");
const ForumPost = require("./models/ForumPost");
const User = require("./models/User");

const debugForumPost = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27017/sece", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // Test creating a forum post
    console.log("Testing ForumPost model...");

    // First, let's check if we have any users
    const users = await User.find().limit(1);
    console.log("Available users:", users.length);

    if (users.length === 0) {
      console.log("❌ No users found in database. Please create a user first.");
      return;
    }

    const testUserId = users[0]._id;
    console.log("Using user ID:", testUserId);

    // Test creating a forum post
    const testPost = new ForumPost({
      title: "Test Forum Post",
      content: "This is a test forum post content.",
      category: "general",
      author: testUserId,
      tags: ["test", "debug"],
    });

    console.log("Saving forum post...");
    const savedPost = await testPost.save();
    console.log("✅ Forum post saved successfully!");
    console.log("Post ID:", savedPost._id);
    console.log("Post title:", savedPost.title);

    // Test populating the author
    const populatedPost = await ForumPost.findById(savedPost._id).populate(
      "author",
      "name email"
    );
    console.log("✅ Post with populated author:", {
      id: populatedPost._id,
      title: populatedPost.title,
      author: populatedPost.author,
    });

    // Clean up - delete the test post
    await ForumPost.findByIdAndDelete(savedPost._id);
    console.log("✅ Test post cleaned up");
  } catch (error) {
    console.error("❌ Error during debug:", error);
    console.error("Error stack:", error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

debugForumPost(); 