import { APIRequestContext } from '@playwright/test';

export interface TestColumn {
  id: string;
  name: string;
  cards: TestCard[];
}

export interface TestCard {
  id: string;
  title: string;
  desc?: string;
  owner?: string;
  priority?: 'h' | 'm' | 'l';
}

/**
 * Seeds the test board with deterministic data
 * Falls back to working with existing board if test endpoints are disabled
 */
export async function seedTestBoard(
  request: APIRequestContext,
  baseURL: string,
  columns: TestColumn[]
) {
  if (process.env.ENABLE_TEST_ENDPOINTS === '1') {
    const res = await request.post(`${baseURL}/api/test/seed`, {
      data: { columns }
    });
    
    if (res.ok()) {
      return res.json();
    }
  }
  
  // Fallback: work with existing board
  return request.get(`${baseURL}/api/board/get`).then(r => r.json());
}

/**
 * Finds a column by ID in the current board
 */
export async function findColumn(
  request: APIRequestContext,
  baseURL: string,
  columnId: string
) {
  const res = await request.get(`${baseURL}/api/board/get`);
  const data = await res.json();
  return data.board.columns.find((c: any) => c.id === columnId);
}

/**
 * Creates a test card in the specified column
 */
export async function createTestCard(
  request: APIRequestContext,
  baseURL: string,
  columnId: string,
  title?: string
) {
  const cardTitle = title || `Test Card ${Date.now()}`;
  
  const res = await request.post(`${baseURL}/api/board/apply`, {
    data: {
      op: 'create_card',
      args: {
        columnId,
        title: cardTitle,
        description: 'Created for testing',
        priority: 'm'
      }
    }
  });
  
  const data = await res.json();
  return data.created;
}

/**
 * Gets the default test board configuration
 */
export function getDefaultTestBoard(): TestColumn[] {
  return [
    {
      id: 'Backlog',
      name: 'Backlog',
      cards: [
        { id: 'test-1', title: 'Test Card 1', priority: 'h' }
      ]
    },
    {
      id: 'Doing',
      name: 'In Progress',
      cards: []
    },
    {
      id: 'Done',
      name: 'Done',
      cards: []
    }
  ];
}