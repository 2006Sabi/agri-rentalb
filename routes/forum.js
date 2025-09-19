const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ForumPost = require("../models/ForumPost");
const ForumAnswer = require("../models/ForumAnswer");
const logger = require("../utils/logger");

// Get all forum posts with pagination and filters
router.get("/posts", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sort = "newest",
      resolved,
    } = req.query;

    const query = {};

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Resolved filter
    if (resolved !== undefined) {
      query.isResolved = resolved === "true";
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "most-voted":
        sortOption = { "votes.upvotes": -1 };
        break;
      case "most-answered":
        sortOption = { answersCount: -1 };
        break;
      case "most-viewed":
        sortOption = { views: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const posts = await ForumPost.find(query)
      .populate("author", "name avatar role")
      .populate("bestAnswer")
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await ForumPost.countDocuments(query);

    res.json({
      success: true,
      data: posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching forum posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching forum posts",
    });
  }
});

// Get single forum post with answers
router.get("/posts/:id", async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate("author", "name avatar role location")
      .populate("bestAnswer")
      .populate({
        path: "votes.upvotes",
        select: "name",
      })
      .populate({
        path: "votes.downvotes",
        select: "name",
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Increment views
    post.views += 1;
    await post.save();

    // Get answers for this post
    const answers = await ForumAnswer.find({ post: req.params.id })
      .populate("author", "name avatar role")
      .populate({
        path: "votes.upvotes",
        select: "name",
      })
      .populate({
        path: "votes.downvotes",
        select: "name",
      })
      .sort({ isBestAnswer: -1, createdAt: 1 });

    res.json({
      success: true,
      data: {
        post,
        answers,
      },
    });
  } catch (error) {
    console.error("Error fetching forum post:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching forum post",
    });
  }
});

// Create new forum post
router.post("/posts", auth, async (req, res) => {
  try {
    logger.info("Forum post creation request:", {
      body: req.body,
      user: req.user,
      headers: {
        "content-type": req.headers["content-type"],
        authorization: req.headers.authorization ? "Bearer [HIDDEN]" : "None",
      },
    });

    const { title, content, category, tags } = req.body;

    // Validate required fields
    const errors = [];
    if (!title || !title.trim()) {
      errors.push("Title is required");
    }
    if (!content || !content.trim()) {
      errors.push("Content is required");
    }
    if (!category || !category.trim()) {
      errors.push("Category is required");
    }

    if (errors.length > 0) {
      logger.warn("Forum post validation errors:", errors);
      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    const post = new ForumPost({
      title,
      content,
      category,
      tags: tags || [],
      author: req.user.id,
    });

    await post.save();

    const populatedPost = await ForumPost.findById(post._id).populate(
      "author",
      "name avatar role"
    );

    res.status(201).json({
      success: true,
      data: populatedPost,
      message: "Post created successfully",
    });
  } catch (error) {
    console.error("Error creating forum post:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      user: req.user,
      body: req.body,
    });
    res.status(500).json({
      success: false,
      message: "Error creating forum post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Update forum post
router.put("/posts/:id", auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is the author or admin
    if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this post",
      });
    }

    const { title, content, category, tags } = req.body;

    if (title) post.title = title;
    if (content) post.content = content;
    if (category) post.category = category;
    if (tags) post.tags = tags;

    await post.save();

    const updatedPost = await ForumPost.findById(post._id).populate(
      "author",
      "name avatar role"
    );

    res.json({
      success: true,
      data: updatedPost,
      message: "Post updated successfully",
    });
  } catch (error) {
    console.error("Error updating forum post:", error);
    res.status(500).json({
      success: false,
      message: "Error updating forum post",
    });
  }
});

// Delete forum post
router.delete("/posts/:id", auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is the author or admin
    if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this post",
      });
    }

    // Delete associated answers
    await ForumAnswer.deleteMany({ post: req.params.id });

    await ForumPost.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting forum post:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting forum post",
    });
  }
});

// Vote on forum post
router.post("/posts/:id/vote", auth, async (req, res) => {
  try {
    const { voteType } = req.body;

    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vote type",
      });
    }

    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    await post.addVote(req.user.id, voteType);

    res.json({
      success: true,
      message: "Vote recorded successfully",
      data: {
        voteCount: post.voteCount,
        userVote: post.hasUserVoted(req.user.id),
      },
    });
  } catch (error) {
    console.error("Error voting on post:", error);
    res.status(500).json({
      success: false,
      message: "Error voting on post",
    });
  }
});

