import { Client } from '@opensearch-project/opensearch';
import { Logger } from '@nestjs/common';

export interface SearchIndexConfig {
  index: string;
  mappings: any;
  settings?: any;
}

export interface SearchQuery {
  index: string;
  query: any;
  from?: number;
  size?: number;
  sort?: any[];
  _source?: string[] | boolean;
  highlight?: any;
  aggs?: any;
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  took: number;
  aggregations?: any;
}

export class SearchService {
  private client: Client | null = null;
  private readonly logger = new Logger(SearchService.name);
  private connected = false;

  constructor(config: { host: string; port: number }) {
    try {
      this.client = new Client({
        node: `http://${config.host}:${config.port}`,
        requestTimeout: 10000,
        sniffOnStart: false,
      });
    } catch (err) {
      this.logger.warn('OpenSearch client initialization failed. Search will be unavailable.');
    }
  }

  async checkHealth(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.cluster.health();
      this.connected = true;
      return true;
    } catch {
      this.connected = false;
      return false;
    }
  }

  async createIndex(config: SearchIndexConfig): Promise<void> {
    if (!this.client) return;
    try {
      const exists = await this.client.indices.exists({ index: config.index });
      if (!exists.body) {
        await this.client.indices.create({
          index: config.index,
          body: {
            settings: {
              number_of_shards: 2,
              number_of_replicas: 1,
              analysis: {
                analyzer: {
                  campus_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'asciifolding', 'campus_ngram'],
                  },
                },
                filter: {
                  campus_ngram: {
                    type: 'ngram',
                    min_gram: 2,
                    max_gram: 15,
                  },
                },
              },
              ...config.settings,
            },
            mappings: config.mappings,
          },
        });
        this.logger.log(`Created index: ${config.index}`);
      }
    } catch (err) {
      this.logger.error(`Failed to create index ${config.index}: ${err.message}`);
    }
  }

  async indexDocument(index: string, id: string, document: any): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.index({
        index,
        id,
        body: {
          ...document,
          _indexed_at: new Date().toISOString(),
        },
        refresh: 'wait_for',
      });
    } catch (err) {
      this.logger.error(`Failed to index document ${index}/${id}: ${err.message}`);
    }
  }

  async bulkIndex(index: string, documents: { id: string; body: any }[]): Promise<void> {
    if (!this.client || documents.length === 0) return;
    try {
      const body = documents.flatMap((doc) => [
        { index: { _index: index, _id: doc.id } },
        { ...doc.body, _indexed_at: new Date().toISOString() },
      ]);
      const response = await this.client.bulk({ body, refresh: false });
      if (response.body.errors) {
        const failed = response.body.items.filter((i: any) => i.index?.error);
        this.logger.warn(`Bulk index: ${failed.length}/${documents.length} failed`);
      }
    } catch (err) {
      this.logger.error(`Bulk index failed for ${index}: ${err.message}`);
    }
  }

  async updateDocument(index: string, id: string, partialDoc: any): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.update({
        index,
        id,
        body: { doc: { ...partialDoc, _updated_at: new Date().toISOString() } },
        refresh: 'wait_for',
      });
    } catch (err) {
      this.logger.error(`Failed to update document ${index}/${id}: ${err.message}`);
    }
  }

  async deleteDocument(index: string, id: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.delete({ index, id, refresh: 'wait_for' });
    } catch (err) {
      this.logger.error(`Failed to delete document ${index}/${id}: ${err.message}`);
    }
  }

  async search<T = any>(query: SearchQuery): Promise<SearchResult<T>> {
    if (!this.client) return { items: [], total: 0, took: 0 };
    try {
      const response = await this.client.search({
        index: query.index,
        body: {
          from: query.from || 0,
          size: query.size || 20,
          query: query.query,
          sort: query.sort,
          _source: query._source,
          highlight: query.highlight,
          aggs: query.aggs,
        },
      });

      const hits = response.body.hits;
      return {
        items: hits.hits.map((h: any) => ({ id: h._id, ...h._source, _score: h._score })),
        total: typeof hits.total === 'number' ? hits.total : hits.total?.value || 0,
        took: response.body.took,
        aggregations: response.body.aggregations,
      };
    } catch (err) {
      this.logger.error(`Search failed: ${err.message}`);
      return { items: [], total: 0, took: 0 };
    }
  }

  async fullTextSearch<T = any>(
    index: string,
    fields: string[],
    searchText: string,
    options: { from?: number; size?: number; filters?: Record<string, any>; universityId?: string } = {},
  ): Promise<SearchResult<T>> {
    const must: any[] = [{ multi_match: { query: searchText, fields, fuzziness: 'AUTO' } }];
    const filter: any[] = [];

    if (options.universityId) {
      filter.push({ term: { university_id: options.universityId } });
    }

    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            filter.push({ terms: { [key]: value } });
          } else {
            filter.push({ term: { [key]: value } });
          }
        }
      }
    }

    return this.search<T>({
      index,
      query: {
        bool: {
          must,
          filter: filter.length > 0 ? filter : undefined,
        },
      },
      from: options.from,
      size: options.size,
      highlight: {
        fields: Object.fromEntries(fields.map((f) => [f, {}])),
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      },
    });
  }

  async autocomplete(index: string, field: string, prefix: string, universityId?: string): Promise<string[]> {
    if (!this.client) return [];
    try {
      const filter = universityId ? [{ term: { university_id: universityId } }] : [];
      const response = await this.client.search({
        index,
        body: {
          size: 8,
          query: {
            bool: {
              must: [{ match_phrase_prefix: { [field]: { query: prefix } } }],
              filter,
            },
          },
          _source: [field],
        },
      });
      return response.body.hits.hits.map((h: any) => h._source[field]);
    } catch {
      return [];
    }
  }

  async deleteByQuery(index: string, query: any): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.deleteByQuery({ index, body: { query }, refresh: true });
    } catch (err) {
      this.logger.error(`Delete by query failed: ${err.message}`);
    }
  }
}
