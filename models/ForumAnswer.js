const mongoose = require("mongoose");

const forumAnswerSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumPost",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    isBestAnswer: {
      type: Boolean,
      default: false,
    },
    isAccepted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
forumAnswerSchema.index({ post: 1, createdAt: -1 });
forumAnswerSchema.index({ author: 1, createdAt: -1 });

// Virtual for vote count
forumAnswerSchema.virtual("voteCount").get(function () {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Method to check if user has voted
forumAnswerSchema.methods.hasUserVoted = function (userId) {
  if (this.votes.upvotes.includes(userId)) return "upvote";
  if (this.votes.downvotes.includes(userId)) return "downvote";
  return null;
};

// Method to add vote
forumAnswerSchema.methods.addVote = function (userId, voteType) {
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

// Method to mark as best answer
forumAnswerSchema.methods.markAsBestAnswer = function () {
  this.isBestAnswer = true;
  this.isAccepted = true;
  return this.save();
};

module.exports = mongoose.model("ForumAnswer", forumAnswerSchema); 