// Create answer to forum post
router.post("/posts/:id/answers", auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Answer content is required",
      });
    }

    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.isLocked) {
      return res.status(400).json({
        success: false,
        message: "This post is locked and cannot receive new answers",
      });
    }

    const answer = new ForumAnswer({
      content,
      post: req.params.id,
      author: req.user.id,
    });

    await answer.save();

    // Increment answers count
    post.answersCount += 1;
    await post.save();

    const populatedAnswer = await ForumAnswer.findById(answer._id).populate(
      "author",
      "name avatar role"
    );

    res.status(201).json({
      success: true,
      data: populatedAnswer,
      message: "Answer posted successfully",
    });
  } catch (error) {
    console.error("Error creating answer:", error);
    res.status(500).json({
      success: false,
      message: "Error creating answer",
    });
  }
});

// Vote on answer
router.post("/answers/:id/vote", auth, async (req, res) => {
  try {
    const { voteType } = req.body;

    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vote type",
      });
    }

    const answer = await ForumAnswer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    await answer.addVote(req.user.id, voteType);

    res.json({
      success: true,
      message: "Vote recorded successfully",
      data: {
        voteCount: answer.voteCount,
        userVote: answer.hasUserVoted(req.user.id),
      },
    });
  } catch (error) {
    console.error("Error voting on answer:", error);
    res.status(500).json({
      success: false,
      message: "Error voting on answer",
    });
  }
});

// Mark answer as best answer
router.post("/answers/:id/best", auth, async (req, res) => {
  try {
    const answer = await ForumAnswer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    const post = await ForumPost.findById(answer.post);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is the post author or admin
    if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to mark best answer",
      });
    }

    // Unmark previous best answer if exists
    if (post.bestAnswer) {
      const previousBest = await ForumAnswer.findById(post.bestAnswer);
      if (previousBest) {
        previousBest.isBestAnswer = false;
        previousBest.isAccepted = false;
        await previousBest.save();
      }
    }

    // Mark new best answer
    answer.isBestAnswer = true;
    answer.isAccepted = true;
    await answer.save();

    // Update post
    post.bestAnswer = answer._id;
    post.isResolved = true;
    await post.save();

    res.json({
      success: true,
      message: "Best answer marked successfully",
    });
  } catch (error) {
    console.error("Error marking best answer:", error);
    res.status(500).json({
      success: false,
      message: "Error marking best answer",
    });
  }
});

// Get forum categories
router.get("/categories", async (req, res) => {
  try {
    const categories = [
      {
        value: "pest-control",
        label: "Pest Control",
        icon: "🐛",
        description: "Questions about managing pests and diseases",
      },
      {
        value: "irrigation",
        label: "Irrigation",
        icon: "💧",
        description: "Water management and irrigation systems",
      },
      {
        value: "organic-farming",
        label: "Organic Farming",
        icon: "🌱",
        description: "Organic farming practices and certification",
      },
      {
        value: "machinery-repair",
        label: "Machinery Repair",
        icon: "🔧",
        description: "Equipment maintenance and troubleshooting",
      },
      {
        value: "soil-management",
        label: "Soil Management",
        icon: "🌍",
        description: "Soil health and fertility management",
      },
      {
        value: "crop-diseases",
        label: "Crop Diseases",
        icon: "🦠",
        description: "Identifying and treating crop diseases",
      },
      {
        value: "harvesting",
        label: "Harvesting",
        icon: "🌾",
        description: "Harvest techniques and timing",
      },
      {
        value: "marketing",
        label: "Marketing",
        icon: "📈",
        description: "Selling crops and market strategies",
      },
      {
        value: "general",
        label: "General",
        icon: "💬",
        description: "General farming discussions",
      },
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
    });
  }
});

// Search forum posts
router.get("/search", async (req, res) => {
  try {
    const { q, category, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const query = {
      $text: { $search: q },
    };

    if (category && category !== "all") {
      query.category = category;
    }

    const posts = await ForumPost.find(query)
      .populate("author", "name avatar role")
      .populate("bestAnswer")
      .sort({ score: { $meta: "textScore" } })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await ForumPost.countDocuments(query);

    res.json({
      success: true,
      data: posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error searching forum posts:", error);
    res.status(500).json({
      success: false,
      message: "Error searching forum posts",
    });
  }
});

module.exports = router;
