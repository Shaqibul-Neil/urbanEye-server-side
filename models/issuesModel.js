// Issues Model - Data operations and validation for issue management

const { ObjectId } = require("mongodb");

class IssuesModel {
  constructor(issueCollection) {
    this.issueCollection = issueCollection;
  }

  // Create new issue
  async create(issueData) {
    return await this.issueCollection.insertOne(issueData);
  }

  // Find issue by ID
  async findById(id) {
    return await this.issueCollection.findOne({ _id: new ObjectId(id) });
  }

  // Find issues with query and options
  async find(query = {}, options = {}) {
    let cursor = this.issueCollection.find(query);
    
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.skip) cursor = cursor.skip(options.skip);
    if (options.limit) cursor = cursor.limit(options.limit);
    if (options.project) cursor = cursor.project(options.project);
    
    return await cursor.toArray();
  }

  // Update issue by ID
  async updateById(id, updateData) {
    return await this.issueCollection.updateOne(
      { _id: new ObjectId(id) },
      updateData
    );
  }

  // Delete issue by ID
  async deleteById(id) {
    return await this.issueCollection.deleteOne({ _id: new ObjectId(id) });
  }

  // Count documents with query
  async countDocuments(query = {}) {
    return await this.issueCollection.countDocuments(query);
  }

  // Aggregate pipeline
  async aggregate(pipeline) {
    return await this.issueCollection.aggregate(pipeline).toArray();
  }

  // Find issues by user email
  async findByUserEmail(email, options = {}) {
    return await this.find({ userEmail: email }, options);
  }

  // Find issues by status
  async findByStatus(status, options = {}) {
    return await this.find({ status }, options);
  }

  // Find issues by priority
  async findByPriority(priority, options = {}) {
    return await this.find({ priority }, options);
  }
}

module.exports = IssuesModel;