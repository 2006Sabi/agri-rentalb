const mongoose = require("mongoose");

const forumPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "pest-control",
        "irrigation",
        "organic-farming",
        "machinery-repair",
        "soil-management",
        "crop-diseases",
        "harvesting",
        "marketing",
        "general",
      ],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    views: {
      type: Number,
      default: 0,
    },
    votes: {
      upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      downvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    bestAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumAnswer",
      default: null,
    },
    answersCount: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better search performance
forumPostSchema.index({ title: "text", content: "text", tags: "text" });
forumPostSchema.index({ category: 1, createdAt: -1 });
forumPostSchema.index({ author: 1, createdAt: -1 });

// Virtual for vote count
forumPostSchema.virtual("voteCount").get(function () {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Method to check if user has voted
forumPostSchema.methods.hasUserVoted = function (userId) {
  if (this.votes.upvotes.includes(userId)) return "upvote";
  if (this.votes.downvotes.includes(userId)) return "downvote";
  return null;
};

// Method to add vote
forumPostSchema.methods.addVote = function (userId, voteType) {
  // Remove existing votes
  this.votes.upvotes = this.votes.upvotes.filter(id => !id.equals(userId));
  this.votes.downvotes = this.votes.downvotes.filter(id => !id.equals(userId));
  
  // Add new vote
  if (voteType === "upvote") {
    this.votes.upvotes.push(userId);
  } else if (voteType === "downvote") {
    this.votes.downvotes.push(userId);
  }
  
  return this.save();
};

module.exports = mongoose.model("ForumPost", forumPostSchema); 