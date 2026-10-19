import { SearchService } from './search.service';

export const INDEX_CONFIGS = {
  library_items: {
    index: 'library_items',
    mappings: {
      properties: {
        university_id: { type: 'keyword' },
        title: { type: 'text', analyzer: 'campus_analyzer', fields: { keyword: { type: 'keyword' } } },
        author: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        content: { type: 'text', analyzer: 'campus_analyzer' },
        course_code: { type: 'keyword' },
        faculty: { type: 'keyword' },
        topic: { type: 'keyword' },
        category: { type: 'keyword' },
        rating: { type: 'float' },
        type: { type: 'keyword' },
        url: { type: 'keyword', index: false },
        created_at: { type: 'date' },
      },
    },
  },
  marketplace_listings: {
    index: 'marketplace_listings',
    mappings: {
      properties: {
        university_id: { type: 'keyword' },
        title: { type: 'text', analyzer: 'campus_analyzer', fields: { keyword: { type: 'keyword' } } },
        description: { type: 'text', analyzer: 'campus_analyzer' },
        category: { type: 'keyword' },
        price: { type: 'scaled_float', scaling_factor: 100 },
        condition: { type: 'keyword' },
        seller_id: { type: 'keyword' },
        seller_name: { type: 'text' },
        images: { type: 'keyword', index: false },
        is_available: { type: 'boolean' },
        created_at: { type: 'date' },
      },
    },
  },
  jobs: {
    index: 'jobs',
    mappings: {
      properties: {
        university_id: { type: 'keyword' },
        title: { type: 'text', analyzer: 'campus_analyzer', fields: { keyword: { type: 'keyword' } } },
        company: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        description: { type: 'text', analyzer: 'campus_analyzer' },
        location: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        type: { type: 'keyword' },
        salary_min: { type: 'integer' },
        salary_max: { type: 'integer' },
        skills: { type: 'keyword' },
        is_remote: { type: 'boolean' },
        deadline: { type: 'date' },
        created_at: { type: 'date' },
      },
    },
  },
  scholarships: {
    index: 'scholarships',
    mappings: {
      properties: {
        university_id: { type: 'keyword' },
        title: { type: 'text', analyzer: 'campus_analyzer', fields: { keyword: { type: 'keyword' } } },
        provider: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        country: { type: 'keyword' },
        degree_level: { type: 'keyword' },
        funding_percentage: { type: 'integer' },
        amount: { type: 'scaled_float', scaling_factor: 100 },
        deadline: { type: 'date' },
        faculty: { type: 'keyword' },
        description: { type: 'text', analyzer: 'campus_analyzer' },
        requirements: { type: 'text' },
        is_active: { type: 'boolean' },
        created_at: { type: 'date' },
      },
    },
  },
  research_calls: {
    index: 'research_calls',
    mappings: {
      properties: {
        university_id: { type: 'keyword' },
        title: { type: 'text', analyzer: 'campus_analyzer', fields: { keyword: { type: 'keyword' } } },
        field: { type: 'keyword' },
        description: { type: 'text', analyzer: 'campus_analyzer' },
        supervisor_name: { type: 'text' },
        supervisor_id: { type: 'keyword' },
        type: { type: 'keyword' },
        deadline: { type: 'date' },
        is_open: { type: 'boolean' },
        created_at: { type: 'date' },
      },
    },
  },
  users: {
    index: 'users',
    mappings: {
      properties: {
        university_id: { type: 'keyword' },
        name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        email: { type: 'keyword' },
        role: { type: 'keyword' },
        faculty: { type: 'keyword' },
        department: { type: 'keyword' },
        skills: { type: 'keyword' },
        is_mentor: { type: 'boolean' },
        is_available: { type: 'boolean' },
        rating: { type: 'float' },
        created_at: { type: 'date' },
      },
    },
  },
};

export class SearchIndexerService {
  constructor(private searchService: SearchService) {}

  async initializeIndices(universityId: string): Promise<void> {
    for (const [name, config] of Object.entries(INDEX_CONFIGS)) {
      await this.searchService.createIndex({
        ...config,
        index: `${config.index}_${universityId}`,
      });
    }
  }

  async indexLibraryItem(item: any, universityId: string): Promise<void> {
    const index = `library_items_${universityId}`;
    await this.searchService.indexDocument(index, item.id, {
      university_id: universityId,
      title: item.title,
      author: item.author,
      content: item.content,
      course_code: item.courseCode,
      faculty: item.faculty,
      topic: item.topic,
      category: item.category,
      rating: item.rating || 0,
      type: item.type,
      url: item.url,
      created_at: item.createdAt,
    });
  }

  async indexMarketplaceListing(listing: any, universityId: string): Promise<void> {
    const index = `marketplace_listings_${universityId}`;
    await this.searchService.indexDocument(index, listing.id, {
      university_id: universityId,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      price: listing.price,
      condition: listing.condition,
      seller_id: listing.sellerId,
      seller_name: listing.sellerName,
      images: listing.images || [],
      is_available: listing.isAvailable ?? true,
      created_at: listing.createdAt,
    });
  }

  async indexJobListing(job: any, universityId: string): Promise<void> {
    const index = `jobs_${universityId}`;
    await this.searchService.indexDocument(index, job.id, {
      university_id: universityId,
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      type: job.type,
      salary_min: job.salaryMin,
      salary_max: job.salaryMax,
      skills: job.skills || [],
      is_remote: job.isRemote ?? false,
      deadline: job.deadline,
      created_at: job.createdAt,
    });
  }

  async indexScholarship(scholarship: any, universityId: string): Promise<void> {
    const index = `scholarships_${universityId}`;
    await this.searchService.indexDocument(index, scholarship.id, {
      university_id: universityId,
      title: scholarship.title,
      provider: scholarship.provider,
      country: scholarship.country,
      degree_level: scholarship.degreeLevel,
      funding_percentage: scholarship.fundingPercentage,
      amount: scholarship.amount,
      deadline: scholarship.deadline,
      faculty: scholarship.faculty,
      description: scholarship.description,
      requirements: scholarship.requirements,
      is_active: scholarship.isActive ?? true,
      created_at: scholarship.createdAt,
    });
  }

  async indexResearchCall(call: any, universityId: string): Promise<void> {
    const index = `research_calls_${universityId}`;
    await this.searchService.indexDocument(index, call.id, {
      university_id: universityId,
      title: call.title,
      field: call.field,
      description: call.description,
      supervisor_name: call.supervisorName,
      supervisor_id: call.supervisorId,
      type: call.type,
      deadline: call.deadline,
      is_open: call.isOpen ?? true,
      created_at: call.createdAt,
    });
  }

  async indexUser(user: any, universityId: string): Promise<void> {
    const index = `users_${universityId}`;
    await this.searchService.indexDocument(index, user.id, {
      university_id: universityId,
      name: user.name,
      email: user.email,
      role: user.role,
      faculty: user.faculty,
      department: user.department,
      skills: user.skills || [],
      is_mentor: user.isMentor ?? false,
      is_available: user.isAvailable ?? true,
      rating: user.rating || 0,
      created_at: user.createdAt,
    });
  }

  async removeDocument(index: string, universityId: string, documentId: string): Promise<void> {
    await this.searchService.deleteDocument(`${index}_${universityId}`, documentId);
  }
}
