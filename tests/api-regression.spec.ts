import { test, expect } from '@playwright/test';

test.describe('API Regression Tests', () => {
  let boardState: any;
  
  test.beforeEach(async ({ request, baseURL }) => {
    // Seed the board for consistent test state
    const seedRes = await request.post(`${baseURL}/api/board/seed`);
    expect(seedRes.ok()).toBeTruthy();
    
    // Get initial board state
    const getRes = await request.get(`${baseURL}/api/board/get`);
    boardState = await getRes.json();
  });
  
  test('rename_column preserves ID and only changes name', async ({ request, baseURL }) => {
    // Get current board state
    const getRes = await request.get(`${baseURL}/api/board/get`);
    const board = await getRes.json();
    
    // Find any existing column to test (use first column)
    const targetColumn = board.board.columns[0];
    expect(targetColumn).toBeDefined();
    const originalId = targetColumn.id;
    const originalCardCount = targetColumn.cards.length;
    const newName = `Renamed_${Date.now()}`;
    
    // Rename the column
    const renameRes = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'rename_column',
        args: { columnId: originalId, newName }
      }
    });
    expect(renameRes.ok()).toBeTruthy();
    
    // Verify the change
    const result = await renameRes.json();
    const renamedColumn = result.board.columns.find((c: any) => c.id === originalId);
    
    // ID should be preserved
    expect(renamedColumn).toBeDefined();
    expect(renamedColumn.id).toBe(originalId);
    // Name should be updated
    expect(renamedColumn.name).toBe(newName);
    // Cards should still be there
    expect(renamedColumn.cards.length).toBe(originalCardCount);
  });
  
  test('create_card with schema validation', async ({ request, baseURL }) => {
    // Valid create_card request
    const validRes = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'create_card',
        args: {
          columnId: 'Backlog',
          title: 'Test Card',
          description: 'Test Description',
          owner: 'test',
          priority: 'h'
        }
      }
    });
    expect(validRes.ok()).toBeTruthy();
    const validData = await validRes.json();
    expect(validData.created).toBeDefined();
    expect(validData.created.title).toBe('Test Card');
    expect(validData.created.priority).toBe('h');
    
    // Invalid: missing title
    const invalidRes = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'create_card',
        args: {
          columnId: 'Backlog',
          title: '' // Empty title should fail
        }
      }
    });
    expect(invalidRes.ok()).toBeFalsy();
    const errorData = await invalidRes.json();
    expect(errorData.error).toContain('Title required');
    
    // Invalid: bad priority
    const badPriorityRes = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'create_card',
        args: {
          columnId: 'Backlog',
          title: 'Test',
          priority: 'invalid' // Should only be h/m/l
        }
      }
    });
    expect(badPriorityRes.ok()).toBeFalsy();
  });
  
  test('delete_column removes column and cards', async ({ request, baseURL }) => {
    // Create a test column first
    const createRes = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'create_column',
        args: { name: 'Test Column' }
      }
    });
    expect(createRes.ok()).toBeTruthy();
    const createData = await createRes.json();
    const newColumnId = createData.created;
    
    // Add a card to the new column
    await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'create_card',
        args: {
          columnId: newColumnId,
          title: 'Test Card in Test Column'
        }
      }
    });
    
    // Delete the column
    const deleteRes = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'delete_column',
        args: { columnId: newColumnId }
      }
    });
    expect(deleteRes.ok()).toBeTruthy();
    
    // Verify column is gone
    const afterRes = await request.get(`${baseURL}/api/board/get`);
    const afterBoard = await afterRes.json();
    const deletedColumn = afterBoard.board.columns.find((c: any) => c.id === newColumnId);
    expect(deletedColumn).toBeUndefined();
  });
  
  test('unknown operation returns detailed error', async ({ request, baseURL }) => {
    const res = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'invalid_operation',
        args: {}
      }
    });
    
    expect(res.ok()).toBeFalsy();
    const errorData = await res.json();
    expect(errorData.error).toContain('Unknown operation');
    expect(errorData.detail.available).toBeDefined();
    expect(Array.isArray(errorData.detail.available)).toBeTruthy();
  });
  
  test('move_card with validation', async ({ request, baseURL }) => {
    // First create a card we can move
    const createRes = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'create_card',
        args: {
          columnId: 'Backlog',
          title: `Test Card ${Date.now()}`,
          description: 'Card for move test'
        }
      }
    });
    expect(createRes.ok()).toBeTruthy();
    const createData = await createRes.json();
    const cardId = createData.created.id;
    
    // Valid move
    const validRes = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'move_card',
        args: {
          fromColumnId: 'Backlog',
          toColumnId: 'Doing',
          cardId
        }
      }
    });
    expect(validRes.ok()).toBeTruthy();
    
    // Invalid: non-existent card
    const invalidRes = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'move_card',
        args: {
          fromColumnId: 'Backlog',
          toColumnId: 'Doing',
          cardId: 'non_existent_card'
        }
      }
    });
    expect(invalidRes.ok()).toBeFalsy();
  });
  
  test('set_wip_limit validation', async ({ request, baseURL }) => {
    // Valid WIP limit
    const validRes = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'set_wip_limit',
        args: {
          columnId: 'Doing',
          limit: 3
        }
      }
    });
    expect(validRes.ok()).toBeTruthy();
    
    // Clear WIP limit (null)
    const clearRes = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'set_wip_limit',
        args: {
          columnId: 'Doing',
          limit: null
        }
      }
    });
    expect(clearRes.ok()).toBeTruthy();
    
    // Invalid: negative limit
    const invalidRes = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'set_wip_limit',
        args: {
          columnId: 'Doing',
          limit: -1
        }
      }
    });
    expect(invalidRes.ok()).toBeFalsy();
  });
  
  test('WIP limit enforcement', async ({ request, baseURL }) => {
    // Set WIP limit on Doing column
    await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'set_wip_limit',
        args: { columnId: 'Doing', limit: 2 }
      }
    });
    
    // Doing column already has 2 cards from seed data
    // Try to add a third card - should fail with 409
    const res = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'create_card',
        args: { 
          columnId: 'Doing', 
          title: 'Over WIP limit card' 
        }
      }
    });
    
    expect(res.status()).toBe(409);
    const error = await res.json();
    expect(error.error).toBe('wip_limit_exceeded');
    expect(error.columnId).toBe('Doing');
    expect(error.limit).toBe(2);
  });
  
  test('Bulk operations with versioning', async ({ request, baseURL }) => {
    // Get current board version
    const getRes = await request.get(`${baseURL}/api/board/get`);
    const board = await getRes.json();
    const currentVersion = board.board.version;
    
    // Execute bulk create operations
    const res = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        ops: [
          { op: 'create_card', args: { columnId: 'Backlog', title: 'Bulk Card 1' } },
          { op: 'create_card', args: { columnId: 'Backlog', title: 'Bulk Card 2' } },
          { op: 'create_card', args: { columnId: 'Backlog', title: 'Bulk Card 3' } }
        ],
        ifVersion: currentVersion
      }
    });
    
    expect(res.ok()).toBeTruthy();
    const result = await res.json();
    expect(result.results).toHaveLength(3);
    expect(result.results[0].created.title).toBe('Bulk Card 1');
    expect(result.results[1].created.title).toBe('Bulk Card 2');
    expect(result.results[2].created.title).toBe('Bulk Card 3');
    
    // Version should be incremented
    expect(result.board.version).toBe(currentVersion + 1);
  });
  
  test('Version conflict handling', async ({ request, baseURL }) => {
    // Get current board version
    const getRes = await request.get(`${baseURL}/api/board/get`);
    const board = await getRes.json();
    const currentVersion = board.board.version;
    
    // Make a change to increment version
    await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'create_card',
        args: { columnId: 'Backlog', title: 'Version incrementer' }
      }
    });
    
    // Try to make another change with old version - should fail
    const res = await request.post(`${baseURL}/api/board/apply`, {
      data: {
        op: 'create_card',
        args: { columnId: 'Backlog', title: 'Should conflict' },
        ifVersion: currentVersion // Using stale version
      }
    });
    
    expect(res.status()).toBe(409);
    const error = await res.json();
    expect(error.error).toBe('version_conflict');
  });
});

test.describe('Health Endpoint', () => {
  test('returns enhanced metrics', async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/api/health`);
    expect(res.ok()).toBeTruthy();
    
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.status).toBe('healthy');
    expect(data.version).toBe('0.3.3');
    expect(data.uptimeSec).toBeDefined();
    expect(typeof data.uptimeSec).toBe('number');
    expect(data.features).toContain('inline-creation');
    expect(data.features).toContain('column-management');
    expect(data.timestamp).toBeDefined();
    
    // Verify ISO timestamp format
    expect(() => new Date(data.timestamp)).not.toThrow();
  });
});