// Contents Model - Data operations and validation for content management

const { ObjectId } = require("mongodb");

class ContentsModel {
  constructor(contentCollection) {
    this.contentCollection = contentCollection;
  }

  // Find content by type
  async findByType(type) {
    return await this.contentCollection.findOne({ type });
  }

  // Create new content
  async create(contentData) {
    const content = {
      ...contentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.contentCollection.insertOne(content);
  }

  // Update content by type
  async updateByType(type, updateData) {
    return await this.contentCollection.updateOne(
      { type },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
  }

  // Delete content by type
  async deleteByType(type) {
    return await this.contentCollection.deleteOne({ type });
  }

  // Get all contents
  async findAll() {
    return await this.contentCollection.find({}).toArray();
  }
}

module.exports = ContentsModel;