import type { FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';
import type { Document } from 'mongoose';

export abstract class BaseRepository<TDoc extends Document> {
  constructor(protected readonly model: Model<TDoc>) {}

  async findById(id: string): Promise<TDoc | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: FilterQuery<TDoc>): Promise<TDoc | null> {
    return this.model.findOne(filter).exec();
  }

  async findMany(
    filter: FilterQuery<TDoc>,
    options?: QueryOptions,
  ): Promise<TDoc[]> {
    return this.model.find(filter, null, options).exec();
  }

  async create(data: Partial<TDoc>): Promise<TDoc> {
    return this.model.create(data);
  }

  async updateById(id: string, update: UpdateQuery<TDoc>): Promise<TDoc | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string): Promise<TDoc | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async count(filter: FilterQuery<TDoc>): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}
